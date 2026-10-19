<?php
// Webhook Oficial Sicredi Cobrança Online - Baixa Automática em Tempo Real
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$logFile = __DIR__ . '/sicredi_webhook_log.json';
$vendasFile = __DIR__ . '/vendas_albuns_db.json';

// Registrar payload recebido para auditoria
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true) ?: $_POST;

$entry = [
    'data_hora' => date('d/m/Y H:i:s'),
    'headers' => getallheaders(),
    'payload' => $payload
];

$logs = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
if (!is_array($logs)) $logs = [];
array_unshift($logs, $entry);
// Limita logs aos últimos 200
if (count($logs) > 200) $logs = array_slice($logs, 0, 200);
file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'online',
        'mensagem' => 'Webhook Sicredi Cobrança Online operacional',
        'total_notificacoes' => count($logs)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Processamento da notificação de liquidação / pagamento
// O Sicredi envia dados como 'nossoNumero', 'seuNumero' (ex: ALB-2026-090-P1) ou 'txid'
$seuNumero = $payload['seuNumero'] ?? $payload['txid'] ?? $payload['nossoNumero'] ?? '';
$statusPagamento = strtoupper($payload['status'] ?? $payload['situacao'] ?? '');

$baixou = false;
$vendaAfetada = null;

if (!empty($seuNumero) && file_exists($vendasFile)) {
    $vendas = json_decode(file_get_contents($vendasFile), true);
    if (is_array($vendas)) {
        foreach ($vendas as $vi => $venda) {
            if (!empty($venda['parcelasBoletos']) && is_array($venda['parcelasBoletos'])) {
                foreach ($venda['parcelasBoletos'] as $pi => $parcela) {
                    $idEsperado = "{$venda['codigoPedido']}-P{$parcela['numero']}";
                    $txidEsperado = $parcela['txid'] ?? '';
                    $nossoNumEsperado = $parcela['nossoNumero'] ?? '';

                    if (
                        strpos($seuNumero, $idEsperado) !== false ||
                        ($txidEsperado !== '' && $seuNumero === $txidEsperado) ||
                        ($nossoNumEsperado !== '' && $seuNumero === $nossoNumEsperado)
                    ) {
                        $vendas[$vi]['parcelasBoletos'][$pi]['status'] = 'PAGO';
                        $vendas[$vi]['parcelasBoletos'][$pi]['dataPagamento'] = date('d/m/Y H:i');
                        $vendas[$vi]['parcelasBoletos'][$pi]['origemPagamento'] = 'SICREDI_WEBHOOK_API';
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
    'pedido' => $vendaAfetada,
    'mensagem' => $baixou ? 'Pagamento liquidado com sucesso!' : 'Notificação recebida e registrada.'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
