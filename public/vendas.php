<?php
// API Centralizada de Vendas de Álbuns & Boletos Sicredi ON Eventos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/vendas_albuns_db.json';

function getVendasBase() {
    return [
        [
            'id' => 'venda-001',
            'codigoPedido' => 'ALB-2026-001',
            'dataVenda' => '2026-10-14',
            'alunoNome' => 'Gabriel Santos Souza',
            'alunoCpf' => '123.456.789-00',
            'alunoTelefone' => '(11) 98765-4321',
            'alunoEmail' => 'gabriel.souza@mackenzie.br',
            'instituicaoNome' => 'Universidade Presbiteriana Mackenzie',
            'periodo' => '2027.1',
            'turmaNome' => 'Direito Mackenzie 2027.1',
            'modeloAlbum' => 'Album premium',
            'valorAlbum' => 3800,
            'brindes' => [
                ['id' => 'b1', 'nome' => 'Quadro 30x60', 'descricao' => 'Moldura caixa alta com foto solene', 'selecionado' => true, 'valorAdicional' => 0],
                ['id' => 'b3', 'nome' => 'Link de fotos', 'descricao' => 'Acesso vitalício à galeria digital em 4K', 'selecionado' => true, 'valorAdicional' => 0]
            ],
            'valorTotalBrindes' => 0,
            'valorTotalKit' => 3800,
            'formaPagamento' => 'BOLETO',
            'boletoQtdParcelas' => 6,
            'statusProducao' => 'EM_DIAGRAMACAO',
            'responsavelNome' => 'Raphaela Rodrigues',
            'responsavelEmail' => 'raphaela@onagenciadeeventos.com.br',
            'prazoLayout' => '2026-10-23',
            'prazoProducao' => '2026-10-23',
            'observacoes' => 'Fotos com a comissão de formatura nas páginas iniciais.',
            'parcelasBoletos' => [
                ['numero' => 1, 'vencimento' => '2026-11-15', 'valor' => 633.35, 'status' => 'PENDENTE', 'linhaDigitavel' => '74891.12628 00001.207261 86042.201083 1 1063200000063335', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406633.355802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***6304ABCD'],
                ['numero' => 2, 'vencimento' => '2026-12-15', 'valor' => 633.33, 'status' => 'PENDENTE', 'linhaDigitavel' => '74891.12628 00002.207261 86042.201083 1 1066200000063333', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406633.335802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***6304EF01'],
                ['numero' => 3, 'vencimento' => '2027-01-15', 'valor' => 633.33, 'status' => 'PENDENTE', 'linhaDigitavel' => '74891.12628 00003.207261 86042.201083 1 1069300000063333', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406633.335802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***63042345'],
                ['numero' => 4, 'vencimento' => '2027-02-15', 'valor' => 633.33, 'status' => 'PENDENTE', 'linhaDigitavel' => '74891.12628 00004.207261 86042.201083 1 1072400000063333', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406633.335802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***63046789'],
                ['numero' => 5, 'vencimento' => '2027-03-15', 'valor' => 633.33, 'status' => 'PENDENTE', 'linhaDigitavel' => '74891.12628 00005.207261 86042.201083 1 1075200000063333', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406633.335802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***63049876'],
                ['numero' => 6, 'vencimento' => '2027-04-15', 'valor' => 633.33, 'status' => 'PENDENTE', 'linhaDigitavel' => '74891.12628 00006.207261 86042.201083 1 1078300000063333', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406633.335802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***63045432']
            ]
        ],
        [
            'id' => 'venda-002',
            'codigoPedido' => 'ALB-2026-002',
            'dataVenda' => '2026-10-15',
            'alunoNome' => 'Amanda Oliveira Lima',
            'alunoCpf' => '987.654.321-11',
            'alunoTelefone' => '(11) 91234-5678',
            'alunoEmail' => 'amanda.lima@usp.br',
            'instituicaoNome' => 'Universidade de São Paulo (USP)',
            'periodo' => '2026.2',
            'turmaNome' => 'Medicina USP 2026.2',
            'modeloAlbum' => 'Album Slim',
            'valorAlbum' => 3000,
            'brindes' => [
                ['id' => 'b1', 'nome' => 'Quadro 30x60', 'descricao' => 'Moldura caixa alta com foto solene', 'selecionado' => true, 'valorAdicional' => 0]
            ],
            'valorTotalBrindes' => 0,
            'valorTotalKit' => 3000,
            'formaPagamento' => 'PIX',
            'statusProducao' => 'APROVACAO_CLIENTE',
            'responsavelNome' => 'Raphaela Rodrigues',
            'responsavelEmail' => 'raphaela@onagenciadeeventos.com.br',
            'prazoAprovacaoCliente' => '2026-10-25',
            'prazoProducao' => '2026-10-25',
            'observacoes' => 'Pagamento à vista realizado via PIX com desconto promocional.'
        ],
        [
            'id' => 'venda-003',
            'codigoPedido' => 'ALB-2026-003',
            'dataVenda' => '2026-10-15',
            'alunoNome' => 'Leonardo Castro Ferreira',
            'alunoCpf' => '456.789.123-22',
            'alunoTelefone' => '(11) 97777-8888',
            'alunoEmail' => 'leonardo.castro@fgv.br',
            'instituicaoNome' => 'Fundação Getulio Vargas (FGV)',
            'periodo' => '2026.1',
            'turmaNome' => 'Administração FGV 2026.1',
            'modeloAlbum' => 'Album Colégio',
            'valorAlbum' => 520,
            'brindes' => [
                ['id' => 'b3', 'nome' => 'Link de fotos', 'descricao' => 'Acesso vitalício à galeria digital em 4K', 'selecionado' => true, 'valorAdicional' => 0]
            ],
            'valorTotalBrindes' => 0,
            'valorTotalKit' => 520,
            'formaPagamento' => 'BOLETO',
            'boletoQtdParcelas' => 2,
            'statusProducao' => 'ENTREGUE',
            'responsavelNome' => 'Thiago Original',
            'responsavelEmail' => 'thiago@onagenciadeeventos.com.br',
            'prazoProducao' => '2026-10-10',
            'concluidoEm' => '10/10/2026',
            'observacoes' => 'Álbum entregue em mãos na agência.',
            'parcelasBoletos' => [
                ['numero' => 1, 'vencimento' => '2026-10-10', 'valor' => 260.00, 'status' => 'PAGO', 'linhaDigitavel' => '74891.12628 00007.207261 86042.201083 1 1060200000026000', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406260.005802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***63047890'],
                ['numero' => 2, 'vencimento' => '2026-11-10', 'valor' => 260.00, 'status' => 'PAGO', 'linhaDigitavel' => '74891.12628 00008.207261 86042.201083 1 1063100000026000', 'codigoPix' => '00020126580014BR.GOV.BCB.PIX0136banco-sicredi-pix-homolog-1235204000053039865406260.005802BR5916ON AGENCIA EVENT6009SAO PAULO62070503***63041234']
            ]
        ]
    ];
}

// Inicializa banco de dados centralizado se não existir
if (!file_exists($dataFile)) {
    $base = getVendasBase();
    file_put_contents($dataFile, json_encode($base, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$vendas = json_decode($content, true);
if (!is_array($vendas)) {
    $vendas = getVendasBase();
    file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    if ($action === 'save' && isset($payload['vendas']) && is_array($payload['vendas'])) {
        $vendas = array_values($payload['vendas']);
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'total' => count($vendas), 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'add' && !empty($payload['venda'])) {
        array_unshift($vendas, $payload['venda']);
        file_put_contents($dataFile, json_encode($vendas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'vendas' => $vendas], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode(array_values($vendas), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
