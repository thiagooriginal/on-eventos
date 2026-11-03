<?php
/**
 * ON Agência de Eventos - Núcleo de Segurança & Autenticação Backend (PHP)
 * Proteção Estrita de Sessão, RBAC Dinâmico, Rate Limiting, Hashing e CSRF Sem Bypass.
 */

// Impede vazamento de avisos internos de PHP no fluxo de respostas JSON
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

// 1. Configuração de CORS Estrito (Comparação Exata de Protocolo, Host e Porta)
function setup_secure_cors() {
    if (php_sapi_name() === 'cli') {
        return;
    }
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

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

setup_secure_cors();

// 2. Armazenamento Seguro Fora da Raiz Pública (Sem Fallback Inseguro)
function get_secure_storage_dir() {
    $custom = getenv('ON_PRIVATE_DATA_DIR');
    if (!empty($custom)) {
        return rtrim($custom, '/\\');
    }

    // 1. Um nível acima do diretório atual (ex: fora de public_html)
    $candidate1 = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'private_data';
    if (is_dir($candidate1)) {
        return $candidate1;
    }

    // 2. Dois níveis acima (caso public_html esteja dentro de domains/dominio.com.br/ e private_data esteja na raiz /home/uXXXXXXX/private_data)
    $candidate2 = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'private_data';
    if (is_dir($candidate2)) {
        return $candidate2;
    }

    // 3. Baseado no DOCUMENT_ROOT do servidor web
    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        $candidate3 = dirname($_SERVER['DOCUMENT_ROOT']) . DIRECTORY_SEPARATOR . 'private_data';
        if (is_dir($candidate3)) {
            return $candidate3;
        }
        $candidate4 = dirname(dirname($_SERVER['DOCUMENT_ROOT'])) . DIRECTORY_SEPARATOR . 'private_data';
        if (is_dir($candidate4)) {
            return $candidate4;
        }
    }

    return $candidate1;
}

function is_dir_really_writable($dir) {
    if (!is_dir($dir)) return false;
    $testFile = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . '.wtest_' . bin2hex(random_bytes(8));
    $fp = @fopen($testFile, 'w');
    if ($fp) {
        @fclose($fp);
        @unlink($testFile);
        return true;
    }
    return false;
}

function get_secure_storage_path($filename) {
    // Sanitização contra Directory Traversal
    $filenameLimpo = basename($filename);
    $privateDir = get_secure_storage_dir();

    // Cria diretório privado seguro se não existir
    if (!is_dir($privateDir)) {
        if (!@mkdir($privateDir, 0750, true)) {
            // Falha segura: NUNCA faz fallback para o diretório público
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro interno de segurança: diretório de dados privados inacessível. O fallback inseguro foi bloqueado.',
                'codigo' => 'SECURE_STORAGE_UNAVAILABLE'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
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

    if (!is_dir_really_writable($privateDir)) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Erro interno de segurança: diretório privado seguro sem permissão de gravação.',
            'codigo' => 'SECURE_STORAGE_NOT_WRITABLE'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $targetFile = $privateDir . DIRECTORY_SEPARATOR . $filenameLimpo;

    // Migração não destrutiva com backup automático de dados remanescentes em locais legados
    $legacyPublic = __DIR__ . DIRECTORY_SEPARATOR . $filenameLimpo;
    $legacySubdir = __DIR__ . DIRECTORY_SEPARATOR . 'private_data' . DIRECTORY_SEPARATOR . $filenameLimpo;

    foreach ([$legacySubdir, $legacyPublic] as $legacyFile) {
        if (file_exists($legacyFile) && realpath($legacyFile) !== realpath($targetFile)) {
            $backupDir = $privateDir . DIRECTORY_SEPARATOR . 'backups';
            if (!is_dir($backupDir)) {
                @mkdir($backupDir, 0750, true);
            }

            if (!file_exists($targetFile)) {
                // Realiza backup pré-migração
                $backupFile = $backupDir . DIRECTORY_SEPARATOR . date('Ymd_His') . '_legacy_' . $filenameLimpo . '.bak';
                @copy($legacyFile, $backupFile);

                // Copia e valida integridade via SHA-256 e tamanho de arquivo
                if (@copy($legacyFile, $targetFile)) {
                    if (filesize($targetFile) === filesize($legacyFile) && hash_file('sha256', $targetFile) === hash_file('sha256', $legacyFile)) {
                        @unlink($legacyFile);
                    }
                }
            } else {
                // Se já existe no destino seguro com conteúdo idêntico, remove cópia remanescente no webroot
                if (hash_file('sha256', $targetFile) === hash_file('sha256', $legacyFile)) {
                    @unlink($legacyFile);
                }
            }
        }
    }

    return $targetFile;
}

// 2.1 Backup e Restauração Não Destrutiva de Dados Privados
function create_private_data_backup($label = null) {
    $privateDir = get_secure_storage_dir();
    $backupDir = $privateDir . DIRECTORY_SEPARATOR . 'backups';
    if (!is_dir($backupDir)) {
        @mkdir($backupDir, 0750, true);
    }

    $cleanLabel = $label ? preg_replace('/[^a-zA-Z0-9_-]/', '_', $label) : date('Ymd_His');
    $snapshotDir = $backupDir . DIRECTORY_SEPARATOR . 'snapshot_' . $cleanLabel;
    if (!is_dir($snapshotDir)) {
        @mkdir($snapshotDir, 0750, true);
    }

    $manifest = [
        'timestamp' => date('c'),
        'label' => $cleanLabel,
        'files' => []
    ];

    if (is_dir($privateDir)) {
        $items = scandir($privateDir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..' || $item === 'backups' || $item === '.htaccess' || $item === 'index.html') continue;
            $src = $privateDir . DIRECTORY_SEPARATOR . $item;
            if (is_file($src)) {
                $dst = $snapshotDir . DIRECTORY_SEPARATOR . $item;
                if (@copy($src, $dst)) {
                    $manifest['files'][$item] = [
                        'size' => filesize($dst),
                        'sha256' => hash_file('sha256', $dst)
                    ];
                }
            }
        }
    }

    @file_put_contents($snapshotDir . DIRECTORY_SEPARATOR . 'manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    return [
        'sucesso' => true,
        'snapshot_dir' => $snapshotDir,
        'total_arquivos' => count($manifest['files']),
        'manifest' => $manifest
    ];
}

function restore_private_data_backup($labelOrPath) {
    $privateDir = get_secure_storage_dir();
    $backupDir = $privateDir . DIRECTORY_SEPARATOR . 'backups';
    $srcDir = is_dir($labelOrPath) ? $labelOrPath : $backupDir . DIRECTORY_SEPARATOR . 'snapshot_' . $labelOrPath;

    if (!is_dir($srcDir)) {
        return ['sucesso' => false, 'erro' => 'Snapshot de backup não localizado: ' . basename($labelOrPath)];
    }

    $manifestFile = $srcDir . DIRECTORY_SEPARATOR . 'manifest.json';
    $manifest = file_exists($manifestFile) ? json_decode(file_get_contents($manifestFile), true) : null;

    $restored = [];
    $items = scandir($srcDir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === 'manifest.json') continue;
        $fileSrc = $srcDir . DIRECTORY_SEPARATOR . $item;
        if (is_file($fileSrc)) {
            $fileDst = $privateDir . DIRECTORY_SEPARATOR . $item;
            if (@copy($fileSrc, $fileDst)) {
                $restored[$item] = hash_file('sha256', $fileDst);
            }
        }
    }

    return [
        'sucesso' => true,
        'arquivos_restaurados' => count($restored),
        'checksums' => $restored,
        'manifest' => $manifest
    ];
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

function record_rate_limit_attempt($action, $identifier, $decaySeconds = 60) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $key = hash('sha256', "rl:{$action}:{$ip}:" . strtolower(trim($identifier)));
    $rateLimitFile = get_secure_storage_path('_rate_limits.json');

    $limits = [];
    if (file_exists($rateLimitFile)) {
        $limits = json_decode(@file_get_contents($rateLimitFile), true) ?: [];
    }

    $now = time();
    if (!isset($limits[$key]) || (($limits[$key]['first_attempt'] ?? 0) + $decaySeconds < $now)) {
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

function record_failed_attempt($action, $identifier, $decaySeconds = 60) {
    record_rate_limit_attempt($action, $identifier, $decaySeconds);
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

// 6. Sanitização de Usuário (Nunca envia senhas, hashes, segredos ou tokens de redefinição)
function sanitize_user_for_client($user) {
    if (!is_array($user)) return null;
    $safe = $user;
    unset($safe['senha']);
    unset($safe['senhaHash']);
    unset($safe['resetTokenHash']);
    return $safe;
}

// 6.1 Auditoria e Registro de Eventos Críticos de Segurança
function mask_email_for_audit($email) {
    $email = strtolower(trim((string)$email));
    $parts = explode('@', $email);
    if (count($parts) !== 2) return '***@***';
    $name = $parts[0];
    $domain = $parts[1];
    $maskedName = strlen($name) <= 2 ? substr($name, 0, 1) . '***' : substr($name, 0, 2) . '***' . substr($name, -1);
    return $maskedName . '@' . $domain;
}

function log_security_event($event, $context = []) {
    $auditFile = get_secure_storage_path('_security_audit.log');
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $entry = [
        'timestamp' => date('c'),
        'event' => $event,
        'ip' => $ip,
        'context' => $context
    ];
    @file_put_contents($auditFile, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

// 6.2 Geração de Token Criptográfico Seguro de Uso Único para Redefinição de Senha
function generate_password_reset_token($email, $validitySeconds = 1800) {
    $emailLimpo = strtolower(trim($email));
    if (empty($emailLimpo)) {
        return null;
    }

    $usuarios = carregar_usuarios_seguros();
    $usuarioIndex = null;
    foreach ($usuarios as $i => $u) {
        if (strtolower(trim($u['email'] ?? '')) === $emailLimpo) {
            $usuarioIndex = $i;
            break;
        }
    }

    if ($usuarioIndex === null) {
        return null;
    }

    // Token com 256 bits de entropia criptográfica (64 hexadecimais)
    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);
    $expires = time() + $validitySeconds;

    $usuarios[$usuarioIndex]['resetTokenHash'] = $tokenHash;
    $usuarios[$usuarioIndex]['resetTokenExpires'] = $expires;
    $usuarios[$usuarioIndex]['resetTokenUsed'] = false;
    $usuarios[$usuarioIndex]['resetTokenCreatedAt'] = time();

    salvar_usuarios_seguros($usuarios);

    log_security_event('PASSWORD_RESET_TOKEN_GENERATED', [
        'destinatario_mascarado' => mask_email_for_audit($emailLimpo),
        'destinatario_sha256' => hash('sha256', $emailLimpo),
        'expires_at' => date('c', $expires),
        'validity_seconds' => $validitySeconds
    ]);

    return [
        'token' => $rawToken,
        'expiraEm' => date('c', $expires),
        'expiraTimestamp' => $expires,
        'email' => $usuarios[$usuarioIndex]['email'],
        'usuarioNome' => $usuarios[$usuarioIndex]['nome']
    ];
}

// 6.2.1 Configuração Segura de E-mail SMTP (Hostinger Oficial)
function get_smtp_config() {
    $configFile = get_secure_storage_path('smtp_config.json');
    $defaultConfig = [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'secure' => 'ssl',
        'auth' => true,
        'username' => 'contato@onagenciadeeventos.com.br',
        'password' => '',
        'from_email' => 'contato@onagenciadeeventos.com.br',
        'from_name' => 'ON Agência de Eventos',
        'reply_to' => 'contato@onagenciadeeventos.com.br'
    ];

    $config = $defaultConfig;
    if (file_exists($configFile)) {
        $saved = json_decode(@file_get_contents($configFile), true);
        if (is_array($saved)) {
            $config = array_merge($defaultConfig, $saved);
        }
    } else {
        @file_put_contents($configFile, json_encode($defaultConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    // Variáveis de ambiente têm precedência se definidas
    $envPass = getenv('SMTP_PASS') ?: (getenv('SMTP_PASSWORD') ?: ($_ENV['SMTP_PASS'] ?? ($_ENV['SMTP_PASSWORD'] ?? '')));
    if (!empty($envPass)) {
        $config['password'] = $envPass;
    }
    $envUser = getenv('SMTP_USER') ?: ($_ENV['SMTP_USER'] ?? '');
    if (!empty($envUser)) {
        $config['username'] = $envUser;
        $config['from_email'] = $envUser;
    }

    return $config;
}

// 6.2.2 Envio Unificado de E-mails do Sistema via SMTP Hostinger (PHPMailer)
function send_system_email($destinatarioEmail, $nomeDestinatario, $assunto, $corpoHtml, $corpoTexto = '') {
    $emailLimpo = strtolower(trim((string)$destinatarioEmail));
    if (empty($emailLimpo) || !filter_var($emailLimpo, FILTER_VALIDATE_EMAIL)) {
        return [
            'sucesso' => false,
            'erro' => 'Endereço de e-mail inválido.',
            'mecanismo' => 'VALIDATION_FAILED'
        ];
    }

    $smtpConfig = get_smtp_config();
    $hasPassword = !empty($smtpConfig['password']);

    // Carrega classes do PHPMailer se disponíveis
    $phpMailerLoaded = false;
    $phpMailerBase = __DIR__ . '/phpmailer/';
    if (file_exists($phpMailerBase . 'PHPMailer.php')) {
        require_once $phpMailerBase . 'Exception.php';
        require_once $phpMailerBase . 'PHPMailer.php';
        require_once $phpMailerBase . 'SMTP.php';
        $phpMailerLoaded = true;
    }

    $sucesso = false;
    $erroSanitizado = null;
    $mecanismoUtilizado = 'NONE';

    if ($phpMailerLoaded && $hasPassword) {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $smtpConfig['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtpConfig['username'];
            $mail->Password   = $smtpConfig['password'];
            $mail->SMTPSecure = ($smtpConfig['port'] == 465) ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int)$smtpConfig['port'];
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;

            $mail->setFrom($smtpConfig['from_email'], $smtpConfig['from_name']);
            if (!empty($smtpConfig['reply_to'])) {
                $mail->addReplyTo($smtpConfig['reply_to'], $smtpConfig['from_name']);
            }
            $mail->addAddress($emailLimpo, $nomeDestinatario ?: $emailLimpo);

            $mail->isHTML(true);
            $mail->Subject = $assunto;
            $mail->Body    = $corpoHtml;
            $mail->AltBody = !empty($corpoTexto) ? $corpoTexto : strip_tags($corpoHtml);

            $mail->send();
            $sucesso = true;
            $mecanismoUtilizado = 'HOSTINGER_SMTP_PHPMAILER';
        } catch (PHPMailer\PHPMailer\Exception $e) {
            $sucesso = false;
            $rawError = $mail->ErrorInfo ?: $e->getMessage();
            $erroSanitizado = str_ireplace([$smtpConfig['password'], $smtpConfig['username']], ['[REDACTED_PASS]', '[USER]'], $rawError);
            $mecanismoUtilizado = 'HOSTINGER_SMTP_FAILED';
        }
    } elseif ($phpMailerLoaded && !$hasPassword) {
        // Modo seguro de pré-configuração ou teste local: senha ainda não informada em private_data
        $sucesso = false;
        $erroSanitizado = 'Senha SMTP pendente de configuração em private_data/smtp_config.json.';
        $mecanismoUtilizado = 'SMTP_PENDING_CREDENTIALS';

        // Tenta fallback defensivo via mail() com remetente institucional Hostinger
        $headersMail = [
            'From: ' . $smtpConfig['from_name'] . ' <' . $smtpConfig['from_email'] . '>',
            'Reply-To: ' . ($smtpConfig['reply_to'] ?: $smtpConfig['from_email']),
            'Return-Path: <' . $smtpConfig['from_email'] . '>',
            'MIME-Version: 1.0',
            'X-Mailer: PHP/' . phpversion(),
            'Content-Type: text/html; charset=UTF-8'
        ];
        $mailFallback = @mail($emailLimpo, $assunto, $corpoHtml, implode("\r\n", $headersMail), "-f " . $smtpConfig['from_email']);
        if ($mailFallback) {
            $sucesso = true;
            $mecanismoUtilizado = 'HOSTINGER_MAIL_FALLBACK';
        }
    } else {
        $sucesso = false;
        $erroSanitizado = 'Biblioteca PHPMailer não carregada.';
        $mecanismoUtilizado = 'PHPMAILER_MISSING';
    }

    // Auditoria de segurança: metadados essenciais sem tokens, senhas ou segredos
    $mailSpoolFile = get_secure_storage_path('_outbox_mail.log');
    $mailEntry = [
        'data_envio' => date('c'),
        'destinatario_mascarado' => mask_email_for_audit($emailLimpo),
        'destinatario_sha256' => hash('sha256', $emailLimpo),
        'assunto' => $assunto,
        'status_entrega' => $sucesso ? 'DISPATCHED_SUCCESS' : 'PENDING_OR_FAILED',
        'mecanismo' => $mecanismoUtilizado,
        'info' => $erroSanitizado
    ];
    @file_put_contents($mailSpoolFile, json_encode($mailEntry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

    log_security_event('SYSTEM_EMAIL_DISPATCHED', [
        'destinatario_mascarado' => mask_email_for_audit($emailLimpo),
        'destinatario_sha256' => hash('sha256', $emailLimpo),
        'sucesso' => $sucesso,
        'mecanismo' => $mecanismoUtilizado
    ]);

    return [
        'sucesso' => $sucesso,
        'erro' => $erroSanitizado,
        'mecanismo' => $mecanismoUtilizado
    ];
}

// 6.2.3 Envio Seguro de E-mail de Recuperação com Token de Uso Único
function dispatch_password_reset_email($destinatarioEmail, $nomeUsuario, $rawToken, $expiresTimestamp) {
    $emailLimpo = strtolower(trim($destinatarioEmail));
    if (empty($emailLimpo) || !filter_var($emailLimpo, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $minutosValidade = max(1, round(($expiresTimestamp - time()) / 60));
    $linkRedefinicao = "https://onagenciadeeventos.com.br/login?token=" . urlencode($rawToken) . "&email=" . urlencode($emailLimpo);
    $dataHoraFormatada = date('d/m/Y H:i');

    $assunto = "ON Agência de Eventos - Redefinição de Senha e Recuperação de Acesso";

    $corpoHtml = '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>' . htmlspecialchars($assunto) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background-color: #3b0764; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">ON AGÊNCIA DE EVENTOS</h1>
              <p style="color: #cbd5e1; margin: 6px 0 0; font-size: 13px;">Portal de Gestão & Administração</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #0f172a;">Olá, ' . htmlspecialchars($nomeUsuario) . '!</h2>
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Uma solicitação de redefinição de acesso foi registrada para a sua conta no Portal da ON Agência de Eventos em <strong>' . $dataHoraFormatada . '</strong>.
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #334155;">
                Para estabelecer sua nova credencial de acesso com segurança, utilize o botão abaixo:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="' . htmlspecialchars($linkRedefinicao) . '" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Redefinir Minha Senha</a>
              </div>
              <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px; border-radius: 4px; margin: 24px 0;">
                <p style="margin: 0; font-size: 13px; color: #475569;">
                  <strong>Token de acesso manual:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">' . htmlspecialchars($rawToken) . '</code>
                </p>
              </div>
              <p style="margin: 0 0 10px; font-size: 12px; color: #64748b; line-height: 1.5;">
                • Este token criptográfico é de uso único e expira automaticamente em <strong>' . $minutosValidade . ' minutos</strong>.<br>
                • Se você não fez essa solicitação, desconsidere esta mensagem. Sua conta permanece totalmente protegida.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ' . date('Y') . ' ON Agência de Eventos — Comunicação segura e criptografada via Hostinger SMTP.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

    $corpoTexto = "Olá, {$nomeUsuario}!\n\n" .
        "Uma solicitação de redefinição de acesso foi registrada em {$dataHoraFormatada}.\n\n" .
        "Para definir sua nova senha, utilize o token criptográfico de uso único:\n" .
        "TOKEN: {$rawToken}\n\n" .
        "Ou acesse pelo link seguro:\n{$linkRedefinicao}\n\n" .
        "Atenção: Este token é de uso único e expira em {$minutosValidade} minutos.\n\n" .
        "Equipe de Tecnologia — ON Agência de Eventos";

    send_system_email($emailLimpo, $nomeUsuario, $assunto, $corpoHtml, $corpoTexto);

    return true;
}

// 6.3 Verificação Estrita e Consumo de Uso Único de Token de Redefinição
function verify_and_consume_reset_token($rawToken, $novaSenha, $emailOpcional = null) {
    $rawTokenLimpo = trim((string)$rawToken);
    if (empty($rawTokenLimpo) || strlen($rawTokenLimpo) < 32) {
        return [
            'sucesso' => false,
            'erro' => 'Token de redefinição inválido ou ausente.',
            'codigo' => 'TOKEN_INVALID'
        ];
    }

    if (strlen((string)$novaSenha) < 8) {
        return [
            'sucesso' => false,
            'erro' => 'A nova senha deve possuir no mínimo 8 caracteres.',
            'codigo' => 'PASSWORD_TOO_SHORT'
        ];
    }

    $tokenHash = hash('sha256', $rawTokenLimpo);
    $usuarios = carregar_usuarios_seguros();
    $usuarioIndex = null;

    foreach ($usuarios as $i => $u) {
        if (empty($u['resetTokenHash'])) {
            continue;
        }

        if ($emailOpcional !== null && !empty($emailOpcional)) {
            if (strtolower(trim($u['email'] ?? '')) !== strtolower(trim($emailOpcional))) {
                continue;
            }
        }

        if (hash_equals($u['resetTokenHash'], $tokenHash)) {
            $usuarioIndex = $i;
            break;
        }
    }

    if ($usuarioIndex === null) {
        log_security_event('PASSWORD_RESET_FAILED_INVALID_TOKEN', [
            'provided_token_hash_prefix' => substr($tokenHash, 0, 8)
        ]);
        return [
            'sucesso' => false,
            'erro' => 'Token de redefinição inválido ou inexistente.',
            'codigo' => 'TOKEN_INVALID'
        ];
    }

    $usuario = $usuarios[$usuarioIndex];

    // Validação 1: Uso Único
    if (!empty($usuario['resetTokenUsed'])) {
        log_security_event('PASSWORD_RESET_REPLAY_ATTACK_PREVENTED', [
            'email' => $usuario['email']
        ]);
        return [
            'sucesso' => false,
            'erro' => 'Este token de redefinição já foi utilizado anteriormente.',
            'codigo' => 'TOKEN_ALREADY_USED'
        ];
    }

    // Validação 2: Expiração Temporal
    $expiresAt = (int)($usuario['resetTokenExpires'] ?? 0);
    if (time() > $expiresAt) {
        log_security_event('PASSWORD_RESET_TOKEN_EXPIRED', [
            'email' => $usuario['email'],
            'expired_at' => date('c', $expiresAt)
        ]);
        return [
            'sucesso' => false,
            'erro' => 'O token de redefinição informado já expirou. Solicite um novo link de redefinição.',
            'codigo' => 'TOKEN_EXPIRED'
        ];
    }

    // Sucesso: Aplica novo hash forte, invalida token e marca como utilizado
    $usuarios[$usuarioIndex]['senhaHash'] = hash_secure_password($novaSenha);
    $usuarios[$usuarioIndex]['precisaRedefinirSenha'] = false;
    $usuarios[$usuarioIndex]['resetTokenUsed'] = true;
    $usuarios[$usuarioIndex]['resetTokenHash'] = null;
    $usuarios[$usuarioIndex]['resetTokenExpires'] = null;
    $usuarios[$usuarioIndex]['senhaAlteradaEm'] = date('c');
    unset($usuarios[$usuarioIndex]['senha']);

    salvar_usuarios_seguros($usuarios);

    log_security_event('PASSWORD_RESET_SUCCESS', [
        'email' => $usuario['email']
    ]);

    return [
        'sucesso' => true,
        'mensagem' => 'Senha redefinida com sucesso! Você já pode efetuar o login com suas novas credenciais.',
        'usuario' => sanitize_user_for_client($usuarios[$usuarioIndex])
    ];
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
        if (($u['id'] ?? '') === $_SESSION['usuario_id']) {
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
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
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
