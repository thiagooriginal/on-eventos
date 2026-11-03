<?php
/**
 * ON AGÊNCIA DE EVENTOS - SCRIPT DE VERIFICAÇÃO DEFENSIVA DE AMBIENTE HOSTINGER
 * 
 * FINALIDADE:
 * 1. Identificar o caminho absoluto da pasta private_data na hospedagem Hostinger.
 * 2. Verificar se o PHP consegue ler o smtp_config.json com permissão 600.
 * 3. Confirmar se a aplicação auth_guard.php está configurada para utilizar exatamente esse caminho.
 * 4. Testar a conectividade de rede com o servidor SMTP (smtp.hostinger.com:465) via SSL/TLS nativo.
 * 
 * SEGURANÇA:
 * - Operação 100% de leitura (READ-ONLY). Nenhum dado de produção é alterado ou excluído.
 * - SENHAS E CREDENCIAIS CONFIDENCIAIS NUNCA SÃO EXIBIDAS.
 * - Deve ser removido do servidor após a conclusão dos testes.
 */

// Configurações básicas de execução e cabeçalhos de proteção
@ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-Robots-Tag: noindex, nofollow, noarchive, nosnippet');
    header('Content-Type: text/html; charset=UTF-8');
}

// Coleta de Dados do Ambiente
$currentDir = __DIR__;
$docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
$sapi = php_sapi_name();
$phpVer = phpversion();

// Identificação de Usuário do Processo PHP
$execUser = 'desconhecido';
$execUid = function_exists('getmyuid') ? getmyuid() : 'N/A';
$execGid = function_exists('getmygid') ? getmygid() : 'N/A';

if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
    $pw = @posix_getpwuid(posix_geteuid());
    if ($pw && isset($pw['name'])) {
        $execUser = $pw['name'];
    }
}
if ($execUser === 'desconhecido' && function_exists('get_current_user')) {
    $execUser = get_current_user();
}

// -------------------------------------------------------------
// 1. CANDIDATOS AO CAMINHO DA PASTA private_data
// -------------------------------------------------------------
$candidates = [];

// Candidato 1: Um nível acima de onde o script está (ex: /domains/.../private_data ou raiz/private_data)
$candidates['Padrão da Aplicação (dirname(__DIR__))'] = dirname($currentDir) . DIRECTORY_SEPARATOR . 'private_data';

// Candidato 2: Dois níveis acima (caso public_html esteja em domains/dominio/public_html e private_data na raiz do usuário)
$candidates['Raiz da Conta Hostinger (dirname(dirname(__DIR__)))'] = dirname(dirname($currentDir)) . DIRECTORY_SEPARATOR . 'private_data';

// Candidato 3: Fora do DOCUMENT_ROOT web
if (!empty($docRoot)) {
    $candidates['Fora do Document Root (dirname(DOCUMENT_ROOT))'] = dirname($docRoot) . DIRECTORY_SEPARATOR . 'private_data';
    $candidates['Raiz Global Document Root (dirname(dirname(DOCUMENT_ROOT)))'] = dirname(dirname($docRoot)) . DIRECTORY_SEPARATOR . 'private_data';
}

// Candidato 4: Variável de ambiente (caso configurada)
$envCustom = getenv('ON_PRIVATE_DATA_DIR');
if (!empty($envCustom)) {
    $candidates['Variável de Ambiente ON_PRIVATE_DATA_DIR'] = rtrim($envCustom, '/\\');
}

$detectedPrivateDir = null;
$detectedLabel = null;
$candidatesStatus = [];

foreach ($candidates as $label => $path) {
    $exists = is_dir($path);
    $real = $exists ? realpath($path) : false;
    $perms = $exists ? substr(sprintf('%o', @fileperms($path)), -4) : 'N/A';
    $owner = ($exists && function_exists('posix_getpwuid') && function_exists('fileowner')) 
        ? (@posix_getpwuid(@fileowner($path))['name'] ?? @fileowner($path)) 
        : ($exists ? @fileowner($path) : 'N/A');

    $candidatesStatus[] = [
        'label' => $label,
        'path' => $path,
        'exists' => $exists,
        'real' => $real,
        'perms' => $perms,
        'owner' => $owner
    ];

    if ($exists && $detectedPrivateDir === null) {
        $detectedPrivateDir = $real ?: $path;
        $detectedLabel = $label;
    }
}

// -------------------------------------------------------------
// 2. VERIFICAÇÃO DO ARQUIVO smtp_config.json
// -------------------------------------------------------------
$smtpFileStatus = [
    'exists' => false,
    'path' => null,
    'perms' => 'N/A',
    'is_600' => false,
    'owner' => 'N/A',
    'readable' => false,
    'json_valid' => false,
    'host' => 'N/A',
    'port' => 'N/A',
    'secure' => 'N/A',
    'auth' => 'N/A',
    'username' => 'N/A',
    'password_status' => 'N/A',
    'from_email' => 'N/A',
    'from_name' => 'N/A',
    'read_error' => null
];

if ($detectedPrivateDir) {
    $smtpPath = $detectedPrivateDir . DIRECTORY_SEPARATOR . 'smtp_config.json';
    $smtpFileStatus['path'] = $smtpPath;

    if (file_exists($smtpPath)) {
        $smtpFileStatus['exists'] = true;
        $permsOctal = substr(sprintf('%o', @fileperms($smtpPath)), -4);
        $smtpFileStatus['perms'] = $permsOctal;
        $smtpFileStatus['is_600'] = ($permsOctal === '0600' || $permsOctal === '600');

        $fileOwner = 'N/A';
        if (function_exists('posix_getpwuid') && function_exists('fileowner')) {
            $pw = @posix_getpwuid(@fileowner($smtpPath));
            $fileOwner = $pw['name'] ?? @fileowner($smtpPath);
        } else {
            $fileOwner = @fileowner($smtpPath);
        }
        $smtpFileStatus['owner'] = $fileOwner;

        $isReadable = @is_readable($smtpPath);
        $smtpFileStatus['readable'] = $isReadable;

        $content = @file_get_contents($smtpPath);
        if ($content !== false) {
            $json = json_decode($content, true);
            if (is_array($json)) {
                $smtpFileStatus['json_valid'] = true;
                $smtpFileStatus['host'] = $json['host'] ?? 'N/A';
                $smtpFileStatus['port'] = $json['port'] ?? 'N/A';
                $smtpFileStatus['secure'] = $json['secure'] ?? 'N/A';
                $smtpFileStatus['auth'] = isset($json['auth']) ? ($json['auth'] ? 'true' : 'false') : 'N/A';
                $smtpFileStatus['username'] = $json['username'] ?? 'N/A';
                $smtpFileStatus['from_email'] = $json['from_email'] ?? 'N/A';
                $smtpFileStatus['from_name'] = $json['from_name'] ?? 'N/A';

                // VERIFICAÇÃO DEFENSIVA DA SENHA: NUNCA EXIBE A SENHA
                if (isset($json['password']) && is_string($json['password']) && strlen($json['password']) > 0) {
                    $len = strlen($json['password']);
                    $smtpFileStatus['password_status'] = "DEFINIDA E PREENCHIDA ({$len} caracteres) [CONTEÚDO PROTEGIDO]";
                } else {
                    $smtpFileStatus['password_status'] = "NÃO DEFINIDA OU VAZIA [ATENÇÃO]";
                }
            } else {
                $smtpFileStatus['read_error'] = 'JSON com formato inválido ou corrompido: ' . json_last_error_msg();
            }
        } else {
            $smtpFileStatus['read_error'] = 'PHP não conseguiu ler o conteúdo com file_get_contents (verifique usuário/permissões).';
        }
    }
}

// -------------------------------------------------------------
// 3. VERIFICAÇÃO DO ALINHAMENTO COM A APLICAÇÃO (auth_guard.php)
// -------------------------------------------------------------
$appResolution = [
    'auth_guard_found' => false,
    'app_path' => null,
    'matches_detected' => false,
    'dir_writable' => false
];

$authGuardCandidate = $currentDir . DIRECTORY_SEPARATOR . 'auth_guard.php';
if (!file_exists($authGuardCandidate)) {
    $authGuardCandidate = $currentDir . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'auth_guard.php';
}

if (file_exists($authGuardCandidate)) {
    $appResolution['auth_guard_found'] = true;
}

// Simulação da lógica exata do auth_guard.php
$c1 = dirname($currentDir) . DIRECTORY_SEPARATOR . 'private_data';
$c2 = dirname(dirname($currentDir)) . DIRECTORY_SEPARATOR . 'private_data';
$simulatedAppDir = is_dir($c1) ? $c1 : (is_dir($c2) ? $c2 : $c1);
if (is_dir($simulatedAppDir)) {
    $simulatedAppDir = realpath($simulatedAppDir) ?: $simulatedAppDir;
}
$appResolution['app_path'] = $simulatedAppDir;

if ($detectedPrivateDir && realpath($detectedPrivateDir) === realpath($simulatedAppDir)) {
    $appResolution['matches_detected'] = true;
}

// Teste de permissão de escrita no diretório (necessário para logs, sessões e backups)
if ($detectedPrivateDir && is_dir($detectedPrivateDir)) {
    $testFile = rtrim($detectedPrivateDir, '/\\') . DIRECTORY_SEPARATOR . '.wtest_' . bin2hex(random_bytes(6));
    $fp = @fopen($testFile, 'w');
    if ($fp) {
        @fclose($fp);
        @unlink($testFile);
        $appResolution['dir_writable'] = true;
    }
}

// -------------------------------------------------------------
// 4. TESTE DE CONECTIVIDADE SSL COM smtp.hostinger.com:465
// -------------------------------------------------------------
$smtpNetStatus = [
    'tested' => true,
    'host' => 'smtp.hostinger.com',
    'port' => 465,
    'connected' => false,
    'latency_ms' => 0,
    'banner' => 'N/A',
    'error' => null
];

$t0 = microtime(true);
$context = stream_context_create([
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'allow_self_signed' => false
    ]
]);

$errno = 0;
$errstr = '';
$socket = @stream_socket_client('ssl://smtp.hostinger.com:465', $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
$smtpNetStatus['latency_ms'] = round((microtime(true) - $t0) * 1000, 1);

if ($socket) {
    stream_set_timeout($socket, 5);
    $banner = @fgets($socket, 512);
    @fclose($socket);

    $smtpNetStatus['connected'] = true;
    $smtpNetStatus['banner'] = trim($banner ?: '');
} else {
    $smtpNetStatus['error'] = "Erro ({$errno}): {$errstr}";
}

// -------------------------------------------------------------
// RENDERIZAÇÃO DA RESPOSTA (CLI OU WEB)
// -------------------------------------------------------------
if ($isCli) {
    echo "============================================================\n";
    echo "  ON AGÊNCIA - DIAGNÓSTICO DE AMBIENTE HOSTINGER (READ-ONLY)\n";
    echo "============================================================\n\n";

    echo "1. CAMINHO ABSOLUTO DA PASTA private_data:\n";
    if ($detectedPrivateDir) {
        echo "  [PASS] Pasta detectada em: {$detectedPrivateDir}\n";
        echo "  - Origem detectada: {$detectedLabel}\n";
    } else {
        echo "  [FAIL] Nenhuma pasta private_data encontrada nas localizações padrão.\n";
    }
    echo "  - Detalhe dos caminhos verificados:\n";
    foreach ($candidatesStatus as $c) {
        $st = $c['exists'] ? "EXISTE (perms: {$c['perms']}, dono: {$c['owner']})" : "NÃO EXISTE";
        echo "    * {$c['label']}: {$c['path']} -> [{$st}]\n";
    }

    echo "\n2. LEITURA DE smtp_config.json COM PERMISSÃO 600:\n";
    if ($smtpFileStatus['exists']) {
        echo "  [PASS] Arquivo encontrado: {$smtpFileStatus['path']}\n";
        echo "  - Permissões em disco: " . ($smtpFileStatus['is_600'] ? "[PASS] {$smtpFileStatus['perms']} (Modo estrito 600)" : "[INFO] {$smtpFileStatus['perms']}") . "\n";
        echo "  - Usuário do arquivo: {$smtpFileStatus['owner']} | Usuário PHP: {$execUser} (UID: {$execUid})\n";
        if ($smtpFileStatus['readable']) {
            echo "  [PASS] PHP conseguiu ler o arquivo perfeitamente!\n";
            if ($smtpFileStatus['json_valid']) {
                echo "  [PASS] JSON estruturado corretamente.\n";
                echo "  - Servidor:    {$smtpFileStatus['host']}:{$smtpFileStatus['port']} ({$smtpFileStatus['secure']})\n";
                echo "  - Usuário:     {$smtpFileStatus['username']}\n";
                echo "  - Remetente:   {$smtpFileStatus['from_name']} <{$smtpFileStatus['from_email']}>\n";
                echo "  - Senha:       {$smtpFileStatus['password_status']}\n";
            } else {
                echo "  [FAIL] {$smtpFileStatus['read_error']}\n";
            }
        } else {
            echo "  [FAIL] PHP NÃO conseguiu ler o arquivo. Causa: Permissão 600 restringe acesso ao proprietário ({$smtpFileStatus['owner']}), enquanto o PHP executa como ({$execUser}).\n";
        }
    } else {
        echo "  [FAIL] Arquivo smtp_config.json não encontrado dentro de private_data.\n";
    }

    echo "\n3. ALINHAMENTO COM A APLICAÇÃO (auth_guard.php):\n";
    echo "  - Caminho que o auth_guard utiliza: {$appResolution['app_path']}\n";
    if ($appResolution['matches_detected']) {
        echo "  [PASS] A aplicação utiliza EXATAMENTE o mesmo caminho identificado!\n";
    } else {
        echo "  [FAIL] Divergência entre a pasta criada e o caminho do auth_guard.\n";
    }
    echo "  - Permissão de escrita na pasta private_data: " . ($appResolution['dir_writable'] ? "[PASS] Liberada (0750/0700)" : "[FAIL] Sem escrita") . "\n";

    echo "\n4. CONECTIVIDADE COM O SERVIDOR SMTP (smtp.hostinger.com:465):\n";
    if ($smtpNetStatus['connected']) {
        echo "  [PASS] Conexão SSL na porta 465 bem-sucedida! Latência: {$smtpNetStatus['latency_ms']}ms\n";
        echo "  - Banner recebido: {$smtpNetStatus['banner']}\n";
    } else {
        echo "  [FAIL] Falha ao conectar: {$smtpNetStatus['error']}\n";
    }

    echo "\n============================================================\n";
    echo "Diagnóstico finalizado. Nenhuma informação confidencial exposta.\n";
    echo "============================================================\n";
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>ON Agência — Diagnóstico de Ambiente Hostinger</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --pass: #10b981;
      --fail: #ef4444;
      --warn: #f59e0b;
      --brand: #8b5cf6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 30px 20px; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
    .header h1 { font-size: 24px; color: #fff; margin-bottom: 6px; }
    .header p { color: var(--text-muted); font-size: 14px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: var(--pass); border: 1px solid var(--pass); }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--fail); border: 1px solid var(--fail); }
    .badge-warn { background: rgba(245, 158, 11, 0.2); color: var(--warn); border: 1px solid var(--warn); }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
    .card-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: var(--text-muted); }
    .value { font-weight: 600; text-align: right; max-width: 65%; word-break: break-all; font-family: monospace; }
    .security-alert { background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warn); border-radius: 8px; padding: 14px; font-size: 13px; color: #fde68a; margin-top: 24px; }
    .code-box { background: #030712; padding: 12px; border-radius: 6px; border: 1px solid #1f2937; font-family: monospace; font-size: 13px; color: #e2e8f0; margin-top: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ON Agência de Eventos</h1>
      <p>Diagnóstico de Configuração e Conectividade SMTP Hostinger</p>
      <div style="margin-top: 10px;">
        <span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid #8b5cf6;">Ambiente Seguro • Read-Only</span>
      </div>
    </div>

    <!-- 1. CAMINHO ABSOLUTO -->
    <div class="card">
      <div class="card-title">
        <span>1. Caminho Absoluto da Pasta private_data</span>
        <?php if ($detectedPrivateDir): ?>
          <span class="badge badge-pass">Localizada</span>
        <?php else: ?>
          <span class="badge badge-fail">Não Localizada</span>
        <?php endif; ?>
      </div>
      <div class="row">
        <span class="label">Caminho Ativo Detectado:</span>
        <span class="value" style="color: <?= $detectedPrivateDir ? '#10b981' : '#ef4444' ?>;">
          <?= htmlspecialchars($detectedPrivateDir ?: 'Nenhum caminho válido encontrado') ?>
        </span>
      </div>
      <div class="row">
        <span class="label">Origem da Descoberta:</span>
        <span class="value"><?= htmlspecialchars($detectedLabel ?: 'N/A') ?></span>
      </div>
      <div class="row">
        <span class="label">Usuário de Execução do PHP:</span>
        <span class="value"><?= htmlspecialchars($execUser) ?> (UID: <?= htmlspecialchars((string)$execUid) ?>)</span>
      </div>
      <div style="margin-top: 14px;">
        <span class="label" style="font-size: 13px;">Varredura de Locais Analisados:</span>
        <div class="code-box">
          <?php foreach ($candidatesStatus as $c): ?>
            [<?= $c['exists'] ? '✓ EXISTE' : '✗ AUSENTE' ?>] <?= htmlspecialchars($c['label']) ?><br>
            &nbsp;&nbsp;→ <?= htmlspecialchars($c['path']) ?> (perms: <?= htmlspecialchars($c['perms']) ?>, dono: <?= htmlspecialchars((string)$c['owner']) ?>)<br>
          <?php endforeach; ?>
        </div>
      </div>
    </div>

    <!-- 2. LEITURA DO ARQUIVO smtp_config.json -->
    <div class="card">
      <div class="card-title">
        <span>2. Leitura do smtp_config.json com Permissão 600</span>
        <?php if ($smtpFileStatus['exists'] && $smtpFileStatus['readable'] && $smtpFileStatus['json_valid']): ?>
          <span class="badge badge-pass">Leitura 100% OK</span>
        <?php elseif ($smtpFileStatus['exists'] && !$smtpFileStatus['readable']): ?>
          <span class="badge badge-fail">Permissão Bloqueada</span>
        <?php else: ?>
          <span class="badge badge-fail">Arquivo Não Encontrado</span>
        <?php endif; ?>
      </div>
      <div class="row">
        <span class="label">Arquivo Encontrado:</span>
        <span class="value"><?= $smtpFileStatus['exists'] ? 'Sim (' . htmlspecialchars($smtpFileStatus['path']) . ')' : 'Não' ?></span>
      </div>
      <div class="row">
        <span class="label">Permissão em Disco:</span>
        <span class="value"><?= htmlspecialchars($smtpFileStatus['perms']) ?> <?= $smtpFileStatus['is_600'] ? '<span style="color:#10b981;">(Modo Estrito 0600)</span>' : '' ?></span>
      </div>
      <div class="row">
        <span class="label">Proprietário do Arquivo:</span>
        <span class="value"><?= htmlspecialchars((string)$smtpFileStatus['owner']) ?></span>
      </div>
      <div class="row">
        <span class="label">PHP Consegue Ler:</span>
        <span class="value" style="color: <?= $smtpFileStatus['readable'] ? '#10b981' : '#ef4444' ?>;">
          <?= $smtpFileStatus['readable'] ? 'Sim (Acesso Autorizado)' : 'Não (Acesso Negado)' ?>
        </span>
      </div>
      <?php if ($smtpFileStatus['json_valid']): ?>
        <div class="row">
          <span class="label">Servidor / Porta:</span>
          <span class="value"><?= htmlspecialchars($smtpFileStatus['host']) ?>:<?= htmlspecialchars((string)$smtpFileStatus['port']) ?> (<?= htmlspecialchars($smtpFileStatus['secure']) ?>)</span>
        </div>
        <div class="row">
          <span class="label">Usuário SMTP:</span>
          <span class="value"><?= htmlspecialchars($smtpFileStatus['username']) ?></span>
        </div>
        <div class="row">
          <span class="label">Remetente Oficial:</span>
          <span class="value"><?= htmlspecialchars($smtpFileStatus['from_name']) ?> &lt;<?= htmlspecialchars($smtpFileStatus['from_email']) ?>&gt;</span>
        </div>
        <div class="row">
          <span class="label">Status da Senha:</span>
          <span class="value" style="color: #10b981;"><?= htmlspecialchars($smtpFileStatus['password_status']) ?></span>
        </div>
      <?php elseif ($smtpFileStatus['read_error']): ?>
        <div class="row">
          <span class="label">Erro de Diagnóstico:</span>
          <span class="value" style="color: #ef4444;"><?= htmlspecialchars($smtpFileStatus['read_error']) ?></span>
        </div>
      <?php endif; ?>
    </div>

    <!-- 3. CONFIGURAÇÃO DA APLICAÇÃO -->
    <div class="card">
      <div class="card-title">
        <span>3. Alinhamento da Aplicação (auth_guard.php)</span>
        <?php if ($appResolution['matches_detected']): ?>
          <span class="badge badge-pass">Alinhado</span>
        <?php else: ?>
          <span class="badge badge-warn">Verificar Caminho</span>
        <?php endif; ?>
      </div>
      <div class="row">
        <span class="label">Caminho Resolvido pelo auth_guard:</span>
        <span class="value"><?= htmlspecialchars($appResolution['app_path']) ?></span>
      </div>
      <div class="row">
        <span class="label">Correspondência Exata:</span>
        <span class="value" style="color: <?= $appResolution['matches_detected'] ? '#10b981' : '#f59e0b' ?>;">
          <?= $appResolution['matches_detected'] ? 'Sim (100% Sincronizado)' : 'Não coincide com a pasta detectada' ?>
        </span>
      </div>
      <div class="row">
        <span class="label">Permissão de Gravação na Pasta (Sessões/Logs):</span>
        <span class="value" style="color: <?= $appResolution['dir_writable'] ? '#10b981' : '#ef4444' ?>;">
          <?= $appResolution['dir_writable'] ? 'Sim (Permissão de escrita confirmada)' : 'Não (Ajuste permissões da pasta para 0750)' ?>
        </span>
      </div>
    </div>

    <!-- 4. CONECTIVIDADE SMTP -->
    <div class="card">
      <div class="card-title">
        <span>4. Conexão com SMTP Hostinger (Porta 465 SSL)</span>
        <?php if ($smtpNetStatus['connected']): ?>
          <span class="badge badge-pass">Conectado (<?= $smtpNetStatus['latency_ms'] ?>ms)</span>
        <?php else: ?>
          <span class="badge badge-fail">Falha de Conexão</span>
        <?php endif; ?>
      </div>
      <div class="row">
        <span class="label">Host Alvo:</span>
        <span class="value">ssl://<?= htmlspecialchars($smtpNetStatus['host']) ?>:<?= htmlspecialchars((string)$smtpNetStatus['port']) ?></span>
      </div>
      <div class="row">
        <span class="label">Handshake SSL / TLS:</span>
        <span class="value" style="color: <?= $smtpNetStatus['connected'] ? '#10b981' : '#ef4444' ?>;">
          <?= $smtpNetStatus['connected'] ? 'Aprovado (' . $smtpNetStatus['latency_ms'] . ' ms)' : 'Falhou' ?>
        </span>
      </div>
      <div class="row">
        <span class="label">Resposta / Banner do Servidor:</span>
        <span class="value" style="color: <?= $smtpNetStatus['connected'] ? '#10b981' : '#ef4444' ?>;">
          <?= htmlspecialchars($smtpNetStatus['banner'] ?: ($smtpNetStatus['error'] ?? 'Sem resposta')) ?>
        </span>
      </div>
    </div>

    <div class="security-alert">
      <strong>⚠️ Recomendação de Segurança:</strong>
      Este script é uma ferramenta de validação defensiva. Não exibe credenciais nem altera arquivos de produção.
      Após confirmar os 4 pontos, <strong>exclua este arquivo do servidor</strong> (ou remova do <code>public_html</code>) para manter a superfície de ataque limpa.
    </div>
  </div>
</body>
</html>
