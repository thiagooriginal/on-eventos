<?php
// API Centralizada de Telemetria do Site Oficial ON Eventos
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';

$dataFile = get_secure_storage_path('telemetria_db.json');

function getEstruturaZerada() {
    return [
        'totalVisitantes' => 0,
        'visitantesUnicos' => 0,
        'visitasHoje' => 0,
        'visitantesAtivosAgora' => 1,
        'tempoMedioSegundos' => 0,
        'totalCliques' => 0,
        'taxaCliquesPorSessao' => 0,
        'dispositivos' => ['mobile' => 0, 'desktop' => 0, 'tablet' => 0],
        'origensTrafego' => [
            ['origem' => 'Instagram (@onagenciadeeventos)', 'porcentagem' => 0, 'visitas' => 0],
            ['origem' => 'Google / Busca Orgânica', 'porcentagem' => 0, 'visitas' => 0],
            ['origem' => 'WhatsApp Direto', 'porcentagem' => 0, 'visitas' => 0],
            ['origem' => 'Indicação de Comissões', 'porcentagem' => 0, 'visitas' => 0],
            ['origem' => 'Acesso Direto ao Site', 'porcentagem' => 0, 'visitas' => 0],
        ],
        'heatmaps' => [
            ['id' => 'btn-orcamento-hero', 'nome' => 'Botão "Solicitar Orçamento Oficial" (Hero)', 'secao' => 'Topo / Hero Principal', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-whatsapp-flutuante', 'nome' => 'Botão Flutuante "Falar no WhatsApp"', 'secao' => 'Flutuante Global', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-menu-fotos', 'nome' => 'Card / Menu "Venda de Álbuns de Formatura"', 'secao' => 'Módulos & Fotografia', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-video-aftermovie', 'nome' => 'Assistir Vídeo "Aftermovie Baile de Gala"', 'secao' => 'Galeria Audiovisual', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-galeria-cenografia', 'nome' => 'Ver Fotos de Cenografia & Espaços', 'secao' => 'Portfólio de Eventos', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-portal-aluno', 'nome' => 'Acesso ao Portal do Aluno / Boletos', 'secao' => 'Área Restrita do Formando', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-simulador-planos', 'nome' => 'Simulador de Planos e Parcelamento', 'secao' => 'Planos & Custos', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-depoimentos-comissoes', 'nome' => 'Depoimentos de Comissões de Formatura', 'secao' => 'Depoimentos Reais', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
            ['id' => 'btn-outros-cliques', 'nome' => 'Outros Links, Redes Sociais e Menus', 'secao' => 'Navegação Diversa', 'cliques' => 0, 'porcentagem' => 0, 'taxaConversao' => '0%'],
        ],
        'ultimosCliques' => [],
        'historicoDias' => [],
        'criadoEm' => date('Y-m-d H:i:s'),
        'atualizadoEm' => date('Y-m-d H:i:s')
    ];
}

$action = $_GET['action'] ?? '';

// Comando de reset total no servidor (Exclusivo ADMIN)
if ($action === 'reset') {
    require_auth(['ADMIN']);
    verify_csrf_token($_GET['csrf_token'] ?? $_POST['csrf_token'] ?? null);
    $limpo = getEstruturaZerada();
    file_put_contents($dataFile, json_encode($limpo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['sucesso' => true, 'mensagem' => 'Métricas zeradas no servidor']);
    exit;
}

if (!file_exists($dataFile)) {
    $limpo = getEstruturaZerada();
    file_put_contents($dataFile, json_encode($limpo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dataFile);
$data = json_decode($content, true) ?: getEstruturaZerada();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $tipo = $payload['tipo'] ?? 'view';

    if ($tipo === 'view') {
        $data['totalVisitantes'] = ($data['totalVisitantes'] ?? 0) + 1;
        $data['visitasHoje'] = ($data['visitasHoje'] ?? 0) + 1;
        if (!empty($payload['isUnique'])) {
            $data['visitantesUnicos'] = ($data['visitantesUnicos'] ?? 0) + 1;
        }
        $disp = $payload['dispositivo'] ?? 'desktop';
        if (strpos(strtolower($disp), 'mobile') !== false) {
            $data['dispositivos']['mobile'] = ($data['dispositivos']['mobile'] ?? 0) + 1;
        } elseif (strpos(strtolower($disp), 'tablet') !== false) {
            $data['dispositivos']['tablet'] = ($data['dispositivos']['tablet'] ?? 0) + 1;
        } else {
            $data['dispositivos']['desktop'] = ($data['dispositivos']['desktop'] ?? 0) + 1;
        }

        $tempo = intval($payload['tempoNaPagina'] ?? 0);
        if ($tempo > 3) {
            $data['tempoMedioSegundos'] = round(($data['tempoMedioSegundos'] ?? 0) * 0.9 + $tempo * 0.1);
        }
    } elseif ($tipo === 'click') {
        $data['totalCliques'] = ($data['totalCliques'] ?? 0) + 1;
        $clickData = [
            'id' => 'clk-' . time() . '-' . rand(100, 999),
            'elemento' => substr($payload['elemento'] ?? 'Clique', 0, 50),
            'categoria' => $payload['categoria'] ?? 'Geral',
            'secao' => $payload['secao'] ?? 'Site',
            'pagina' => $payload['pagina'] ?? '/',
            'timestamp' => date('c'),
            'tempoNaPagina' => intval($payload['tempoNaPagina'] ?? 0),
            'dispositivo' => $payload['dispositivo'] ?? 'Mobile',
            'cidade' => $payload['cidade'] ?? 'Visitante Online',
        ];
        array_unshift($data['ultimosCliques'], $clickData);
        $data['ultimosCliques'] = array_slice($data['ultimosCliques'], 0, 40);

        // Identifica no heatmap
        $el = mb_strtolower($clickData['elemento']);
        $idx = count($data['heatmaps']) - 1;
        foreach ($data['heatmaps'] as $i => $hm) {
            if (mb_strpos($el, mb_strtolower(substr($hm['nome'], 0, 14))) !== false) {
                $idx = $i;
                break;
            }
        }
        $data['heatmaps'][$idx]['cliques']++;
        $totalCliquesHeat = array_sum(array_column($data['heatmaps'], 'cliques'));
        if ($totalCliquesHeat > 0) {
            foreach ($data['heatmaps'] as &$hm) {
                $hm['porcentagem'] = round(($hm['cliques'] / $totalCliquesHeat) * 100, 1);
            }
        }
    }

    $data['atualizadoEm'] = date('Y-m-d H:i:s');
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['sucesso' => true]);
    exit;
}

echo json_encode($data);
