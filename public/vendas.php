<?php
// API Centralizada de Vendas de Álbuns & Auditoria de Segurança ON Eventos
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';
require_auth(['ADMIN', 'EQUIPE_INTERNA', 'VENDEDOR', 'BASICO']);

$dataFile = get_secure_storage_path('vendas_albuns_db.json');
$logFile = get_secure_storage_path('vendas_excluidas_db.json');

// Inicializa arquivos de banco de dados se não existirem
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
if (!file_exists($logFile)) {
    file_put_contents($logFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$vendas = json_decode($content, true);
if (!is_array($vendas)) {
    $vendas = [];
}

$logContent = file_get_contents($logFile);
$logsExclusoes = json_decode($logContent, true);
if (!is_array($logsExclusoes)) {
    $logsExclusoes = [];
}

// Filtra e remove clientes fictícios de teste garantindo apenas dados reais
function filtrarApenasReais($lista) {
    if (!is_array($lista)) return [];
    return array_values(array_filter($lista, function($v) {
        $id = strtolower(trim($v['id'] ?? ''));
        $codigo = strtoupper(trim($v['codigoPedido'] ?? ''));
        $nome = strtolower(trim($v['alunoNome'] ?? ''));
        $cpf = preg_replace('/\D/', '', $v['alunoCpf'] ?? '');

        if (in_array($id, ['venda-001', 'venda-002', 'venda-003'])) return false;
        if (in_array($codigo, ['ALB-2026-001', 'ALB-2026-002', 'ALB-2026-003'])) return false;
        if (strpos($nome, 'gabriel santos') !== false) return false;
        if (strpos($nome, 'amanda oliveira') !== false) return false;
        if (strpos($nome, 'leonardo castro') !== false) return false;
        if (in_array($cpf, ['12345678900', '98765432111', '45678912322'])) return false;

        return true;
    }));
}

$vendasLimpo = filtrarApenasReais($vendas);
if (count($vendasLimpo) !== count($vendas)) {
    $vendas = $vendasLimpo;
    file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    if ($action === 'clear') {
        require_auth(['ADMIN']);
        $vendas = [];
        file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => 0, 'vendas' => []], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'purge_mocks') {
        require_auth(['ADMIN']);
        $vendas = filtrarApenasReais($vendas);
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => count($vendas), 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'save' && isset($payload['vendas']) && is_array($payload['vendas'])) {
        require_auth(['ADMIN', 'EQUIPE_INTERNA']);
        $vendas = filtrarApenasReais($payload['vendas']);
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => count($vendas), 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'add' && !empty($payload['venda'])) {
        require_auth(['ADMIN', 'EQUIPE_INTERNA', 'VENDEDOR']);
        if (filtrarApenasReais([$payload['venda']])) {
            array_unshift($vendas, $payload['venda']);
            file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
        echo json_encode(['sucesso' => true, 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Exclusão com Registro de Segurança e Auditoria
    if ($action === 'delete_with_log' && !empty($payload['id'])) {
        require_auth(['ADMIN']);
        $id = $payload['id'];
        $vendaRemovida = null;
        foreach ($vendas as $v) {
            if (($v['id'] ?? '') === $id) {
                $vendaRemovida = $v;
                break;
            }
        }

        $vendas = array_values(array_filter($vendas, function($v) use ($id) {
            return ($v['id'] ?? '') !== $id;
        }));
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

        if (!empty($payload['log'])) {
            $novoLog = $payload['log'];
            array_unshift($logsExclusoes, $novoLog);
            file_put_contents($logFile, json_encode($logsExclusoes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        }

        echo json_encode([
            'sucesso' => true,
            'vendas' => $vendas,
            'logsExclusoes' => $logsExclusoes,
            'removido' => $vendaRemovida
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Obter logs de exclusões para a tela de segurança
    if ($action === 'get_deleted_logs') {
        require_auth(['ADMIN']);
        echo json_encode(['sucesso' => true, 'logsExclusoes' => $logsExclusoes], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Restaurar álbum excluído de volta para a lista ativa
    if ($action === 'restore' && !empty($payload['logId'])) {
        require_auth(['ADMIN']);
        $logId = $payload['logId'];
        $logRestaurar = null;

        foreach ($logsExclusoes as $log) {
            if (($log['id'] ?? '') === $logId) {
                $logRestaurar = $log;
                break;
            }
        }

        if ($logRestaurar && !empty($logRestaurar['dadosVenda'])) {
            $vendaRestaurada = $logRestaurar['dadosVenda'];
            array_unshift($vendas, $vendaRestaurada);
            file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

            $logsExclusoes = array_values(array_filter($logsExclusoes, function($l) use ($logId) {
                return ($l['id'] ?? '') !== $logId;
            }));
            file_put_contents($logFile, json_encode($logsExclusoes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

            echo json_encode([
                'sucesso' => true,
                'vendas' => $vendas,
                'logsExclusoes' => $logsExclusoes,
                'restaurado' => $vendaRestaurada
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(['sucesso' => false, 'erro' => 'Log não encontrado para restaurar'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete' && !empty($payload['id'])) {
        require_auth(['ADMIN']);
        $id = $payload['id'];
        $vendas = array_values(array_filter($vendas, function($v) use ($id) {
            return ($v['id'] ?? '') !== $id;
        }));
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Resposta GET padrão com as vendas limpas
echo json_encode(array_values($vendas), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
