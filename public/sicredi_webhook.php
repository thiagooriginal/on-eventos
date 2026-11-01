<?php
// Webhook Oficial Sicredi Cobrança Online - Baixa Automática em Tempo Real
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';

$logFile = get_secure_storage_path('sicredi_webhook_log.json');
$vendasFile = get_secure_storage_path('vendas_albuns_db.json');
$configFile = get_secure_storage_path('sicredi_api_config.json');

// Função de validação criptográfica da autenticidade da notificação (HMAC / Secret Token Oficial Sicredi)
function validarAssinaturaWebhook($headers, $rawBody, $payload = []) {
    // 1. Obter segredo configurado no ambiente ou arquivo seguro
    $webhookSecret = getenv('SICREDI_WEBHOOK_SECRET');
    if (empty($webhookSecret) && file_exists($GLOBALS['configFile'])) {
        $cfg = json_decode(@file_get_contents($GLOBALS['configFile']), true) ?: [];
        $webhookSecret = $cfg['webhook_secret'] ?? $cfg['webhookSecret'] ?? '';
    }

    // 2. Verifica token de cabeçalho oficial (Bearer token em Authorization, X-Webhook-Secret ou x-api-key)
    $tokenEnviado = $headers['X-Webhook-Secret'] ?? $headers['x-webhook-secret'] ?? $headers['x-api-key'] ?? $headers['X-Api-Key'] ?? '';
    if (empty($tokenEnviado) && !empty($headers['Authorization'])) {
        $auth = trim($headers['Authorization']);
        if (stripos($auth, 'Bearer ') === 0) {
            $tokenEnviado = substr($auth, 7);
        }
    }

    // Suporte para servidores PHP CLI embutido / FastCGI onde getallheaders omite cabeçalhos customizados
    if (empty($tokenEnviado) && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = trim($_SERVER['HTTP_AUTHORIZATION']);
        if (stripos($auth, 'Bearer ') === 0) {
            $tokenEnviado = substr($auth, 7);
        }
    }
    if (empty($tokenEnviado) && !empty($_SERVER['HTTP_X_WEBHOOK_SECRET'])) {
        $tokenEnviado = trim($_SERVER['HTTP_X_WEBHOOK_SECRET']);
    }
    if (empty($tokenEnviado) && !empty($_SERVER['HTTP_X_API_KEY'])) {
        $tokenEnviado = trim($_SERVER['HTTP_X_API_KEY']);
    }

    // Validação estrita por token compartilhado do Sicredi em tempo constante
    if (!empty($webhookSecret) && !empty($tokenEnviado)) {
        if (hash_equals($webhookSecret, $tokenEnviado)) {
            return true;
        }
    }

    // 3. Validação por assinatura HMAC-SHA256 (se enviada pelo gateway do banco)
    $signatureEnviada = $headers['X-Signature-Sha256'] ?? $headers['x-signature-sha256'] ?? $headers['X-Sicredi-Signature'] ?? '';
    if (!empty($webhookSecret) && !empty($signatureEnviada)) {
        $esperada = hash_hmac('sha256', $rawBody, $webhookSecret);
        if (hash_equals($esperada, $signatureEnviada)) {
            return true;
        }
    }

    // 4. Testes manuais por administradores logados exigem CSRF estrito
    $usuario = get_authenticated_user();
    if ($usuario && strtoupper($usuario['nivel'] ?? '') === 'ADMIN') {
        verify_csrf_token($payload['csrf_token'] ?? null);
        return true;
    }

    return false;
}

// Higieniza cabeçalhos para auditoria sem vazar segredos ou tokens
function mascararHeadersParaAuditoria($headers) {
    if (!is_array($headers)) return [];
    $mascarados = [];
    foreach ($headers as $k => $v) {
        $kLower = strtolower($k);
        if (in_array($kLower, ['authorization', 'x-webhook-secret', 'x-api-key', 'cookie'])) {
            $mascarados[$k] = '********';
        } else {
            $mascarados[$k] = $v;
        }
    }
    return $mascarados;
}

// Leitura do corpo da requisição
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true) ?: $_POST;
$headers = function_exists('getallheaders') ? getallheaders() : [];

// Auditoria com headers mascarados
$entry = [
    'data_hora' => date('d/m/Y H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
    'headers' => mascararHeadersParaAuditoria($headers),
    'payload' => $payload
];

$logs = file_exists($logFile) ? (json_decode(file_get_contents($logFile), true) ?: []) : [];
if (!is_array($logs)) $logs = [];
array_unshift($logs, $entry);
if (count($logs) > 200) $logs = array_slice($logs, 0, 200);
@file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

// Consulta GET informativa (Apenas para administradores autenticados)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_auth(['ADMIN']);
    echo json_encode([
        'status' => 'online',
        'mensagem' => 'Webhook Sicredi Cobrança Online operacional',
        'total_notificacoes' => count($logs)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Validação estrita de autenticidade no POST (Token oficial Sicredi / HMAC)
if (!validarAssinaturaWebhook($headers, $raw, $payload)) {
    http_response_code(401);
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Não autorizado: assinatura ou token do webhook inválido.',
        'codigo' => 'WEBHOOK_UNAUTHORIZED'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Processamento da notificação de liquidação com correspondência EXATA (Suporta Boleto Sicredi e Pix Sicredi BACEN)
$seuNumero = trim((string)($payload['seuNumero'] ?? $payload['txid'] ?? $payload['nossoNumero'] ?? ''));

// Extração do status e evento declarados (NUNCA assume 'LIQUIDADO' por padrão)
$statusDeclarado = strtoupper(trim((string)($payload['status'] ?? $payload['situacao'] ?? $payload['statusPagamento'] ?? '')));
$evento = strtoupper(trim((string)($payload['evento'] ?? $payload['tipoOperacao'] ?? $payload['tipoEvento'] ?? '')));

// Eventos bancários que expressamente NÃO representam liquidação financeira (devem ser ignorados para baixa)
$eventosNaoLiquidacao = [
    'REGISTRO', 'ENTRADA_CONFIRMADA', 'EMISSAO', 'ALTERACAO', 'ALTERACAO_VENCIMENTO',
    'ALTERACAO_VALOR', 'BAIXA_ADMINISTRATIVA', 'BAIXA_SEM_PAGAMENTO', 'CANCELAMENTO',
    'PROTESTO', 'PEDIDO_BAIXA', 'DEVOLUCAO', 'ESTORNO', 'REJEICAO'
];

$eventoNaoPermitido = (!empty($evento) && in_array($evento, $eventosNaoLiquidacao, true));

// Status que confirmam quitação financeira legítima
$statusConfirmadosPagamento = ['LIQUIDADO', 'PAGO', 'BAIXADO_POR_LIQUIDACAO', 'RECEBIDO', 'CONCLUIDO'];

// Suporte estrito ao formato oficial Pix Sicredi / BACEN (array 'pix')
$isPixBacenValido = false;
if (!empty($payload['pix']) && is_array($payload['pix']) && isset($payload['pix'][0])) {
    $itemPix = $payload['pix'][0];
    $txidPix = trim((string)($itemPix['txid'] ?? ''));
    $e2ePix = trim((string)($itemPix['endToEndId'] ?? ''));
    $valorPix = floatval($itemPix['valor'] ?? 0);
    $temDevolucao = !empty($itemPix['devolucoes']) && is_array($itemPix['devolucoes']) && count($itemPix['devolucoes']) > 0;
    $statusPix = strtoupper(trim((string)($itemPix['status'] ?? 'CONCLUIDO')));

    if (empty($seuNumero)) {
        $seuNumero = !empty($txidPix) ? $txidPix : $e2ePix;
    }

    // Critérios estritos BACEN/Sicredi Pix: identificador presente, valor > 0, sem devoluções, status não estornado
    if (!empty($seuNumero) && $valorPix > 0 && !$temDevolucao && !in_array($statusPix, ['DEVOLVIDO', 'CANCELADO', 'REJEITADO', 'ESTORNADO'], true)) {
        $isPixBacenValido = true;
        $statusDeclarado = 'LIQUIDADO';
    }
}

// Determinação estrita da liquidação segundo os formatos contratuais Sicredi
$pagamentoEfetivamenteLiquidado = false;
if (!$eventoNaoPermitido) {
    if ($isPixBacenValido) {
        $pagamentoEfetivamenteLiquidado = true;
    } elseif (!empty($statusDeclarado) && in_array($statusDeclarado, $statusConfirmadosPagamento, true)) {
        $pagamentoEfetivamenteLiquidado = true;
    } elseif (!empty($evento) && (strpos($evento, 'LIQUIDAC') !== false || in_array($evento, ['TITULO_LIQUIDADO', 'BAIXA_POR_LIQUIDACAO', 'PIX_RECEBIDO', 'PAGO'], true))) {
        $pagamentoEfetivamenteLiquidado = true;
    }
}

$baixou = false;
$jaEstavaPago = false;
$vendaAfetada = null;

if (!empty($seuNumero) && $pagamentoEfetivamenteLiquidado && file_exists($vendasFile)) {
    $vendas = json_decode(file_get_contents($vendasFile), true);
    if (is_array($vendas)) {
        foreach ($vendas as $vi => $venda) {
            if (!empty($venda['parcelasBoletos']) && is_array($venda['parcelasBoletos'])) {
                foreach ($venda['parcelasBoletos'] as $pi => $parcela) {
                    $idEsperado = "{$venda['codigoPedido']}-P{$parcela['numero']}";
                    $txidEsperado = trim((string)($parcela['txid'] ?? ''));
                    $nossoNumEsperado = trim((string)($parcela['nossoNumero'] ?? ''));

                    // Correspondência estrita e exata (===)
                    $bateId = ($seuNumero === $idEsperado);
                    $bateTxid = ($txidEsperado !== '' && $seuNumero === $txidEsperado);
                    $bateNossoNumero = ($nossoNumEsperado !== '' && $seuNumero === $nossoNumEsperado);

                    if ($bateId || $bateTxid || $bateNossoNumero) {
                        if (strtoupper($parcela['status'] ?? '') === 'PAGO') {
                            $jaEstavaPago = true;
                            $vendaAfetada = $venda['codigoPedido'];
                            break 2;
                        }

                        $vendas[$vi]['parcelasBoletos'][$pi]['status'] = 'PAGO';
                        $vendas[$vi]['parcelasBoletos'][$pi]['dataPagamento'] = date('d/m/Y H:i');
                        $vendas[$vi]['parcelasBoletos'][$pi]['origemPagamento'] = 'SICREDI_WEBHOOK_AUTENTICADO';
                        $baixou = true;
                        $vendaAfetada = $venda['codigoPedido'];
                        break 2;
                    }
                }
            }
        }
        if ($baixou) {
            file_put_contents($vendasFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
    }
}

echo json_encode([
    'sucesso' => true,
    'baixado' => $baixou,
    'jaPagoAnteriormente' => $jaEstavaPago,
    'pagamentoLiquidado' => $pagamentoEfetivamenteLiquidado,
    'statusReconhecido' => $statusDeclarado ?: ($evento ?: 'NAO_INFORMADO'),
    'pedido' => $vendaAfetada,
    'mensagem' => $baixou ? 'Pagamento liquidado e registrado com sucesso!' : ($jaEstavaPago ? 'Pagamento já havia sido baixado anteriormente (idempotente).' : ($pagamentoEfetivamenteLiquidado ? 'Notificação verificada, mas parcela não localizada na base.' : 'Notificação recebida. Status não representa liquidação financeira válida; nenhuma alteração efetuada.'))
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
