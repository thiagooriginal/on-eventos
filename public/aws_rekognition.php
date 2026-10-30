<?php
/**
 * AWS Rekognition Facial AI Gateway - ON Eventos
 * Reconhecimento Facial e Separação Inteligente de Fotos por Rosto
 */

require_once __DIR__ . '/auth_guard.php';
require_auth(['ADMIN', 'EQUIPE_INTERNA']);

ini_set('memory_limit', '512M');
ini_set('max_execution_time', '300');

$configFile = get_secure_storage_path('aws_rekognition_config.json');

function carregarConfigAws($arquivo) {
    if (file_exists($arquivo)) {
        $conteudo = file_get_contents($arquivo);
        $dados = json_decode($conteudo, true);
        if (is_array($dados)) {
            return $dados;
        }
    }
    return [
        'ativo' => false,
        'aws_access_key_id' => '',
        'aws_secret_access_key' => '',
        'aws_region' => 'us-east-1',
        'limiar_similaridade' => 80
    ];
}

function salvarConfigAws($arquivo, $dados) {
    return file_put_contents($arquivo, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Assinatura AWS Signature Version 4 (SigV4) nativa em PHP puro
function chamarAwsRekognition($target, $payload, $config) {
    $accessKey = trim($config['aws_access_key_id'] ?? '');
    $secretKey = trim($config['aws_secret_access_key'] ?? '');
    $region = trim($config['aws_region'] ?? 'us-east-1');
    if (empty($region)) $region = 'us-east-1';

    if (empty($accessKey) || empty($secretKey)) {
        return [
            'sucesso' => false,
            'erro' => 'Credenciais da AWS Rekognition não configuradas. Adicione o Access Key e o Secret Key.'
        ];
    }

    $host = "rekognition.{$region}.amazonaws.com";
    $endpoint = "https://{$host}/";
    $service = "rekognition";

    $amzDate = gmdate('Ymd\THis\Z');
    $dateStamp = gmdate('Ymd');

    $requestPayload = json_encode($payload);
    $payloadHash = hash('sha256', $requestPayload);

    $canonicalUri = '/';
    $canonicalQueryString = '';
    $canonicalHeaders = "content-type:application/x-amz-json-1.1\n" .
                        "host:{$host}\n" .
                        "x-amz-date:{$amzDate}\n" .
                        "x-amz-target:{$target}\n";
    $signedHeaders = "content-type;host;x-amz-date;x-amz-target";

    $canonicalRequest = "POST\n" .
                        "{$canonicalUri}\n" .
                        "{$canonicalQueryString}\n" .
                        "{$canonicalHeaders}\n" .
                        "{$signedHeaders}\n" .
                        "{$payloadHash}";

    $algorithm = "AWS4-HMAC-SHA256";
    $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";
    $stringToSign = "{$algorithm}\n" .
                    "{$amzDate}\n" .
                    "{$credentialScope}\n" .
                    hash('sha256', $canonicalRequest);

    // Derivação da chave de assinatura
    $kSecret = 'AWS4' . $secretKey;
    $kDate = hash_hmac('sha256', $dateStamp, $kSecret, true);
    $kRegion = hash_hmac('sha256', $region, $kDate, true);
    $kService = hash_hmac('sha256', $service, $kRegion, true);
    $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
    $signature = hash_hmac('sha256', $stringToSign, $kSigning);

    $authorizationHeader = "{$algorithm} Credential={$accessKey}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";

    $headers = [
        "Content-Type: application/x-amz-json-1.1",
        "Host: {$host}",
        "X-Amz-Date: {$amzDate}",
        "X-Amz-Target: {$target}",
        "Authorization: {$authorizationHeader}"
    ];

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestPayload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['sucesso' => false, 'erro' => 'Falha de conexão com a AWS: ' . $curlError];
    }

    $decoded = json_decode($response, true);
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['sucesso' => true, 'dados' => $decoded];
    } else {
        $msg = $decoded['Message'] ?? ($decoded['message'] ?? 'Erro retornado pela AWS (HTTP ' . $httpCode . ')');
        return [
            'sucesso' => false,
            'erro' => $msg,
            'httpCode' => $httpCode,
            'respostaBruta' => $decoded
        ];
    }
}

function limparBase64($string) {
    if (strpos($string, ';base64,') !== false) {
        $partes = explode(';base64,', $string);
        return trim($partes[1]);
    }
    return trim($string);
}

// Leitura do payload recebido
$metodo = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents('php://input');
$dadosRequisicao = json_decode($body, true) ?? [];
$action = $_GET['action'] ?? ($dadosRequisicao['action'] ?? 'obter_config');

$configAtual = carregarConfigAws($configFile);

// =========================================================================
// ROTA 1: Obter Configurações Atuais
// =========================================================================
if ($action === 'obter_config') {
    $chave = $configAtual['aws_access_key_id'] ?? '';
    $chaveMascarada = '';
    if (!empty($chave)) {
        $tam = strlen($chave);
        $chaveMascarada = substr($chave, 0, 4) . str_repeat('*', max(0, $tam - 8)) . substr($chave, -4);
    }

    echo json_encode([
        'sucesso' => true,
        'configurado' => !empty($configAtual['aws_access_key_id']) && !empty($configAtual['aws_secret_access_key']),
        'ativo' => $configAtual['ativo'] ?? false,
        'aws_access_key_id_mascarada' => $chaveMascarada,
        'aws_region' => $configAtual['aws_region'] ?? 'us-east-1',
        'limiar_similaridade' => $configAtual['limiar_similaridade'] ?? 80
    ]);
    exit;
}

// =========================================================================
// ROTA 2: Salvar Configurações
// =========================================================================
if ($action === 'salvar_config') {
    require_auth(['ADMIN']);
    verify_csrf_token($dadosRequisicao['csrf_token'] ?? null);
    $novaKey = trim($dadosRequisicao['aws_access_key_id'] ?? '');
    $novoSecret = trim($dadosRequisicao['aws_secret_access_key'] ?? '');
    $novaRegiao = trim($dadosRequisicao['aws_region'] ?? 'us-east-1');
    $novoLimiar = floatval($dadosRequisicao['limiar_similaridade'] ?? 80);

    // Se o usuário não redigitá-lo, mantém o anterior
    if (empty($novaKey)) {
        $novaKey = $configAtual['aws_access_key_id'] ?? '';
    }
    if (empty($novoSecret)) {
        $novoSecret = $configAtual['aws_secret_access_key'] ?? '';
    }

    $novaConfig = [
        'ativo' => true,
        'aws_access_key_id' => $novaKey,
        'aws_secret_access_key' => $novoSecret,
        'aws_region' => $novaRegiao ?: 'us-east-1',
        'limiar_similaridade' => $novoLimiar > 0 ? $novoLimiar : 80
    ];

    if (salvarConfigAws($configFile, $novaConfig)) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Configurações da AWS Rekognition salvas com sucesso!'
        ]);
    } else {
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Não foi possível gravar o arquivo de configurações no servidor.'
        ]);
    }
    exit;
}

// =========================================================================
// ROTA 3: Testar Conexão com a AWS Rekognition
// =========================================================================
if ($action === 'testar_conexao') {
    // Chamada leve para listar coleções (valida se o par de chaves e região são autênticos)
    $res = chamarAwsRekognition('RekognitionService.ListCollections', ['MaxResults' => 1], $configAtual);

    if ($res['sucesso']) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Conexão estabelecida com sucesso com a AWS Rekognition! O serviço está pronto para uso.',
            'regiao' => $configAtual['aws_region'] ?? 'us-east-1'
        ]);
    } else {
        echo json_encode([
            'sucesso' => false,
            'erro' => $res['erro'] ?? 'Falha ao autenticar com a AWS Rekognition.'
        ]);
    }
    exit;
}

// =========================================================================
// ROTA 4: Comparar Rosto (Selfie de Referência vs Lote de Fotos do Evento)
// =========================================================================
if ($action === 'comparar_rosto') {
    $inicioTempo = microtime(true);

    $fotoReferencia = $dadosRequisicao['fotoReferencia'] ?? '';
    $fotosLote = $dadosRequisicao['fotosLote'] ?? [];
    $limiar = floatval($dadosRequisicao['limiarSimilaridade'] ?? ($configAtual['limiar_similaridade'] ?? 80));

    if (empty($fotoReferencia)) {
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Foto de referência (rosto do formando) não fornecida.'
        ]);
        exit;
    }

    if (empty($fotosLote) || !is_array($fotosLote)) {
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Nenhuma foto do evento foi enviada para análise.'
        ]);
        exit;
    }

    $refBase64 = limparBase64($fotoReferencia);

    $resultados = [];
    $totalEncontradas = 0;
    $erros = [];

    foreach ($fotosLote as $itemFoto) {
        $idFoto = $itemFoto['id'] ?? uniqid('foto_');
        $nomeFoto = $itemFoto['nome'] ?? 'Foto';
        $alvoBase64 = limparBase64($itemFoto['base64'] ?? '');

        if (empty($alvoBase64)) {
            $resultados[] = [
                'id' => $idFoto,
                'nome' => $nomeFoto,
                'encontrado' => false,
                'erro' => 'Imagem vazia ou inválida.'
            ];
            continue;
        }

        $payload = [
            'SourceImage' => [
                'Bytes' => $refBase64
            ],
            'TargetImage' => [
                'Bytes' => $alvoBase64
            ],
            'SimilarityThreshold' => $limiar
        ];

        $resAws = chamarAwsRekognition('RekognitionService.CompareFaces', $payload, $configAtual);

        if (!$resAws['sucesso']) {
            $resultados[] = [
                'id' => $idFoto,
                'nome' => $nomeFoto,
                'encontrado' => false,
                'erro' => $resAws['erro']
            ];
            $erros[] = "{$nomeFoto}: " . $resAws['erro'];
            continue;
        }

        $matches = $resAws['dados']['FaceMatches'] ?? [];
        $temMatch = count($matches) > 0;

        $melhorSimilaridade = 0;
        $boundingBox = null;

        if ($temMatch) {
            $totalEncontradas++;
            // Pega o match com maior similaridade
            foreach ($matches as $match) {
                $sim = floatval($match['Similarity'] ?? 0);
                if ($sim > $melhorSimilaridade) {
                    $melhorSimilaridade = $sim;
                    $boundingBox = $match['Face']['BoundingBox'] ?? null;
                }
            }
        }

        $resultados[] = [
            'id' => $idFoto,
            'nome' => $nomeFoto,
            'encontrado' => $temMatch,
            'similaridade' => round($melhorSimilaridade, 1),
            'boundingBox' => $boundingBox,
            'totalRostosNaFoto' => count($resAws['dados']['UnmatchedFaces'] ?? []) + count($matches)
        ];
    }

    $tempoTotalSegundos = round(microtime(true) - $inicioTempo, 2);

    echo json_encode([
        'sucesso' => true,
        'totalAnalisadas' => count($fotosLote),
        'totalEncontradas' => $totalEncontradas,
        'tempoTotalSegundos' => $tempoTotalSegundos,
        'limiarUtilizado' => $limiar,
        'resultados' => $resultados,
        'erros' => $erros
    ]);
    exit;
}

echo json_encode([
    'sucesso' => false,
    'erro' => "Ação desconhecida: {$action}"
]);
