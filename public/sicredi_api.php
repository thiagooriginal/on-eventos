<?php
// API Oficial de Integração Sicredi Cobrança Online (OpenAPI v1/v2) - ON Eventos
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';
require_auth(['ADMIN']);

$configFile = get_secure_storage_path('sicredi_api_config.json');
$tokenCacheFile = get_secure_storage_path('sicredi_token_cache.json');
$vendasFile = get_secure_storage_path('vendas_albuns_db.json');

// Configuração segura do Sicredi (valores padrão vazios para carregamento de cofre/ambiente)
$defaultConfig = [
    'ambiente' => getenv('SICREDI_AMBIENTE') ?: 'producao',
    'username' => getenv('SICREDI_USERNAME') ?: '',
    'x_api_key' => getenv('SICREDI_API_KEY') ?: '',
    'password' => getenv('SICREDI_PASSWORD') ?: '',
    'cooperativa' => getenv('SICREDI_COOPERATIVA') ?: '0726',
    'posto' => getenv('SICREDI_POSTO') ?: '86',
    'beneficiario' => getenv('SICREDI_BENEFICIARIO') ?: '04220',
    'conta' => getenv('SICREDI_CONTA') ?: '26102-1',
    'cnpj' => getenv('SICREDI_CNPJ') ?: '30988070000160',
    'razao_social' => 'ON AGENCIA DE EVENTOS LTDA'
];

if (!file_exists($configFile)) {
    file_put_contents($configFile, json_encode($defaultConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$config = json_decode(file_get_contents($configFile), true) ?: $defaultConfig;

function getSicrediBaseUrl($ambiente) {
    if ($ambiente === 'sandbox') {
        return [
            'auth' => 'https://api-parceiro.sicredi.com.br/sb/auth/openapi/token',
            'cobranca' => 'https://api-parceiro.sicredi.com.br/sb/cobranca/boleto/v1/boletos'
        ];
    }
    return [
        'auth' => 'https://api-parceiro.sicredi.com.br/auth/openapi/token',
        'cobranca' => 'https://api-parceiro.sicredi.com.br/cobranca/boleto/v1/boletos'
    ];
}

// Obter Access Token OAuth2 com cache automático
function obterAccessTokenSicredi($config, $tokenCacheFile, $forceRenew = false) {
    if (!$forceRenew && file_exists($tokenCacheFile)) {
        $cache = json_decode(file_get_contents($tokenCacheFile), true);
        if ($cache && !empty($cache['access_token']) && !empty($cache['expires_at'])) {
            if (time() < ($cache['expires_at'] - 60)) {
                return ['sucesso' => true, 'access_token' => $cache['access_token'], 'cached' => true];
            }
        }
    }

    if (empty($config['password'])) {
        return [
            'sucesso' => false,
            'erro' => 'Código de Acesso (Password) não preenchido.'
        ];
    }

    $urls = getSicrediBaseUrl($config['ambiente'] ?? 'producao');
    $authUrl = $urls['auth'];

    $postFields = http_build_query([
        'grant_type' => 'password',
        'username' => $config['username'],
        'password' => $config['password'],
        'scope' => 'cobranca'
    ]);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $authUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'x-api-key: ' . $config['x_api_key'],
            'context: COBRANCA'
        ],
        CURLOPT_TIMEOUT => 25,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['sucesso' => false, 'erro' => 'Falha de rede ao conectar no Sicredi: ' . $curlError];
    }

    $data = json_decode($response, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($data['access_token'])) {
        $expiresIn = intval($data['expires_in'] ?? 300);
        $cacheData = [
            'access_token' => $data['access_token'],
            'expires_at' => time() + $expiresIn,
            'created_at' => date('c')
        ];
        file_put_contents($tokenCacheFile, json_encode($cacheData, JSON_PRETTY_PRINT));
        return ['sucesso' => true, 'access_token' => $data['access_token'], 'cached' => false];
    }

    $msgErro = $data['error_description'] ?? $data['message'] ?? $data['error'] ?? 'Erro ao autenticar (HTTP ' . $httpCode . ')';
    return ['sucesso' => false, 'erro' => $msgErro, 'httpCode' => $httpCode, 'raw' => $data];
}

// Função auxiliar para registrar 1 parcela na API do Sicredi
function registrarParcelaSicrediApi($config, $accessToken, $vendaAlvo, $parcelaAlvo) {
    $urls = getSicrediBaseUrl($config['ambiente'] ?? 'producao');
    $cobrancaUrl = $urls['cobranca'];

    // Formatar data vencimento YYYY-MM-DD
    $vencimento = $parcelaAlvo['vencimento'] ?? date('Y-m-d', strtotime('+30 days'));
    if (strpos($vencimento, '/') !== false) {
        $partes = explode('/', $vencimento);
        if (count($partes) === 3) {
            $vencimento = "{$partes[2]}-{$partes[1]}-{$partes[0]}";
        }
    }

    // Se o vencimento for no passado, o Sicredi rejeita. Ajusta para a data de hoje:
    if ($vencimento < date('Y-m-d')) {
        $vencimento = date('Y-m-d');
    }

    $cpfNumeros = preg_replace('/\D/', '', $vendaAlvo['alunoCpf'] ?? '');
    $valorParcela = floatval($parcelaAlvo['valor'] ?? 0);
    $pNum = intval($parcelaAlvo['numero'] ?? 1);

    // Seu Número de no máximo 10 caracteres (ex: A090P01)
    $codigoCurto = preg_replace('/[^0-9A-Za-z]/', '', $vendaAlvo['codigoPedido'] ?? 'P');
    if (strlen($codigoCurto) > 6) {
        $codigoCurto = substr($codigoCurto, -6);
    }
    $seuNumero = substr("{$codigoCurto}P{$pNum}", 0, 10);

    $bodyBoleto = [
        'codigoBeneficiario' => $config['beneficiario'] ?? '04220',
        'tipoCobranca' => 'HIBRIDO', // Boleto com QR Code Pix
        'especieDocumento' => 'DUPLICATA_SERVICO_INDICACAO',
        'dataVencimento' => $vencimento,
        'valor' => $valorParcela,
        'seuNumero' => $seuNumero,
        'pagador' => [
            'tipoPessoa' => strlen($cpfNumeros) > 11 ? 'PESSOA_JURIDICA' : 'PESSOA_FISICA',
            'documento' => $cpfNumeros ?: '00000000000',
            'nome' => substr(strtoupper($vendaAlvo['alunoNome'] ?? 'FORMANDO ON EVENTOS'), 0, 40),
            'cep' => '01001000',
            'cidade' => 'SAO PAULO',
            'uf' => 'SP',
            'endereco' => 'CAMPUS FORMATURA'
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $cobrancaUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($bodyBoleto, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'x-api-key: ' . $config['x_api_key'],
            'cooperativa: ' . ($config['cooperativa'] ?? '0726'),
            'posto: ' . ($config['posto'] ?? '86')
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return ['sucesso' => false, 'erro' => 'Falha de rede ao registrar parcela #' . $pNum . ': ' . $err];
    }

    $data = json_decode($resp, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($data)) {
        return [
            'sucesso' => true,
            'dados' => $data,
            'linhaDigitavel' => $data['linhaDigitavel'] ?? '',
            'codigoBarras' => $data['codigoBarras'] ?? '',
            'qrCodePix' => $data['qrCode'] ?? '',
            'nossoNumero' => $data['nossoNumero'] ?? '',
            'txid' => $data['txid'] ?? ''
        ];
    }

    $msg = $data['message'] ?? $data['mensagem'] ?? $data['error'] ?? 'Erro Sicredi (HTTP ' . $httpCode . ')';
    return ['sucesso' => false, 'erro' => $msg, 'httpCode' => $httpCode, 'detalhes' => $data];
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true) ?: $_POST;
$action = $payload['action'] ?? $_GET['action'] ?? 'get_config';

// Todas as mutações bancárias e de configuração exigem CSRF estrito
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action !== 'get_config') {
    verify_csrf_token($payload['csrf_token'] ?? null);
}

// 1. Obter Configurações
if ($action === 'get_config') {
    $safeConfig = $config;
    if (!empty($safeConfig['password'])) {
        $len = strlen($safeConfig['password']);
        $safeConfig['password_masked'] = str_repeat('•', max(4, $len - 6)) . substr($safeConfig['password'], -6);
        $safeConfig['tem_password'] = true;
    } else {
        $safeConfig['password_masked'] = '';
        $safeConfig['tem_password'] = false;
    }
    unset($safeConfig['password']);

    echo json_encode(['sucesso' => true, 'config' => $safeConfig], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Salvar Configurações
if ($action === 'save_config') {
    if (isset($payload['password']) && trim($payload['password']) !== '') {
        $config['password'] = trim($payload['password']);
    }
    if (isset($payload['ambiente'])) {
        $config['ambiente'] = in_array($payload['ambiente'], ['producao', 'sandbox']) ? $payload['ambiente'] : 'producao';
    }
    if (!empty($payload['username'])) {
        $config['username'] = trim($payload['username']);
    }
    if (!empty($payload['x_api_key'])) {
        $config['x_api_key'] = trim($payload['x_api_key']);
    }

    file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if (file_exists($tokenCacheFile)) @unlink($tokenCacheFile);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Configurações da API Sicredi salvas com sucesso!',
        'tem_password' => !empty($config['password'])
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. Testar Conexão e Autenticação OAuth2
if ($action === 'test_connection') {
    $res = obterAccessTokenSicredi($config, $tokenCacheFile, true);
    if ($res['sucesso']) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Conexão com a API do Sicredi estabelecida com sucesso! Token OAuth2 ativo.',
            'cached' => $res['cached']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'sucesso' => false,
            'erro' => $res['erro'],
            'detalhes' => $res['raw'] ?? null
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// 4. Emitir e Registrar 1 Parcela específica
if ($action === 'emitir_parcela_api') {
    $vendaId = $payload['vendaId'] ?? '';
    $parcelaNumero = intval($payload['parcelaNumero'] ?? 0);

    $vendas = file_exists($vendasFile) ? json_decode(file_get_contents($vendasFile), true) : [];
    if (!is_array($vendas)) $vendas = [];

    $vendaIndex = -1;
    $vendaAlvo = null;
    foreach ($vendas as $i => $v) {
        if (($v['id'] ?? '') === $vendaId) {
            $vendaIndex = $i;
            $vendaAlvo = $v;
            break;
        }
    }

    if (!$vendaAlvo) {
        echo json_encode(['sucesso' => false, 'erro' => 'Venda de álbum não encontrada.'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $parcelaAlvo = null;
    $parcelaIndex = -1;
    if (!empty($vendaAlvo['parcelasBoletos']) && is_array($vendaAlvo['parcelasBoletos'])) {
        foreach ($vendaAlvo['parcelasBoletos'] as $pi => $p) {
            if (intval($p['numero'] ?? 0) === $parcelaNumero) {
                $parcelaAlvo = $p;
                $parcelaIndex = $pi;
                break;
            }
        }
    }

    if (!$parcelaAlvo) {
        echo json_encode(['sucesso' => false, 'erro' => 'Parcela #' . $parcelaNumero . ' não encontrada na venda.'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $tokenRes = obterAccessTokenSicredi($config, $tokenCacheFile);
    if (!$tokenRes['sucesso']) {
        echo json_encode(['sucesso' => false, 'erro' => $tokenRes['erro']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $regRes = registrarParcelaSicrediApi($config, $tokenRes['access_token'], $vendaAlvo, $parcelaAlvo);
    if ($regRes['sucesso']) {
        // Atualizar parcela no banco de dados local
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['linhaDigitavel'] = $regRes['linhaDigitavel'] ?: $parcelaAlvo['linhaDigitavel'];
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['codigoBarras'] = $regRes['codigoBarras'] ?: ($parcelaAlvo['codigoBarras'] ?? '');
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['codigoPix'] = $regRes['qrCodePix'] ?: ($parcelaAlvo['codigoPix'] ?? '');
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['nossoNumero'] = $regRes['nossoNumero'] ?: ($parcelaAlvo['nossoNumero'] ?? '');
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['txid'] = $regRes['txid'] ?: ($parcelaAlvo['txid'] ?? '');
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['registradoSicredi'] = true;
        $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex]['dataRegistroSicredi'] = date('d/m/Y H:i');

        file_put_contents($vendasFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Parcela #{$parcelaNumero} registrada com sucesso na API do Sicredi!",
            'parcelaAtualizada' => $vendas[$vendaIndex]['parcelasBoletos'][$parcelaIndex],
            'venda' => $vendas[$vendaIndex]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['sucesso' => false, 'erro' => $regRes['erro'], 'detalhes' => $regRes['detalhes'] ?? null], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. Emitir e Registrar TODAS as parcelas pendentes da venda de uma só vez!
if ($action === 'emitir_todas_parcelas_venda') {
    $vendaId = $payload['vendaId'] ?? '';
    $vendaPayload = $payload['venda'] ?? null;

    $vendas = file_exists($vendasFile) ? json_decode(file_get_contents($vendasFile), true) : [];
    if (!is_array($vendas)) $vendas = [];

    $vendaIndex = -1;
    $vendaAlvo = null;
    foreach ($vendas as $i => $v) {
        if (($v['id'] ?? '') === $vendaId) {
            $vendaIndex = $i;
            $vendaAlvo = $v;
            break;
        }
    }

    // Se ainda não estava gravado em disco mas foi enviado na requisição, insere imediatamente
    if (!$vendaAlvo && $vendaPayload && is_array($vendaPayload)) {
        $vendaAlvo = $vendaPayload;
        array_unshift($vendas, $vendaAlvo);
        $vendaIndex = 0;
    }

    if (!$vendaAlvo) {
        echo json_encode(['sucesso' => false, 'erro' => 'Venda de álbum não encontrada.'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $tokenRes = obterAccessTokenSicredi($config, $tokenCacheFile);
    if (!$tokenRes['sucesso']) {
        echo json_encode(['sucesso' => false, 'erro' => $tokenRes['erro']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $accessToken = $tokenRes['access_token'];
    $sucessos = 0;
    $erros = [];

    if (!empty($vendaAlvo['parcelasBoletos']) && is_array($vendaAlvo['parcelasBoletos'])) {
        foreach ($vendaAlvo['parcelasBoletos'] as $pi => $parcela) {
            // Se já estiver registrada e tiver linhaDigitavel do Sicredi, pode pular ou atualizar
            $regRes = registrarParcelaSicrediApi($config, $accessToken, $vendaAlvo, $parcela);
            if ($regRes['sucesso']) {
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['linhaDigitavel'] = $regRes['linhaDigitavel'] ?: $parcela['linhaDigitavel'];
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['codigoBarras'] = $regRes['codigoBarras'] ?: ($parcela['codigoBarras'] ?? '');
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['codigoPix'] = $regRes['qrCodePix'] ?: ($parcela['codigoPix'] ?? '');
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['nossoNumero'] = $regRes['nossoNumero'] ?: ($parcela['nossoNumero'] ?? '');
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['txid'] = $regRes['txid'] ?: ($parcela['txid'] ?? '');
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['registradoSicredi'] = true;
                $vendas[$vendaIndex]['parcelasBoletos'][$pi]['dataRegistroSicredi'] = date('d/m/Y H:i');
                $sucessos++;
            } else {
                $erros[] = "Parcela #{$parcela['numero']}: {$regRes['erro']}";
            }
        }
        file_put_contents($vendasFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    echo json_encode([
        'sucesso' => $sucessos > 0,
        'sucessos' => $sucessos,
        'erros' => $erros,
        'mensagem' => "{$sucessos} parcela(s) registrada(s) com sucesso na API do Sicredi!",
        'venda' => $vendas[$vendaIndex]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. Consultar e Sincronizar Baixas Automáticas no Sicredi
if ($action === 'sincronizar_baixas') {
    $vendas = file_exists($vendasFile) ? json_decode(file_get_contents($vendasFile), true) : [];
    if (!is_array($vendas)) $vendas = [];

    $tokenRes = obterAccessTokenSicredi($config, $tokenCacheFile);
    if (!$tokenRes['sucesso']) {
        echo json_encode(['sucesso' => false, 'erro' => $tokenRes['erro']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $accessToken = $tokenRes['access_token'];
    $urls = getSicrediBaseUrl($config['ambiente'] ?? 'producao');
    $cobrancaUrl = $urls['cobranca'];
    $beneficiario = $config['beneficiario'] ?? '04220';

    $baixasEfetuadas = 0;
    $modificado = false;

    foreach ($vendas as $vi => $venda) {
        if (!empty($venda['parcelasBoletos']) && is_array($venda['parcelasBoletos'])) {
            foreach ($venda['parcelasBoletos'] as $pi => $parcela) {
                // Checar apenas parcelas que têm nossoNumero e ainda estão PENDENTE
                if (($parcela['status'] ?? 'PENDENTE') === 'PENDENTE' && !empty($parcela['nossoNumero'])) {
                    $nossoNumero = $parcela['nossoNumero'];
                    $consultaUrl = "{$cobrancaUrl}?codigoBeneficiario={$beneficiario}&nossoNumero={$nossoNumero}";

                    $ch = curl_init();
                    curl_setopt_array($ch, [
                        CURLOPT_URL => $consultaUrl,
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_HTTPHEADER => [
                            'Content-Type: application/json',
                            'Authorization: Bearer ' . $accessToken,
                            'x-api-key: ' . $config['x_api_key'],
                            'cooperativa: ' . ($config['cooperativa'] ?? '0726'),
                            'posto: ' . ($config['posto'] ?? '86')
                        ],
                        CURLOPT_TIMEOUT => 15,
                        CURLOPT_SSL_VERIFYPEER => true
                    ]);

                    $resp = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);

                    if ($httpCode >= 200 && $httpCode < 300) {
                        $dadosBoleto = json_decode($resp, true);
                        $item = (is_array($dadosBoleto) && isset($dadosBoleto[0])) ? $dadosBoleto[0] : $dadosBoleto;
                        $situacao = strtoupper(trim($item['situacao'] ?? ''));
                        // Situações que indicam pagamento/liquidação:
                        if (
                            strpos($situacao, 'LIQUIDADO') !== false ||
                            strpos($situacao, 'PAGO') !== false ||
                            strpos($situacao, 'BAIXADO') !== false
                        ) {
                            $vendas[$vi]['parcelasBoletos'][$pi]['status'] = 'PAGO';
                            $vendas[$vi]['parcelasBoletos'][$pi]['dataPagamento'] = $item['dataLiquidacao'] ?? $item['dataPagamento'] ?? date('d/m/Y H:i');
                            $vendas[$vi]['parcelasBoletos'][$pi]['situacaoSicredi'] = $situacao;
                            $baixasEfetuadas++;
                            $modificado = true;
                        }
                    }
                }
            }
        }
    }

    if ($modificado) {
        file_put_contents($vendasFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    echo json_encode([
        'sucesso' => true,
        'baixasEfetuadas' => $baixasEfetuadas,
        'mensagem' => $baixasEfetuadas > 0 ? "{$baixasEfetuadas} parcela(s) baixada(s) automaticamente pelo Sicredi!" : 'Todas as parcelas estão atualizadas.',
        'vendas' => $vendas
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['sucesso' => false, 'erro' => 'Ação inválida.'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
