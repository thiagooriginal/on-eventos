<?php
// API Centralizada de Instituições e Cursos - ON Agência de Eventos
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/auth_guard.php';
require_auth(['ADMIN', 'EQUIPE_INTERNA', 'BASICO']);

$dataFile = get_secure_storage_path('instituicoes_db.json');

function getDadosBase() {
    return [
        'instituicoes' => [
            [
                'id' => 'inst-1',
                'nome' => 'Universidade Anhembi Morumbi',
                'sigla' => 'UAM',
                'tipo' => 'UNIVERSIDADE',
                'campus' => 'Vila Olímpia / Paulista',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'endereco' => 'R. Casa do Ator, 275 - Vila Olímpia',
                'contatoResponsavel' => 'Coordenação de Eventos & Alunos',
                'telefone' => '(11) 3847-3000',
                'whatsapp' => '(11) 98765-4321',
                'email' => 'eventos@anhembi.br',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-10T10:00:00.000Z',
                'cor' => 'from-purple-600 to-indigo-600',
            ],
            [
                'id' => 'inst-2',
                'nome' => 'Universidade Presbiteriana Mackenzie',
                'sigla' => 'MACK',
                'tipo' => 'UNIVERSIDADE',
                'campus' => 'Higienópolis (Campus Central)',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'endereco' => 'R. da Consolação, 930 - Higienópolis',
                'contatoResponsavel' => 'Diretório Acadêmico & Reitoria',
                'telefone' => '(11) 2114-8000',
                'whatsapp' => '(11) 97654-3210',
                'email' => 'comissoes@mackenzie.br',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-12T11:00:00.000Z',
                'cor' => 'from-rose-600 to-red-600',
            ],
            [
                'id' => 'inst-3',
                'nome' => 'Pontifícia Universidade Católica de SP',
                'sigla' => 'PUC-SP',
                'tipo' => 'UNIVERSIDADE',
                'campus' => 'Perdizes / Monte Alegre',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'endereco' => 'R. Monte Alegre, 984 - Perdizes',
                'contatoResponsavel' => 'Comissão Central de Formaturas',
                'telefone' => '(11) 3670-8000',
                'whatsapp' => '(11) 96543-2109',
                'email' => 'formatura@pucsp.br',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-15T09:30:00.000Z',
                'cor' => 'from-blue-600 to-indigo-700',
            ],
            [
                'id' => 'inst-4',
                'nome' => 'FMU - Centro Universitário',
                'sigla' => 'FMU',
                'tipo' => 'CENTRO_UNIVERSITARIO',
                'campus' => 'Liberdade / Brigadeiro',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'endereco' => 'Av. Liberdade, 899 - Liberdade',
                'contatoResponsavel' => 'Secretaria Geral de Cursos',
                'telefone' => '(11) 3132-3000',
                'whatsapp' => '(11) 95432-1098',
                'email' => 'eventos@fmu.br',
                'status' => 'ATIVO',
                'criadoEm' => '2026-02-01T14:00:00.000Z',
                'cor' => 'from-teal-600 to-emerald-600',
            ],
            [
                'id' => 'inst-5',
                'nome' => 'Colégio e Curso Bandeirantes',
                'sigla' => 'BANDEIRANTES',
                'tipo' => 'COLEGIO',
                'campus' => 'Unidade Paraíso',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'endereco' => 'R. Estela, 268 - Vila Mariana',
                'contatoResponsavel' => 'Orientação Educacional Ensino Médio',
                'telefone' => '(11) 5087-3500',
                'whatsapp' => '(11) 94321-0987',
                'email' => 'terceirao@colband.com.br',
                'status' => 'ATIVO',
                'criadoEm' => '2026-02-15T16:00:00.000Z',
                'cor' => 'from-amber-500 to-orange-600',
            ],
            [
                'id' => 'inst-6',
                'nome' => 'Universidade de São Paulo',
                'sigla' => 'USP',
                'tipo' => 'UNIVERSIDADE',
                'campus' => 'Cidade Universitária - Butantã',
                'cidade' => 'São Paulo',
                'uf' => 'SP',
                'endereco' => 'Av. Prof. Luciano Gualberto, Butantã',
                'contatoResponsavel' => 'Centro Acadêmico Oswaldo Cruz',
                'telefone' => '(11) 3091-3000',
                'whatsapp' => '(11) 93210-9876',
                'email' => 'comissao@usp.br',
                'status' => 'PROSPECCAO',
                'criadoEm' => '2026-02-20T08:00:00.000Z',
                'cor' => 'from-amber-600 to-yellow-500',
            ]
        ],
        'cursos' => [
            [
                'id' => 'cur-1',
                'instituicaoId' => 'inst-1',
                'instituicaoNome' => 'Universidade Anhembi Morumbi',
                'instituicaoSigla' => 'UAM',
                'nome' => 'Medicina',
                'grau' => 'BACHARELADO',
                'area' => 'SAUDE',
                'periodo' => 'INTEGRAL',
                'turmasAtivas' => ['2026.1', '2026.2', '2027.1'],
                'estimativaAlunos' => 95,
                'coordenador' => 'Dra. Camila Vasconcelos',
                'contato' => '(11) 98111-2233',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-10T10:30:00.000Z',
            ],
            [
                'id' => 'cur-2',
                'instituicaoId' => 'inst-1',
                'instituicaoNome' => 'Universidade Anhembi Morumbi',
                'instituicaoSigla' => 'UAM',
                'nome' => 'Direito',
                'grau' => 'BACHARELADO',
                'area' => 'HUMANAS',
                'periodo' => 'NOTURNO',
                'turmasAtivas' => ['2026.2'],
                'estimativaAlunos' => 75,
                'coordenador' => 'Dr. Roberto Silveira',
                'contato' => '(11) 98222-3344',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-10T11:00:00.000Z',
            ],
            [
                'id' => 'cur-3',
                'instituicaoId' => 'inst-1',
                'instituicaoNome' => 'Universidade Anhembi Morumbi',
                'instituicaoSigla' => 'UAM',
                'nome' => 'Enfermagem & Fisioterapia',
                'grau' => 'BACHARELADO',
                'area' => 'SAUDE',
                'periodo' => 'MATUTINO',
                'turmasAtivas' => ['2026.1', '2026.2'],
                'estimativaAlunos' => 60,
                'coordenador' => 'Profª. Renata Alencar',
                'contato' => '(11) 98333-4455',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-10T11:30:00.000Z',
            ],
            [
                'id' => 'cur-4',
                'instituicaoId' => 'inst-2',
                'instituicaoNome' => 'Universidade Presbiteriana Mackenzie',
                'instituicaoSigla' => 'MACK',
                'nome' => 'Direito',
                'grau' => 'BACHARELADO',
                'area' => 'HUMANAS',
                'periodo' => 'MATUTINO',
                'turmasAtivas' => ['2026.2', '2027.1'],
                'estimativaAlunos' => 140,
                'coordenador' => 'Dr. Fernando Paes de Barros',
                'contato' => '(11) 98444-5566',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-12T11:30:00.000Z',
            ],
            [
                'id' => 'cur-5',
                'instituicaoId' => 'inst-2',
                'instituicaoNome' => 'Universidade Presbiteriana Mackenzie',
                'instituicaoSigla' => 'MACK',
                'nome' => 'Arquitetura e Urbanismo',
                'grau' => 'BACHARELADO',
                'area' => 'EXATAS',
                'periodo' => 'INTEGRAL',
                'turmasAtivas' => ['2026.2'],
                'estimativaAlunos' => 80,
                'coordenador' => 'Prof. Lucas Mendonça',
                'contato' => '(11) 98555-6677',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-12T12:00:00.000Z',
            ],
            [
                'id' => 'cur-6',
                'instituicaoId' => 'inst-2',
                'instituicaoNome' => 'Universidade Presbiteriana Mackenzie',
                'instituicaoSigla' => 'MACK',
                'nome' => 'Administração de Empresas',
                'grau' => 'BACHARELADO',
                'area' => 'NEGOCIOS',
                'periodo' => 'NOTURNO',
                'turmasAtivas' => ['2026.1'],
                'estimativaAlunos' => 90,
                'coordenador' => 'Prof. Marcelo Siqueira',
                'contato' => '(11) 98666-7788',
                'status' => 'ATIVO',
                'criadoEm' => '2026-01-12T12:30:00.000Z',
            ]
        ]
    ];
}

// Inicializa banco de dados central se não existir
if (!file_exists($dataFile)) {
    $base = getDadosBase();
    file_put_contents($dataFile, json_encode($base, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$content = file_get_contents($dataFile);
$dados = json_decode($content, true);
if (!is_array($dados) || !isset($dados['instituicoes'])) {
    $dados = getDadosBase();
    file_put_contents($dataFile, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_auth(['ADMIN', 'EQUIPE_INTERNA']);
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: $_POST;
    $action = $payload['action'] ?? 'save';

    // Salvar todas as instituições e cursos
    if ($action === 'save') {
        if (isset($payload['instituicoes']) && is_array($payload['instituicoes'])) {
            $dados['instituicoes'] = array_values($payload['instituicoes']);
        }
        if (isset($payload['cursos']) && is_array($payload['cursos'])) {
            $dados['cursos'] = array_values($payload['cursos']);
        }
        file_put_contents($dataFile, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'instituicoes' => $dados['instituicoes'], 'cursos' => $dados['cursos']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Adicionar / Atualizar Instituição
    if ($action === 'add_instituicao' && !empty($payload['instituicao'])) {
        $inst = $payload['instituicao'];
        $instId = $inst['id'] ?? ('inst-' . time());
        $inst['id'] = $instId;

        $filtradas = [];
        foreach ($dados['instituicoes'] as $item) {
            if ($item['id'] !== $instId) {
                $filtradas[] = $item;
            }
        }
        array_unshift($filtradas, $inst);
        $dados['instituicoes'] = array_values($filtradas);

        file_put_contents($dataFile, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'instituicao' => $inst, 'instituicoes' => $dados['instituicoes'], 'cursos' => $dados['cursos']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Excluir Instituição
    if ($action === 'delete_instituicao' && !empty($payload['id'])) {
        $delId = $payload['id'];
        $dados['instituicoes'] = array_values(array_filter($dados['instituicoes'], function($i) use ($delId) {
            return $i['id'] !== $delId;
        }));
        // Remove cursos vinculados
        $dados['cursos'] = array_values(array_filter($dados['cursos'], function($c) use ($delId) {
            return ($c['instituicaoId'] ?? '') !== $delId;
        }));

        file_put_contents($dataFile, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'instituicoes' => $dados['instituicoes'], 'cursos' => $dados['cursos']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Adicionar / Atualizar Curso
    if ($action === 'add_curso' && !empty($payload['curso'])) {
        $cur = $payload['curso'];
        $curId = $cur['id'] ?? ('cur-' . time());
        $cur['id'] = $curId;

        $filtrados = [];
        foreach ($dados['cursos'] as $item) {
            if ($item['id'] !== $curId) {
                $filtrados[] = $item;
            }
        }
        array_unshift($filtrados, $cur);
        $dados['cursos'] = array_values($filtrados);

        file_put_contents($dataFile, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'curso' => $cur, 'instituicoes' => $dados['instituicoes'], 'cursos' => $dados['cursos']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Excluir Curso
    if ($action === 'delete_curso' && !empty($payload['id'])) {
        $delId = $payload['id'];
        $dados['cursos'] = array_values(array_filter($dados['cursos'], function($c) use ($delId) {
            return $c['id'] !== $delId;
        }));

        file_put_contents($dataFile, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        echo json_encode(['sucesso' => true, 'instituicoes' => $dados['instituicoes'], 'cursos' => $dados['cursos']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
