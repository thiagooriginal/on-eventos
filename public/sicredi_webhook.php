<?php
// Webhook Oficial Sicredi Cobrança Online - Baixa Automática em Tempo Real
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';

$logFile = get_secure_storage_path('sicredi_webhook_log.json');
$vendasFile = get_secure_storage_path('vendas_albuns_db.json');
$configFile = get_secure_storage_path('sicredi_api_config.json');

// Função de validação criptográfica da autenticidade da notificação (HMAC / Secret Token)
function validarAssinaturaWebhook($headers, $rawBody) {
    // 1. Obter segredo configurado no ambiente ou arquivo seguro
    $webhookSecret = getenv('SICREDI_WEBHOOK_SECRET');
    if (empty($webhookSecret) && file_exists($GLOBALS['configFile'])) {
        $cfg = json_decode(@file_get_contents($GLOBALS['configFile']), true) ?: [];
        $webhookSecret = $cfg['webhook_secret'] ?? '';
    }

    // 2. Verifica token de cabeçalho X-Webhook-Secret ou Authorization
    $tokenEnviado = $headers['X-Webhook-Secret'] ?? $headers['x-webhook-secret'] ?? '';
    if (empty($tokenEnviado) && !empty($headers['Authorization'])) {
        $auth = trim($headers['Authorization']);
        if (stripos($auth, 'Bearer ') === 0) {
            $tokenEnviado = substr($auth, 7);
        }
    }

    // Validação por token compartilhado constante
    if (!empty($webhookSecret) && !empty($tokenEnviado)) {
        if (hash_equals($webhookSecret, $tokenEnviado)) {
            return true;
        }
    }

    // 3. Validação por assinatura HMAC-SHA256 (se enviada pelo gateway)
    $signatureEnviada = $headers['X-Signature-Sha256'] ?? $headers['x-signature-sha256'] ?? '';
    if (!empty($webhookSecret) && !empty($signatureEnviada)) {
        $esperada = hash_hmac('sha256', $rawBody, $webhookSecret);
        if (hash_equals($esperada, $signatureEnviada)) {
            return true;
        }
    }

    // 4. Permite chamadas autenticadas por administrador logado para testes manuais
    $usuario = get_authenticated_user();
    if ($usuario && strtoupper($usuario['nivel'] ?? '') === 'ADMIN') {
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

// Validação estrita de autenticidade no POST
if (!validarAssinaturaWebhook($headers, $raw)) {
    http_response_code(401);
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Não autorizado: assinatura ou token do webhook inválido.',
        'codigo' => 'WEBHOOK_UNAUTHORIZED'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Processamento da notificação de liquidação com correspondência EXATA
$seuNumero = trim((string)($payload['seuNumero'] ?? $payload['txid'] ?? $payload['nossoNumero'] ?? ''));
$statusPagamento = strtoupper(trim((string)($payload['status'] ?? $payload['situacao'] ?? 'LIQUIDADO')));

// Status que confirmam pagamento real
$statusValidosPagamento = ['LIQUIDADO', 'PAGO', 'BAIXADO', 'RECEBIDO', 'CONCLUIDO'];
$statusValido = in_array($statusPagamento, $statusValidosPagamento);

$baixou = false;
$jaEstavaPago = false;
$vendaAfetada = null;

if (!empty($seuNumero) && $statusValido && file_exists($vendasFile)) {
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
    'pedido' => $vendaAfetada,
    'mensagem' => $baixou ? 'Pagamento liquidado e registrado com sucesso!' : ($jaEstavaPago ? 'Pagamento já havia sido baixado anteriormente (idempotente).' : 'Notificação recebida e verificada.')
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
