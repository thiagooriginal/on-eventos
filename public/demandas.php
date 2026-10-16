<?php
// API Centralizada de Demandas Internas & Tarefas de Equipe ON Eventos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/demandas_db.json';

// Inicializa banco de dados centralizado limpo (início do zero)
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$demandas = json_decode($content, true);
if (!is_array($demandas)) {
    $demandas = [];
    file_put_contents($dataFile, json_encode($demandas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    if ($action === 'clear') {
        $demandas = [];
        file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'demandas' => []]);
        exit;
    }

    if ($action === 'save' && isset($payload['demandas']) && is_array($payload['demandas'])) {
        $demandas = array_values($payload['demandas']);
        file_put_contents($dataFile, json_encode($demandas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => count($demandas), 'demandas' => $demandas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete' && !empty($payload['id'])) {
        $id = $payload['id'];
        $filtradas = array_filter($demandas, function($d) use ($id) {
            return ($d['id'] ?? '') !== $id;
        });
        $demandas = array_values($filtradas);
        file_put_contents($dataFile, json_encode($demandas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'demandas' => $demandas]);
        exit;
    }

    if ($action === 'add' && !empty($payload['demanda'])) {
        array_unshift($demandas, $payload['demanda']);
        file_put_contents($dataFile, json_encode($demandas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'demandas' => $demandas]);
        exit;
    }
}

echo json_encode(array_values($demandas), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
