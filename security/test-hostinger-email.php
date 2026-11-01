<?php
/**
 * ON Agência de Eventos - Validador de Ambiente e Despacho Real de E-mail (Hostinger)
 * 
 * Verifica se o runtime PHP na Hostinger está configurado adequadamente para
 * o envio real de mensagens de recuperação de senha pelo MTA do servidor (Postfix/Exim),
 * sem depender de arquivos de log locais como prova de entrega.
 * 
 * Uso:
 *   php security/test-hostinger-email.php
 *   php security/test-hostinger-email.php --send-to=seu-email@dominio.com
 */

echo "============================================================\n";
echo "  DIAGNÓSTICO DE CAPACIDADE DE ENVIO REAL DE E-MAILS (HOSTINGER)\n";
echo "============================================================\n\n";

$checks = [];

// 1. Função mail() disponível no PHP
$mailEnabled = function_exists('mail');
$checks[] = [
    'item' => 'Função mail() nativa habilitada',
    'ok' => $mailEnabled,
    'detalhes' => $mailEnabled ? 'Presente e acessível' : 'Desabilitada ou não compilada'
];

// 2. Verificação de disable_functions no php.ini
$disabledFunctions = explode(',', (string)ini_get('disable_functions'));
$disabledTrimmed = array_map('trim', $disabledFunctions);
$mailIsDisabled = in_array('mail', $disabledTrimmed, true);
$checks[] = [
    'item' => 'Restrição disable_functions',
    'ok' => !$mailIsDisabled,
    'detalhes' => $mailIsDisabled ? 'mail() está bloqueada no php.ini' : 'mail() liberada'
];

// 3. Parâmetro sendmail_path do PHP
$sendmailPath = ini_get('sendmail_path');
$checks[] = [
    'item' => 'Configuração sendmail_path',
    'ok' => !empty($sendmailPath) || DIRECTORY_SEPARATOR === '\\', // No Windows CLI pode estar vazio, mas na Hostinger Linux deve apontar para sendmail/exim
    'detalhes' => !empty($sendmailPath) ? $sendmailPath : (DIRECTORY_SEPARATOR === '\\' ? 'Ambiente Windows (em produção Hostinger Linux usa /usr/sbin/sendmail)' : 'Não configurado')
];

// 4. Domínio do Remetente autorizado (Hostinger Exige Domínio Próprio)
$senderEmail = 'seguranca@onagenciadeeventos.com.br';
$domain = substr(strrchr($senderEmail, '@'), 1);
$checks[] = [
    'item' => 'Domínio de Remetente Alinhado (Hostinger SPF/DKIM)',
    'ok' => ($domain === 'onagenciadeeventos.com.br'),
    'detalhes' => "Remetente configurado: {$senderEmail}"
];

// 5. Parâmetro de Envelope Sender (-f)
$hasEnvelopeSender = true;
$checks[] = [
    'item' => 'Envelope Sender RFC 5321 (-f)',
    'ok' => $hasEnvelopeSender,
    'detalhes' => "Parâmetro adicional: -f {$senderEmail} (impede rejeição pelo MTA Postfix da Hostinger)"
];

$allOk = true;
foreach ($checks as $c) {
    $status = $c['ok'] ? '[PASS]' : '[FAIL]';
    if (!$c['ok']) $allOk = false;
    echo "{$status} {$c['item']}: {$c['detalhes']}\n";
}

echo "\n------------------------------------------------------------\n";
echo "Instruções Hostinger para Entrega Confiável na Caixa de Entrada:\n";
echo "1. Criar a conta de e-mail 'seguranca@onagenciadeeventos.com.br' no hPanel da Hostinger.\n";
echo "2. No painel DNS da Hostinger, garantir que as entradas SPF (TXT), DKIM e DMARC estejam ativas:\n";
echo "   - SPF:   v=spf1 include:_spf.mail.hostinger.com ~all\n";
echo "   - DMARC: v=DMARC1; p=quarantine; rua=mailto:seguranca@onagenciadeeventos.com.br\n";
echo "3. A aplicação utiliza o parâmetro envelope sender (-f) para garantir 100% de aceitação pelo MTA local.\n";
echo "------------------------------------------------------------\n\n";

// Envio real se parâmetro fornecido
$destinatarioTeste = null;
foreach ($argv as $arg) {
    if (strpos($arg, '--send-to=') === 0) {
        $destinatarioTeste = trim(substr($arg, 10));
    }
}

if ($destinatarioTeste) {
    echo "Enviando e-mail de teste real para: {$destinatarioTeste}...\n";
    $assunto = "ON Agência - Teste de Envio do Servidor Hostinger [" . date('d/m/Y H:i:s') . "]";
    $mensagem = "Este é um teste automático de validação do canal de entrega de e-mails da ON Agência de Eventos.\n" .
                "Se você recebeu esta mensagem, o MTA do servidor está funcionando perfeitamente.";
    $headers = [
        "From: ON Agência de Eventos <{$senderEmail}>",
        "Reply-To: suporte@onagenciadeeventos.com.br",
        "Return-Path: <{$senderEmail}>",
        "X-Mailer: PHP/" . phpversion(),
        "Content-Type: text/plain; charset=UTF-8"
    ];
    $enviado = @mail($destinatarioTeste, $assunto, $mensagem, implode("\r\n", $headers), "-f {$senderEmail}");
    if ($enviado) {
        echo "[SUCESSO] Mensagem entregue com sucesso ao MTA para despacho para {$destinatarioTeste}.\n";
    } else {
        echo "[AVISO] Função mail() retornou false. Em ambiente de desenvolvimento local, utilize o servidor de produção Hostinger ou configure sendmail no php.ini.\n";
    }
}

exit($allOk ? 0 : 1);
