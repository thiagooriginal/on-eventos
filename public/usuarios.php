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
        [
            'id' => 'usr-3',
            'nome' => 'Rodrigo Consultor',
            'email' => 'vendedor.rodrigo@formatura.com.br',
            'senha' => 'On@2026',
            'nivel' => 'BASICO',
            'cargo' => 'Consultor Comercial de Formaturas',
            'departamento' => 'Comercial',
            'telefone' => '(11) 97654-3210',
            'status' => 'ATIVO',
            'criadoEm' => '2026-02-01T14:30:00.000Z',
            'ultimoAcesso' => 'Hoje',
            'avatarCor' => 'from-blue-500 to-cyan-500 text-white',
        ],
        [
            'id' => 'usr-4',
            'nome' => 'Camila Fotografia',
            'email' => 'camila.fotos@formatura.com.br',
            'senha' => 'On@2026',
            'nivel' => 'BASICO',
            'cargo' => 'Especialista em Vendas de Álbuns & Kits',
            'departamento' => 'Fotografia & Produção',
            'telefone' => '(11) 96543-2109',
            'status' => 'ATIVO',
            'criadoEm' => '2026-02-10T11:00:00.000Z',
            'ultimoAcesso' => 'Hoje',
            'avatarCor' => 'from-fuchsia-500 to-pink-500 text-white',
        ],
        [
            'id' => 'usr-5',
            'nome' => 'Larissa Atendimento',
            'email' => 'larissa.comissao@formatura.com.br',
            'senha' => 'On@2026',
            'nivel' => 'BASICO',
            'cargo' => 'Coordenadora de Atendimento às Comissões',
            'departamento' => 'Atendimento & Suporte',
            'telefone' => '(11) 95432-1098',
            'status' => 'ATIVO',
            'criadoEm' => '2026-03-05T08:15:00.000Z',
            'ultimoAcesso' => 'Hoje',
            'avatarCor' => 'from-emerald-500 to-teal-500 text-white',
        ],
    ];
}

// Inicializa banco de dados centralizado se não existir
if (!file_exists($dataFile)) {
    $base = getUsuariosBase();
    file_put_contents($dataFile, json_encode($base, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$usuarios = json_decode($content, true) ?: getUsuariosBase();

// Garante que Valter está sempre presente e ativo
$valterPresente = false;
foreach ($usuarios as &$u) {
    if (strtolower($u['email']) === 'valter.sa@hotmail.com') {
        $u['senha'] = '1gabriella5';
        $u['status'] = 'ATIVO';
        $valterPresente = true;
        break;
    }
}
if (!$valterPresente) {
    $usuarios[] = [
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
    ];
    file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    if ($action === 'save' && !empty($payload['usuarios']) && is_array($payload['usuarios'])) {
        $usuarios = $payload['usuarios'];
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['sucesso' => true, 'total' => count($usuarios)]);
        exit;
    }

    if ($action === 'add' && !empty($payload['usuario'])) {
        $novo = $payload['usuario'];
        $usuarios[] = $novo;
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['sucesso' => true, 'usuario' => $novo]);
        exit;
    }
}

echo json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
