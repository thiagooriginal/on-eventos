<?php
/**
 * ON AGÊNCIA DE EVENTOS - FERRAMENTA ADMINISTRATIVA DE BOOTSTRAP DE CREDENCIAIS
 * 
 * FINALIDADE:
 * Permitir que os administradores oficiais definam suas novas senhas seguras (ou gerem tokens
 * de uso único) diretamente no ambiente da hospedagem via CLI/SSH, de forma 100% segura, com
 * ENTRADA INTERATIVA OCULTA (sem expor senhas no histórico do shell com --pass) e
 * SEM DEPENDER DO DISPARO DE E-MAILS SMTP (solucionando o bootstrap inicial quando o SMTP
 * ainda não possui senha configurada).
 * 
 * LOCALIZAÇÃO NA HOSPEDAGEM:
 * Pode ser executado em private_data/setup-admin-password.php (fora do public_html).
 * 
 * USO VIA TERMINAL / SSH NA HOSPEDAGEM:
 * 1. Definir senha de forma interativa com digitação oculta:
 *    php setup-admin-password.php --email="thiago@onagenciadeeventos.com.br"
 *    (O sistema solicitará a nova senha com digitação oculta e confirmação)
 * 
 * 2. Ou gerar token criptográfico de uso único para redefinição no navegador:
 *    php setup-admin-password.php --email="thiago@onagenciadeeventos.com.br" --generate-token
 * 
 * 3. Listar administradores:
 *    php setup-admin-password.php --list-admins
 * 
 * SEGURANÇA:
 * - Execução estritamente restrita a CLI (linha de comando / SSH). Bloqueado via Web/HTTP.
 * - Entrada oculta de senha (stty -echo / Read-Host).
 * - Hashing com Argon2id ou Bcrypt (cost 12) e salt individual aleatório.
 * - Registrado no log de auditoria com timestamp.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die("Acesso negado: Este script de gerenciamento só pode ser executado via CLI / Terminal.\n");
}

// Resolução dinâmica e resiliente do auth_guard.php
$candidatosAuthGuard = [
    dirname(__DIR__) . '/public/auth_guard.php', // Quando executado em security/ (ambiente local)
    dirname(__DIR__) . '/public_html/auth_guard.php', // Quando executado em private_data/ (hospedagem)
    __DIR__ . '/../public_html/auth_guard.php',
    __DIR__ . '/../public/auth_guard.php',
    __DIR__ . '/auth_guard.php'
];

$authGuardPath = null;
foreach ($candidatosAuthGuard as $c) {
    if (file_exists($c)) {
        $authGuardPath = realpath($c) ?: $c;
        break;
    }
}

if (!$authGuardPath) {
    die("[ERRO CRÍTICO]: Arquivo auth_guard.php não encontrado nos caminhos esperados.\n");
}

require_once $authGuardPath;

/**
 * Captura entrada de senha do terminal de forma silenciosa/oculta
 */
function prompt_silent_password($prompt) {
    echo $prompt;

    // Ambiente Windows
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $cmd = 'powershell -Command "$p = Read-Host -AsSecureString; if ($p) { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p)) }"';
        $pass = trim((string)shell_exec($cmd));
        echo "\n";
        return $pass;
    }

    // Ambiente Linux / macOS (Hospedagem Hostinger via SSH)
    $hasStty = (shell_exec('which stty 2>/dev/null') !== null);
    if ($hasStty) {
        shell_exec('stty -echo');
        $pass = trim((string)fgets(STDIN));
        shell_exec('stty echo');
        echo "\n";
        return $pass;
    }

    // Fallback padrão caso stty não esteja disponível
    $pass = trim((string)fgets(STDIN));
    return $pass;
}

// Leitura de opções da linha de comando
$options = getopt('', ['email:', 'pass:', 'generate-token', 'list-admins']);

echo "============================================================\n";
echo "  ON AGÊNCIA - GESTÃO DEFENSIVA DE CREDENCIAIS ADMINISTRATIVAS\n";
echo "============================================================\n\n";

$usuarios = carregar_usuarios_seguros();

// Opção: Listar administradores existentes
if (isset($options['list-admins'])) {
    echo "Administradores cadastrados na base:\n";
    foreach ($usuarios as $u) {
        if (($u['nivel'] ?? '') === 'ADMIN') {
            $hasPass = !empty($u['senhaHash']) ? 'SIM (Hasheada)' : 'NÃO (Pendente de definição)';
            $redefinir = !empty($u['precisaRedefinirSenha']) ? 'SIM' : 'NÃO';
            echo "  - {$u['nome']} <{$u['email']}> | Senha configurada: {$hasPass} | Precisa redefinir: {$redefinir}\n";
        }
    }
    echo "\n";
    exit(0);
}

// Identifica ou solicita o e-mail do administrador
$email = strtolower(trim($options['email'] ?? ''));

if (empty($email)) {
    echo "Administradores disponíveis:\n";
    $adminsList = [];
    foreach ($usuarios as $u) {
        if (($u['nivel'] ?? '') === 'ADMIN') {
            $adminsList[] = $u['email'];
            echo "  * {$u['email']} ({$u['nome']})\n";
        }
    }
    echo "\nDigite o e-mail do administrador para configurar: ";
    $email = strtolower(trim((string)fgets(STDIN)));
    echo "\n";
}

if (empty($email)) {
    echo "[ERRO] E-mail não informado. Operação cancelada.\n";
    exit(1);
}

// Localiza o usuário na base
$usuarioIndex = null;
foreach ($usuarios as $i => $u) {
    if (strtolower(trim($u['email'] ?? '')) === $email) {
        $usuarioIndex = $i;
        break;
    }
}

if ($usuarioIndex === null) {
    echo "[ERRO] Usuário '{$email}' não encontrado na base de dados segura.\n";
    echo "Execute com --list-admins para verificar os e-mails cadastrados.\n";
    exit(1);
}

$usuario = $usuarios[$usuarioIndex];

// Garante que é um administrador
if (($usuario['nivel'] ?? '') !== 'ADMIN') {
    echo "[ERRO] O usuário '{$email}' possui nível '{$usuario['nivel']}'. Este utilitário de emergência é restrito a administradores.\n";
    exit(1);
}

// 1. GERAÇÃO DE TOKEN CRIPTOGRÁFICO DE USO ÚNICO (Modo Token)
if (isset($options['generate-token'])) {
    $tokenData = generate_password_reset_token($email, 86400); // 24 horas de validade
    if (!$tokenData) {
        echo "[ERRO] Não foi possível gerar o token de redefinição.\n";
        exit(1);
    }

    $link = "https://onagenciadeeventos.com.br/login?token=" . urlencode($tokenData['token']) . "&email=" . urlencode($email);

    log_security_event('CLI_ADMIN_TOKEN_GENERATED', [
        'email' => $email,
        'action_by' => 'cli_administrator'
    ]);

    echo "[PASS] Token criptográfico de uso único gerado com sucesso!\n\n";
    echo "  E-mail:       {$email}\n";
    echo "  Token Manual: {$tokenData['token']}\n";
    echo "  Expiração:    " . date('d/m/Y H:i', $tokenData['expiraTimestamp']) . " (24 horas)\n\n";
    echo "Link seguro para acesso direto no navegador (sem depender de SMTP):\n";
    echo "  {$link}\n\n";
    echo "Copie e cole este link no seu navegador para definir sua nova senha com segurança.\n";
    echo "============================================================\n";
    exit(0);
}

// 2. DEFINIÇÃO DE SENHA INTERATIVA COM ENTRADA OCULTA (Modo Padrão)
$novaSenha = '';

if (!empty($options['pass'])) {
    echo "[AVISO DE SEGURANÇA]: Passar senhas via argumento de linha de comando (--pass) pode registrar a credencial no histórico do shell. Para máxima segurança, omita o parâmetro --pass e digite de forma oculta.\n\n";
    $novaSenha = (string)$options['pass'];
} else {
    // Modo interativo com entrada oculta
    echo "Configurando nova senha para: {$usuario['nome']} <{$email}>\n";
    $novaSenha = prompt_silent_password("Digite a nova senha (mínimo 8 caracteres): ");
    
    if (strlen($novaSenha) < 8) {
        echo "[ERRO] A senha deve possuir no mínimo 8 caracteres para garantir a segurança da plataforma.\n";
        exit(1);
    }

    $confirmaSenha = prompt_silent_password("Confirme a nova senha digitada: ");
    
    if ($novaSenha !== $confirmaSenha) {
        echo "[ERRO] As senhas digitadas não conferem. Operação cancelada.\n";
        exit(1);
    }
}

if (strlen($novaSenha) < 8) {
    echo "[ERRO] A senha deve possuir no mínimo 8 caracteres.\n";
    exit(1);
}

// Aplica hash seguro (Argon2id ou Bcrypt com salt aleatório)
$novoHash = hash_secure_password($novaSenha);
$usuarios[$usuarioIndex]['senhaHash'] = $novoHash;
$usuarios[$usuarioIndex]['precisaRedefinirSenha'] = false;
$usuarios[$usuarioIndex]['senhaAlteradaEm'] = date('c');
$usuarios[$usuarioIndex]['status'] = 'ATIVO';

// Purga dados legados de redefinição e senhas em texto puro
unset($usuarios[$usuarioIndex]['senha']);
$usuarios[$usuarioIndex]['resetTokenHash'] = null;
$usuarios[$usuarioIndex]['resetTokenExpires'] = null;
$usuarios[$usuarioIndex]['resetTokenUsed'] = true;

// Persiste na base segura
salvar_usuarios_seguros($usuarios);

log_security_event('CLI_ADMIN_PASSWORD_PROVISIONED', [
    'email' => $email,
    'action_by' => 'cli_administrator'
]);

echo "\n[PASS] Senha do administrador {$email} atualizada com 100% de sucesso!\n";
echo "  - Algoritmo aplicado:  " . (defined('PASSWORD_ARGON2ID') ? 'Argon2id' : 'Bcrypt (cost 12)') . "\n";
echo "  - Flag de redefinição: Desmarcada (Acesso liberado imediatamente)\n";
echo "  - Senhas em texto puro: Expurgo garantido\n";
echo "  - Status do usuário:   ATIVO\n\n";
echo "O administrador {$email} já pode efetuar login diretamente no painel web da ON Agência.\n";
echo "============================================================\n";
exit(0);
