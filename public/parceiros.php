<?php
// API Centralizada de Parceiros: Profissionais Liberais & Espaços para Eventos
// ON Agência de Eventos & Formaturas
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';
require_auth(['ADMIN', 'EQUIPE_INTERNA', 'BASICO']);

$dataFile = get_secure_storage_path('parceiros_db.json');

// Inicializa arquivo com estrutura caso não exista
if (!file_exists($dataFile)) {
    $inicial = [
        'profissionais' => [],
        'espacos' => []
    ];
    file_put_contents($dataFile, json_encode($inicial, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$data = json_decode($content, true);
if (!is_array($data)) {
    $data = ['profissionais' => [], 'espacos' => []];
}
if (!isset($data['profissionais'])) $data['profissionais'] = [];
if (!isset($data['espacos'])) $data['espacos'] = [];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'sucesso' => true,
        'profissionais' => $data['profissionais'],
        'espacos' => $data['espacos']
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_auth(['ADMIN', 'EQUIPE_INTERNA']);

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save_all';

    // Mutações de parceiros exigem validação CSRF
    verify_csrf_token($payload['csrf_token'] ?? null);

    // Salvar estado completo
    if ($action === 'save_all') {
        if (isset($payload['profissionais']) && is_array($payload['profissionais'])) {
            $data['profissionais'] = array_values($payload['profissionais']);
        }
        if (isset($payload['espacos']) && is_array($payload['espacos'])) {
            $data['espacos'] = array_values($payload['espacos']);
        }
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode([
            'sucesso' => true,
            'profissionais' => $data['profissionais'],
            'espacos' => $data['espacos']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Salvar apenas profissionais
    if ($action === 'save_profissionais' && isset($payload['profissionais']) && is_array($payload['profissionais'])) {
        $data['profissionais'] = array_values($payload['profissionais']);
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'profissionais' => $data['profissionais']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Salvar apenas espaços
    if ($action === 'save_espacos' && isset($payload['espacos']) && is_array($payload['espacos'])) {
        $data['espacos'] = array_values($payload['espacos']);
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'espacos' => $data['espacos']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Adicionar Profissional
    if ($action === 'add_profissional' && !empty($payload['item'])) {
        array_unshift($data['profissionais'], $payload['item']);
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'profissionais' => $data['profissionais']]);
        exit;
    }

    // Adicionar Espaço
    if ($action === 'add_espaco' && !empty($payload['item'])) {
        array_unshift($data['espacos'], $payload['item']);
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'espacos' => $data['espacos']]);
        exit;
    }

    // Excluir Profissional
    if ($action === 'delete_profissional' && !empty($payload['id'])) {
        $id = $payload['id'];
        $data['profissionais'] = array_values(array_filter($data['profissionais'], function($p) use ($id) {
            return ($p['id'] ?? '') !== $id;
        }));
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'profissionais' => $data['profissionais']]);
        exit;
    }

    // Excluir Espaço
    if ($action === 'delete_espaco' && !empty($payload['id'])) {
        $id = $payload['id'];
        $data['espacos'] = array_values(array_filter($data['espacos'], function($e) use ($id) {
            return ($e['id'] ?? '') !== $id;
        }));
        file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'espacos' => $data['espacos']]);
        exit;
    }

    echo json_encode(['sucesso' => false, 'erro' => 'Ação não reconhecida']);
}
