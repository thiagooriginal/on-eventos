// Gerenciador de Instituições de Ensino e Cursos - ON Agência de Eventos

export type TipoInstituicao = 
  | 'UNIVERSIDADE'
  | 'FACULDADE'
  | 'CENTRO_UNIVERSITARIO'
  | 'COLEGIO'
  | 'ESCOLA_TECNICA';

export type GrauCurso = 
  | 'BACHARELADO'
  | 'LICENCIATURA'
  | 'TECNOLOGO'
  | 'ENSINO_MEDIO'
  | 'POS_GRADUACAO'
  | 'TECNICO';

export type AreaCurso = 
  | 'SAUDE'
  | 'HUMANAS'
  | 'EXATAS'
  | 'NEGOCIOS'
  | 'COMUNICACAO_ARTES'
  | 'EDUCACAO_BASICA';

export type PeriodoCurso = 
  | 'INTEGRAL'
  | 'MATUTINO'
  | 'NOTURNO'
  | 'VESPERTINO';

export interface Instituicao {
  id: string;
  nome: string;
  sigla: string;
  tipo: TipoInstituicao;
  campus: string;
  cidade: string;
  uf: string;
  endereco?: string;
  contatoResponsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  status: 'ATIVO' | 'PROSPECCAO' | 'INATIVO';
  criadoEm: string;
  cor: string;
}

export interface Curso {
  id: string;
  instituicaoId: string;
  instituicaoNome: string;
  instituicaoSigla: string;
  nome: string;
  grau: GrauCurso;
  area: AreaCurso;
  periodo: PeriodoCurso;
  turmasAtivas: string[];
  estimativaAlunos: number;
  coordenador: string;
  contato?: string;
  status: 'ATIVO' | 'PROSPECCAO' | 'CONCLUIDO';
  criadoEm: string;
}

const STORAGE_KEY_INSTITUICOES = 'on_instituicoes_v1';
const STORAGE_KEY_CURSOS = 'on_cursos_v1';

export const INSTITUICOES_INICIAIS: Instituicao[] = [
  {
    id: 'inst-1',
    nome: 'Universidade Anhembi Morumbi',
    sigla: 'UAM',
    tipo: 'UNIVERSIDADE',
    campus: 'Vila Olímpia / Paulista',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'R. Casa do Ator, 275 - Vila Olímpia',
    contatoResponsavel: 'Coordenação de Eventos & Alunos',
    telefone: '(11) 3847-3000',
    whatsapp: '(11) 98765-4321',
    email: 'eventos@anhembi.br',
    status: 'ATIVO',
    criadoEm: '2026-01-10T10:00:00.000Z',
    cor: 'from-purple-600 to-indigo-600',
  },
  {
    id: 'inst-2',
    nome: 'Universidade Presbiteriana Mackenzie',
    sigla: 'MACK',
    tipo: 'UNIVERSIDADE',
    campus: 'Higienópolis (Campus Central)',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'R. da Consolação, 930 - Higienópolis',
    contatoResponsavel: 'Diretório Acadêmico & Reitoria',
    telefone: '(11) 2114-8000',
    whatsapp: '(11) 97654-3210',
    email: 'comissoes@mackenzie.br',
    status: 'ATIVO',
    criadoEm: '2026-01-12T11:00:00.000Z',
    cor: 'from-rose-600 to-red-600',
  },
  {
    id: 'inst-3',
    nome: 'Pontifícia Universidade Católica de SP',
    sigla: 'PUC-SP',
    tipo: 'UNIVERSIDADE',
    campus: 'Perdizes / Monte Alegre',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'R. Monte Alegre, 984 - Perdizes',
    contatoResponsavel: 'Comissão Central de Formaturas',
    telefone: '(11) 3670-8000',
    whatsapp: '(11) 96543-2109',
    email: 'formatura@pucsp.br',
    status: 'ATIVO',
    criadoEm: '2026-01-15T09:30:00.000Z',
    cor: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'inst-4',
    nome: 'FMU - Centro Universitário',
    sigla: 'FMU',
    tipo: 'CENTRO_UNIVERSITARIO',
    campus: 'Liberdade / Brigadeiro',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'Av. Liberdade, 899 - Liberdade',
    contatoResponsavel: 'Secretaria Geral de Cursos',
    telefone: '(11) 3132-3000',
    whatsapp: '(11) 95432-1098',
    email: 'eventos@fmu.br',
    status: 'ATIVO',
    criadoEm: '2026-02-01T14:00:00.000Z',
    cor: 'from-teal-600 to-emerald-600',
  },
  {
    id: 'inst-5',
    nome: 'Colégio e Curso Bandeirantes',
    sigla: 'BANDEIRANTES',
    tipo: 'COLEGIO',
    campus: 'Unidade Paraíso',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'R. Estela, 268 - Vila Mariana',
    contatoResponsavel: 'Orientação Educacional Ensino Médio',
    telefone: '(11) 5087-3500',
    whatsapp: '(11) 94321-0987',
    email: 'terceirao@colband.com.br',
    status: 'ATIVO',
    criadoEm: '2026-02-15T16:00:00.000Z',
    cor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'inst-6',
    nome: 'Universidade de São Paulo',
    sigla: 'USP',
    tipo: 'UNIVERSIDADE',
    campus: 'Cidade Universitária - Butantã',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'Av. Prof. Luciano Gualberto, Butantã',
    contatoResponsavel: 'Centro Acadêmico Oswaldo Cruz',
    telefone: '(11) 3091-3000',
    whatsapp: '(11) 93210-9876',
    email: 'comissao@usp.br',
    status: 'PROSPECCAO',
    criadoEm: '2026-02-20T08:00:00.000Z',
    cor: 'from-amber-600 to-yellow-500',
  },
];

export const CURSOS_INICIAIS: Curso[] = [
  {
    id: 'cur-1',
    instituicaoId: 'inst-1',
    instituicaoNome: 'Universidade Anhembi Morumbi',
    instituicaoSigla: 'UAM',
    nome: 'Medicina',
    grau: 'BACHARELADO',
    area: 'SAUDE',
    periodo: 'INTEGRAL',
    turmasAtivas: ['2026.1', '2026.2', '2027.1'],
    estimativaAlunos: 95,
    coordenador: 'Dra. Camila Vasconcelos',
    contato: '(11) 98111-2233',
    status: 'ATIVO',
    criadoEm: '2026-01-10T10:30:00.000Z',
  },
  {
    id: 'cur-2',
    instituicaoId: 'inst-1',
    instituicaoNome: 'Universidade Anhembi Morumbi',
    instituicaoSigla: 'UAM',
    nome: 'Direito',
    grau: 'BACHARELADO',
    area: 'HUMANAS',
    periodo: 'NOTURNO',
    turmasAtivas: ['2026.2'],
    estimativaAlunos: 75,
    coordenador: 'Dr. Roberto Silveira',
    contato: '(11) 98222-3344',
    status: 'ATIVO',
    criadoEm: '2026-01-10T11:00:00.000Z',
  },
  {
    id: 'cur-3',
    instituicaoId: 'inst-1',
    instituicaoNome: 'Universidade Anhembi Morumbi',
    instituicaoSigla: 'UAM',
    nome: 'Enfermagem & Fisioterapia',
    grau: 'BACHARELADO',
    area: 'SAUDE',
    periodo: 'MATUTINO',
    turmasAtivas: ['2026.1', '2026.2'],
    estimativaAlunos: 60,
    coordenador: 'Profª. Renata Alencar',
    contato: '(11) 98333-4455',
    status: 'ATIVO',
    criadoEm: '2026-01-10T11:30:00.000Z',
  },
  {
    id: 'cur-4',
    instituicaoId: 'inst-2',
    instituicaoNome: 'Universidade Presbiteriana Mackenzie',
    instituicaoSigla: 'MACK',
    nome: 'Direito',
    grau: 'BACHARELADO',
    area: 'HUMANAS',
    periodo: 'MATUTINO',
    turmasAtivas: ['2026.2', '2027.1'],
    estimativaAlunos: 140,
    coordenador: 'Dr. Fernando Paes de Barros',
    contato: '(11) 98444-5566',
    status: 'ATIVO',
    criadoEm: '2026-01-12T11:30:00.000Z',
  },
  {
    id: 'cur-5',
    instituicaoId: 'inst-2',
    instituicaoNome: 'Universidade Presbiteriana Mackenzie',
    instituicaoSigla: 'MACK',
    nome: 'Arquitetura e Urbanismo',
    grau: 'BACHARELADO',
    area: 'EXATAS',
    periodo: 'INTEGRAL',
    turmasAtivas: ['2026.2'],
    estimativaAlunos: 80,
    coordenador: 'Prof. Lucas Mendonça',
    contato: '(11) 98555-6677',
    status: 'ATIVO',
    criadoEm: '2026-01-12T12:00:00.000Z',
  },
  {
    id: 'cur-6',
    instituicaoId: 'inst-2',
    instituicaoNome: 'Universidade Presbiteriana Mackenzie',
    instituicaoSigla: 'MACK',
    nome: 'Administração de Empresas',
    grau: 'BACHARELADO',
    area: 'NEGOCIOS',
    periodo: 'NOTURNO',
    turmasAtivas: ['2026.1'],
    estimativaAlunos: 90,
    coordenador: 'Prof. Marcelo Siqueira',
    contato: '(11) 98666-7788',
    status: 'ATIVO',
    criadoEm: '2026-01-12T12:30:00.000Z',
  },
  {
    id: 'cur-7',
    instituicaoId: 'inst-3',
    instituicaoNome: 'Pontifícia Universidade Católica de SP',
    instituicaoSigla: 'PUC-SP',
    nome: 'Psicologia',
    grau: 'BACHARELADO',
    area: 'HUMANAS',
    periodo: 'MATUTINO',
    turmasAtivas: ['2026.1', '2026.2'],
    estimativaAlunos: 85,
    coordenador: 'Dra. Beatriz Toledo',
    contato: '(11) 98777-8899',
    status: 'ATIVO',
    criadoEm: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'cur-8',
    instituicaoId: 'inst-3',
    instituicaoNome: 'Pontifícia Universidade Católica de SP',
    instituicaoSigla: 'PUC-SP',
    nome: 'Relações Internacionais',
    grau: 'BACHARELADO',
    area: 'HUMANAS',
    periodo: 'NOTURNO',
    turmasAtivas: ['2026.2'],
    estimativaAlunos: 65,
    coordenador: 'Prof. André Guimarães',
    contato: '(11) 98888-9900',
    status: 'ATIVO',
    criadoEm: '2026-01-15T10:30:00.000Z',
  },
  {
    id: 'cur-9',
    instituicaoId: 'inst-4',
    instituicaoNome: 'FMU - Centro Universitário',
    instituicaoSigla: 'FMU',
    nome: 'Biomedicina & Farmácia',
    grau: 'BACHARELADO',
    area: 'SAUDE',
    periodo: 'NOTURNO',
    turmasAtivas: ['2026.2'],
    estimativaAlunos: 70,
    coordenador: 'Profª. Juliana Prado',
    contato: '(11) 98999-0011',
    status: 'ATIVO',
    criadoEm: '2026-02-01T14:30:00.000Z',
  },
  {
    id: 'cur-10',
    instituicaoId: 'inst-4',
    instituicaoNome: 'FMU - Centro Universitário',
    instituicaoSigla: 'FMU',
    nome: 'Odontologia',
    grau: 'BACHARELADO',
    area: 'SAUDE',
    periodo: 'INTEGRAL',
    turmasAtivas: ['2026.2', '2027.1'],
    estimativaAlunos: 75,
    coordenador: 'Dr. Carlos Eduardo Lima',
    contato: '(11) 97000-1122',
    status: 'ATIVO',
    criadoEm: '2026-02-01T15:00:00.000Z',
  },
  {
    id: 'cur-11',
    instituicaoId: 'inst-5',
    instituicaoNome: 'Colégio e Curso Bandeirantes',
    instituicaoSigla: 'BANDEIRANTES',
    nome: '3º Ano Ensino Médio (Terceirão)',
    grau: 'ENSINO_MEDIO',
    area: 'EDUCACAO_BASICA',
    periodo: 'MATUTINO',
    turmasAtivas: ['2026.2'],
    estimativaAlunos: 130,
    coordenador: 'Prof. Cláudio Brandão',
    contato: '(11) 97111-2233',
    status: 'ATIVO',
    criadoEm: '2026-02-15T16:30:00.000Z',
  },
  {
    id: 'cur-12',
    instituicaoId: 'inst-6',
    instituicaoNome: 'Universidade de São Paulo',
    instituicaoSigla: 'USP',
    nome: 'Engenharia Politécnica (POLI)',
    grau: 'BACHARELADO',
    area: 'EXATAS',
    periodo: 'INTEGRAL',
    turmasAtivas: ['2027.1'],
    estimativaAlunos: 160,
    coordenador: 'Prof. Geraldo Magela',
    contato: '(11) 97222-3344',
    status: 'PROSPECCAO',
    criadoEm: '2026-02-20T08:30:00.000Z',
  },
];

// Funções de Carregamento & Persistência de Instituições
export function getInstituicoes(): Instituicao[] {
  if (typeof window === 'undefined') return INSTITUICOES_INICIAIS;

  try {
    const salvo = localStorage.getItem(STORAGE_KEY_INSTITUICOES);
    if (!salvo) {
      localStorage.setItem(STORAGE_KEY_INSTITUICOES, JSON.stringify(INSTITUICOES_INICIAIS));
      return INSTITUICOES_INICIAIS;
    }
    const parsed = JSON.parse(salvo);
    return Array.isArray(parsed) ? parsed : INSTITUICOES_INICIAIS;
  } catch (e) {
    return INSTITUICOES_INICIAIS;
  }
}

export function salvarInstituicoes(lista: Instituicao[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_INSTITUICOES, JSON.stringify(lista));
  } catch (e) {
    console.error('Erro ao salvar instituições:', e);
  }
}

export function adicionarInstituicao(
  dados: Omit<Instituicao, 'id' | 'criadoEm'>
): Instituicao {
  const lista = getInstituicoes();
  const nova: Instituicao = {
    ...dados,
    id: 'inst-' + Date.now(),
    criadoEm: new Date().toISOString(),
  };
  lista.unshift(nova);
  salvarInstituicoes(lista);
  return nova;
}

export function atualizarInstituicao(
  id: string,
  updates: Partial<Instituicao>
): Instituicao | null {
  const lista = getInstituicoes();
  const index = lista.findIndex((i) => i.id === id);
  if (index === -1) return null;

  lista[index] = { ...lista[index], ...updates };
  salvarInstituicoes(lista);

  // Atualiza também o nome/sigla nos cursos vinculados
  if (updates.nome || updates.sigla) {
    const cursos = getCursos();
    let modificado = false;
    cursos.forEach((c) => {
      if (c.instituicaoId === id) {
        if (updates.nome) c.instituicaoNome = updates.nome;
        if (updates.sigla) c.instituicaoSigla = updates.sigla;
        modificado = true;
      }
    });
    if (modificado) {
      salvarCursos(cursos);
    }
  }

  return lista[index];
}

export function removerInstituicao(id: string): boolean {
  const lista = getInstituicoes();
  const filtrada = lista.filter((i) => i.id !== id);
  if (filtrada.length === lista.length) return false;

  salvarInstituicoes(filtrada);

  // Remove também cursos vinculados a essa instituição
  const cursos = getCursos().filter((c) => c.instituicaoId !== id);
  salvarCursos(cursos);

  return true;
}

// Funções de Carregamento & Persistência de Cursos
export function getCursos(): Curso[] {
  if (typeof window === 'undefined') return CURSOS_INICIAIS;

  try {
    const salvo = localStorage.getItem(STORAGE_KEY_CURSOS);
    if (!salvo) {
      localStorage.setItem(STORAGE_KEY_CURSOS, JSON.stringify(CURSOS_INICIAIS));
      return CURSOS_INICIAIS;
    }
    const parsed = JSON.parse(salvo);
    return Array.isArray(parsed) ? parsed : CURSOS_INICIAIS;
  } catch (e) {
    return CURSOS_INICIAIS;
  }
}

export function salvarCursos(lista: Curso[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CURSOS, JSON.stringify(lista));
  } catch (e) {
    console.error('Erro ao salvar cursos:', e);
  }
}

export function adicionarCurso(
  dados: Omit<Curso, 'id' | 'criadoEm'>
): Curso {
  const lista = getCursos();
  const novo: Curso = {
    ...dados,
    id: 'cur-' + Date.now(),
    criadoEm: new Date().toISOString(),
  };
  lista.unshift(novo);
  salvarCursos(lista);
  return novo;
}

export function atualizarCurso(
  id: string,
  updates: Partial<Curso>
): Curso | null {
  const lista = getCursos();
  const index = lista.findIndex((c) => c.id === id);
  if (index === -1) return null;

  lista[index] = { ...lista[index], ...updates };
  salvarCursos(lista);
  return lista[index];
}

export function removerCurso(id: string): boolean {
  const lista = getCursos();
  const filtrada = lista.filter((c) => c.id !== id);
  if (filtrada.length === lista.length) return false;

  salvarCursos(filtrada);
  return true;
}

export function getCursosPorInstituicao(instituicaoId: string): Curso[] {
  return getCursos().filter((c) => c.instituicaoId === instituicaoId);
}
