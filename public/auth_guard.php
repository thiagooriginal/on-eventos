<?php
/**
 * ON Agência de Eventos - Núcleo de Segurança & Autenticação Backend (PHP)
 * Proteção Estrita de Sessão, RBAC Dinâmico, Rate Limiting, Hashing e CSRF Sem Bypass.
 */

// 1. Configuração de CORS Estrito (Comparação Exata de Protocolo, Host e Porta)
function setup_secure_cors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Lista estrita de origens explicitamente autorizadas
    $allowedOrigins = [
        'https://onagenciadeeventos.com.br',
        'https://www.onagenciadeeventos.com.br',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ];

    $originLimpa = rtrim($origin, '/');

    if (!empty($origin) && in_array($originLimpa, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$originLimpa}");
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
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

setup_secure_cors();

// 2. Armazenamento Seguro com Eliminação de Cópias no Webroot Público
function get_secure_storage_path($filename) {
    $privateDir = __DIR__ . '/private_data';

    // Cria diretório privado com proteções se não existir
    if (!is_dir($privateDir)) {
        @mkdir($privateDir, 0750, true);
        $htaccessPath = $privateDir . '/.htaccess';
        if (!file_exists($htaccessPath)) {
            $htaccessContent = "<IfModule authz_core_module>\n  Require all denied\n</IfModule>\n<IfModule !authz_core_module>\n  Deny from all\n</IfModule>\n";
            @file_put_contents($htaccessPath, $htaccessContent);
        }
        $indexPath = $privateDir . '/index.html';
        if (!file_exists($indexPath)) {
            @file_put_contents($indexPath, '');
        }
    }

    $webrootFile = __DIR__ . '/' . $filename;
    $privateFile = $privateDir . '/' . $filename;

    if (is_dir($privateDir) && is_writable($privateDir)) {
        // Se arquivo já existe no webroot público, migra para a pasta privada e remove do webroot
        if (file_exists($webrootFile)) {
            if (!file_exists($privateFile)) {
                $copiado = @copy($webrootFile, $privateFile);
                if ($copiado && filesize($privateFile) === filesize($webrootFile)) {
                    @unlink($webrootFile);
                }
            } else {
                // Já existe cópia segura no private_data: remove a cópia pública redundante
                @unlink($webrootFile);
            }
        }
        return $privateFile;
    }

    return $webrootFile;
}

// 3. Gerenciamento de Sessão Segura (Cookies HttpOnly, Strict Mode e SameSite)
function start_secure_session() {
    if (session_status() === PHP_SESSION_NONE) {
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                   (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
                   (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.gc_maxlifetime', '86400');

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

        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
    }
}

// 4. Criptografia e Hasheamento Seguro de Senhas
function hash_secure_password($plainPassword) {
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($plainPassword, PASSWORD_ARGON2ID);
    }
    return password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verify_secure_password($plainPassword, $hash) {
    if (empty($plainPassword) || empty($hash)) {
        return false;
    }
    return password_verify($plainPassword, $hash);
}

// 5. Rate Limiting no Servidor por IP e Identificador
function check_server_rate_limit($action, $identifier, $maxAttempts = 5, $decaySeconds = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $key = hash('sha256', "rl:{$action}:{$ip}:" . strtolower(trim($identifier)));
    $rateLimitFile = get_secure_storage_path('_rate_limits.json');

    $limits = [];
    if (file_exists($rateLimitFile)) {
        $limits = json_decode(@file_get_contents($rateLimitFile), true) ?: [];
    }

    $now = time();
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

// 6. Sanitização de Usuário (Nunca envia senhas, hashes ou segredos)
function sanitize_user_for_client($user) {
    if (!is_array($user)) return null;
    $safe = $user;
    unset($safe['senha']);
    unset($safe['senhaHash']);
    return $safe;
}

// 7. Base de Usuários Sem Senhas Padrão Conhecidas e Com Exigência de Redefinição
function carregar_usuarios_seguros() {
    $dataFile = get_secure_storage_path('usuarios_db.json');

    // Usuários preservados sem senhas padrão conhecidas no código
    $defaultUsers = [
        [
            'id' => 'usr-1',
            'nome' => 'Thiago Original',
            'email' => 'thiago@onagenciadeeventos.com.br',
            'senhaHash' => '',
            'precisaRedefinirSenha' => true,
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
            'senhaHash' => '',
            'precisaRedefinirSenha' => true,
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
            'senhaHash' => '',
            'precisaRedefinirSenha' => true,
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

    // Migração segura: remove campos de senha legados e exige redefinição se não houver senha forte pessoal
    $precisaSalvar = false;
    foreach ($usuarios as $i => $u) {
        if (isset($u['senha'])) {
            unset($usuarios[$i]['senha']);
            $precisaSalvar = true;
        }

        // Se o usuário não tem hash definido ou ainda usa hash de senha default conhecida
        if (empty($u['senhaHash'])) {
            $usuarios[$i]['precisaRedefinirSenha'] = true;
            $precisaSalvar = true;
        }
    }

    if ($precisaSalvar) {
        file_put_contents($dataFile, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    return $usuarios;
}

function salvar_usuarios_seguros($usuarios) {
    $dataFile = get_secure_storage_path('usuarios_db.json');
    return file_put_contents($dataFile, json_encode(array_values($usuarios), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// 8. Revalidação em Tempo Real de Sessões (Usuários Excluídos, Inativados ou com Nível Alterado)
function get_authenticated_user() {
    start_secure_session();

    if (empty($_SESSION['usuario_id']) || empty($_SESSION['usuario_email'])) {
        return null;
    }

    // 8.1 Verifica tempo máximo de inatividade (24h)
    $maxSessionTime = 86400;
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $maxSessionTime)) {
        $_SESSION = [];
        if (session_id()) session_destroy();
        return null;
    }

    // 8.2 Consulta a base de usuários no servidor para validar status em tempo real
    $usuarios = carregar_usuarios_seguros();
    $usuarioDb = null;
    foreach ($usuarios as $u) {
        if ($u['id'] === $_SESSION['usuario_id']) {
            $usuarioDb = $u;
            break;
        }
    }

    // Se o usuário foi excluído pelo administrador: destrói a sessão imediatamente
    if (!$usuarioDb) {
        $_SESSION = [];
        if (session_id()) session_destroy();
        return null;
    }

    // Se o usuário foi inativado pelo administrador: destrói a sessão imediatamente
    if (($usuarioDb['status'] ?? 'ATIVO') !== 'ATIVO') {
        $_SESSION = [];
        if (session_id()) session_destroy();
        return null;
    }

    // Se as permissões do usuário foram alteradas: sincroniza na sessão imediatamente
    $nivelAtual = strtoupper($usuarioDb['nivel'] ?? 'BASICO');
    $_SESSION['usuario_nivel'] = $nivelAtual;
    $_SESSION['usuario_nome'] = $usuarioDb['nome'];
    $_SESSION['usuario_email'] = $usuarioDb['email'];
    $_SESSION['last_activity'] = time();

    return [
        'id' => $usuarioDb['id'],
        'nome' => $usuarioDb['nome'],
        'email' => $usuarioDb['email'],
        'nivel' => $nivelAtual,
        'perfil' => $nivelAtual,
        'precisaRedefinirSenha' => !empty($usuarioDb['precisaRedefinirSenha']),
        'csrf_token' => $_SESSION['csrf_token'] ?? '',
        'logadoEm' => $_SESSION['logged_in_at'] ?? time()
    ];
}

// 9. Guarda de Autorização (RBAC) com Bloqueio de Usuários Pendentes de Redefinição
function require_auth($perfisPermitidos = [], $permitirPendenteRedefinicao = false) {
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

    // Exige redefinição de senha antes de permitir acesso aos recursos operacionais
    if (!empty($usuario['precisaRedefinirSenha']) && !$permitirPendenteRedefinicao) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Por motivos de segurança, você deve redefinir sua senha antes de prosseguir.',
            'codigo' => 'PASSWORD_RESET_REQUIRED',
            'precisaRedefinirSenha' => true
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!empty($perfisPermitidos) && is_array($perfisPermitidos)) {
        $nivelUsuario = strtoupper($usuario['nivel'] ?? 'BASICO');

        if ($nivelUsuario !== 'ADMIN' && !in_array($nivelUsuario, $perfisPermitidos)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Acesso negado. Seu perfil de usuário não tem permissão para este recurso.',
                'codigo' => 'FORBIDDEN',
                'perfil_atual' => $nivelUsuario
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    return $usuario;
}

// 10. Validação Estrita de CSRF Sem Bypass para Sessões Autenticadas
function verify_csrf_token($payloadToken = null) {
    start_secure_session();

    $tokenEnviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? $payloadToken ?? '';
    $tokenSessao = $_SESSION['csrf_token'] ?? '';

    // Validação estrita: exige token válido e idêntico em todas as mutações
    if (empty($tokenEnviado) || empty($tokenSessao) || !hash_equals($tokenSessao, (string)$tokenEnviado)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Falha na validação de segurança CSRF: token ausente ou inválido.',
            'codigo' => 'CSRF_INVALID'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return true;
}
