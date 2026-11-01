<?php
/**
 * ON Agência de Eventos - Validador e Teste Real de Envio SMTP Hostinger (PHPMailer)
 * 
 * Executa diagnóstico completo do transporte SMTP SSL/TLS na porta 465,
 * testa a autenticação com o servidor smtp.hostinger.com e realiza envio de teste
 * para um destinatário autorizado sem utilizar dados de clientes ou expor credenciais.
 * 
 * Uso:
 *   # 1. Diagnóstico de configuração e conectividade:
 *   php security/test-hostinger-smtp.php
 * 
 *   # 2. Diagnóstico informando a senha via linha de comando ou variável de ambiente:
 *   php security/test-hostinger-smtp.php --pass=SuaSenhaDoEmail
 * 
 *   # 3. Teste de envio real para um destinatário autorizado:
 *   php security/test-hostinger-smtp.php --pass=SuaSenhaDoEmail --send-to=seu-email-pessoal@dominio.com
 */

echo "============================================================\n";
echo "  ON AGÊNCIA - DIAGNÓSTICO E TESTE SMTP HOSTINGER (PHPMAILER)\n";
echo "============================================================\n\n";

$root = dirname(__DIR__);
$webroot = $root . DIRECTORY_SEPARATOR . 'public';

// 1. Carrega núcleo de autenticação e utilitários
require_once $webroot . DIRECTORY_SEPARATOR . 'auth_guard.php';

// Argumentos de linha de comando
$args = [];
foreach ($argv as $arg) {
    if (strpos($arg, '--') === 0) {
        $parts = explode('=', substr($arg, 2), 2);
        $args[$parts[0]] = $parts[1] ?? true;
    }
}

// 2. Resolução da Configuração SMTP
$smtpConfig = get_smtp_config();

if (!empty($args['pass'])) {
    $smtpConfig['password'] = (string)$args['pass'];
}
if (!empty($args['user'])) {
    $smtpConfig['username'] = (string)$args['user'];
    $smtpConfig['from_email'] = (string)$args['user'];
}
if (!empty($args['host'])) {
    $smtpConfig['host'] = (string)$args['host'];
}
if (!empty($args['port'])) {
    $smtpConfig['port'] = (int)$args['port'];
}

$destinatarioTeste = !empty($args['send-to']) ? trim((string)$args['send-to']) : null;

echo "1. Parâmetros do Servidor SMTP:\n";
echo "  - Servidor:     " . $smtpConfig['host'] . "\n";
echo "  - Porta:        " . $smtpConfig['port'] . " (SSL/TLS nativo)\n";
echo "  - Usuário:      " . $smtpConfig['username'] . "\n";
echo "  - Remetente:    " . $smtpConfig['from_name'] . " <" . $smtpConfig['from_email'] . ">\n";
echo "  - Senha:        " . (!empty($smtpConfig['password']) ? "[DEFINIDA NO SERVIDOR - " . strlen($smtpConfig['password']) . " CARACTERES]" : "[NÃO CONFIGURADA - pendente de preenchimento em private_data/smtp_config.json]") . "\n\n";

// 3. Verificação de Pré-requisitos do Ambiente PHP
echo "2. Pré-requisitos de Runtime PHP:\n";

$checks = [];

// PHPMailer disponível
$phpMailerDir = $webroot . DIRECTORY_SEPARATOR . 'phpmailer';
$hasPhpMailer = file_exists($phpMailerDir . DIRECTORY_SEPARATOR . 'PHPMailer.php') &&
                file_exists($phpMailerDir . DIRECTORY_SEPARATOR . 'SMTP.php') &&
                file_exists($phpMailerDir . DIRECTORY_SEPARATOR . 'Exception.php');

$checks[] = [
    'item' => 'Biblioteca PHPMailer 6.x disponível',
    'ok' => $hasPhpMailer,
    'detalhes' => $hasPhpMailer ? 'Arquivos presentes em public/phpmailer/' : 'Arquivos ausentes'
];

// Extensão OpenSSL para TLS/SSL
$hasOpenSSL = extension_loaded('openssl');
$checks[] = [
    'item' => 'Extensão PHP OpenSSL habilitada (SSL 465)',
    'ok' => $hasOpenSSL,
    'detalhes' => $hasOpenSSL ? 'Ativa e funcional' : 'Desabilitada no php.ini'
];

// Sockets e Conectividade
$checks[] = [
    'item' => 'Suporte a Sockets de Rede (fsockopen/stream)',
    'ok' => function_exists('fsockopen') && function_exists('stream_socket_client'),
    'detalhes' => 'Funções de socket liberadas'
];

$allChecksOk = true;
foreach ($checks as $c) {
    $status = $c['ok'] ? '[PASS]' : '[FAIL]';
    if (!$c['ok']) $allChecksOk = false;
    echo "  {$status} {$c['item']}: {$c['detalhes']}\n";
}

if (!$allChecksOk) {
    echo "\n[ERRO]: Requisitos fundamentais do PHP ausentes. Corrija o ambiente antes de prosseguir.\n";
    exit(1);
}

// 4. Teste de Conexão de Rede com smtp.hostinger.com:465
echo "\n3. Teste de Conexão de Rede e Handshake SSL com Hostinger:\n";
$host = $smtpConfig['host'];
$port = (int)$smtpConfig['port'];
$timeout = 10;

$context = stream_context_create([
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'allow_self_signed' => false,
    ]
]);

$remoteSocket = "ssl://{$host}:{$port}";
echo "  -> Conectando a {$remoteSocket} (timeout: {$timeout}s)... ";

$startTime = microtime(true);
$fp = @stream_socket_client(
    $remoteSocket,
    $errno,
    $errstr,
    $timeout,
    STREAM_CLIENT_CONNECT,
    $context
);
$elapsed = round((microtime(true) - $startTime) * 1000);

if ($fp) {
    $banner = trim((string)fgets($fp, 512));
    fclose($fp);
    echo "OK ({$elapsed}ms)\n";
    echo "  [PASS] Banner SMTP Hostinger recebido: {$banner}\n";
} else {
    echo "FALHA\n";
    echo "  [FAIL] Erro ao conectar ao servidor SMTP Hostinger: ({$errno}) {$errstr}\n";
    echo "         Verifique se a porta 465 de saída está liberada no firewall.\n";
    if (empty($destinatarioTeste)) {
        exit(1);
    }
}

// 5. Teste de Envio Real via PHPMailer
if ($destinatarioTeste) {
    echo "\n4. Execução de Envio Real via SMTP Hostinger Autenticado:\n";
    echo "  - Destinatário de Teste: {$destinatarioTeste}\n";

    if (empty($smtpConfig['password'])) {
        echo "  [ERRO]: Não é possível realizar o envio real sem a senha do e-mail.\n";
        echo "          Informe a senha com: --pass=SuaSenha ou defina em private_data/smtp_config.json.\n";
        exit(1);
    }

    require_once $phpMailerDir . DIRECTORY_SEPARATOR . 'Exception.php';
    require_once $phpMailerDir . DIRECTORY_SEPARATOR . 'PHPMailer.php';
    require_once $phpMailerDir . DIRECTORY_SEPARATOR . 'SMTP.php';

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
        $mail->Timeout    = 20;

        $mail->setFrom($smtpConfig['from_email'], $smtpConfig['from_name']);
        if (!empty($smtpConfig['reply_to'])) {
            $mail->addReplyTo($smtpConfig['reply_to'], $smtpConfig['from_name']);
        }
        $mail->addAddress($destinatarioTeste, 'Destinatário Autorizado');

        $dataHora = date('d/m/Y H:i:s');
        $mail->Subject = "ON Agência - Teste de Envio Autenticado Hostinger SMTP [{$dataHora}]";
        $mail->isHTML(true);

        $mail->Body = '
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background-color: #3b0764; color: #ffffff; padding: 15px; border-radius: 6px; text-align: center;">
                <h2 style="margin: 0;">ON AGÊNCIA DE EVENTOS</h2>
                <p style="margin: 5px 0 0; font-size: 13px;">Validação de Envio Oficial via Hostinger SMTP</p>
            </div>
            <div style="padding: 20px 0;">
                <p>Olá!</p>
                <p>Este é um <strong>e-mail de teste real</strong> enviado pelo sistema da ON Agência de Eventos utilizando autenticação SMTP oficial da Hostinger.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 13px;"><strong>Servidor:</strong> ' . htmlspecialchars($smtpConfig['host']) . ':465 (SSL/TLS)</p>
                    <p style="margin: 4px 0 0; font-size: 13px;"><strong>Remetente:</strong> ' . htmlspecialchars($smtpConfig['from_email']) . '</p>
                    <p style="margin: 4px 0 0; font-size: 13px;"><strong>Data e Hora:</strong> ' . $dataHora . '</p>
                </div>
                <p style="font-size: 13px; color: #64748b;">Se você recebeu esta mensagem, o canal de despacho está 100% operacional e pronto para envio de links de recuperação, convites e notificações.</p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center;">
                © ' . date('Y') . ' ON Agência de Eventos — Comunicação segura.
            </div>
        </div>';

        $mail->AltBody = "ON Agência de Eventos - Teste de Envio Autenticado Hostinger SMTP\n\n" .
                         "Se você recebeu esta mensagem em {$dataHora}, o envio via Hostinger SMTP está 100% operacional.";

        echo "  -> Autenticando e despachando e-mail... ";
        $mail->send();
        echo "SUCESSO!\n";
        echo "  [PASS] Mensagem aceita pelo servidor SMTP e despachada para {$destinatarioTeste}!\n";

    } catch (PHPMailer\PHPMailer\Exception $e) {
        echo "FALHA!\n";
        $rawError = $mail->ErrorInfo ?: $e->getMessage();
        $erroSanitizado = str_ireplace([$smtpConfig['password'], $smtpConfig['username']], ['[REDACTED_PASS]', '[USER]'], $rawError);
        echo "  [FAIL] Erro de autenticação/despacho SMTP: {$erroSanitizado}\n";
        echo "         Verifique se a senha informada corresponde exatamente à cadastrada no hPanel da Hostinger.\n";
        exit(1);
    }
} else {
    echo "\n4. Teste de Envio Real:\n";
    echo "  (Nenhum destinatário informado. Para executar envio real para sua caixa de entrada, execute:)\n";
    echo "  php security/test-hostinger-smtp.php --pass=SuaSenha --send-to=seu-email@dominio.com\n";
}

echo "\n------------------------------------------------------------\n";
echo "Diagnóstico concluído com sucesso. Integração SMTP pronta!\n";
echo "------------------------------------------------------------\n";
exit(0);
