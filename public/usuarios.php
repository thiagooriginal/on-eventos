<?php
// API Centralizada de Usuários e Autenticação ON Eventos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/usuarios_db.json';

function getUsuariosBase() {
    return [
        [
            'id' => 'usr-1',
            'nome' => 'Thiago Original',
            'email' => 'thiago@onagenciadeeventos.com.br',
            'senha' => 'On@2026',
            'nivel' => 'ADMIN',
            'cargo' => 'Diretor Geral & Executivo',
            'departamento' => 'Diretoria',
            'telefone' => '(11) 99876-5432',
            'status' => 'ATIVO',
            'criadoEm' => '2026-01-15T09:00:00.000Z',
            'ultimoAcesso' => 'Hoje',
            'avatarCor' => 'from-amber-400 to-amber-200 text-slate-900',
        ],
        [
            'id' => 'usr-2',
            'nome' => 'Administrador ON',
            'email' => 'admin@formatura.com.br',
            'senha' => 'On@2026',
            'nivel' => 'ADMIN',
            'cargo' => 'Administrador da Plataforma',
            'departamento' => 'Tecnologia & Operações',
            'telefone' => '(11) 98765-4321',
            'status' => 'ATIVO',
            'criadoEm' => '2026-01-15T10:00:00.000Z',
            'ultimoAcesso' => 'Hoje',
            'avatarCor' => 'from-purple-600 to-indigo-600 text-white',
        ],
        [
            'id' => 'usr-valter',
            'nome' => 'Valter Sá',
            'email' => 'valter.sa@hotmail.com',
            'senha' => '1gabriella5',
            'nivel' => 'ADMIN',
            'cargo' => 'Consultor Comercial',
            'departamento' => 'Comercial & Vendas',
            'telefone' => '(11) 91219-8389',
            'status' => 'ATIVO',
            'criadoEm' => '2026-10-14T20:00:00.000Z',
            'ultimoAcesso' => 'Nunca acessou',
            'avatarCor' => 'from-blue-600 to-indigo-600 text-white',
        ],
    ];
}

// Inicializa banco de dados centralizado se não existir
if (!file_exists($dataFile)) {
    $base = getUsuariosBase();
    file_put_contents($dataFile, json_encode($base, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$usuarios = json_decode($content, true);
if (!is_array($usuarios) || empty($usuarios)) {
    $usuarios = getUsuariosBase();
    file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    // Ação: Exclusão definitiva de um usuário
    if ($action === 'delete') {
        $idParaRemover = $payload['id'] ?? '';
        $emailParaRemover = strtolower(trim($payload['email'] ?? ''));

        $usuariosFiltrados = [];
        foreach ($usuarios as $u) {
            $uEmail = strtolower(trim($u['email'] ?? ''));
            // Impede exclusão dos donos do sistema
            if ($uEmail === 'thiago@onagenciadeeventos.com.br' || $uEmail === 'admin@formatura.com.br') {
                $usuariosFiltrados[] = $u;
                continue;
            }

            $bateId = !empty($idParaRemover) && $u['id'] === $idParaRemover;
            $bateEmail = !empty($emailParaRemover) && $uEmail === $emailParaRemover;

            if ($bateId || $bateEmail) {
                // Usuário excluído com sucesso (ignorado na nova lista)
                continue;
            }

            $usuariosFiltrados[] = $u;
        }

        $usuarios = array_values($usuariosFiltrados);
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['sucesso' => true, 'mensagem' => 'Usuário excluído definitivamente', 'usuarios' => $usuarios]);
        exit;
    }

    // Ação: Adicionar novo usuário
    if ($action === 'add' && !empty($payload['usuario'])) {
        $novo = $payload['usuario'];
        $novoEmail = strtolower(trim($novo['email'] ?? ''));
        $usuariosFiltrados = [];
        foreach ($usuarios as $u) {
            if (strtolower(trim($u['email'] ?? '')) !== $novoEmail) {
                $usuariosFiltrados[] = $u;
            }
        }
        array_unshift($usuariosFiltrados, $novo);
        $usuarios = array_values($usuariosFiltrados);
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'usuario' => $novo, 'usuarios' => $usuarios], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação: Salvar lista inteira (sincronização)
    if ($action === 'save' && isset($payload['usuarios']) && is_array($payload['usuarios'])) {
        $usuarios = array_values($payload['usuarios']);
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => count($usuarios), 'usuarios' => $usuarios], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode(array_values($usuarios), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
