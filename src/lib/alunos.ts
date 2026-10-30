// Gerenciador de Alunos e Clientes Formandos - ON Agência de Eventos
// Suporte a importação via Excel (.xlsx, .xls, .csv), colagem direta e exportação

import * as XLSX from 'xlsx';

export interface AlunoCliente {
  id: string;
  codigoContrato: string;
  nome: string;
  cpf: string;
  celular: string;
  email: string;
  instituicao: string;
  campus: string; // Unidade/Campus
  curso: string;
  turma: string;
  semestre: string;
  projeto: string;
  plano: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  cidade: string;
  uf: string;
  cep: string;
  status: 'ATIVO' | 'PENDENTE' | 'CANCELADO';
  valorTotal?: number;
  parcelasPagas?: number;
  totalParcelas?: number;
  criadoEm: string;
}

export const COLUNAS_EXCEL_PADRAO = [
  'Nome',
  'Cpf',
  'Celular',
  'E-mail',
  'Instituição',
  'Unidade/Campus',
  'Curso',
  'Turma',
  'Semestre',
  'Projeto',
  'Plano',
  'Logradouro',
  'Número',
  'Complemento',
  'Cidade',
  'UF',
  'CEP',
] as const;

export const ALUNOS_INICIAIS: AlunoCliente[] = [
  {
    id: 'alu-001',
    codigoContrato: 'ALU-2026-001',
    nome: 'Mariana Silva Santos',
    cpf: '123.456.789-01',
    celular: '(11) 98765-4321',
    email: 'mariana.silva@gmail.com',
    instituicao: 'Universidade Presbiteriana Mackenzie',
    campus: 'Campus Higienópolis',
    curso: 'Direito',
    turma: 'DIR-MAT-A',
    semestre: '2026.2',
    projeto: 'Baile Unificado Direito Mackenzie 2026',
    plano: 'Plano Ouro Completo',
    logradouro: 'Rua da Consolação',
    numero: '1200',
    complemento: 'Apto 42B',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01302-001',
    status: 'ATIVO',
    valorTotal: 5000,
    parcelasPagas: 6,
    totalParcelas: 10,
    criadoEm: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'alu-002',
    codigoContrato: 'ALU-2026-002',
    nome: 'Lucas Gabriel Oliveira',
    cpf: '234.567.890-12',
    celular: '(11) 97654-3210',
    email: 'lucas.oliveira@outlook.com',
    instituicao: 'Universidade Anhembi Morumbi',
    campus: 'Campus Vila Olímpia',
    curso: 'Medicina',
    turma: 'MED-INT-26',
    semestre: '2026.2',
    projeto: 'Unificados Saúde 2026',
    plano: 'Plano Premium Gala',
    logradouro: 'Av. Brigadeiro Faria Lima',
    numero: '2800',
    complemento: '',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01451-000',
    status: 'ATIVO',
    valorTotal: 6500,
    parcelasPagas: 8,
    totalParcelas: 12,
    criadoEm: '2026-01-20T14:30:00.000Z',
  },
  {
    id: 'alu-003',
    codigoContrato: 'ALU-2026-003',
    nome: 'Beatriz Almeida Costa',
    cpf: '345.678.901-23',
    celular: '(11) 96543-2109',
    email: 'beatriz.costa@hotmail.com',
    instituicao: 'Pontifícia Universidade Católica - PUC-SP',
    campus: 'Campus Perdizes',
    curso: 'Administração',
    turma: 'ADM-NOT-B',
    semestre: '2027.1',
    projeto: 'Formatura ADM & Economia PUC',
    plano: 'Plano Prata',
    logradouro: 'Rua Monte Alegre',
    numero: '984',
    complemento: 'Bloco C',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '05014-901',
    status: 'ATIVO',
    valorTotal: 4200,
    parcelasPagas: 4,
    totalParcelas: 10,
    criadoEm: '2026-02-05T09:15:00.000Z',
  },
];

const STORAGE_KEY_ALUNOS = 'on_alunos_cadastrados_v1';

export function getAlunosCadastrados(): AlunoCliente[] {
  if (typeof window === 'undefined') return ALUNOS_INICIAIS;
  try {
    const dados = localStorage.getItem(STORAGE_KEY_ALUNOS);
    if (!dados) {
      localStorage.setItem(STORAGE_KEY_ALUNOS, JSON.stringify(ALUNOS_INICIAIS));
      return ALUNOS_INICIAIS;
    }
    const lista = JSON.parse(dados);
    return Array.isArray(lista) ? lista : ALUNOS_INICIAIS;
  } catch (err) {
    return ALUNOS_INICIAIS;
  }
}

export function salvarAlunosCadastrados(alunos: AlunoCliente[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ALUNOS, JSON.stringify(alunos));
    window.dispatchEvent(new Event('on_alunos_atualizados'));
  } catch (err) {
    console.error('Erro ao salvar alunos:', err);
  }
}

// Normalizador de chaves para mapear variações de cabeçalhos do Excel
function normalizarChave(chave: string): string {
  return chave
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Mapeia uma linha genérica do Excel para o formato AlunoCliente
export function mapearLinhaExcelParaAluno(linha: Record<string, any>, indice: number): AlunoCliente | null {
  const chaves = Object.keys(linha);
  const mapa: Record<string, any> = {};

  chaves.forEach((k) => {
    mapa[normalizarChave(k)] = linha[k];
  });

  const getValor = (...variantes: string[]): string => {
    for (const v of variantes) {
      const norm = normalizarChave(v);
      if (mapa[norm] !== undefined && mapa[norm] !== null) {
        return String(mapa[norm]).trim();
      }
    }
    return '';
  };

  const nome = getValor('nome', 'aluno', 'cliente', 'nomecompleto');
  if (!nome) return null; // Linha vazia ou sem nome

  const cpf = getValor('cpf', 'documento', 'cpfdoc');
  const celular = getValor('celular', 'telefone', 'whatsapp', 'fone', 'tel');
  const email = getValor('email', 'e-mail', 'correio');
  const instituicao = getValor('instituicao', 'faculdade', 'universidade', 'escola', 'colegio');
  const campus = getValor('unidade/campus', 'unidade', 'campus', 'polo', 'campusassociado');
  const curso = getValor('curso', 'graduacao', 'carreira');
  const turma = getValor('turma', 'classe', 'codigo_turma');
  const semestre = getValor('semestre', 'periodo', 'ano_semestre') || '2026.2';
  const projeto = getValor('projeto', 'evento', 'nomeprojeto', 'turmaprojeto');
  const plano = getValor('plano', 'pacote', 'adesao', 'planoescolhido') || 'Plano Padrão';
  const logradouro = getValor('logradouro', 'endereco', 'rua', 'av', 'avenida');
  const numero = getValor('numero', 'num', 'n');
  const complemento = getValor('complemento', 'compl', 'apto');
  const cidade = getValor('cidade', 'municipio') || 'São Paulo';
  const uf = getValor('uf', 'estado') || 'SP';
  const cep = getValor('cep', 'codigopostal');

  const codigoContrato = `ALU-${new Date().getFullYear()}-${String(Date.now() + indice).slice(-4)}`;

  return {
    id: `alu-import-${Date.now()}-${indice}`,
    codigoContrato,
    nome,
    cpf,
    celular,
    email,
    instituicao: instituicao || 'Não especificada',
    campus: campus || 'Geral / Principal',
    curso: curso || 'Geral',
    turma: turma || 'Turma A',
    semestre,
    projeto: projeto || 'Projeto Formatura Unificado',
    plano,
    logradouro,
    numero,
    complemento,
    cidade,
    uf: uf.toUpperCase(),
    cep,
    status: 'ATIVO',
    valorTotal: 5000,
    parcelasPagas: 0,
    totalParcelas: 10,
    criadoEm: new Date().toISOString(),
  };
}

// Processa arquivo Excel (.xlsx, .xls) ou CSV via FileReader
export async function processarArquivoExcel(file: File): Promise<AlunoCliente[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const alunos: AlunoCliente[] = [];
        jsonRows.forEach((row, idx) => {
          const aluno = mapearLinhaExcelParaAluno(row, idx);
          if (aluno) {
            alunos.push(aluno);
          }
        });

        resolve(alunos);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// Processa texto copiado diretamente da planilha (separado por tabulação \t ou vírgula/ponto e vírgula)
export function processarTextoCopiado(texto: string): AlunoCliente[] {
  const linhas = texto.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [];

  // Detecta o separador (TAB ou Ponto e Vírgula ou Vírgula)
  const primeiraLinha = linhas[0];
  let separador = '\t';
  if (primeiraLinha.includes('\t')) {
    separador = '\t';
  } else if (primeiraLinha.includes(';')) {
    separador = ';';
  } else if (primeiraLinha.includes(',')) {
    separador = ',';
  }

  // Verifica se a primeira linha é cabeçalho
  const cabecalhosRaw = primeiraLinha.split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const temCabecalho = cabecalhosRaw.some((c) =>
    ['nome', 'cpf', 'aluno', 'celular', 'email'].includes(normalizarChave(c))
  );

  let cabecalhos = cabecalhosRaw;
  let inicio = 1;

  if (!temCabecalho) {
    // Usa colunas padrão na ordem informada pelo usuário
    cabecalhos = [...COLUNAS_EXCEL_PADRAO];
    inicio = 0;
  }

  const alunos: AlunoCliente[] = [];

  for (let i = inicio; i < linhas.length; i++) {
    const colunas = linhas[i].split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (colunas.length === 0 || (colunas.length === 1 && !colunas[0])) continue;

    const objetoLinha: Record<string, string> = {};
    cabecalhos.forEach((cab, idx) => {
      objetoLinha[cab] = colunas[idx] || '';
    });

    const aluno = mapearLinhaExcelParaAluno(objetoLinha, i);
    if (aluno) {
      alunos.push(aluno);
    }
  }

  return alunos;
}

// Gera e dispara o download da planilha modelo .XLSX com as 17 colunas oficiais
export function baixarPlanilhaModeloXlsx(): void {
  const dadosExemplo = [
    {
      Nome: 'Mariana Silva Santos',
      Cpf: '123.456.789-01',
      Celular: '(11) 98765-4321',
      'E-mail': 'mariana.silva@gmail.com',
      Instituição: 'Universidade Presbiteriana Mackenzie',
      'Unidade/Campus': 'Campus Higienópolis',
      Curso: 'Direito',
      Turma: 'DIR-MAT-A',
      Semestre: '2026.2',
      Projeto: 'Baile Unificado Direito Mackenzie 2026',
      Plano: 'Plano Ouro Completo',
      Logradouro: 'Rua da Consolação',
      Número: '1200',
      Complemento: 'Apto 42B',
      Cidade: 'São Paulo',
      UF: 'SP',
      CEP: '01302-001',
    },
    {
      Nome: 'Lucas Gabriel Oliveira',
      Cpf: '234.567.890-12',
      Celular: '(11) 97654-3210',
      'E-mail': 'lucas.oliveira@outlook.com',
      Instituição: 'Universidade Anhembi Morumbi',
      'Unidade/Campus': 'Campus Vila Olímpia',
      Curso: 'Medicina',
      Turma: 'MED-INT-26',
      Semestre: '2026.2',
      Projeto: 'Unificados Saúde 2026',
      Plano: 'Plano Premium Gala',
      Logradouro: 'Av. Brigadeiro Faria Lima',
      Número: '2800',
      Complemento: '',
      Cidade: 'São Paulo',
      UF: 'SP',
      CEP: '01451-000',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(dadosExemplo);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Formandos_Importacao');

  // Ajusta larguras de coluna
  ws['!cols'] = [
    { wch: 26 }, // Nome
    { wch: 16 }, // Cpf
    { wch: 16 }, // Celular
    { wch: 28 }, // E-mail
    { wch: 35 }, // Instituição
    { wch: 22 }, // Unidade/Campus
    { wch: 20 }, // Curso
    { wch: 14 }, // Turma
    { wch: 12 }, // Semestre
    { wch: 35 }, // Projeto
    { wch: 22 }, // Plano
    { wch: 28 }, // Logradouro
    { wch: 10 }, // Número
    { wch: 14 }, // Complemento
    { wch: 18 }, // Cidade
    { wch: 6 },  // UF
    { wch: 12 }, // CEP
  ];

  XLSX.writeFile(wb, 'Modelo_Importacao_Alunos_ON_Eventos.xlsx');
}

// Exporta todos os alunos cadastrados para uma planilha .XLSX
export function exportarAlunosParaXlsx(alunos: AlunoCliente[]): void {
  const dadosExportar = alunos.map((a) => ({
    Nome: a.nome,
    Cpf: a.cpf,
    Celular: a.celular,
    'E-mail': a.email,
    Instituição: a.instituicao,
    'Unidade/Campus': a.campus,
    Curso: a.curso,
    Turma: a.turma,
    Semestre: a.semestre,
    Projeto: a.projeto,
    Plano: a.plano,
    Logradouro: a.logradouro,
    Número: a.numero,
    Complemento: a.complemento || '',
    Cidade: a.cidade,
    UF: a.uf,
    CEP: a.cep,
    'Código Contrato': a.codigoContrato,
    Status: a.status,
  }));

  const ws = XLSX.utils.json_to_sheet(dadosExportar);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lista_Alunos_Contratos');
  XLSX.writeFile(wb, `Alunos_Formaturas_ON_Agencia_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
