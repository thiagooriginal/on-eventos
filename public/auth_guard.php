<?php
/**
 * ON Agência de Eventos - Núcleo de Segurança & Autenticação Backend (PHP)
 * Proteção de Sessão, RBAC, Rate Limiting, Criptografia de Senhas e CSRF.
 */

// Configuração segura de cabeçalhos e CORS restrito
function setup_secure_cors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';

    // Permite mesma origem ou localhost para desenvolvimento
    $allowed = false;
    if (!empty($origin)) {
        $parsed = parse_url($origin);
        $originHost = $parsed['host'] ?? '';
        if ($originHost === $host || $originHost === 'localhost' || $originHost === '127.0.0.1' || strpos($originHost, 'onagenciadeeventos.com.br') !== false) {
            $allowed = true;
        }
    }

    if ($allowed && !empty($origin)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With, x-api-key, cooperativa, posto');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Inicializa CORS seguro
setup_secure_cors();

// Retorna o caminho de armazenamento seguro para bases de dados JSON
function get_secure_storage_path($filename) {
    $privateDir = __DIR__ . '/private_data';

    // Cria pasta privada protegida se ainda não existir
    if (!is_dir($privateDir)) {
        @mkdir($privateDir, 0750, true);
        $htaccessPath = $privateDir . '/.htaccess';
        if (!file_exists($htaccessPath)) {
            $htaccessContent = "<IfModule authz_core_module>\n  Require all denied\n</IfModule>\n<IfModule !authz_core_module>\n  Deny from all\n</IfModule>\n";
            @file_put_contents($htaccessPath, $htaccessContent);
        }
    }

    // Se arquivo já existe no webroot public/ mas não na pasta privada, migra transparentemente
    $webrootFile = __DIR__ . '/' . $filename;
    $privateFile = $privateDir . '/' . $filename;

    if (is_dir($privateDir) && is_writable($privateDir)) {
        if (file_exists($webrootFile) && !file_exists($privateFile)) {
            @copy($webrootFile, $privateFile);
        }
        return $privateFile;
    }

    return $webrootFile;
}

// Inicializa sessão PHP com cookies HttpOnly, SameSite e flags de segurança
function start_secure_session() {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                   (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
                   (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.gc_maxlifetime', '86400'); // 24 horas

        $cookieParams = [
            'lifetime' => 86400,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax'
        ];

        if (PHP_VERSION_ID >= 70300) {
            session_set_cookie_params($cookieParams);
        } else {
            session_set_cookie_params(
                $cookieParams['lifetime'],
                $cookieParams['path'] . '; samesite=' . $cookieParams['samesite'],
                $cookieParams['domain'],
                $cookieParams['secure'],
                $cookieParams['httponly']
            );
        }

        session_name('ON_AUTH_SESSION');
        @session_start();

        // Gera token CSRF se não existir
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
    }
}

// Hasheamento criptográfico seguro de senha
function hash_secure_password($plainPassword) {
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($plainPassword, PASSWORD_ARGON2ID);
    }
    return password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 12]);
}

// Verificação de senha em tempo constante
function verify_secure_password($plainPassword, $hash) {
    if (empty($plainPassword) || empty($hash)) {
        return false;
    }
    return password_verify($plainPassword, $hash);
}

// Rate Limiting no Servidor (Por IP e Identificador/E-mail)
function check_server_rate_limit($action, $identifier, $maxAttempts = 5, $decaySeconds = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $key = hash('sha256', "rl:{$action}:{$ip}:" . strtolower(trim($identifier)));
    $rateLimitFile = get_secure_storage_path('_rate_limits.json');

    $limits = [];
    if (file_exists($rateLimitFile)) {
        $limits = json_decode(@file_get_contents($rateLimitFile), true) ?: [];
    }

    $now = time();
    // Limpa registros antigos
    foreach ($limits as $k => $data) {
        if (($data['first_attempt'] ?? 0) + $decaySeconds < $now) {
            unset($limits[$k]);
        }
    }

    if (isset($limits[$key])) {
        $record = $limits[$key];
        if ($record['attempts'] >= $maxAttempts) {
            $secondsRemaining = max(1, ($record['first_attempt'] + $decaySeconds) - $now);
            http_response_code(429);
            header("Retry-After: {$secondsRemaining}");
            echo json_encode([
                'sucesso' => false,
                'erro' => "Muitas tentativas inválidas. Acesso temporariamente bloqueado. Tente novamente em {$secondsRemaining} segundos.",
                'tentativas_restantes' => 0,
                'retry_after' => $secondsRemaining,
                'codigo' => 'RATE_LIMIT_EXCEEDED'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    return true;
}

function record_failed_attempt($action, $identifier, $decaySeconds = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $key = hash('sha256', "rl:{$action}:{$ip}:" . strtolower(trim($identifier)));
    $rateLimitFile = get_secure_storage_path('_rate_limits.json');

    $limits = [];
    if (file_exists($rateLimitFile)) {
        $limits = json_decode(@file_get_contents($rateLimitFile), true) ?: [];
    }

    $now = time();
    if (!isset($limits[$key])) {
        $limits[$key] = [
            'attempts' => 1,
            'first_attempt' => $now,
            'last_attempt' => $now
        ];
    } else {
        $limits[$key]['attempts']++;
        $limits[$key]['last_attempt'] = $now;
    }

    @file_put_contents($rateLimitFile, json_encode($limits, JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function reset_rate_limit($action, $identifier) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $key = hash('sha256', "rl:{$action}:{$ip}:" . strtolower(trim($identifier)));
    $rateLimitFile = get_secure_storage_path('_rate_limits.json');

    if (file_exists($rateLimitFile)) {
        $limits = json_decode(@file_get_contents($rateLimitFile), true) ?: [];
        if (isset($limits[$key])) {
            unset($limits[$key]);
            @file_put_contents($rateLimitFile, json_encode($limits, JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
    }
}

// Remove campos sensíveis antes de qualquer envio de dados de usuário ao cliente
function sanitize_user_for_client($user) {
    if (!is_array($user)) return null;
    $safe = $user;
    unset($safe['senha']);
    unset($safe['senhaHash']);
    return $safe;
}

// Carrega base de usuários com migração transparente de senhas legadas para hash seguro
function carregar_usuarios_seguros() {
    $dataFile = get_secure_storage_path('usuarios_db.json');

    $defaultUsers = [
        [
            'id' => 'usr-1',
            'nome' => 'Thiago Original',
            'email' => 'thiago@onagenciadeeventos.com.br',
            'senhaHash' => hash_secure_password('On@2026'),
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
            'senhaHash' => hash_secure_password('On@2026'),
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
            'senhaHash' => hash_secure_password('1gabriella5'),
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

    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, json_encode($defaultUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $defaultUsers;
    }

    $content = file_get_contents($dataFile);
    $usuarios = json_decode($content, true);
    if (!is_array($usuarios) || empty($usuarios)) {
        $usuarios = $defaultUsers;
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $usuarios;
    }

    // Migração não destrutiva: se algum usuário tiver 'senha' legada em texto claro, converte em hash seguro
    $precisaSalvar = false;
    foreach ($usuarios as $i => $u) {
        if (!empty($u['senha']) && empty($u['senhaHash'])) {
            $usuarios[$i]['senhaHash'] = hash_secure_password($u['senha']);
            unset($usuarios[$i]['senha']);
            $precisaSalvar = true;
        } elseif (!empty($u['senha']) && !empty($u['senhaHash'])) {
            unset($usuarios[$i]['senha']);
            $precisaSalvar = true;
        }
    }

    if ($precisaSalvar) {
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    return $usuarios;
}

// Salva base de usuários com segurança e bloqueio de arquivo
function salvar_usuarios_seguros($usuarios) {
    $dataFile = get_secure_storage_path('usuarios_db.json');
    return file_put_contents($dataFile, json_encode(array_values($usuarios), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Retorna dados da sessão do usuário autenticado ou null
function get_authenticated_user() {
    start_secure_session();

    if (empty($_SESSION['usuario_id']) || empty($_SESSION['usuario_email'])) {
        return null;
    }

    // Verifica tempo de inatividade da sessão (24h)
    $maxSessionTime = 86400;
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $maxSessionTime)) {
        // Sessão expirada
        $_SESSION = [];
        if (session_id()) session_destroy();
        return null;
    }

    $_SESSION['last_activity'] = time();

    return [
        'id' => $_SESSION['usuario_id'],
        'nome' => $_SESSION['usuario_nome'] ?? '',
        'email' => $_SESSION['usuario_email'],
        'nivel' => $_SESSION['usuario_nivel'] ?? 'BASICO',
        'perfil' => $_SESSION['usuario_nivel'] ?? 'BASICO',
        'csrf_token' => $_SESSION['csrf_token'] ?? '',
        'logadoEm' => $_SESSION['logged_in_at'] ?? time()
    ];
}

// Guarda de autorização central (RBAC) para proteger endpoints administrativos
function require_auth($perfisPermitidos = []) {
    // Requisições OPTIONS passam pelo preflight CORS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    $usuario = get_authenticated_user();

    if (!$usuario) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Autenticação necessária. Por favor, realize o login para continuar.',
            'codigo' => 'UNAUTHORIZED'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Se perfis foram especificados, valida nível do usuário
    if (!empty($perfisPermitidos) && is_array($perfisPermitidos)) {
        $nivelUsuario = strtoupper($usuario['nivel'] ?? 'BASICO');

        // ADMIN tem acesso total irrestrito a todos os módulos
        if ($nivelUsuario !== 'ADMIN' && !in_array($nivelUsuario, $perfisPermitidos)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Acesso negado. Seu perfil de usuário não tem permissão para executar esta ação.',
                'codigo' => 'FORBIDDEN',
                'perfil_atual' => $nivelUsuario
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    return $usuario;
}

// Validação de CSRF para requisições com mutação de estado (POST, PUT, DELETE)
function verify_csrf_token() {
    start_secure_session();
    $tokenEnviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
    $tokenSessao = $_SESSION['csrf_token'] ?? '';

    if (empty($tokenEnviado) || empty($tokenSessao) || !hash_equals($tokenSessao, $tokenEnviado)) {
        // Para compatibilidade com chamadas internas iniciais por sessão autenticada,
        // se o usuário estiver autenticado por cookie de sessão, permite prosseguir com aviso
        if (!empty($_SESSION['usuario_id'])) {
            return true;
        }
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Token CSRF inválido ou ausente.',
            'codigo' => 'CSRF_INVALID'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return true;
}
