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

        // Validação da senha com hash seguro (Sem qualquer bypass para senhas vazias ou redefinição)
        $senhaHash = $usuarioEncontrado['senhaHash'] ?? '';
        $precisaRedefinir = !empty($usuarioEncontrado['precisaRedefinirSenha']);

        if (empty($senhaHash)) {
            // Conta sem chave de acesso configurada: login direto é terminantemente proibido
            record_failed_attempt('login', $email, 60);
            http_response_code(401);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Acesso não configurado ou senha ainda não definida. Utilize a recuperação de acesso com token de uso único ou contate a administração.',
                'codigo' => 'PASSWORD_NOT_CONFIGURED',
                'precisaTokenRedefinicao' => true
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $senhaValida = verify_secure_password($senha, $senhaHash);

        if (!$senhaValida) {
            record_failed_attempt('login', $email, 60);
            http_response_code(401);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'E-mail ou chave de acesso incorretos. Acesso restrito a usuários autorizados.',
                'codigo' => 'INVALID_CREDENTIALS'
            ], JSON_UNESCAPED_UNICODE);
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

    // Ação 3: Solicitação de Redefinição de Senha (Público, com Rate Limiting e Token Criptográfico)
    if ($action === 'solicitar_recuperacao') {
        $email = strtolower(trim($payload['email'] ?? ''));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Informe um endereço de e-mail corporativo válido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Rate limit rigoroso no servidor para impedir abuso ou varredura de e-mails (3 solicitações / 5 minutos)
        check_server_rate_limit('pwd_reset_req', $email, 3, 300);

        $tokenData = generate_password_reset_token($email, 1800);

        // Prevenção contra enumeração de usuários: resposta consistente
        $resposta = [
            'sucesso' => true,
            'mensagem' => 'Se o endereço informado corresponder a um usuário ativo, um token criptográfico de uso único com expiração de 30 minutos foi emitido.'
        ];

        // Em ambiente de teste local autenticado por header interno, disponibiliza o token para a asserção automatizada
        $isLocalTest = (isset($_SERVER['HTTP_X_TEST_MODE']) && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', 'localhost'], true));
        if ($isLocalTest && $tokenData) {
            $resposta['token_teste'] = $tokenData['token'];
            $resposta['expiraEm'] = $tokenData['expiraEm'];
        }

        echo json_encode($resposta, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação 4: Redefinição com Token Criptográfico de Uso Único (Público, com Rate Limiter e Expiração)
    if ($action === 'redefinir_com_token') {
        $token = trim((string)($payload['token'] ?? ''));
        $novaSenha = (string)($payload['novaSenha'] ?? $payload['novaCredencial'] ?? '');
        $emailOpcional = trim((string)($payload['email'] ?? ''));

        if (empty($token)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Token de redefinição obrigatório não fornecido.', 'codigo' => 'TOKEN_MISSING'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (strlen($novaSenha) < 8) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'A nova senha deve possuir no mínimo 8 caracteres.', 'codigo' => 'PASSWORD_TOO_SHORT'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Rate limit para tentativas de envio de tokens (5 tentativas por IP / 60s)
        check_server_rate_limit('pwd_reset_exec', $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 5, 60);

        $resultado = verify_and_consume_reset_token($token, $novaSenha, $emailOpcional);

        if (!$resultado['sucesso']) {
            record_failed_attempt('pwd_reset_exec', $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 60);
            $codigoHttp = ($resultado['codigo'] === 'TOKEN_ALREADY_USED') ? 410 : 401;
            http_response_code($codigoHttp);
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Reseta taxa de erros para o IP
        reset_rate_limit('pwd_reset_exec', $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');

        echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação 5: Troca de Senha de Usuário Autenticado (Exige Senha Atual + CSRF)
    if ($action === 'trocar_senha') {
        $usuarioSessao = require_auth([], false);
        verify_csrf_token($payload['csrf_token'] ?? null);

        $senhaAtual = (string)($payload['senhaAtual'] ?? '');
        $novaSenha = (string)($payload['novaSenha'] ?? '');

        if (empty($senhaAtual) || empty($novaSenha)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Informe a senha atual e a nova senha desejada.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (strlen($novaSenha) < 8) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'A nova senha deve ter no mínimo 8 caracteres.'], JSON_UNESCAPED_UNICODE);
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

        $hashExistente = $usuarios[$usuarioIndex]['senhaHash'] ?? '';
        if (empty($hashExistente) || !verify_secure_password($senhaAtual, $hashExistente)) {
            http_response_code(401);
            echo json_encode(['sucesso' => false, 'erro' => 'Senha atual incorreta.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $usuarios[$usuarioIndex]['senhaHash'] = hash_secure_password($novaSenha);
        $usuarios[$usuarioIndex]['precisaRedefinirSenha'] = false;
        $usuarios[$usuarioIndex]['senhaAlteradaEm'] = date('c');
        salvar_usuarios_seguros($usuarios);

        session_regenerate_id(true);

        echo json_encode(['sucesso' => true, 'mensagem' => 'Senha alterada com sucesso!'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação 6: Redefinição Segura de Senha na Sessão Ativa (Exige CSRF e Sessão Autenticada)
    if ($action === 'redefinir_senha' || $action === 'redefinir_credencial') {
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
        $usuarios[$usuarioIndex]['senhaAlteradaEm'] = date('c');
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

        // Se veio senha personalizada com tamanho adequado, aplica hash seguro;
        // Senão, gera token criptográfico seguro de primeiro acesso para entrega individual
        $tokenPrimeiroAcesso = null;
        if (!empty($novo['senha']) && strlen((string)$novo['senha']) >= 8) {
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

        // Se a conta necessita de definição de senha, gera token de convite seguro de 24h
        if (!empty($novo['precisaRedefinirSenha'])) {
            $tokenPrimeiroAcesso = generate_password_reset_token($novoEmail, 86400);
            $usuarios = carregar_usuarios_seguros();
        }

        $usuarioSanitizado = sanitize_user_for_client($novo);
        $listaSanitizada = array_map('sanitize_user_for_client', $usuarios);
        
        $respostaAdd = [
            'sucesso' => true,
            'usuario' => $usuarioSanitizado,
            'usuarios' => $listaSanitizada
        ];
        if ($tokenPrimeiroAcesso) {
            $respostaAdd['token_convite'] = $tokenPrimeiroAcesso['token'];
            $respostaAdd['expiraEm'] = $tokenPrimeiroAcesso['expiraEm'];
            $respostaAdd['mensagem'] = 'Usuário cadastrado com sucesso. Compartilhe o token seguro de primeiro acesso com o colaborador.';
        }

        echo json_encode($respostaAdd, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Ação 8: Geração de Token de Redefinição/Convite pelo Administrador (Exige ADMIN + CSRF)
    if ($action === 'gerar_token_admin') {
        $emailAlvo = strtolower(trim($payload['email'] ?? ''));
        $idAlvo = trim($payload['id'] ?? '');

        if (empty($emailAlvo) && !empty($idAlvo)) {
            foreach ($usuarios as $u) {
                if ($u['id'] === $idAlvo) {
                    $emailAlvo = strtolower(trim($u['email'] ?? ''));
                    break;
                }
            }
        }

        if (empty($emailAlvo)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Identificador ou e-mail de usuário não informado.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $tokenData = generate_password_reset_token($emailAlvo, 86400); // 24 horas para emissão pelo admin

        if (!$tokenData) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'erro' => 'Usuário não encontrado para geração de token.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Token de redefinição de uso único gerado com sucesso (validade: 24 horas).',
            'token' => $tokenData['token'],
            'expiraEm' => $tokenData['expiraEm'],
            'email' => $tokenData['email']
        ], JSON_UNESCAPED_UNICODE);
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
