<?php
// API Centralizada de Vendas de Álbuns & Boletos Sicredi ON Eventos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/vendas_albuns_db.json';

function getVendasBase() {
    return [];
}

// Inicializa banco de dados centralizado se não existir
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$vendas = json_decode($content, true);
if (!is_array($vendas)) {
    $vendas = [];
}

// Filtra e remove clientes fictícios de teste garantindo apenas dados reais
$vendasLimpo = array_values(array_filter($vendas, function($v) {
    $id = $v['id'] ?? '';
    $nome = $v['alunoNome'] ?? '';
    return !in_array($id, ['venda-001', 'venda-002', 'venda-003']) &&
           !in_array($nome, ['Gabriel Santos Souza', 'Amanda Oliveira Lima', 'Leonardo Castro Ferreira']);
}));

if (count($vendasLimpo) !== count($vendas)) {
    $vendas = $vendasLimpo;
    file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    if ($action === 'clear') {
        $vendas = [];
        file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => 0, 'vendas' => []], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'save' && isset($payload['vendas']) && is_array($payload['vendas'])) {
        // Filtra para nunca gravar fictícios
        $vendas = array_values(array_filter($payload['vendas'], function($v) {
            $id = $v['id'] ?? '';
            $nome = $v['alunoNome'] ?? '';
            return !in_array($id, ['venda-001', 'venda-002', 'venda-003']) &&
                   !in_array($nome, ['Gabriel Santos Souza', 'Amanda Oliveira Lima', 'Leonardo Castro Ferreira']);
        }));
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => count($vendas), 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'add' && !empty($payload['venda'])) {
        array_unshift($vendas, $payload['venda']);
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete' && !empty($payload['id'])) {
        $id = $payload['id'];
        $vendas = array_values(array_filter($vendas, function($v) use ($id) {
            return ($v['id'] ?? '') !== $id;
        }));
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode(array_values($vendas), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
