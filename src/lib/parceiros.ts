// Gerenciador de Parceiros: Profissionais Liberais & Espaços para Eventos
// ON Agência de Eventos & Formaturas

export type CategoriaProfissional =
  | 'Recepcionista'
  | 'Fotógrafo'
  | 'Mestre de Cerimônias'
  | 'Segurança'
  | 'Garçom'
  | 'Barman / Bartender'
  | 'DJ / Sonorização'
  | 'Banda / Músico'
  | 'Cinegrafista'
  | 'Decorador / Cenógrafo'
  | 'Cerimonialista'
  | 'Buffet / Cozinha'
  | 'Maquiador / Hair'
  | 'Outro';

export type TipoEspaco =
  | 'SITIO'
  | 'CASA_PISCINA'
  | 'MANSAO'
  | 'BAR'
  | 'ESPACO_EVENTO'
  | 'CHACARA'
  | 'ROOFTOP'
  | 'HOTEL'
  | 'OUTRO';

export interface ProfissionalLiberal {
  id: string;
  nome: string;
  categoria: CategoriaProfissional | string;
  especialidade?: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  cidade: string;
  uf: string;
  regiaoAtendimento?: string;
  valorDiariaOuCache?: number;
  unidadeCobranca?: 'POR_EVENTO' | 'POR_HORA' | 'POR_DIA' | 'A_COMBINAR';
  chavePix?: string;
  tipoChavePix?: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  bancoPix?: string;
  cpfOuCnpj?: string;
  instagram?: string;
  portfolioUrl?: string;
  avaliacaoEstrelas: number; // 1 a 5
  status: 'DISPONIVEL' | 'EM_EVENTO' | 'INDISPONIVEL' | 'AVALIANDO';
  fotoUrl?: string;
  habilidades: string[];
  observacoes?: string;
  totalEventosRealizados?: number;
  criadoEm: string;
}

export interface EspacoEvento {
  id: string;
  nome: string;
  tipo: TipoEspaco;
  tipoLabel: string;
  capacidadePessoas: number;
  capacidadeSentadas?: number;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep?: string;
  linkGoogleMaps?: string;
  responsavelNome: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  valorLocacao?: number;
  periodoLocacao?: 'DIARIA' | 'FIM_DE_SEMANA' | 'POR_HORA' | 'PACOTE_EVENTO';
  taxaLimpeza?: number;
  fotos: string[];
  fotoPrincipal?: string;
  infraestrutura: string[];
  avaliacaoEstrelas: number; // 1 a 5
  status: 'DISPONIVEL' | 'RESERVADO' | 'EM_REFORMA' | 'INATIVO';
  regrasObservacoes?: string;
  horarioLimiteSom?: string;
  criadoEm: string;
}

export const CATEGORIAS_PROFISSIONAIS: CategoriaProfissional[] = [
  'Recepcionista',
  'Fotógrafo',
  'Mestre de Cerimônias',
  'Segurança',
  'Garçom',
  'Barman / Bartender',
  'DJ / Sonorização',
  'Banda / Músico',
  'Cinegrafista',
  'Decorador / Cenógrafo',
  'Cerimonialista',
  'Buffet / Cozinha',
  'Maquiador / Hair',
  'Outro',
];

export const TIPOS_ESPACOS: { id: TipoEspaco; label: string; icone?: string }[] = [
  { id: 'SITIO', label: 'Sítio' },
  { id: 'CASA_PISCINA', label: 'Casa com Piscina' },
  { id: 'MANSAO', label: 'Mansão' },
  { id: 'BAR', label: 'Bar / Lounge' },
  { id: 'ESPACO_EVENTO', label: 'Espaço para Eventos / Salão' },
  { id: 'CHACARA', label: 'Chácara' },
  { id: 'ROOFTOP', label: 'Rooftop / Terraço' },
  { id: 'HOTEL', label: 'Hotel / Pousada' },
  { id: 'OUTRO', label: 'Outro Espaço' },
];

export const INFRAESTRUTURAS_DISPONIVEIS: string[] = [
  'Piscina',
  'Piscina Aquecida',
  'Área com Churrasqueira',
  'Estacionamento Próprio',
  'Estacionamento c/ Manobrista',
  'Cozinha Industrial Completa',
  'Ar Condicionado / Climatização',
  'Gerador de Energia',
  'Área Coberta Ampla',
  'Área ao Ar Livre / Jardim',
  'Camarim c/ Banheiro Privativo',
  'Som e Iluminação Integrados',
  'Palco para Shows / DJ',
  'Permite Som Alto até Tarde',
  'Acessibilidade Total PCD',
  'Segurança / Portaria 24h',
  'Wi-Fi de Alta Velocidade',
  'Mobiliário Incluso (Mesas/Cadeiras)',
  'Lounge / Espaço VIP',
  'Deck Panorâmico',
];

const STORAGE_KEY_PROFISSIONAIS = 'on_parceiros_profissionais_v1';
const STORAGE_KEY_ESPACOS = 'on_parceiros_espacos_v1';

// Dados Iniciais Realistas e de Alto Padrão
export const PROFISSIONAIS_INICIAIS: ProfissionalLiberal[] = [
  {
    id: 'prof-1',
    nome: 'Juliana Mendes de Castro',
    categoria: 'Recepcionista',
    especialidade: 'Recepção VIP & Credenciamento de Formaturas',
    telefone: '(11) 98451-2290',
    whatsapp: '11984512290',
    email: 'juliana.eventos@gmail.com',
    cidade: 'São Paulo',
    uf: 'SP',
    regiaoAtendimento: 'São Paulo e Grande ABC',
    valorDiariaOuCache: 280,
    unidadeCobranca: 'POR_EVENTO',
    chavePix: 'juliana.eventos@gmail.com',
    tipoChavePix: 'EMAIL',
    bancoPix: 'Nubank',
    cpfOuCnpj: '412.875.998-01',
    instagram: '@julianamendes.recepcao',
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    habilidades: ['Inglês Fluente', 'Uniforme Preto / Social', 'Credenciamento Digital', 'Pontualidade Britânica'],
    observacoes: 'Excelente postura em mesas solenes e recepção de paraninfos e convidados de honra.',
    totalEventosRealizados: 48,
    criadoEm: '2026-01-15',
  },
  {
    id: 'prof-2',
    nome: 'Lucas Albuquerque Prado',
    categoria: 'Fotógrafo',
    especialidade: 'Fotografia Solene, Colação e Bailes de Formatura',
    telefone: '(11) 99120-4411',
    whatsapp: '11991204411',
    email: 'lucas.prado.foto@gmail.com',
    cidade: 'São Paulo',
    uf: 'SP',
    regiaoAtendimento: 'Capital, Interior e Litoral',
    valorDiariaOuCache: 650,
    unidadeCobranca: 'POR_EVENTO',
    chavePix: '11991204411',
    tipoChavePix: 'TELEFONE',
    bancoPix: 'Itaú',
    cpfOuCnpj: '32.189.442/0001-10',
    instagram: '@lucasprado.fotografia',
    portfolioUrl: 'https://lucaspradofotos.com.br',
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    habilidades: ['Câmera Sony A7 IV', 'Lente 70-200mm f/2.8', 'Flash de Alta Potência', 'Entrega de Raw / Jpeg Rápida'],
    observacoes: 'Especialista em captar o momento de entrega do canudo e beijo no diploma com precisão cirúrgica.',
    totalEventosRealizados: 112,
    criadoEm: '2026-02-10',
  },
  {
    id: 'prof-3',
    nome: 'Rodrigo Vasconcelos',
    categoria: 'Mestre de Cerimônias',
    especialidade: 'Oratória Solene, Bailes de Gala e Protocolo Acadêmico',
    telefone: '(11) 97332-9011',
    whatsapp: '11973329011',
    email: 'rodrigo.voz@gmail.com',
    cidade: 'Campinas',
    uf: 'SP',
    regiaoAtendimento: 'Estado de São Paulo completo',
    valorDiariaOuCache: 850,
    unidadeCobranca: 'POR_EVENTO',
    chavePix: 'rodrigo.voz@gmail.com',
    tipoChavePix: 'EMAIL',
    bancoPix: 'Bradesco',
    cpfOuCnpj: '219.043.882-90',
    instagram: '@rodrigovasconcelos.voz',
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    habilidades: ['Voz Padrão Rádio / TV', 'Smoking Próprio', 'Domínio de Roteiro e Improviso', 'Bilingue'],
    observacoes: 'Mestre de cerimônias oficial de solenidades de Medicina e Direito das principais faculdades.',
    totalEventosRealizados: 160,
    criadoEm: '2026-01-20',
  },
  {
    id: 'prof-4',
    nome: 'Marcos Vinícius (Cachaça & Co)',
    categoria: 'Barman / Bartender',
    especialidade: 'Coquetelaria Criativa, Drinks Autorais & Open Bar',
    telefone: '(11) 98112-7722',
    whatsapp: '11981127722',
    email: 'marcos.drinks@gmail.com',
    cidade: 'São Paulo',
    uf: 'SP',
    regiaoAtendimento: 'São Paulo e Interior',
    valorDiariaOuCache: 350,
    unidadeCobranca: 'POR_EVENTO',
    chavePix: '38.992.112/0001-90',
    tipoChavePix: 'CNPJ',
    bancoPix: 'Santander',
    instagram: '@marcosv.bartender',
    avaliacaoEstrelas: 4.9,
    status: 'EM_EVENTO',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    habilidades: ['Flair Bartending', 'Estrutura de Bar Móvel', 'Drinks Sem Álcool (Mocktails)', 'Velocidade de Atendimento'],
    observacoes: 'Capacidade de atender grandes filas sem perder o sorriso e o padrão dos coquetéis.',
    totalEventosRealizados: 85,
    criadoEm: '2026-03-01',
  },
  {
    id: 'prof-5',
    nome: 'DJ Gabriel K (Gabriel Koenig)',
    categoria: 'DJ / Sonorização',
    especialidade: 'Pista de Dança Open Format, Formaturas & Mega Bailes',
    telefone: '(11) 99881-3300',
    whatsapp: '11998813300',
    email: 'contato@djgabrielk.com',
    cidade: 'São Paulo',
    uf: 'SP',
    regiaoAtendimento: 'Brasil todo',
    valorDiariaOuCache: 1800,
    unidadeCobranca: 'POR_EVENTO',
    chavePix: 'gabriel.dj@gmail.com',
    tipoChavePix: 'EMAIL',
    bancoPix: 'Inter',
    instagram: '@djgabrielk_oficial',
    portfolioUrl: 'https://soundcloud.com/djgabrielk',
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    fotoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    habilidades: ['Equipamento Pioneer CDJ 3000', 'Setlist Personalizado', 'Efeitos Especiais de Pista', 'Sem Parar'],
    observacoes: 'Mantém a pista cheia até 6h da manhã. Recomendado para festas com mais de 500 formandos.',
    totalEventosRealizados: 140,
    criadoEm: '2026-02-18',
  },
];

export const ESPACOS_INICIAIS: EspacoEvento[] = [
  {
    id: 'espaco-1',
    nome: 'Sítio Paraíso das Palmeiras Imperial',
    tipo: 'SITIO',
    tipoLabel: 'Sítio',
    capacidadePessoas: 900,
    capacidadeSentadas: 550,
    endereco: 'Estrada das Palmeiras, 1420',
    bairro: 'Zona Rural Nobre',
    cidade: 'Mairiporã',
    uf: 'SP',
    cep: '07600-000',
    linkGoogleMaps: 'https://maps.google.com/?q=Mairipora',
    responsavelNome: 'Cláudio Ferreira (Gerente)',
    telefone: '(11) 98711-3320',
    whatsapp: '11987113320',
    email: 'contato@sitioimperial.com.br',
    valorLocacao: 7500,
    periodoLocacao: 'DIARIA',
    taxaLimpeza: 500,
    fotos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
    ],
    fotoPrincipal: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    infraestrutura: [
      'Piscina',
      'Piscina Aquecida',
      'Área com Churrasqueira',
      'Estacionamento Próprio',
      'Cozinha Industrial Completa',
      'Gerador de Energia',
      'Área Coberta Ampla',
      'Área ao Ar Livre / Jardim',
      'Permite Som Alto até Tarde',
      'Segurança / Portaria 24h',
    ],
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    regrasObservacoes: 'Permite som alto sem limite de decibéis até as 05h da manhã. Estacionamento comporta 200 veículos.',
    horarioLimiteSom: '05:00',
    criadoEm: '2026-01-10',
  },
  {
    id: 'espaco-2',
    nome: 'Villa Bella - Casa Moderna com Piscina',
    tipo: 'CASA_PISCINA',
    tipoLabel: 'Casa com Piscina',
    capacidadePessoas: 200,
    capacidadeSentadas: 120,
    endereco: 'Rua das Magnólias, 310',
    bairro: 'Granja Viana',
    cidade: 'Cotia',
    uf: 'SP',
    cep: '06700-110',
    linkGoogleMaps: 'https://maps.google.com/?q=Granja+Viana',
    responsavelNome: 'Dra. Beatriz Fontana',
    telefone: '(11) 99234-8899',
    whatsapp: '11992348899',
    email: 'villabella.eventos@gmail.com',
    valorLocacao: 3800,
    periodoLocacao: 'DIARIA',
    taxaLimpeza: 350,
    fotos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    ],
    fotoPrincipal: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    infraestrutura: [
      'Piscina',
      'Área com Churrasqueira',
      'Estacionamento Próprio',
      'Ar Condicionado / Climatização',
      'Lounge / Espaço VIP',
      'Wi-Fi de Alta Velocidade',
      'Mobiliário Incluso (Mesas/Cadeiras)',
    ],
    avaliacaoEstrelas: 4.8,
    status: 'DISPONIVEL',
    regrasObservacoes: 'Ideal para pool party de formatura, despedida de turma e sunset com churrasco premium.',
    horarioLimiteSom: '23:30',
    criadoEm: '2026-02-05',
  },
  {
    id: 'espaco-3',
    nome: 'Mansão Bosque Nobre Eventos',
    tipo: 'MANSAO',
    tipoLabel: 'Mansão',
    capacidadePessoas: 1200,
    capacidadeSentadas: 800,
    endereco: 'Av. dos Nobres, 850',
    bairro: 'Morumbi Nobre',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '05650-000',
    linkGoogleMaps: 'https://maps.google.com/?q=Morumbi+Sao+Paulo',
    responsavelNome: 'Dr. Henrique Siqueira',
    telefone: '(11) 97110-5522',
    whatsapp: '11971105522',
    email: 'contato@mansaobosquenobre.com.br',
    valorLocacao: 16500,
    periodoLocacao: 'PACOTE_EVENTO',
    taxaLimpeza: 1000,
    fotos: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800&auto=format&fit=crop&q=80',
    ],
    fotoPrincipal: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
    infraestrutura: [
      'Estacionamento c/ Manobrista',
      'Cozinha Industrial Completa',
      'Ar Condicionado / Climatização',
      'Gerador de Energia',
      'Área Coberta Ampla',
      'Camarim c/ Banheiro Privativo',
      'Som e Iluminação Integrados',
      'Palco para Shows / DJ',
      'Acessibilidade Total PCD',
      'Segurança / Portaria 24h',
      'Deck Panorâmico',
    ],
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    regrasObservacoes: 'Arquitetura neoclássica para grandes bailes de gala de medicina e direito. Pé direito de 7 metros.',
    horarioLimiteSom: '05:00',
    criadoEm: '2026-01-28',
  },
  {
    id: 'espaco-4',
    nome: 'The High Bar & Lounge Rooftop',
    tipo: 'BAR',
    tipoLabel: 'Bar / Lounge',
    capacidadePessoas: 320,
    capacidadeSentadas: 180,
    endereco: 'Rua Augusta, 2200 - 18º Andar',
    bairro: 'Cerqueira César / Jardins',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01412-000',
    linkGoogleMaps: 'https://maps.google.com/?q=Rua+Augusta+2200',
    responsavelNome: 'Camila Zampieri (Sócia-Diretora)',
    telefone: '(11) 98229-1002',
    whatsapp: '11982291002',
    email: 'camila@thehighbar.com.br',
    valorLocacao: 5200,
    periodoLocacao: 'DIARIA',
    taxaLimpeza: 400,
    fotos: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    ],
    fotoPrincipal: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    infraestrutura: [
      'Ar Condicionado / Climatização',
      'Som e Iluminação Integrados',
      'Palco para Shows / DJ',
      'Lounge / Espaço VIP',
      'Deck Panorâmico',
      'Acessibilidade Total PCD',
      'Wi-Fi de Alta Velocidade',
    ],
    avaliacaoEstrelas: 4.9,
    status: 'DISPONIVEL',
    regrasObservacoes: 'Bar moderno com vista 360° para a Av. Paulista. Possui 2 balcões de drinks e sistema de som acústico.',
    horarioLimiteSom: '04:00',
    criadoEm: '2026-02-22',
  },
  {
    id: 'espaco-5',
    nome: 'Grand Hall Espaço para Eventos & Convenções',
    tipo: 'ESPACO_EVENTO',
    tipoLabel: 'Espaço para Eventos / Salão',
    capacidadePessoas: 2500,
    capacidadeSentadas: 1800,
    endereco: 'Av. Marquês de São Vicente, 3500',
    bairro: 'Barra Funda',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01139-003',
    linkGoogleMaps: 'https://maps.google.com/?q=Barra+Funda+Sao+Paulo',
    responsavelNome: 'André Lemos (Diretoria Comercial)',
    telefone: '(11) 98300-1199',
    whatsapp: '11983001199',
    email: 'eventos@grandhallsp.com.br',
    valorLocacao: 28000,
    periodoLocacao: 'PACOTE_EVENTO',
    taxaLimpeza: 2000,
    fotos: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
    ],
    fotoPrincipal: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80',
    infraestrutura: [
      'Estacionamento Próprio',
      'Estacionamento c/ Manobrista',
      'Cozinha Industrial Completa',
      'Ar Condicionado / Climatização',
      'Gerador de Energia',
      'Área Coberta Ampla',
      'Camarim c/ Banheiro Privativo',
      'Som e Iluminação Integrados',
      'Palco para Shows / DJ',
      'Acessibilidade Total PCD',
      'Segurança / Portaria 24h',
      'Mobiliário Incluso (Mesas/Cadeiras)',
    ],
    avaliacaoEstrelas: 5,
    status: 'DISPONIVEL',
    regrasObservacoes: 'Mega espaço estruturado para grandes colações de grau e bailes com mega estruturas suspensas.',
    horarioLimiteSom: '06:00',
    criadoEm: '2026-01-05',
  },
];

// Funções de Leitura e Persistência Sincronizada

export function getProfissionais(): ProfissionalLiberal[] {
  if (typeof window === 'undefined') return PROFISSIONAIS_INICIAIS;
  try {
    const dados = localStorage.getItem(STORAGE_KEY_PROFISSIONAIS);
    if (!dados) {
      localStorage.setItem(STORAGE_KEY_PROFISSIONAIS, JSON.stringify(PROFISSIONAIS_INICIAIS));
      return PROFISSIONAIS_INICIAIS;
    }
    const parsed = JSON.parse(dados);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : PROFISSIONAIS_INICIAIS;
  } catch (e) {
    return PROFISSIONAIS_INICIAIS;
  }
}

export function salvarProfissionaisLocal(lista: ProfissionalLiberal[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROFISSIONAIS, JSON.stringify(lista));
  } catch (e) {}
}

export function getEspacos(): EspacoEvento[] {
  if (typeof window === 'undefined') return ESPACOS_INICIAIS;
  try {
    const dados = localStorage.getItem(STORAGE_KEY_ESPACOS);
    if (!dados) {
      localStorage.setItem(STORAGE_KEY_ESPACOS, JSON.stringify(ESPACOS_INICIAIS));
      return ESPACOS_INICIAIS;
    }
    const parsed = JSON.parse(dados);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ESPACOS_INICIAIS;
  } catch (e) {
    return ESPACOS_INICIAIS;
  }
}

export function salvarEspacosLocal(lista: EspacoEvento[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ESPACOS, JSON.stringify(lista));
  } catch (e) {}
}

// Sincronização com o Servidor PHP
export async function sincronizarParceirosServidor(): Promise<{
  profissionais: ProfissionalLiberal[];
  espacos: EspacoEvento[];
} | null> {
  try {
    const res = await fetch('/parceiros.php');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.sucesso) {
      const profs = Array.isArray(data.profissionais) && data.profissionais.length > 0
        ? data.profissionais
        : getProfissionais();
      const esp = Array.isArray(data.espacos) && data.espacos.length > 0
        ? data.espacos
        : getEspacos();

      salvarProfissionaisLocal(profs);
      salvarEspacosLocal(esp);
      return { profissionais: profs, espacos: esp };
    }
  } catch (e) {}
  return null;
}

export async function salvarParceirosServidor(
  profissionais: ProfissionalLiberal[],
  espacos: EspacoEvento[]
) {
  salvarProfissionaisLocal(profissionais);
  salvarEspacosLocal(espacos);
  try {
    await fetch('/parceiros.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_all',
        profissionais,
        espacos,
      }),
    });
  } catch (e) {}
}
