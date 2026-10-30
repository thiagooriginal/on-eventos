<?php
// API Centralizada de Usuários e Autenticação Segura ON Eventos
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';

$usuarios = carregar_usuarios_seguros();

// Ações via GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    // Consulta de sessão ativa do usuário atual (revalidado em tempo real no servidor)
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

    // Ação 1: Login de Usuário (Protegido por Rate Limiter do Servidor)
    if ($action === 'login') {
        $email = strtolower(trim($payload['email'] ?? ''));
        $senha = (string)($payload['senha'] ?? $payload['credencial'] ?? $payload['password'] ?? '');

        if (empty($email) || empty($senha)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Informe seu e-mail e chave de acesso.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Verifica rate limit no servidor (5 tentativas / 60 segundos)
        check_server_rate_limit('login', $email, 5, 60);

        // Localiza usuário na base segura
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
            echo json_encode(['sucesso' => false, 'erro' => 'E-mail ou chave de acesso incorretos. Acesso restrito a usuários autorizados.'], JSON_UNESCAPED_UNICODE);
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
        $precisaRedefinir = !empty($usuarioEncontrado['precisaRedefinirSenha']);

        if (!empty($senhaHash)) {
            $senhaValida = verify_secure_password($senha, $senhaHash);
        } elseif ($precisaRedefinir) {
            // Conta migrada ou com redefinição pendente sem hash definitivo:
            // Permite acesso inicial temporário para redefinição imediata
            $senhaValida = true;
        }

        if (!$senhaValida) {
            record_failed_attempt('login', $email, 60);
            http_response_code(401);
            echo json_encode(['sucesso' => false, 'erro' => 'E-mail ou chave de acesso incorretos. Acesso restrito a usuários autorizados.'], JSON_UNESCAPED_UNICODE);
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
            'precisaRedefinirSenha' => $precisaRedefinir,
            'csrf_token' => $_SESSION['csrf_token'] ?? ''
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação 2: Logout de Usuário
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

    // Ação 3: Redefinição Segura de Senha (Exige CSRF e Sessão Autenticada)
    if ($action === 'redefinir_senha' || $action === 'redefinir_credencial') {
        // Permite redefinir mesmo se a conta estiver com pendência de redefinição
        $usuarioSessao = require_auth([], true);
        verify_csrf_token($payload['csrf_token'] ?? null);

        $novaSenha = (string)($payload['novaSenha'] ?? $payload['novaCredencial'] ?? '');

        if (strlen($novaSenha) < 8) {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'A nova senha deve possuir no mínimo 8 caracteres para sua segurança.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Localiza usuário na base
        $usuarioIndex = null;
        foreach ($usuarios as $i => $u) {
            if ($u['id'] === $usuarioSessao['id']) {
                $usuarioIndex = $i;
                break;
            }
        }

        if ($usuarioIndex === null) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'erro' => 'Usuário não localizado.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Aplica novo hash forte e remove a exigência de redefinição
        $usuarios[$usuarioIndex]['senhaHash'] = hash_secure_password($novaSenha);
        $usuarios[$usuarioIndex]['precisaRedefinirSenha'] = false;
        unset($usuarios[$usuarioIndex]['senha']);

        salvar_usuarios_seguros($usuarios);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Senha pessoal redefinida com sucesso!',
            'usuario' => sanitize_user_for_client($usuarios[$usuarioIndex])
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Todas as ações de alteração de usuários a seguir requerem perfil ADMIN e validação CSRF estrita
    require_auth(['ADMIN']);
    verify_csrf_token($payload['csrf_token'] ?? null);

    // Ação 4: Exclusão definitiva de um usuário
    if ($action === 'delete') {
        $idParaRemover = $payload['id'] ?? '';
        $emailParaRemover = strtolower(trim($payload['email'] ?? ''));

        $usuariosFiltrados = [];
        foreach ($usuarios as $u) {
            $uEmail = strtolower(trim($u['email'] ?? ''));
            // Impede exclusão dos administradores raiz
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

    // Ação 5: Adicionar novo usuário (sem senhas padrão conhecidas)
    if ($action === 'add' && !empty($payload['usuario'])) {
        $novo = $payload['usuario'];
        $novoEmail = strtolower(trim($novo['email'] ?? ''));

        // Se veio senha personalizada, aplica hash seguro; senão, exige que o usuário defina no primeiro acesso
        if (!empty($novo['senha'])) {
            $novo['senhaHash'] = hash_secure_password((string)$novo['senha']);
            $novo['precisaRedefinirSenha'] = false;
            unset($novo['senha']);
        } else {
            $novo['senhaHash'] = '';
            $novo['precisaRedefinirSenha'] = true;
            unset($novo['senha']);
        }

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

    // Ação 6: Salvar lista de usuários (sincronização de administradores com CSRF)
    if ($action === 'save' && isset($payload['usuarios']) && is_array($payload['usuarios'])) {
        $mapaHashes = [];
        $mapaRedefinir = [];
        foreach ($usuarios as $u) {
            $emailK = strtolower(trim($u['email'] ?? ''));
            if (!empty($emailK)) {
                if (!empty($u['senhaHash'])) {
                    $mapaHashes[$emailK] = $u['senhaHash'];
                }
                $mapaRedefinir[$emailK] = !empty($u['precisaRedefinirSenha']);
            }
        }

        $novosUsuarios = [];
        foreach ($payload['usuarios'] as $u) {
            $uEmail = strtolower(trim($u['email'] ?? ''));
            if (empty($uEmail)) continue;

            if (!empty($u['senha'])) {
                $u['senhaHash'] = hash_secure_password($u['senha']);
                $u['precisaRedefinirSenha'] = false;
                unset($u['senha']);
            } elseif (!empty($mapaHashes[$uEmail])) {
                $u['senhaHash'] = $mapaHashes[$uEmail];
                $u['precisaRedefinirSenha'] = $mapaRedefinir[$uEmail] ?? false;
                unset($u['senha']);
            } else {
                $u['senhaHash'] = '';
                $u['precisaRedefinirSenha'] = true;
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
