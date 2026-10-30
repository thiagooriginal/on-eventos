<?php
// API Centralizada de Usuários e Autenticação Segura ON Eventos
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';

$usuarios = carregar_usuarios_seguros();

// Ações via GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    // Consulta de sessão ativa do usuário atual
    if ($action === 'session' || $action === 'me') {
        $user = get_authenticated_user();
        if ($user) {
            echo json_encode([
                'sucesso' => true,
                'autenticado' => true,
                'usuario' => $user
            ], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(401);
            echo json_encode([
                'sucesso' => false,
                'autenticado' => false,
                'erro' => 'Nenhuma sessão ativa encontrada.'
            ], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    // Listagem de usuários exige autenticação no servidor
    require_auth(['ADMIN', 'EQUIPE_INTERNA', 'BASICO']);

    // Sanitiza todos os usuários para nunca expor senhas ou hashes
    $usuariosSanitizados = array_values(array_map('sanitize_user_for_client', $usuarios));
    echo json_encode($usuariosSanitizados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Ações via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    // Ação: Login de Usuário (Protegido por Rate Limiter do Servidor)
    if ($action === 'login') {
        $email = strtolower(trim($payload['email'] ?? ''));
        $senha = (string)($payload['senha'] ?? $payload['credencial'] ?? $payload['password'] ?? '');

        if (empty($email) || empty($senha)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Informe seu e-mail e senha de acesso.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Verifica rate limit no servidor (5 tentativas / 60 segundos)
        check_server_rate_limit('login', $email, 5, 60);

        // Localiza usuário
        $usuarioEncontrado = null;
        $usuarioIndex = null;
        foreach ($usuarios as $i => $u) {
            if (strtolower(trim($u['email'] ?? '')) === $email) {
                $usuarioEncontrado = $u;
                $usuarioIndex = $i;
                break;
            }
        }

        if (!$usuarioEncontrado) {
            record_failed_attempt('login', $email, 60);
            http_response_code(401);
            echo json_encode(['sucesso' => false, 'erro' => 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (($usuarioEncontrado['status'] ?? 'ATIVO') !== 'ATIVO') {
            http_response_code(403);
            echo json_encode(['sucesso' => false, 'erro' => 'Acesso bloqueado: este usuário foi inativado pela administração.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Validação da senha com hash seguro
        $senhaHash = $usuarioEncontrado['senhaHash'] ?? '';
        $senhaValida = false;

        if (!empty($senhaHash)) {
            $senhaValida = verify_secure_password($senha, $senhaHash);
        } elseif (!empty($usuarioEncontrado['senha'])) {
            // Migração pontual caso ainda haja senha em texto claro
            if (hash_equals($usuarioEncontrado['senha'], $senha)) {
                $senhaValida = true;
                $usuarios[$usuarioIndex]['senhaHash'] = hash_secure_password($senha);
                unset($usuarios[$usuarioIndex]['senha']);
                salvar_usuarios_seguros($usuarios);
            }
        }

        if (!$senhaValida) {
            record_failed_attempt('login', $email, 60);
            http_response_code(401);
            echo json_encode(['sucesso' => false, 'erro' => 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Sucesso: reseta histórico de falhas
        reset_rate_limit('login', $email);

        // Inicializa sessão segura e regenera ID contra fixation
        start_secure_session();
        session_regenerate_id(true);

        $_SESSION['usuario_id'] = $usuarioEncontrado['id'];
        $_SESSION['usuario_nome'] = $usuarioEncontrado['nome'];
        $_SESSION['usuario_email'] = $usuarioEncontrado['email'];
        $_SESSION['usuario_nivel'] = $usuarioEncontrado['nivel'] ?? 'BASICO';
        $_SESSION['logged_in_at'] = time();
        $_SESSION['last_activity'] = time();

        // Atualiza horário de último acesso
        $usuarios[$usuarioIndex]['ultimoAcesso'] = 'Hoje às ' . date('H:i');
        salvar_usuarios_seguros($usuarios);

        $usuarioLimpo = sanitize_user_for_client($usuarios[$usuarioIndex]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Login realizado com sucesso.',
            'usuario' => $usuarioLimpo,
            'csrf_token' => $_SESSION['csrf_token'] ?? ''
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação: Logout de Usuário
    if ($action === 'logout') {
        start_secure_session();
        $_SESSION = [];
        if (session_id()) {
            session_destroy();
        }
        if (isset($_COOKIE['ON_AUTH_SESSION'])) {
            setcookie('ON_AUTH_SESSION', '', time() - 3600, '/', '', false, true);
        }
        echo json_encode(['sucesso' => true, 'mensagem' => 'Sessão encerrada com sucesso.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Todas as ações de alteração de usuários a seguir requerem perfil ADMIN
    require_auth(['ADMIN']);

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
                continue;
            }

            $usuariosFiltrados[] = $u;
        }

        $usuarios = array_values($usuariosFiltrados);
        salvar_usuarios_seguros($usuarios);
        $sanitizados = array_map('sanitize_user_for_client', $usuarios);
        echo json_encode(['sucesso' => true, 'mensagem' => 'Usuário excluído definitivamente', 'usuarios' => $sanitizados], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação: Adicionar novo usuário (com hash de senha seguro)
    if ($action === 'add' && !empty($payload['usuario'])) {
        $novo = $payload['usuario'];
        $novoEmail = strtolower(trim($novo['email'] ?? ''));

        // Se veio senha em texto puro, converte em hash seguro
        $senhaPura = !empty($novo['senha']) ? (string)$novo['senha'] : 'On@2026';
        $novo['senhaHash'] = hash_secure_password($senhaPura);
        unset($novo['senha']);

        // Força nível seguro caso não seja admin válido
        if (empty($novo['nivel']) || !in_array($novo['nivel'], ['ADMIN', 'BASICO', 'EQUIPE_INTERNA', 'VENDEDOR'])) {
            $novo['nivel'] = 'BASICO';
        }

        $usuariosFiltrados = [];
        foreach ($usuarios as $u) {
            if (strtolower(trim($u['email'] ?? '')) !== $novoEmail) {
                $usuariosFiltrados[] = $u;
            }
        }
        array_unshift($usuariosFiltrados, $novo);
        $usuarios = array_values($usuariosFiltrados);
        salvar_usuarios_seguros($usuarios);

        $usuarioSanitizado = sanitize_user_for_client($novo);
        $listaSanitizada = array_map('sanitize_user_for_client', $usuarios);
        echo json_encode(['sucesso' => true, 'usuario' => $usuarioSanitizado, 'usuarios' => $listaSanitizada], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação: Salvar lista inteira (sincronização de administradores)
    if ($action === 'save' && isset($payload['usuarios']) && is_array($payload['usuarios'])) {
        // Mapeia hashes já existentes para não perder senhas dos usuários
        $mapaHashes = [];
        foreach ($usuarios as $u) {
            if (!empty($u['email']) && !empty($u['senhaHash'])) {
                $mapaHashes[strtolower(trim($u['email']))] = $u['senhaHash'];
            }
        }

        $novosUsuarios = [];
        foreach ($payload['usuarios'] as $u) {
            $uEmail = strtolower(trim($u['email'] ?? ''));
            if (empty($uEmail)) continue;

            if (!empty($u['senha'])) {
                $u['senhaHash'] = hash_secure_password($u['senha']);
                unset($u['senha']);
            } elseif (!empty($mapaHashes[$uEmail])) {
                $u['senhaHash'] = $mapaHashes[$uEmail];
                unset($u['senha']);
            } else {
                $u['senhaHash'] = hash_secure_password('On@2026');
                unset($u['senha']);
            }

            $novosUsuarios[] = $u;
        }

        $usuarios = array_values($novosUsuarios);
        salvar_usuarios_seguros($usuarios);
        $sanitizados = array_map('sanitize_user_for_client', $usuarios);
        echo json_encode(['sucesso' => true, 'total' => count($sanitizados), 'usuarios' => $sanitizados], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Fallback padrão sanitizado
$usuariosSanitizados = array_values(array_map('sanitize_user_for_client', $usuarios));
echo json_encode($usuariosSanitizados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
