<?php
/**
 * ON AGÊNCIA DE EVENTOS - FERRAMENTA ADMINISTRATIVA DE BOOTSTRAP DE CREDENCIAIS
 * 
 * FINALIDADE:
 * Permitir que os administradores oficiais definam suas novas senhas seguras (ou gerem tokens
 * de uso único) diretamente no ambiente da hospedagem via CLI/SSH, de forma 100% segura e
 * SEM DEPENDER DO DISPARO DE E-MAILS SMTP (solucionando o bootstrap inicial quando o SMTP
 * ainda não possui a senha configurada).
 * 
 * USO VIA TERMINAL / SSH NA HOSPEDAGEM:
 * 1. Definir senha diretamente:
 *    php security/setup-admin-password.php --email="thiago@onagenciadeeventos.com.br" --pass="NovaSenhaForte@2026"
 * 
 * 2. Ou gerar token criptográfico de uso único para redefinição no navegador:
 *    php security/setup-admin-password.php --email="thiago@onagenciadeeventos.com.br" --generate-token
 * 
 * SEGURANÇA:
 * - Execução estritamente restrita a CLI (linha de comando / SSH). Bloqueado via Web/HTTP.
 * - Hashing com Argon2id ou Bcrypt (cost 12) e salt individual.
 * - Registrado no log de auditoria com timestamp e hash.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die("Acesso negado: Este script de gerenciamento só pode ser executado via CLI / Terminal.\n");
}

require_once dirname(__DIR__) . '/public/auth_guard.php';

// Leitura de parâmetros de linha de comando
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

$email = strtolower(trim($options['email'] ?? ''));

if (empty($email)) {
    echo "Uso:\n";
    echo "  Definir senha:  php security/setup-admin-password.php --email=\"seu-email@dominio.com\" --pass=\"SuaNovaSenhaForte@123\"\n";
    echo "  Gerar token:    php security/setup-admin-password.php --email=\"seu-email@dominio.com\" --generate-token\n";
    echo "  Listar admins:  php security/setup-admin-password.php --list-admins\n\n";
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
    echo "Link seguro para acesso direto no navegador:\n";
    echo "  {$link}\n\n";
    echo "Copie e cole este link no seu navegador para definir sua nova senha com segurança.\n";
    echo "============================================================\n";
    exit(0);
}

// 2. DEFINIÇÃO DIRETA DE SENHA COM HASH FORTE (Modo Senha)
$novaSenha = (string)($options['pass'] ?? '');

if (empty($novaSenha)) {
    echo "[ERRO] Nenhuma senha informada. Utilize o parâmetro --pass=\"SuaSenhaForte\" ou use --generate-token.\n";
    exit(1);
}

if (strlen($novaSenha) < 8) {
    echo "[ERRO] A senha deve possuir no mínimo 8 caracteres para garantir a segurança da plataforma.\n";
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

echo "[PASS] Senha do administrador {$email} atualizada com 100% de sucesso!\n";
echo "  - Algoritmo aplicado:  " . (defined('PASSWORD_ARGON2ID') ? 'Argon2id' : 'Bcrypt (cost 12)') . "\n";
echo "  - Flag de redefinição: Desmarcada (Acesso liberado imediatamente)\n";
echo "  - Senhas em texto puro: Expurgo garantido\n";
echo "  - Status do usuário:   ATIVO\n\n";
echo "O administrador {$email} já pode efetuar login diretamente no painel web da ON Agência.\n";
echo "============================================================\n";
exit(0);
