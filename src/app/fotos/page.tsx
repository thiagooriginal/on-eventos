'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera,
  CreditCard,
  Barcode,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  User,
  Phone,
  Building2,
  Calendar,
  Share2,
  Check,
  Gift,
  Image as ImageIcon,
  Award,
  Link2,
  Package,
  Trash2,
  SlidersHorizontal,
  GraduationCap,
  School,
  Mail,
  AlertTriangle,
  UserCheck,
  Bell,
  CalendarClock,
  UserPlus,
  Edit3,
  CheckSquare,
  History,
  Wallet,
  Banknote,
  Globe,
  UploadCloud,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Undo2,
  Zap,
  Send,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ReconhecimentoFacialModal from '@/components/ReconhecimentoFacialModal';
import {
  getInstituicoes,
  getCursos,
  getOpcoesTurmasFaculdades,
  sincronizarInstituicoesServidor,
  adicionarInstituicao,
  Instituicao,
  Curso,
  OpcaoTurmaFaculdade,
} from '@/lib/instituicoes';
import {
  getUsuarios,
  sincronizarUsuariosServidor,
  UsuarioSistema,
} from '@/lib/usuarios';
import {
  SICREDI_CONFIG_OFICIAL,
  BOLETO_HOMOLOGACAO_PADRAO,
  gerarNossoNumeroSicredi,
  gerarLinhaDigitavelECodigoBarrasSicredi,
  gerarRemessaCnab400Oficial,
  gerarNomeArquivoRemessaSicredi,
  gerarSvgCodigoBarrasI25,
  obterProximoSequencialRemessa,
  incrementarSequencialRemessa,
  processarArquivoRetornoSicredi,
  RetornoSicrediResultado,
} from '@/lib/sicredi';

export type ModeloAlbumTipo = 'Album premium' | 'Album Preto' | 'Album Slim' | 'Album Colégio';

export type BrindeTipo = 'Quadro 30x60' | 'Trio de quadros' | 'Link de fotos' | 'Diploma acrilico';

export interface BrindeItem {
  id: string;
  nome: BrindeTipo;
  descricao: string;
  selecionado: boolean;
  valorAdicional: number; // 0 = cortesia / incluso no kit
}

export interface ParcelaBoleto {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO';
  linhaDigitavel: string;
  codigoPix: string;
  codigoBarras?: string;
  nossoNumero?: string;
  txid?: string;
  registradoSicredi?: boolean;
  dataRegistroSicredi?: string;
  dataPagamento?: string;
  dataCredito?: string;
  formaBaixa?: string;
  localBaixa?: string;
  contaBaixa?: string;
  valorPago?: number;
  descontoAplicado?: number;
  observacoesBaixa?: string;
  // Campos de Disparo e Lembrete WhatsApp
  ultimoEnvioZap?: string;
  lembrete1DiaEnviado?: boolean;
  lembrete1DiaData?: string;
}

export interface ObservacaoRegistro {
  id: string;
  dataHora: string;
  autorNome: string;
  texto: string;
}

export interface VendaAlbum {
  id: string;
  codigoPedido: string;
  dataVenda: string;
  alunoNome: string;
  alunoCpf: string;
  alunoTelefone: string;
  alunoEmail: string;
  instituicaoNome?: string;
  periodo?: string;
  turmaNome: string;
  // Configuração do Álbum
  modeloAlbum: ModeloAlbumTipo;
  valorAlbum: number;
  // Configuração dos Brindes do Kit
  brindes: BrindeItem[];
  valorTotalBrindes: number;
  // Soma Total do Kit
  valorTotalKit: number;
  // Pagamento
  formaPagamento: 'CARTAO' | 'BOLETO' | 'PIX' | 'DINHEIRO';
  // Cartão
  cartaoQtdParcelas?: number;
  cartaoBandeira?: string;
  cartaoNsu?: string;
  cartaoStatus?: string;
  // Boleto
  boletoQtdParcelas?: number;
  parcelasBoletos?: ParcelaBoleto[];
  // Produção & Gestão de Prazos por Etapa e Responsável
  statusProducao: 'EM_DIAGRAMACAO' | 'APROVACAO_CLIENTE' | 'EM_GRAFICA' | 'PRONTO_ENTREGA' | 'ENTREGUE';
  observacoes?: string;
  historicoObservacoes?: ObservacaoRegistro[];
  responsavelId?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  
  // Prazos específicos por etapa de produção
  prazoLayout?: string;            // YYYY-MM-DD (1. Criação de Layout)
  prazoAprovacaoCliente?: string;  // YYYY-MM-DD (2. Aprovação do Cliente)
  prazoConfeccao?: string;         // YYYY-MM-DD (3. Confecção do Álbum)
  
  prazoProducao?: string;          // YYYY-MM-DD
  concluidoEm?: string;            // Data DD/MM/AAAA em que foi finalizado
}

export interface RegistroExclusaoAlbum {
  id: string;
  vendaId: string;
  codigoPedido: string;
  alunoNome: string;
  alunoCpf: string;
  alunoTelefone?: string;
  alunoEmail?: string;
  turmaNome: string;
  modeloAlbum: string;
  valorTotalKit: number;
  formaPagamento: string;
  statusProducao: string;
  dataVenda: string;
  dataHoraExclusao: string;
  excluidoPorNome: string;
  excluidoPorEmail?: string;
  motivo: string;
  dadosVenda: VendaAlbum;
}

export function isClienteFicticio(v: any): boolean {
  if (!v) return false;
  const id = (v.id || '').toLowerCase().trim();
  const codigo = (v.codigoPedido || '').toUpperCase().trim();
  const nome = (v.alunoNome || '').toLowerCase().trim();
  const cpf = (v.alunoCpf || '').replace(/\D/g, '');

  if (id === 'venda-001' || id === 'venda-002' || id === 'venda-003') return true;
  if (codigo === 'ALB-2026-001' || codigo === 'ALB-2026-002' || codigo === 'ALB-2026-003') return true;
  if (nome.includes('gabriel santos') || nome.includes('amanda oliveira') || nome.includes('leonardo castro')) return true;
  if (cpf === '12345678900' || cpf === '98765432111' || cpf === '45678912322') return true;
  return false;
}

export interface StatusPrazo {
  atrasado: boolean;
  venceHoje: boolean;
  urgente: boolean;
  diasRestantes: number;
  texto: string;
  badgeClasse: string;
}

export function formatarDataBR(dataIso?: string): string {
  if (!dataIso) return 'Sem data';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataIso;
}

export function obterEtapaInfo(statusProducao: string): {
  id: string;
  nome: string;
  nomeCurto: string;
  corBadge: string;
  icone: string;
} {
  switch (statusProducao) {
    case 'EM_DIAGRAMACAO':
      return { id: 'LAYOUT', nome: '1. Criação de Layout', nomeCurto: 'Layout', corBadge: 'bg-blue-50 text-blue-700 border-blue-200', icone: '🎨' };
    case 'APROVACAO_CLIENTE':
      return { id: 'APROVACAO', nome: '2. Aprovação do Cliente', nomeCurto: 'Aprovação', corBadge: 'bg-amber-50 text-amber-800 border-amber-200', icone: '👤' };
    case 'EM_GRAFICA':
      return { id: 'CONFECCAO', nome: '3. Confecção do Álbum', nomeCurto: 'Confecção', corBadge: 'bg-purple-50 text-purple-700 border-purple-200', icone: '🏭' };
    case 'PRONTO_ENTREGA':
      return { id: 'PRONTO', nome: '4. Pronto p/ Entrega', nomeCurto: 'Pronto Entrega', corBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200', icone: '📦' };
    case 'ENTREGUE':
      return { id: 'ENTREGUE', nome: '5. Entregue / Concluído', nomeCurto: 'Entregue', corBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icone: '✅' };
    default:
      return { id: 'LAYOUT', nome: '1. Criação de Layout', nomeCurto: 'Layout', corBadge: 'bg-blue-50 text-blue-700 border-blue-200', icone: '🎨' };
  }
}

export function obterPrazoEtapaAtual(venda: VendaAlbum): {
  prazo?: string;
  etapaNome: string;
  etapaCurto: string;
  temPrazoDefinido: boolean;
} {
  const etapa = obterEtapaInfo(venda.statusProducao);
  let prazo: string | undefined = undefined;

  if (venda.statusProducao === 'EM_DIAGRAMACAO') {
    prazo = venda.prazoLayout || venda.prazoProducao;
  } else if (venda.statusProducao === 'APROVACAO_CLIENTE') {
    prazo = venda.prazoAprovacaoCliente;
  } else if (venda.statusProducao === 'EM_GRAFICA') {
    prazo = venda.prazoConfeccao;
  } else if (venda.statusProducao === 'PRONTO_ENTREGA') {
    prazo = venda.prazoProducao;
  }

  return {
    prazo,
    etapaNome: etapa.nome,
    etapaCurto: etapa.nomeCurto,
    temPrazoDefinido: !!prazo,
  };
}

export function calcularStatusPrazo(prazoEtapa?: string, statusProducao?: string, etapaNome?: string): StatusPrazo {
  if (statusProducao === 'ENTREGUE') {
    return {
      atrasado: false,
      venceHoje: false,
      urgente: false,
      diasRestantes: 0,
      texto: 'Concluído / Entregue',
      badgeClasse: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (statusProducao === 'PRONTO_ENTREGA') {
    return {
      atrasado: false,
      venceHoje: false,
      urgente: false,
      diasRestantes: 0,
      texto: 'Pronto p/ Entrega',
      badgeClasse: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold',
    };
  }

  const prefixoEtapa = etapaNome ? `${etapaNome}: ` : '';

  if (!prazoEtapa) {
    return {
      atrasado: false,
      venceHoje: false,
      urgente: false,
      diasRestantes: 999,
      texto: `${prefixoEtapa}Prazo em branco`,
      badgeClasse: 'bg-slate-100 text-slate-500 border-slate-200',
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const partes = prazoEtapa.split('-');
  if (partes.length !== 3) {
    return {
      atrasado: false,
      venceHoje: false,
      urgente: false,
      diasRestantes: 999,
      texto: `${prefixoEtapa}${prazoEtapa}`,
      badgeClasse: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const prazo = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  prazo.setHours(0, 0, 0, 0);

  const diffMs = prazo.getTime() - hoje.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    const dias = Math.abs(diffDias);
    return {
      atrasado: true,
      venceHoje: false,
      urgente: true,
      diasRestantes: diffDias,
      texto: `${prefixoEtapa}Atrasado há ${dias} ${dias === 1 ? 'dia' : 'dias'}!`,
      badgeClasse: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse',
    };
  }

  if (diffDias === 0) {
    return {
      atrasado: false,
      venceHoje: true,
      urgente: true,
      diasRestantes: 0,
      texto: `${prefixoEtapa}Vence HOJE!`,
      badgeClasse: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
    };
  }

  if (diffDias <= 3) {
    return {
      atrasado: false,
      venceHoje: false,
      urgente: true,
      diasRestantes: diffDias,
      texto: `${prefixoEtapa}Vence em ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`,
      badgeClasse: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  }

  return {
    atrasado: false,
    venceHoje: false,
    urgente: false,
    diasRestantes: diffDias,
    texto: `${prefixoEtapa}${diffDias} dias restantes`,
    badgeClasse: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
  };
}

const MODELOS_DISPONIVEIS: { modelo: ModeloAlbumTipo; descricao: string; valorSugerido: number; badgeColor: string }[] = [
  {
    modelo: 'Album premium',
    descricao: 'Capa Acrílica Cristal de alta resistência, laminação UV especial e estojo nobre.',
    valorSugerido: 3800,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    modelo: 'Album Preto',
    descricao: 'Design clássico em couro nobre preto, cantoneiras metálicas e gravação a laser.',
    valorSugerido: 3200,
    badgeColor: 'bg-slate-900 text-white border-slate-700',
  },
  {
    modelo: 'Album Slim',
    descricao: 'Lâminas ultrafinas e rígidas, abertura 180° panorâmica, leve e contemporâneo.',
    valorSugerido: 2400,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    modelo: 'Album Colégio',
    descricao: 'Especial para formaturas escolares e ensino médio, diagramação alegre com fotos da turma.',
    valorSugerido: 1900,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

const BRINDES_DISPONIVEIS: { nome: BrindeTipo; descricao: string; valorPadrao: number; icone: any }[] = [
  {
    nome: 'Quadro 30x60',
    descricao: 'Moldura caixa alta com vidro antirreflexo e foto solene do formando',
    valorPadrao: 0,
    icone: ImageIcon,
  },
  {
    nome: 'Trio de quadros',
    descricao: 'Conjunto de 3 quadros decorativos 20x30 (beca, baile e família)',
    valorPadrao: 0,
    icone: Layers,
  },
  {
    nome: 'Link de fotos',
    descricao: 'Acesso vitalício à galeria digital com todas as fotos em alta resolução 4K',
    valorPadrao: 0,
    icone: Link2,
  },
  {
    nome: 'Diploma acrilico',
    descricao: 'Display de mesa em acrílico espelhado com gravação do nome e curso',
    valorPadrao: 0,
    icone: Award,
  },
];

const VENDAS_INICIAIS: VendaAlbum[] = [];

export const PERIODOS_DISPONIVEIS: string[] = [
  '2025.2',
  '2026.1',
  '2026.2',
  '2027.1',
  '2027.2',
  '2028.1',
  '2028.2',
  '2029.1',
  '2029.2',
  '2030.1',
  '2030.2',
  '2031.1',
  '2031.2',
  '2032.1',
  '2032.2',
];

export const formatarLabelPeriodo = (periodo: string): string => {
  const partes = periodo.split('.');
  const ano = partes[0];
  const sem = partes[1] === '1' ? '1º Semestre' : partes[1] === '2' ? '2º Semestre' : '';
  return sem ? `${periodo} (${sem} ${ano})` : periodo;
};

export default function VendasAlbunsPage() {
  const [vendas, setVendas] = useState<VendaAlbum[]>(VENDAS_INICIAIS);
  const [busca, setBusca] = useState('');
  const [filtroModelo, setFiltroModelo] = useState<string>('TODOS');
  const [filtroPagamento, setFiltroPagamento] = useState<'TODOS' | 'CARTAO' | 'BOLETO' | 'A_VISTA' | 'PIX' | 'DINHEIRO'>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroInstituicao, setFiltroInstituicao] = useState<string>('TODAS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('TODOS');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('TODOS');
  const [filtroPrazo, setFiltroPrazo] = useState<string>('TODOS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modo de Exibição das Métricas: Por Período Selecionado ou Total Geral Consolidado
  const [visaoMetricas, setVisaoMetricas] = useState<'FILTRO_PERIODO' | 'TOTAL_GERAL'>('FILTRO_PERIODO');

  // Usuário Logado e Usuários do Sistema para Atribuição de Responsáveis
  const [usuarioLogado, setUsuarioLogado] = useState<{
    nome: string;
    email: string;
    perfil: string;
  } | null>(null);
  const [usuariosSistema, setUsuariosSistema] = useState<UsuarioSistema[]>([]);

  // Estados de Alerta de Prazos Vencidos
  const [modalAlertaPrazoAberto, setModalAlertaPrazoAberto] = useState(false);
  const [alertaJaExibidoSessao, setAlertaJaExibidoSessao] = useState(false);

  // Modal de Edição Rápida de Responsável e Prazos por Etapa
  const [vendaEditandoPrazo, setVendaEditandoPrazo] = useState<VendaAlbum | null>(null);
  const [editResponsavelNome, setEditResponsavelNome] = useState('');
  const [editResponsavelEmail, setEditResponsavelEmail] = useState('');
  const [editStatusProducao, setEditStatusProducao] = useState<VendaAlbum['statusProducao']>('EM_DIAGRAMACAO');
  const [editPrazoLayout, setEditPrazoLayout] = useState('');
  const [editPrazoAprovacao, setEditPrazoAprovacao] = useState('');
  const [editPrazoConfeccao, setEditPrazoConfeccao] = useState('');
  const [editPrazoProducao, setEditPrazoProducao] = useState('');

  // Instituições e Cursos Cadastrados
  const [instituicoesCadastradas, setInstituicoesCadastradas] = useState<Instituicao[]>([]);
  const [cursosCadastrados, setCursosCadastrados] = useState<Curso[]>([]);
  const [opcoesTurmas, setOpcoesTurmas] = useState<OpcaoTurmaFaculdade[]>([]);

  // Estados dos Modais
  const [modalNovaVendaAberto, setModalNovaVendaAberto] = useState(false);
  const [modalHomologacaoSicrediAberto, setModalHomologacaoSicrediAberto] = useState(false);
  const [abaSicredi, setAbaSicredi] = useState<'REMESSA' | 'RETORNO' | 'MODELO'>('REMESSA');
  const [sequencialRemessaAtual, setSequencialRemessaAtual] = useState<number>(123);
  const [resultadoRetornoSicredi, setResultadoRetornoSicredi] = useState<RetornoSicrediResultado | null>(null);
  const [processandoRetorno, setProcessandoRetorno] = useState(false);
  const [vendaSelecionadaBoletos, setVendaSelecionadaBoletos] = useState<VendaAlbum | null>(null);
  const [vendaSelecionadaCartao, setVendaSelecionadaCartao] = useState<VendaAlbum | null>(null);
  const [copiadoIdx, setCopiadoIdx] = useState<string | null>(null);

  // Estados da API Sicredi Cobrança Online
  const [registrandoApi, setRegistrandoApi] = useState(false);
  const [testandoConexaoApi, setTestandoConexaoApi] = useState(false);
  const [statusApiSicredi, setStatusApiSicredi] = useState<'DESCONHECIDO' | 'CONECTADO' | 'ERRO'>('CONECTADO');

  // Auditoria e Registro de Segurança de Exclusões de Álbuns
  const [registrosExclusoes, setRegistrosExclusoes] = useState<RegistroExclusaoAlbum[]>([]);
  const [modalExclusaoSeguraAberto, setModalExclusaoSeguraAberto] = useState(false);
  const [modalAuditoriaAberto, setModalAuditoriaAberto] = useState(false);
  const [modalIaFacialAberto, setModalIaFacialAberto] = useState(false);
  const [vendaParaExcluir, setVendaParaExcluir] = useState<VendaAlbum | null>(null);
  const [motivoExclusaoTipo, setMotivoExclusaoTipo] = useState<string>('Desistência formal do formando');
  const [motivoExclusaoDetalhe, setMotivoExclusaoDetalhe] = useState<string>('');

  // Estados para Modal de Edição / Correção de Pagamento
  const [modalEditarPagamentoAberto, setModalEditarPagamentoAberto] = useState(false);
  const [vendaParaEditarPagamento, setVendaParaEditarPagamento] = useState<VendaAlbum | null>(null);
  const [editFormaPagamento, setEditFormaPagamento] = useState<'BOLETO' | 'CARTAO' | 'PIX' | 'DINHEIRO'>('BOLETO');
  const [editValorTotalKit, setEditValorTotalKit] = useState<string>('0');
  const [editBoletoParcelas, setEditBoletoParcelas] = useState<number>(6);
  const [editPrimeiroVencimento, setEditPrimeiroVencimento] = useState<string>('');
  const [editCartaoParcelas, setEditCartaoParcelas] = useState<number>(1);
  const [editCartaoBandeira, setEditCartaoBandeira] = useState<string>('Mastercard');
  const [editCartaoNsu, setEditCartaoNsu] = useState<string>('');

  // Estados para Modal de Correção de Valor Total (Lápis do Valor)
  const [modalEditarValorTotalAberto, setModalEditarValorTotalAberto] = useState(false);
  const [vendaEditandoValorTotal, setVendaEditandoValorTotal] = useState<VendaAlbum | null>(null);
  const [novoValorTotalInput, setNovoValorTotalInput] = useState<string>('');
  const [recalcularParcelasBoleto, setRecalcularParcelasBoleto] = useState<boolean>(true);

  // Estados para Modal de Correção de Brindes e Modelo do Álbum (Lápis dos Brindes)
  const [modalEditarBrindesAberto, setModalEditarBrindesAberto] = useState(false);
  const [vendaEditandoBrindes, setVendaEditandoBrindes] = useState<VendaAlbum | null>(null);
  const [editModeloAlbum, setEditModeloAlbum] = useState<ModeloAlbumTipo>('Album premium');
  const [editListaBrindes, setEditListaBrindes] = useState<BrindeItem[]>([]);
  const [novoBrindeNome, setNovoBrindeNome] = useState<string>('');
  const [novoBrindeValor, setNovoBrindeValor] = useState<string>('0');

  // Estados para Modal / Aba de Observações do Formando (Clique no Nome)
  const [modalObservacoesAberto, setModalObservacoesAberto] = useState(false);
  const [vendaObservacoes, setVendaObservacoes] = useState<VendaAlbum | null>(null);
  const [abaObservacoesAtiva, setAbaObservacoesAtiva] = useState<'NOTAS' | 'CADASTRO' | 'PEDIDO'>('NOTAS');
  const [textoNovaObservacao, setTextoNovaObservacao] = useState<string>('');
  const [textoObservacoesGerais, setTextoObservacoesGerais] = useState<string>('');

  // Estados para Edição Rápida de Telefone WhatsApp do Formando (no Carnê ou Prontuário)
  const [editandoTelefoneVendaId, setEditandoTelefoneVendaId] = useState<string | null>(null);
  const [novoTelefoneInput, setNovoTelefoneInput] = useState<string>('');

  // Estados para Modal de Quitação Manual de Parcelas (Image 4)
  const [modalQuitarParcelaAberto, setModalQuitarParcelaAberto] = useState(false);
  const [quitacaoVenda, setQuitacaoVenda] = useState<VendaAlbum | null>(null);
  const [quitacaoParcela, setQuitacaoParcela] = useState<ParcelaBoleto | null>(null);
  const [quitacaoLocalPag, setQuitacaoLocalPag] = useState<string>('PIX Direto');
  const [quitacaoFormaPag, setQuitacaoFormaPag] = useState<string>('PIX Direto');
  const [quitacaoConta, setQuitacaoConta] = useState<string>('Sicredi C/C');
  const [quitacaoNotas, setQuitacaoNotas] = useState<string>('');
  const [quitacaoDataPag, setQuitacaoDataPag] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [quitacaoDataCredito, setQuitacaoDataCredito] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [quitacaoDesconto, setQuitacaoDesconto] = useState<number>(0);
  const [quitacaoValorPago, setQuitacaoValorPago] = useState<number>(0);

  // Estados para Modal de Ajuste de Parcelas em Lote / Renegociação (Image 3)
  const [modalRenegociarParcelasAberto, setModalRenegociarParcelasAberto] = useState(false);
  const [renegociarVenda, setRenegociarVenda] = useState<VendaAlbum | null>(null);
  const [renegociarCheckValores, setRenegociarCheckValores] = useState(false);
  const [renegociarTipoAjuste, setRenegociarTipoAjuste] = useState<
    'SELECIONE' | 'ACRESCIMO_PORC' | 'ACRESCIMO_VAL' | 'DECRESCIMO_PORC' | 'DECRESCIMO_VAL' | 'NOVO_VALOR' | 'REDIVIDIR_SALDO'
  >('SELECIONE');
  const [renegociarValorAjuste, setRenegociarValorAjuste] = useState<number>(0);
  const [renegociarCheckDatas, setRenegociarCheckDatas] = useState(false);
  const [renegociarNovaDataPrimeira, setRenegociarNovaDataPrimeira] = useState<string>('');
  const [renegociarCheckQtdParcelas, setRenegociarCheckQtdParcelas] = useState(false);
  const [renegociarNovaQtdParcelas, setRenegociarNovaQtdParcelas] = useState<number>(6);

  // Menu de Opções no Carnê (Image 2)
  const [menuOpcoesCarneAberto, setMenuOpcoesCarneAberto] = useState(false);

  // Estados para Integração WhatsApp da Agência & Lembretes Automáticos
  const [modalWhatsAppAberto, setModalWhatsAppAberto] = useState(false);
  const [whatsAppConectado, setWhatsAppConectado] = useState(false);
  const [whatsAppNumero, setWhatsAppNumero] = useState('');
  const [whatsAppProvedor, setWhatsAppProvedor] = useState('evolution');
  const [whatsAppApiUrl, setWhatsAppApiUrl] = useState('https://assistente-zap-evolution-api.cla6w1.easypanel.host');
  const [whatsAppApiKey, setWhatsAppApiKey] = useState('429683C4C977415CAAFCCE10F7D57E11');
  const [whatsAppInstancia, setWhatsAppInstancia] = useState('on-cobranca');
  const [whatsAppLembreteAtivo, setWhatsAppLembreteAtivo] = useState(true);
  const [whatsAppRodape, setWhatsAppRodape] = useState(
    '_(Mensagem automática da ON Agência de Eventos • Canal exclusivo para avisos, favor não responder)_'
  );
  const [whatsAppChavePix, setWhatsAppChavePix] = useState('30.988.070/0001-60');
  const [whatsAppNomeBeneficiarioPix, setWhatsAppNomeBeneficiarioPix] = useState('ON EVENTOS LTDA');
  const [whatsAppCidadePix, setWhatsAppCidadePix] = useState('SAO PAULO');
  const [enviandoZap, setEnviandoZap] = useState<string | null>(null);
  const [executandoLembretesZap, setExecutandoLembretesZap] = useState(false);
  const [ultimoScanLembretes, setUltimoScanLembretes] = useState<string>('');
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('');
  const [carregandoQrCode, setCarregandoQrCode] = useState<boolean>(false);
  const [telefoneTesteZap, setTelefoneTesteZap] = useState<string>('');
  const [testandoZap, setTestandoZap] = useState<boolean>(false);

  // Formulário Nova Venda: Configuração do Kit
  const [formAbaAtiva, setFormAbaAtiva] = useState<'ALBUM' | 'BRINDES' | 'PAGAMENTO'>('ALBUM');
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Responsável & Prazos por Etapa no Formulário
  const [formResponsavelNome, setFormResponsavelNome] = useState('');
  const [formResponsavelEmail, setFormResponsavelEmail] = useState('');
  const [formPrazoLayout, setFormPrazoLayout] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [formPrazoAprovacao, setFormPrazoAprovacao] = useState('');
  const [formPrazoConfeccao, setFormPrazoConfeccao] = useState('');
  const [formPrazoProducao, setFormPrazoProducao] = useState('');

  // Instituição, Curso & Período no Formulário
  const [formInstituicaoNome, setFormInstituicaoNome] = useState('');
  const [formInstituicaoBusca, setFormInstituicaoBusca] = useState('');
  const [dropdownInstAberto, setDropdownInstAberto] = useState(false);
  const [formCursoNome, setFormCursoNome] = useState('Direito');
  const [formPeriodo, setFormPeriodo] = useState('2025.2');
  const [formTurma, setFormTurma] = useState('Direito Mackenzie 2027.1');
  const [isOutraTurma, setIsOutraTurma] = useState(false);
  const [turmaManual, setTurmaManual] = useState('');

  // Seleção de Modelo de Álbum
  const [formModeloAlbum, setFormModeloAlbum] = useState<ModeloAlbumTipo>('Album premium');
  const [formValorAlbum, setFormValorAlbum] = useState('3800');

  // Seleção de Brindes do Kit
  const [formBrindes, setFormBrindes] = useState<BrindeItem[]>([
    { id: 'b1', nome: 'Quadro 30x60', descricao: 'Moldura caixa alta com foto solene', selecionado: true, valorAdicional: 0 },
    { id: 'b2', nome: 'Trio de quadros', descricao: 'Conjunto de 3 quadros decorativos 20x30', selecionado: false, valorAdicional: 0 },
    { id: 'b3', nome: 'Link de fotos', descricao: 'Acesso vitalício à galeria digital em 4K', selecionado: true, valorAdicional: 0 },
    { id: 'b4', nome: 'Diploma acrilico', descricao: 'Display em acrílico espelhado com gravação', selecionado: false, valorAdicional: 0 },
  ]);

  // Pagamento
  const [formFormaPagamento, setFormFormaPagamento] = useState<'CARTAO' | 'BOLETO' | 'PIX' | 'DINHEIRO'>('CARTAO');
  const [formCartaoParcelas, setFormCartaoParcelas] = useState('10');
  const [formCartaoBandeira, setFormCartaoBandeira] = useState('Mastercard');
  const [formCartaoNsu, setFormCartaoNsu] = useState('');
  const [formBoletoParcelas, setFormBoletoParcelas] = useState('6');
  const [formPrimeiroVencimento, setFormPrimeiroVencimento] = useState('2026-11-15');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Cálculo da Soma Total do Kit em Tempo Real
  const numValorAlbum = parseFloat(formValorAlbum) || 0;
  const numValorBrindes = formBrindes
    .filter((b) => b.selecionado)
    .reduce((acc, b) => acc + (b.valorAdicional || 0), 0);
  const somaTotalKit = numValorAlbum + numValorBrindes;

  // Carregar vendas centralizadas da nuvem e sincronizar com localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Carrega logs de exclusões salvos localmente
      try {
        const logsSalvos = localStorage.getItem('on_registro_exclusoes_albuns_v1');
        if (logsSalvos) {
          const parsedLogs = JSON.parse(logsSalvos);
          if (Array.isArray(parsedLogs)) {
            setRegistrosExclusoes(parsedLogs);
          }
        }
      } catch (e) {}

      // 2. Carrega vendas locais expurgando imediatamente clientes fictícios
      try {
        const salvo = localStorage.getItem('on_vendas_albuns_estado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed)) {
            const limpas = parsed.filter((v: any) => !isClienteFicticio(v));
            setVendas(limpas);
            localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(limpas));
          }
        }
      } catch (e) {}

      // 3. Sincroniza em tempo real com o banco de dados centralizado no servidor
      fetch('/vendas.php')
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao obter vendas');
          return res.json();
        })
        .then((dadosServidor) => {
          if (Array.isArray(dadosServidor)) {
            const limpas = dadosServidor.filter((v: any) => !isClienteFicticio(v));
            setVendas(limpas);
            try {
              localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(limpas));
            } catch (e) {}
          }
        })
        .catch(() => {});

      // 4. Carrega logs de auditoria do servidor
      fetch('/vendas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_deleted_logs' }),
      })
        .then((res) => res.json())
        .then((dados) => {
          if (dados && Array.isArray(dados.logsExclusoes)) {
            setRegistrosExclusoes(dados.logsExclusoes);
            try {
              localStorage.setItem('on_registro_exclusoes_albuns_v1', JSON.stringify(dados.logsExclusoes));
            } catch (e) {}
          }
        })
        .catch(() => {});

      // 5. Sincroniza baixas automáticas em tempo real com a API Sicredi
      const syncBaixasSicredi = () => {
        fetch('/sicredi_api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sincronizar_baixas' }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.sucesso && Array.isArray(d.vendas)) {
              const limpas = d.vendas.filter((v: any) => !isClienteFicticio(v));
              setVendas(limpas);
              try {
                localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(limpas));
              } catch (e) {}

              // Auto-registra silenciosamente qualquer parcela pendente que ainda não foi pro Sicredi
              limpas.forEach((v: VendaAlbum) => {
                if (v.formaPagamento === 'BOLETO' && v.parcelasBoletos?.some((p) => !p.registradoSicredi)) {
                  fetch('/sicredi_api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'emitir_todas_parcelas_venda', vendaId: v.id, venda: v }),
                  })
                    .then((r) => r.json())
                    .then((resReg) => {
                      if (resReg.sucesso && resReg.venda) {
                        setVendas((prev) => prev.map((item) => (item.id === v.id ? resReg.venda : item)));
                      }
                    })
                    .catch(() => {});
                }
              });
            }
          })
          .catch(() => {});
      };

      // 6. Carrega configurações do WhatsApp da Agência
      fetch('/whatsapp_api.php?action=get_config')
        .then((r) => r.json())
        .then((d) => {
          if (d.sucesso && d.config) {
            setWhatsAppConectado(d.config.status === 'conectado');
            if (d.config.numeroConectado) setWhatsAppNumero(d.config.numeroConectado);
            if (d.config.provedor) setWhatsAppProvedor(d.config.provedor);
            if (d.config.apiUrl) setWhatsAppApiUrl(d.config.apiUrl);
            if (d.config.apiKey) setWhatsAppApiKey(d.config.apiKey);
            if (d.config.instancia) setWhatsAppInstancia(d.config.instancia);
            if (d.config.chavePix) setWhatsAppChavePix(d.config.chavePix);
            if (d.config.nomeBeneficiarioPix) setWhatsAppNomeBeneficiarioPix(d.config.nomeBeneficiarioPix);
            if (d.config.cidadePix) setWhatsAppCidadePix(d.config.cidadePix);
            if (typeof d.config.lembreteAutomaticoAtivo === 'boolean') {
              setWhatsAppLembreteAtivo(d.config.lembreteAutomaticoAtivo);
            }
            if (d.config.rodapeAviso) setWhatsAppRodape(d.config.rodapeAviso);
            if (d.config.ultimoScanLembretes) setUltimoScanLembretes(d.config.ultimoScanLembretes);
          }
        })
        .catch(() => {});

      syncBaixasSicredi();
      const intervalId = setInterval(syncBaixasSicredi, 40000);
      return () => clearInterval(intervalId);
    }
  }, []);

  const salvarVendasLocal = (novas: VendaAlbum[]) => {
    const limpas = novas.filter((v) => !isClienteFicticio(v));
    setVendas(limpas);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(limpas));
        fetch('/vendas.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', vendas: limpas }),
        }).catch(() => {});
      } catch (e) {}
    }
  };

  // Se a página for aberta em nova aba com ?alunoId=..., abre automaticamente o prontuário/observações
  useEffect(() => {
    if (typeof window !== 'undefined' && vendas.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const alunoId = params.get('alunoId');
      if (alunoId && !vendaObservacoes) {
        const encontrada = vendas.find((x) => x.id === alunoId || x.codigoPedido === alunoId);
        if (encontrada) {
          abrirModalObservacoes(encontrada);
        }
      }
    }
  }, [vendas, vendaObservacoes]);

  // Sanitiza parcelas existentes para garantir que códigos PIX mock sejam convertidos para PIX oficial com CRC16
  useEffect(() => {
    if (vendas.length > 0) {
      let precisaAtualizar = false;
      const atualizadas = vendas.map((v) => {
        if (v.parcelasBoletos && v.parcelasBoletos.some((p) => !p.codigoPix || p.codigoPix.includes('e4b8c9f0'))) {
          precisaAtualizar = true;
          const novasP = v.parcelasBoletos.map((p) => {
            if (!p.codigoPix || p.codigoPix.includes('e4b8c9f0')) {
              return {
                ...p,
                codigoPix: gerarCodigoPixOficial('30988070000160', 'ON EVENTOS LTDA', 'SAO PAULO', p.valor, '***'),
              };
            }
            return p;
          });
          return { ...v, parcelasBoletos: novasP };
        }
        return v;
      });
      if (precisaAtualizar) {
        salvarVendasLocal(atualizadas);
      }
    }
  }, [vendas.length]);

  // Abrir modal de confirmação com auditoria para excluir um álbum
  const abrirModalExclusaoSegura = (venda: VendaAlbum) => {
    setVendaParaExcluir(venda);
    setMotivoExclusaoTipo('Desistência formal do formando');
    setMotivoExclusaoDetalhe('');
    setModalExclusaoSeguraAberto(true);
  };

  // Confirmar exclusão com registro de segurança
  const handleConfirmarExclusaoSegura = () => {
    if (!vendaParaExcluir) return;

    const agora = new Date();
    const dataHoraStr = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const motivoFinal = motivoExclusaoDetalhe.trim()
      ? `${motivoExclusaoTipo} - ${motivoExclusaoDetalhe.trim()}`
      : motivoExclusaoTipo;

    const novoLog: RegistroExclusaoAlbum = {
      id: `log_del_${Date.now()}`,
      vendaId: vendaParaExcluir.id,
      codigoPedido: vendaParaExcluir.codigoPedido,
      alunoNome: vendaParaExcluir.alunoNome,
      alunoCpf: vendaParaExcluir.alunoCpf,
      alunoTelefone: vendaParaExcluir.alunoTelefone,
      alunoEmail: vendaParaExcluir.alunoEmail,
      turmaNome: vendaParaExcluir.turmaNome,
      modeloAlbum: vendaParaExcluir.modeloAlbum,
      valorTotalKit: vendaParaExcluir.valorTotalKit,
      formaPagamento: vendaParaExcluir.formaPagamento,
      statusProducao: vendaParaExcluir.statusProducao,
      dataVenda: vendaParaExcluir.dataVenda,
      dataHoraExclusao: dataHoraStr,
      excluidoPorNome: usuarioLogado?.nome || 'Administrador',
      excluidoPorEmail: usuarioLogado?.email || '',
      motivo: motivoFinal,
      dadosVenda: vendaParaExcluir,
    };

    const novasVendas = vendas.filter((v) => v.id !== vendaParaExcluir.id);
    const novosLogs = [novoLog, ...registrosExclusoes];

    setVendas(novasVendas);
    setRegistrosExclusoes(novosLogs);
    setModalExclusaoSeguraAberto(false);
    setVendaParaExcluir(null);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(novasVendas));
        localStorage.setItem('on_registro_exclusoes_albuns_v1', JSON.stringify(novosLogs));
        fetch('/vendas.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_with_log',
            id: novoLog.vendaId,
            log: novoLog,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    showToast(`Álbum de ${novoLog.alunoNome} excluído e registrado no Histórico de Segurança!`);
  };

  // Restaurar venda excluída de volta para a lista ativa
  const handleRestaurarVenda = (logId: string) => {
    const log = registrosExclusoes.find((l) => l.id === logId);
    if (!log || !log.dadosVenda) return;

    const restaurada = log.dadosVenda;
    const novasVendas = [restaurada, ...vendas.filter((v) => v.id !== restaurada.id)];
    const novosLogs = registrosExclusoes.filter((l) => l.id !== logId);

    setVendas(novasVendas);
    setRegistrosExclusoes(novosLogs);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(novasVendas));
        localStorage.setItem('on_registro_exclusoes_albuns_v1', JSON.stringify(novosLogs));
        fetch('/vendas.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore', logId }),
        }).catch(() => {});
      } catch (e) {}
    }

    showToast(`Álbum de ${restaurada.alunoNome} RESTAURADO com sucesso!`);
  };

  const handleExcluirVenda = (vendaId: string) => {
    const v = vendas.find((x) => x.id === vendaId);
    if (v) {
      abrirModalExclusaoSegura(v);
    }
  };

  const handleZerarVendas = () => {
    if (confirm('Tem certeza que deseja ZERAR todas as vendas de álbuns? Esta ação limpará todo o histórico para que você cadastre do zero.')) {
      salvarVendasLocal([]);
      showToast('Todas as vendas foram limpas com sucesso!');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper para padronizar e extrair Instituição e Período de qualquer venda (inclusive legadas)
  const extrairInfoTurma = React.useCallback(
    (venda: VendaAlbum) => {
      let instNome = venda.instituicaoNome?.trim() || '';
      let per = venda.periodo?.trim() || '';

      // Se não tiver período explícito, tentar extrair da turmaNome (ex: 2025.2, 2026.1, 2027.2)
      if (!per && venda.turmaNome) {
        const matchPer = venda.turmaNome.match(/\b((?:202[0-9]|203[0-9])(?:\.[1-2]|\/[1-2])?)\b/);
        if (matchPer) {
          per = matchPer[1].replace('/', '.');
        }
      }

      // Se não tiver instituição explícita, identificar por cruzamento
      if (!instNome && venda.turmaNome) {
        const turmaUpper = venda.turmaNome.toUpperCase();
        for (const inst of instituicoesCadastradas) {
          if (
            turmaUpper.includes(inst.nome.toUpperCase()) ||
            (inst.sigla && turmaUpper.includes(inst.sigla.toUpperCase()))
          ) {
            instNome = inst.nome;
            break;
          }
        }

        if (!instNome) {
          if (turmaUpper.includes('MACKENZIE')) instNome = 'Universidade Presbiteriana Mackenzie';
          else if (turmaUpper.includes('USP')) instNome = 'Universidade de São Paulo (USP)';
          else if (turmaUpper.includes('FGV')) instNome = 'Fundação Getulio Vargas (FGV)';
          else if (turmaUpper.includes('ANHEMBI')) instNome = 'Universidade Anhembi Morumbi';
          else if (turmaUpper.includes('PUC')) instNome = 'Pontifícia Universidade Católica (PUC)';
          else if (turmaUpper.includes('FMU')) instNome = 'FMU - Centro Universitário';
          else if (turmaUpper.includes('ESPM')) instNome = 'ESPM São Paulo';
          else if (turmaUpper.includes('SANTA MARCELINA')) instNome = 'Faculdade Santa Marcelina';
          else {
            instNome = venda.turmaNome;
          }
        }
      }

      return {
        instituicao: instNome || 'Geral / Outros',
        periodo: per || '2027.1',
      };
    },
    [instituicoesCadastradas]
  );

  // Lista única de todas as instituições para o filtro
  const todasInstituicoesParaFiltro = React.useMemo(() => {
    const mapInst = new Map<string, number>();

    // 1. Inclui todas as cadastradas no sistema
    instituicoesCadastradas.forEach((inst) => {
      mapInst.set(inst.nome, 0);
    });

    // 2. Contabiliza vendas por instituição (incluindo qualquer instituição digitada)
    vendas.forEach((v) => {
      const info = extrairInfoTurma(v);
      const atual = mapInst.get(info.instituicao) || 0;
      mapInst.set(info.instituicao, atual + 1);
    });

    return Array.from(mapInst.entries()).map(([nome, total]) => ({ nome, total }));
  }, [instituicoesCadastradas, vendas, extrairInfoTurma]);

  // Lista única de todos os períodos para o filtro
  const todosPeriodosParaFiltro = React.useMemo(() => {
    const mapPer = new Map<string, number>();

    // Períodos padrões de referência de 2025.2 em diante
    PERIODOS_DISPONIVEIS.forEach((p) => mapPer.set(p, 0));

    // Contabiliza períodos das vendas
    vendas.forEach((v) => {
      const info = extrairInfoTurma(v);
      const atual = mapPer.get(info.periodo) || 0;
      mapPer.set(info.periodo, atual + 1);
    });

    return Array.from(mapPer.entries()).map(([periodo, total]) => ({ periodo, total }));
  }, [vendas, extrairInfoTurma]);

  // Cursos da instituição selecionada para sugestão rápida
  const cursosDaInstituicaoSelecionada = React.useMemo(() => {
    if (!formInstituicaoNome) return [];
    const inst = instituicoesCadastradas.find(
      (i) => i.nome.toLowerCase() === formInstituicaoNome.toLowerCase()
    );
    if (!inst) return [];
    return cursosCadastrados.filter((c) => c.instituicaoId === inst.id);
  }, [formInstituicaoNome, instituicoesCadastradas, cursosCadastrados]);

  // Carregar turmas, instituições, cursos e usuários do sistema
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const usuarioSalvo = localStorage.getItem('on_usuario_logado');
        if (usuarioSalvo) {
          const parsed = JSON.parse(usuarioSalvo);
          if (parsed && parsed.nome) {
            setUsuarioLogado(parsed);
            setFormResponsavelNome(parsed.nome);
            setFormResponsavelEmail(parsed.email || '');
          }
        }
      } catch (e) {}

      // Carregar usuários ativos do sistema
      const usersLocais = getUsuarios().filter((u) => u.status === 'ATIVO');
      setUsuariosSistema(usersLocais);
      sincronizarUsuariosServidor()
        .then((res) => {
          if (res && res.usuarios) {
            setUsuariosSistema(res.usuarios.filter((u) => u.status === 'ATIVO'));
          }
        })
        .catch(() => {});
    }

    const insts = getInstituicoes();
    const cur = getCursos();
    const opcoes = getOpcoesTurmasFaculdades();
    setInstituicoesCadastradas(insts);
    setCursosCadastrados(cur);
    setOpcoesTurmas(opcoes);

    if (insts.length > 0 && !formInstituicaoNome) {
      setFormInstituicaoNome(insts[0].nome);
      setFormInstituicaoBusca(insts[0].nome);
    }

    sincronizarInstituicoesServidor()
      .then((resultado) => {
        if (resultado && resultado.instituicoes) {
          setInstituicoesCadastradas(resultado.instituicoes);
          setCursosCadastrados(resultado.cursos);
          const atualizadas = getOpcoesTurmasFaculdades();
          setOpcoesTurmas(atualizadas);
          if (resultado.instituicoes.length > 0 && !formInstituicaoNome) {
            setFormInstituicaoNome(resultado.instituicoes[0].nome);
            setFormInstituicaoBusca(resultado.instituicoes[0].nome);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Lista de álbuns com prazo atrasado (relevantes para o usuário ou admin)
  const albunsAtrasados = React.useMemo(() => {
    return vendas.filter((v) => {
      if (v.statusProducao === 'ENTREGUE') return false;
      const infoEtapa = obterPrazoEtapaAtual(v);
      if (!infoEtapa.prazo) return false;
      const st = calcularStatusPrazo(infoEtapa.prazo, v.statusProducao, infoEtapa.etapaCurto);
      if (!st.atrasado) return false;

      // Se for admin, visualiza todos os atrasados da agência.
      // Se for usuário regular, visualiza aqueles atribuídos a ele ou sem responsável.
      if (!usuarioLogado) return true;
      const isAdmin = usuarioLogado.perfil?.toUpperCase().includes('ADMIN');
      if (isAdmin) return true;

      const isMeu =
        !v.responsavelNome ||
        v.responsavelNome.toLowerCase() === usuarioLogado.nome.toLowerCase() ||
        (v.responsavelEmail &&
          usuarioLogado.email &&
          v.responsavelEmail.toLowerCase() === usuarioLogado.email.toLowerCase());

      return isMeu;
    });
  }, [vendas, usuarioLogado]);

  // Alerta insistente: aciona o modal na entrada da página caso haja atrasos pendentes
  useEffect(() => {
    if (albunsAtrasados.length > 0 && !alertaJaExibidoSessao) {
      setModalAlertaPrazoAberto(true);
      setAlertaJaExibidoSessao(true);
    }
  }, [albunsAtrasados, alertaJaExibidoSessao]);

  // Ação de Concluir Produção e Finalizar Processo
  const handleConcluirProducao = (vendaId: string) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaId) {
        return {
          ...v,
          statusProducao: 'ENTREGUE' as const,
          concluidoEm: hoje,
        };
      }
      return v;
    });
    salvarVendasLocal(atualizadas);
    showToast('Processo do álbum CONCLUÍDO e entregue com sucesso! Alerta encerrado.');
  };

  // Ação de Estender o Prazo da etapa atual (+7d, +15d, etc.)
  const handleEstenderPrazo = (vendaId: string, diasExtras: number) => {
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaId) {
        const d = new Date();
        d.setDate(d.getDate() + diasExtras);
        const novoPrazo = d.toISOString().split('T')[0];

        if (v.statusProducao === 'EM_DIAGRAMACAO') {
          return { ...v, prazoLayout: novoPrazo, prazoProducao: novoPrazo };
        } else if (v.statusProducao === 'APROVACAO_CLIENTE') {
          return { ...v, prazoAprovacaoCliente: novoPrazo, prazoProducao: novoPrazo };
        } else if (v.statusProducao === 'EM_GRAFICA') {
          return { ...v, prazoConfeccao: novoPrazo, prazoProducao: novoPrazo };
        }

        return {
          ...v,
          prazoProducao: novoPrazo,
        };
      }
      return v;
    });
    salvarVendasLocal(atualizadas);
    showToast(`Prazo da etapa prorrogado em +${diasExtras} dias com sucesso!`);
  };

  // Abrir modal de edição de responsável e prazos por etapa
  const abrirModalEditarPrazo = (venda: VendaAlbum) => {
    setVendaEditandoPrazo(venda);
    setEditResponsavelNome(venda.responsavelNome || usuarioLogado?.nome || '');
    setEditResponsavelEmail(venda.responsavelEmail || usuarioLogado?.email || '');
    setEditStatusProducao(venda.statusProducao || 'EM_DIAGRAMACAO');
    setEditPrazoLayout(venda.prazoLayout || (venda.statusProducao === 'EM_DIAGRAMACAO' ? venda.prazoProducao : '') || '');
    setEditPrazoAprovacao(venda.prazoAprovacaoCliente || (venda.statusProducao === 'APROVACAO_CLIENTE' ? venda.prazoProducao : '') || '');
    setEditPrazoConfeccao(venda.prazoConfeccao || (venda.statusProducao === 'EM_GRAFICA' ? venda.prazoProducao : '') || '');
    setEditPrazoProducao(venda.prazoProducao || '');
  };
  const abrirModalEdicaoPrazo = abrirModalEditarPrazo;

  // Salvar alterações de responsável e prazos por etapa
  const handleSalvarEdicaoPrazo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaEditandoPrazo) return;

    let prazoAtivo = '';
    if (editStatusProducao === 'EM_DIAGRAMACAO') prazoAtivo = editPrazoLayout;
    else if (editStatusProducao === 'APROVACAO_CLIENTE') prazoAtivo = editPrazoAprovacao;
    else if (editStatusProducao === 'EM_GRAFICA') prazoAtivo = editPrazoConfeccao;
    else prazoAtivo = editPrazoLayout || editPrazoAprovacao || editPrazoConfeccao || '';

    const atualizadas = vendas.map((v) => {
      if (v.id === vendaEditandoPrazo.id) {
        return {
          ...v,
          responsavelNome: editResponsavelNome.trim() || undefined,
          responsavelEmail: editResponsavelEmail.trim() || undefined,
          statusProducao: editStatusProducao,
          prazoLayout: editPrazoLayout || undefined,
          prazoAprovacaoCliente: editPrazoAprovacao || undefined,
          prazoConfeccao: editPrazoConfeccao || undefined,
          prazoProducao: prazoAtivo || undefined,
        };
      }
      return v;
    });
    salvarVendasLocal(atualizadas);
    setVendaEditandoPrazo(null);
    showToast('Prazos por etapa e responsável atualizados com sucesso!');
  };

  // ==========================================
  // FUNÇÕES PARA CORREÇÃO DE VALOR TOTAL DO KIT (LÁPIS DO VALOR)
  // ==========================================
  const abrirModalEditarValorTotal = (venda: VendaAlbum) => {
    setVendaEditandoValorTotal(venda);
    setNovoValorTotalInput(String(venda.valorTotalKit || 0));
    setRecalcularParcelasBoleto(true);
    setModalEditarValorTotalAberto(true);
  };

  const handleSalvarValorTotal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaEditandoValorTotal) return;

    const novoValor = parseFloat(novoValorTotalInput.replace(',', '.'));
    if (isNaN(novoValor) || novoValor <= 0) {
      showToast('⚠️ Digite um valor numérico válido maior que zero.');
      return;
    }

    const atualizadas = vendas.map((v) => {
      if (v.id === vendaEditandoValorTotal.id) {
        let novasParcelas = v.parcelasBoletos ? [...v.parcelasBoletos] : undefined;

        if (v.formaPagamento === 'BOLETO' && Array.isArray(novasParcelas) && novasParcelas.length > 0 && recalcularParcelasBoleto) {
          const pagas = novasParcelas.filter((p) => p.status === 'PAGO');
          const pendentes = novasParcelas.filter((p) => p.status !== 'PAGO');

          if (pendentes.length > 0) {
            const somaPagas = pagas.reduce((acc, p) => acc + (p.valorPago || p.valor), 0);
            const restante = Math.max(0, novoValor - somaPagas);
            const valorBase = Math.floor((restante / pendentes.length) * 100) / 100;
            const centavosDiferenca = Number((restante - valorBase * pendentes.length).toFixed(2));

            novasParcelas = novasParcelas.map((p) => {
              if (p.status === 'PAGO') return p;
              const idxPendente = pendentes.findIndex((x) => x.numero === p.numero);
              const val = idxPendente === pendentes.length - 1 ? Number((valorBase + centavosDiferenca).toFixed(2)) : valorBase;

              const dig1 = Math.floor(10000 + Math.random() * 90000);
              const dig2 = Math.floor(10000 + Math.random() * 90000);
              const linha = `74891.12003 ${dig1}.234508 ${dig2}.67890${p.numero} ${p.numero} 98760000${Math.floor(val * 100)}`;
              const pix = gerarCodigoPixOficial('30988070000160', 'ON EVENTOS LTDA', 'SAO PAULO', val, '***');

              return {
                ...p,
                valor: val,
                linhaDigitavel: linha,
                codigoPix: pix,
              };
            });
          }
        }

        return {
          ...v,
          valorTotalKit: novoValor,
          parcelasBoletos: novasParcelas,
        };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    if (vendaSelecionadaBoletos && vendaSelecionadaBoletos.id === vendaEditandoValorTotal.id) {
      const at = atualizadas.find((x) => x.id === vendaEditandoValorTotal.id);
      if (at) setVendaSelecionadaBoletos(at);
    }
    setModalEditarValorTotalAberto(false);
    showToast(`✓ Valor total do pedido ${vendaEditandoValorTotal.codigoPedido} atualizado para R$ ${novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!`);
  };

  // ==========================================
  // FUNÇÕES PARA CORREÇÃO DE BRINDES & MODELO (LÁPIS DOS BRINDES)
  // ==========================================
  const abrirModalEditarBrindes = (venda: VendaAlbum) => {
    setVendaEditandoBrindes(venda);
    setEditModeloAlbum(venda.modeloAlbum || 'Album premium');
    const brindesPadrao: BrindeItem[] = [
      { id: '1', nome: 'Quadro 30x60', descricao: 'Moldura de madeira nobre e acabamento premium', selecionado: false, valorAdicional: 0 },
      { id: '2', nome: 'Trio de quadros', descricao: 'Três quadros decorativos 15x21 com paspatur', selecionado: false, valorAdicional: 0 },
      { id: '3', nome: 'Link de fotos', descricao: 'Acesso digital ilimitado em alta resolução', selecionado: false, valorAdicional: 0 },
      { id: '4', nome: 'Diploma acrilico', descricao: 'Placa comemorativa em acrílico cristal', selecionado: false, valorAdicional: 0 },
    ];

    if (Array.isArray(venda.brindes) && venda.brindes.length > 0) {
      const mesclados = brindesPadrao.map((padrao) => {
        const existente = venda.brindes.find((b) => b.nome === padrao.nome || b.id === padrao.id);
        return existente ? { ...padrao, ...existente } : padrao;
      });
      const extras = venda.brindes.filter((b) => !brindesPadrao.some((padrao) => padrao.nome === b.nome));
      setEditListaBrindes([...mesclados, ...extras]);
    } else {
      setEditListaBrindes(brindesPadrao);
    }

    setNovoBrindeNome('');
    setNovoBrindeValor('0');
    setModalEditarBrindesAberto(true);
  };

  const toggleBrindeEdicao = (idOuNome: string) => {
    setEditListaBrindes((prev) =>
      prev.map((b) => (b.id === idOuNome || b.nome === idOuNome ? { ...b, selecionado: !b.selecionado } : b))
    );
  };

  const handleAdicionarBrindeExtra = () => {
    if (!novoBrindeNome.trim()) return;
    const novo: BrindeItem = {
      id: `brinde_extra_${Date.now()}`,
      nome: novoBrindeNome.trim() as any,
      descricao: 'Item adicional do kit',
      selecionado: true,
      valorAdicional: parseFloat(novoBrindeValor.replace(',', '.')) || 0,
    };
    setEditListaBrindes((prev) => [...prev, novo]);
    setNovoBrindeNome('');
    setNovoBrindeValor('0');
    showToast(`✓ Brinde '${novo.nome}' adicionado à lista!`);
  };

  const handleRemoverBrindeExtra = (id: string) => {
    setEditListaBrindes((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSalvarBrindes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaEditandoBrindes) return;

    const somaBrindes = editListaBrindes
      .filter((b) => b.selecionado)
      .reduce((acc, b) => acc + (b.valorAdicional || 0), 0);

    const atualizadas = vendas.map((v) => {
      if (v.id === vendaEditandoBrindes.id) {
        return {
          ...v,
          modeloAlbum: editModeloAlbum,
          brindes: editListaBrindes,
          valorTotalBrindes: somaBrindes,
        };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    setModalEditarBrindesAberto(false);
    showToast(`✓ Brindes e modelo do pedido ${vendaEditandoBrindes.codigoPedido} atualizados com sucesso!`);
  };

  // ==========================================
  // FUNÇÕES PARA MODAL / ABA DE OBSERVAÇÕES (CLIQUE NO FORMANDO)
  // ==========================================
  const abrirModalObservacoes = (venda: VendaAlbum) => {
    setVendaObservacoes(venda);
    setTextoObservacoesGerais(venda.observacoes || '');
    setTextoNovaObservacao('');
    setAbaObservacoesAtiva('NOTAS');
    setModalObservacoesAberto(true);
  };

  const handleAdicionarNovaNotaObservacao = () => {
    if (!vendaObservacoes || !textoNovaObservacao.trim()) return;

    const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const novaNota: ObservacaoRegistro = {
      id: `obs_${Date.now()}`,
      dataHora: agora,
      autorNome: usuarioLogado?.nome || 'Equipe ON',
      texto: textoNovaObservacao.trim(),
    };

    const historicoAtual = Array.isArray(vendaObservacoes.historicoObservacoes)
      ? vendaObservacoes.historicoObservacoes
      : [];
    const novoHistorico = [novaNota, ...historicoAtual];

    const atualizadas = vendas.map((v) => {
      if (v.id === vendaObservacoes.id) {
        return {
          ...v,
          observacoes: textoObservacoesGerais.trim(),
          historicoObservacoes: novoHistorico,
        };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    const atualizada = atualizadas.find((v) => v.id === vendaObservacoes.id);
    if (atualizada) setVendaObservacoes(atualizada);
    setTextoNovaObservacao('');
    showToast('✓ Anotação registrada com sucesso no prontuário do formando!');
  };

  const handleSalvarObservacoesGerais = () => {
    if (!vendaObservacoes) return;
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaObservacoes.id) {
        return {
          ...v,
          observacoes: textoObservacoesGerais.trim(),
        };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    const atualizada = atualizadas.find((v) => v.id === vendaObservacoes.id);
    if (atualizada) setVendaObservacoes(atualizada);
    showToast('✓ Observações gerais salvas com sucesso!');
  };

  const handleSalvarTelefoneFormando = (vendaId: string, novoTelefone: string) => {
    const limpo = novoTelefone.trim();
    if (!limpo) {
      showToast('⚠️ Informe um número de telefone válido.');
      return;
    }
    const atualizadas = vendas.map((v) => (v.id === vendaId ? { ...v, alunoTelefone: limpo } : v));
    salvarVendasLocal(atualizadas);

    if (vendaSelecionadaBoletos && vendaSelecionadaBoletos.id === vendaId) {
      setVendaSelecionadaBoletos({ ...vendaSelecionadaBoletos, alunoTelefone: limpo });
    }
    if (vendaObservacoes && vendaObservacoes.id === vendaId) {
      setVendaObservacoes({ ...vendaObservacoes, alunoTelefone: limpo });
    }
    setEditandoTelefoneVendaId(null);
    showToast(`✓ Telefone atualizado para ${limpo}! Agora você pode reenviar via WhatsApp.`);
  };

  const abrirModalNovaVenda = () => {
    const insts = getInstituicoes();
    const cur = getCursos();
    setInstituicoesCadastradas(insts);
    setCursosCadastrados(cur);
    const atualizadas = getOpcoesTurmasFaculdades();
    setOpcoesTurmas(atualizadas);

    if (insts.length > 0 && !formInstituicaoNome) {
      setFormInstituicaoNome(insts[0].nome);
      setFormInstituicaoBusca(insts[0].nome);
    }
    setFormAbaAtiva('ALBUM');
    setModalNovaVendaAberto(true);
  };

  const copiarTexto = (texto: string, idRef: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCopiadoIdx(idRef);
      setTimeout(() => setCopiadoIdx(null), 2000);
      showToast('Copiado para a área de transferência!');
    }
  };

  // Download do arquivo de remessa oficial Sicredi CNAB 400
  const handleDownloadRemessaSicredi = () => {
    const conteudo = gerarRemessaCnab400Oficial(SICREDI_CONFIG_OFICIAL, [BOLETO_HOMOLOGACAO_PADRAO], 1);
    const nomeArquivo = gerarNomeArquivoRemessaSicredi(SICREDI_CONFIG_OFICIAL.convenio, new Date(), 'REM');
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Arquivo de Remessa ${nomeArquivo} baixado com sucesso!`);
  };

  // Registrar Todas as Parcelas da Venda via API Sicredi Cobrança Online
  const handleRegistrarBoletosApi = async (vendaId: string, vendaObj?: VendaAlbum) => {
    setRegistrandoApi(true);
    try {
      const res = await fetch('/sicredi_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'emitir_todas_parcelas_venda',
          vendaId,
          venda: vendaObj || vendas.find((v) => v.id === vendaId),
        }),
      });
      const data = await res.json();
      if (data.sucesso && data.venda) {
        setVendas((prev) => {
          const existe = prev.some((v) => v.id === vendaId);
          const atualizadas = existe
            ? prev.map((v) => (v.id === vendaId ? data.venda : v))
            : [data.venda, ...prev];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(atualizadas));
            } catch (e) {}
          }
          return atualizadas;
        });
        setVendaSelecionadaBoletos(data.venda);
        showToast(`🎉 ${data.mensagem}`);
      } else {
        showToast(`⚠️ ${data.erro || 'Falha ao registrar parcelas na API do Sicredi.'}`);
      }
    } catch (e: any) {
      showToast(`⚠️ Erro de conexão com a API Sicredi: ${e.message}`);
    } finally {
      setRegistrandoApi(false);
    }
  };

  // Registrar Parcela Individual via API Sicredi
  const handleRegistrarParcelaIndividualApi = async (vendaId: string, parcelaNumero: number) => {
    setRegistrandoApi(true);
    try {
      const res = await fetch('/sicredi_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emitir_parcela_api', vendaId, parcelaNumero }),
      });
      const data = await res.json();
      if (data.sucesso && data.venda) {
        const atualizadas = vendas.map((v) => (v.id === vendaId ? data.venda : v));
        setVendas(atualizadas);
        setVendaSelecionadaBoletos(data.venda);
        if (typeof window !== 'undefined') {
          localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(atualizadas));
        }
        showToast(`🎉 Parcela #${parcelaNumero} registrada no Sicredi com sucesso!`);
      } else {
        showToast(`⚠️ ${data.erro || 'Falha ao registrar parcela.'}`);
      }
    } catch (e: any) {
      showToast(`⚠️ Erro: ${e.message}`);
    } finally {
      setRegistrandoApi(false);
    }
  };

  // Testar conexão com a API Sicredi
  const handleTestarConexaoSicrediApi = async () => {
    setTestandoConexaoApi(true);
    try {
      const res = await fetch('/sicredi_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setStatusApiSicredi('CONECTADO');
        showToast('✅ Conexão com API Sicredi ATIVA! Token OAuth2 validado com sucesso.');
      } else {
        setStatusApiSicredi('ERRO');
        showToast(`⚠️ Erro Sicredi: ${data.erro}`);
      }
    } catch (e: any) {
      setStatusApiSicredi('ERRO');
      showToast(`⚠️ Erro de rede: ${e.message}`);
    } finally {
      setTestandoConexaoApi(false);
    }
  };

  // Sincronizar Baixas e Liquidações Automáticas no Sicredi
  const sincronizarBaixasSicredi = async () => {
    try {
      const res = await fetch('/sicredi_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sincronizar_baixas' }),
      });
      const data = await res.json();
      if (data.sucesso && Array.isArray(data.vendas)) {
        const limpas = data.vendas.filter((v: any) => !isClienteFicticio(v));
        setVendas(limpas);
        if (vendaSelecionadaBoletos) {
          const atual = limpas.find((v: any) => v.id === vendaSelecionadaBoletos.id);
          if (atual) setVendaSelecionadaBoletos(atual);
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(limpas));
          } catch (e) {}
        }
        if (data.baixasEfetuadas > 0) {
          showToast(`🎉 ${data.baixasEfetuadas} parcela(s) baixada(s) automaticamente pelo Sicredi!`);
        } else {
          showToast('Status sincronizado com o Sicredi!');
        }
      }
    } catch (e) {
      showToast('Status verificado no Sicredi.');
    }
  };

  // Abrir Carnê de Boletos com Auto-Registro Silencioso em Background
  const abrirCarneBoletos = (venda: VendaAlbum) => {
    setVendaSelecionadaBoletos(venda);
    const temPendente = venda.parcelasBoletos?.some((p) => !p.registradoSicredi);
    if (temPendente) {
      handleRegistrarBoletosApi(venda.id, venda);
    }
  };

  // Alternar Brinde
  const toggleBrinde = (nome: BrindeTipo) => {
    setFormBrindes((prev) =>
      prev.map((b) => (b.nome === nome ? { ...b, selecionado: !b.selecionado } : b))
    );
  };

  // Alterar valor adicional do brinde
  const setBrindeValor = (nome: BrindeTipo, valor: number) => {
    setFormBrindes((prev) =>
      prev.map((b) => (b.nome === nome ? { ...b, valorAdicional: valor } : b))
    );
  };

  // Funções oficiais para geração de PIX Copia e Cola (Padrão Banco Central do Brasil / CRC16-CCITT)
  const calcularCrc16Pix = (str: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const formatarTLVPix = (tag: string, valor: string): string => {
    const tamanho = valor.length.toString().padStart(2, '0');
    return `${tag}${tamanho}${valor}`;
  };

  const gerarCodigoPixOficial = (
    chavePix: string = '30988070000160',
    nome: string = 'ON EVENTOS LTDA',
    cidade: string = 'SAO PAULO',
    valor: number = 0,
    txid: string = '***'
  ): string => {
    let chaveLimpa = (chavePix || '30988070000160').trim();
    if (!chaveLimpa.includes('@')) {
      const soDigitos = chaveLimpa.replace(/\D/g, '');
      if (soDigitos.length === 14 || soDigitos.length === 11) {
        chaveLimpa = soDigitos;
      } else if (soDigitos.length === 10 || soDigitos.length === 11) {
        chaveLimpa = '+55' + soDigitos;
      }
    }

    const tag26 = formatarTLVPix('00', 'br.gov.bcb.pix') + formatarTLVPix('01', chaveLimpa);
    const nomeLimpo = (nome || 'ON EVENTOS LTDA').substring(0, 25).toUpperCase();
    const cidadeLimpa = (cidade || 'SAO PAULO').substring(0, 15).toUpperCase();
    const txidLimpo = (txid || '***').substring(0, 25);

    let payload =
      formatarTLVPix('00', '01') +
      formatarTLVPix('26', tag26) +
      formatarTLVPix('52', '0000') +
      formatarTLVPix('53', '986');

    if (valor > 0) {
      const valStr = valor.toFixed(2);
      payload += formatarTLVPix('54', valStr);
    }

    payload +=
      formatarTLVPix('58', 'BR') +
      formatarTLVPix('59', nomeLimpo) +
      formatarTLVPix('60', cidadeLimpa) +
      formatarTLVPix('62', formatarTLVPix('05', txidLimpo)) +
      '6304';

    const crc = calcularCrc16Pix(payload);
    return payload + crc;
  };

  // Gerar Boletos Sicredi automáticos com base no Valor Total do Kit
  const gerarParcelasBoletos = (valorTotal: number, qtdParcelas: number, primeiroVenc: string): ParcelaBoleto[] => {
    const valorParcela = Math.floor((valorTotal / qtdParcelas) * 100) / 100;
    const diferencaCentavos = Number((valorTotal - (valorParcela * qtdParcelas)).toFixed(2));
    const parcelas: ParcelaBoleto[] = [];
    const baseDate = new Date(primeiroVenc || new Date());

    for (let i = 1; i <= qtdParcelas; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));
      const vencStr = d.toLocaleDateString('pt-BR');
      const val = i === qtdParcelas ? Number((valorParcela + diferencaCentavos).toFixed(2)) : valorParcela;
      
      const dig1 = Math.floor(10000 + Math.random() * 90000);
      const dig2 = Math.floor(10000 + Math.random() * 90000);
      const linha = `74891.12003 ${dig1}.234508 ${dig2}.67890${i} ${i} 98760000${Math.floor(val * 100)}`;
      const pix = gerarCodigoPixOficial('30988070000160', 'ON EVENTOS LTDA', 'SAO PAULO', val, '***');

      parcelas.push({
        numero: i,
        vencimento: vencStr,
        valor: val,
        status: 'PENDENTE',
        linhaDigitavel: linha,
        codigoPix: pix,
      });
    }

    return parcelas;
  };

  // Abrir Modal de Edição / Correção de Pagamento
  const abrirModalEditarPagamento = (venda: VendaAlbum) => {
    setVendaParaEditarPagamento(venda);
    setEditFormaPagamento(venda.formaPagamento);
    setEditValorTotalKit(venda.valorTotalKit.toString());
    setEditBoletoParcelas(venda.boletoQtdParcelas || venda.parcelasBoletos?.length || 6);

    const primeiroVenc = venda.parcelasBoletos?.[0]?.vencimento;
    let dataVencIso = '';
    if (primeiroVenc && primeiroVenc.includes('/')) {
      const partes = primeiroVenc.split('/');
      if (partes.length === 3) {
        dataVencIso = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    if (!dataVencIso) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      dataVencIso = d.toISOString().split('T')[0];
    }
    setEditPrimeiroVencimento(dataVencIso);

    setEditCartaoParcelas(venda.cartaoQtdParcelas || 1);
    setEditCartaoBandeira(venda.cartaoBandeira || 'Mastercard');
    setEditCartaoNsu(venda.cartaoNsu || '');
    setModalEditarPagamentoAberto(true);
  };

  // Salvar Correção de Pagamento
  const handleSalvarEdicaoPagamento = async () => {
    if (!vendaParaEditarPagamento) return;

    const valorNum = parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit;
    const vendaId = vendaParaEditarPagamento.id;

    let parcelasNovas: ParcelaBoleto[] | undefined = undefined;
    if (editFormaPagamento === 'BOLETO') {
      parcelasNovas = gerarParcelasBoletos(valorNum, editBoletoParcelas, editPrimeiroVencimento);
    }

    const vendaAtualizada: VendaAlbum = {
      ...vendaParaEditarPagamento,
      valorTotalKit: valorNum,
      formaPagamento: editFormaPagamento,
      boletoQtdParcelas: editFormaPagamento === 'BOLETO' ? editBoletoParcelas : undefined,
      parcelasBoletos: parcelasNovas,
      cartaoQtdParcelas: editFormaPagamento === 'CARTAO' ? editCartaoParcelas : undefined,
      cartaoBandeira: editFormaPagamento === 'CARTAO' ? editCartaoBandeira : undefined,
      cartaoNsu: editFormaPagamento === 'CARTAO' ? (editCartaoNsu.trim() || `NSU-${Date.now().toString().slice(-6)}`) : undefined,
      cartaoStatus: editFormaPagamento === 'CARTAO' ? 'Aprovado / Liquidado' : undefined,
    };

    const novasVendas = vendas.map((v) => (v.id === vendaId ? vendaAtualizada : v));
    salvarVendasLocal(novasVendas);

    // Se o modal de boletos estava aberto para essa venda
    if (vendaSelecionadaBoletos && vendaSelecionadaBoletos.id === vendaId) {
      if (editFormaPagamento === 'BOLETO') {
        setVendaSelecionadaBoletos(vendaAtualizada);
      } else {
        setVendaSelecionadaBoletos(null);
        if (editFormaPagamento === 'CARTAO') {
          setVendaSelecionadaCartao(vendaAtualizada);
        }
      }
    }

    // Se o modal de cartão estava aberto para essa venda
    if (vendaSelecionadaCartao && vendaSelecionadaCartao.id === vendaId) {
      if (editFormaPagamento === 'CARTAO') {
        setVendaSelecionadaCartao(vendaAtualizada);
      } else {
        setVendaSelecionadaCartao(null);
        if (editFormaPagamento === 'BOLETO') {
          setVendaSelecionadaBoletos(vendaAtualizada);
        }
      }
    }

    // Se a nova forma for boleto, registrar automaticamente na API Sicredi
    if (editFormaPagamento === 'BOLETO' && parcelasNovas && parcelasNovas.length > 0) {
      handleRegistrarBoletosApi(vendaAtualizada.id, vendaAtualizada);
    }

    setModalEditarPagamentoAberto(false);
    showToast(`✓ Pagamento do pedido ${vendaAtualizada.codigoPedido} atualizado com sucesso!`);
  };

  // Abrir Modal de Quitação Manual de Parcela (Image 4)
  const abrirModalQuitacaoManual = (venda: VendaAlbum, parcela: ParcelaBoleto) => {
    setQuitacaoVenda(venda);
    setQuitacaoParcela(parcela);
    setQuitacaoLocalPag('PIX Direto');
    setQuitacaoFormaPag('PIX Direto');
    setQuitacaoConta('Sicredi C/C');
    setQuitacaoNotas('');
    const hoje = new Date().toISOString().split('T')[0];
    setQuitacaoDataPag(hoje);
    setQuitacaoDataCredito(hoje);
    setQuitacaoDesconto(0);
    setQuitacaoValorPago(parcela.valor);
    setModalQuitarParcelaAberto(true);
  };

  const usarDataVencimento = () => {
    if (!quitacaoParcela) return;
    const parts = quitacaoParcela.vencimento.split('/');
    if (parts.length === 3) {
      const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      setQuitacaoDataPag(iso);
      setQuitacaoDataCredito(iso);
    }
  };

  const handleDescontoChange = (desc: number) => {
    setQuitacaoDesconto(desc);
    if (quitacaoParcela) {
      const novoValor = Math.max(0, quitacaoParcela.valor - desc);
      setQuitacaoValorPago(Number(novoValor.toFixed(2)));
    }
  };

  const handleConfirmarQuitacaoManual = () => {
    if (!quitacaoVenda || !quitacaoParcela) return;

    const dParts = quitacaoDataPag.split('-');
    const dataPagFormatada = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : quitacaoDataPag;

    const atualizadas = vendas.map((v) => {
      if (v.id === quitacaoVenda.id && v.parcelasBoletos) {
        const novasParcelas = v.parcelasBoletos.map((p) => {
          if (p.numero === quitacaoParcela.numero) {
            return {
              ...p,
              status: 'PAGO' as const,
              dataPagamento: dataPagFormatada,
              dataCredito: quitacaoDataCredito,
              formaBaixa: quitacaoFormaPag,
              localBaixa: quitacaoLocalPag,
              contaBaixa: quitacaoConta,
              valorPago: quitacaoValorPago,
              descontoAplicado: quitacaoDesconto,
              observacoesBaixa: quitacaoNotas,
            };
          }
          return p;
        });
        return { ...v, parcelasBoletos: novasParcelas };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    const atualizada = atualizadas.find((v) => v.id === quitacaoVenda.id);
    if (atualizada) setVendaSelecionadaBoletos(atualizada);

    setModalQuitarParcelaAberto(false);
    showToast(`🎉 Parcela ${quitacaoParcela.numero} quitada com sucesso via ${quitacaoFormaPag}!`);
  };

  // Abrir Modal de Renegociação / Ajuste de Parcelas em Lote (Image 3)
  const abrirModalRenegociacao = (venda: VendaAlbum) => {
    setRenegociarVenda(venda);
    setRenegociarCheckValores(false);
    setRenegociarTipoAjuste('SELECIONE');
    setRenegociarValorAjuste(0);
    setRenegociarCheckDatas(false);

    const parcelasNaoPagas = venda.parcelasBoletos?.filter((p) => p.status !== 'PAGO') || [];
    if (parcelasNaoPagas.length > 0) {
      const prim = parcelasNaoPagas[0];
      const parts = prim.vencimento.split('/');
      if (parts.length === 3) {
        setRenegociarNovaDataPrimeira(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      } else {
        setRenegociarNovaDataPrimeira(new Date().toISOString().split('T')[0]);
      }
    } else {
      setRenegociarNovaDataPrimeira(new Date().toISOString().split('T')[0]);
    }

    setRenegociarCheckQtdParcelas(false);
    setRenegociarNovaQtdParcelas(parcelasNaoPagas.length || 1);
    setModalRenegociarParcelasAberto(true);
  };

  // Confirmar Renegociação / Ajuste em Lote
  const handleConfirmarRenegociacao = () => {
    if (!renegociarVenda) return;

    const parcelasAtuais = renegociarVenda.parcelasBoletos || [];
    const parcelasPagas = parcelasAtuais.filter((p) => p.status === 'PAGO');
    const parcelasNaoPagas = parcelasAtuais.filter((p) => p.status !== 'PAGO');

    if (parcelasNaoPagas.length === 0) {
      showToast('⚠️ Todas as parcelas deste carnê já foram quitadas! Não há parcelas pendentes para ajustar.');
      return;
    }

    const qtdNovas = renegociarCheckQtdParcelas && renegociarNovaQtdParcelas > 0 ? renegociarNovaQtdParcelas : parcelasNaoPagas.length;
    const saldoOriginalRestante = parcelasNaoPagas.reduce((acc, p) => acc + p.valor, 0);

    let saldoAjustado = saldoOriginalRestante;
    if (renegociarCheckValores) {
      if (renegociarTipoAjuste === 'ACRESCIMO_PORC') saldoAjustado *= (1 + renegociarValorAjuste / 100);
      else if (renegociarTipoAjuste === 'ACRESCIMO_VAL') saldoAjustado += (renegociarValorAjuste * parcelasNaoPagas.length);
      else if (renegociarTipoAjuste === 'DECRESCIMO_PORC') saldoAjustado = Math.max(1, saldoAjustado * (1 - renegociarValorAjuste / 100));
      else if (renegociarTipoAjuste === 'DECRESCIMO_VAL') saldoAjustado = Math.max(1, saldoAjustado - (renegociarValorAjuste * parcelasNaoPagas.length));
      else if (renegociarTipoAjuste === 'NOVO_VALOR') saldoAjustado = renegociarValorAjuste * qtdNovas;
    }

    const valorBaseParcela = Math.floor((saldoAjustado / qtdNovas) * 100) / 100;
    const centavosAjuste = Number((saldoAjustado - (valorBaseParcela * qtdNovas)).toFixed(2));

    const baseDate = renegociarCheckDatas && renegociarNovaDataPrimeira
      ? new Date(renegociarNovaDataPrimeira + 'T12:00:00')
      : new Date();

    const startNum = parcelasPagas.length + 1;
    const novasAjustadas: ParcelaBoleto[] = [];

    for (let i = 0; i < qtdNovas; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      const vencStr = d.toLocaleDateString('pt-BR');
      const val = i === qtdNovas - 1 ? Number((valorBaseParcela + centavosAjuste).toFixed(2)) : valorBaseParcela;
      const numParcela = startNum + i;

      const dig1 = Math.floor(10000 + Math.random() * 90000);
      const dig2 = Math.floor(10000 + Math.random() * 90000);
      const linha = `74891.12003 ${dig1}.234508 ${dig2}.67890${numParcela} ${numParcela} 98760000${Math.floor(val * 100)}`;
      const pix = gerarCodigoPixOficial('30988070000160', 'ON EVENTOS LTDA', 'SAO PAULO', val, '***');

      novasAjustadas.push({
        numero: numParcela,
        vencimento: vencStr,
        valor: val,
        status: 'PENDENTE',
        linhaDigitavel: linha,
        codigoPix: pix,
        registradoSicredi: false,
      });
    }

    const todasParcelas = [...parcelasPagas, ...novasAjustadas];
    const novoValorTotalKit = todasParcelas.reduce((acc, p) => acc + (p.status === 'PAGO' ? (p.valorPago ?? p.valor) : p.valor), 0);

    const vendaAtualizada: VendaAlbum = {
      ...renegociarVenda,
      valorTotalKit: Number(novoValorTotalKit.toFixed(2)),
      boletoQtdParcelas: todasParcelas.length,
      parcelasBoletos: todasParcelas,
    };

    const atualizadas = vendas.map((v) => (v.id === renegociarVenda.id ? vendaAtualizada : v));
    salvarVendasLocal(atualizadas);
    setVendaSelecionadaBoletos(vendaAtualizada);
    setModalRenegociarParcelasAberto(false);
    showToast(`🎉 ${qtdNovas} parcelas renegociadas com sucesso! Saldo ajustado.`);

    // Registrar novas parcelas no Sicredi
    handleRegistrarBoletosApi(vendaAtualizada.id, vendaAtualizada);
  };

  // Enviar Carnê Completo diretamente pelo WhatsApp da Agência (sem abrir o app do zap)
  const handleEnviarCarneWhatsApp = async (venda: VendaAlbum) => {
    if (!venda.alunoTelefone) {
      showToast('⚠️ O formando não possui telefone cadastrado.');
      return;
    }
    const parcelasPendentes = (venda.parcelasBoletos || []).filter((p) => p.status !== 'PAGO');
    if (parcelasPendentes.length === 0) {
      showToast('⚠️ Todas as parcelas deste carnê já foram quitadas!');
      return;
    }
    const confirma = window.confirm(
      `Deseja enviar ${parcelasPendentes.length} boletos pendentes como mensagens separadas para o WhatsApp de ${venda.alunoNome} (${venda.alunoTelefone})?`
    );
    if (!confirma) return;

    setEnviandoZap('carne');
    showToast(`📤 Enviando ${parcelasPendentes.length} boletos individualmente via WhatsApp para ${venda.alunoNome}...`);

    try {
      const res = await fetch('/whatsapp_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enviar_carne',
          vendaId: venda.id,
          telefone: venda.alunoTelefone,
          alunoNome: venda.alunoNome,
          codigoPedido: venda.codigoPedido,
          modeloAlbum: venda.modeloAlbum,
          valorTotal: venda.valorTotalKit,
          parcelas: venda.parcelasBoletos || [],
          chavePix: whatsAppChavePix,
          nomeBeneficiarioPix: whatsAppNomeBeneficiarioPix,
          cidadePix: whatsAppCidadePix,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const atualizadas = vendas.map((v) => {
          if (v.id === venda.id && v.parcelasBoletos) {
            const novasP = v.parcelasBoletos.map((p) => (p.status !== 'PAGO' ? { ...p, ultimoEnvioZap: agora } : p));
            return { ...v, parcelasBoletos: novasP };
          }
          return v;
        });
        salvarVendasLocal(atualizadas);
        const atualizada = atualizadas.find((v) => v.id === venda.id);
        if (atualizada) setVendaSelecionadaBoletos(atualizada);

        showToast(`🎉 ${data.mensagem || 'Boletos enviados com sucesso pelo WhatsApp!'}`);
      } else {
        showToast(`⚠️ ${data.erro || 'Falha ao enviar carnê via WhatsApp.'}`);
        if (data.erro && (data.erro.includes('não possui conta') || data.erro.includes('inexistente'))) {
          setNovoTelefoneInput(venda.alunoTelefone || '');
          setEditandoTelefoneVendaId(venda.id);
        }
      }
    } catch (e: any) {
      showToast(`⚠️ Erro de conexão com o WhatsApp da agência: ${e.message}`);
    } finally {
      setEnviandoZap(null);
    }
  };

  // Enviar Boleto de Parcela Individual diretamente pelo WhatsApp da Agência
  const handleEnviarParcelaWhatsApp = async (venda: VendaAlbum, parcela: ParcelaBoleto) => {
    if (!venda.alunoTelefone) {
      showToast('⚠️ O formando não possui telefone cadastrado.');
      return;
    }
    const chaveEnvio = `parcela-${parcela.numero}`;
    setEnviandoZap(chaveEnvio);
    showToast(`📤 Enviando Parcela #${parcela.numero} via WhatsApp da agência para ${venda.alunoNome}...`);

    try {
      const res = await fetch('/whatsapp_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enviar_boleto',
          vendaId: venda.id,
          parcelaNumero: parcela.numero,
          telefone: venda.alunoTelefone,
          alunoNome: venda.alunoNome,
          codigoPedido: venda.codigoPedido,
          modeloAlbum: venda.modeloAlbum,
          vencimento: parcela.vencimento,
          valor: parcela.valor,
          linhaDigitavel: parcela.linhaDigitavel,
          codigoPix: parcela.codigoPix,
          totalParcelas: venda.parcelasBoletos?.length || 1,
          chavePix: whatsAppChavePix,
          nomeBeneficiarioPix: whatsAppNomeBeneficiarioPix,
          cidadePix: whatsAppCidadePix,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const atualizadas = vendas.map((v) => {
          if (v.id === venda.id && v.parcelasBoletos) {
            const novasP = v.parcelasBoletos.map((p) => (p.numero === parcela.numero ? { ...p, ultimoEnvioZap: agora } : p));
            return { ...v, parcelasBoletos: novasP };
          }
          return v;
        });
        salvarVendasLocal(atualizadas);
        const atualizada = atualizadas.find((v) => v.id === venda.id);
        if (atualizada) setVendaSelecionadaBoletos(atualizada);

        showToast(`🎉 Parcela #${parcela.numero} enviada no WhatsApp de ${venda.alunoNome}!`);
      } else {
        showToast(`⚠️ ${data.erro || 'Falha ao enviar parcela via WhatsApp.'}`);
        if (data.erro && (data.erro.includes('não possui conta') || data.erro.includes('inexistente'))) {
          setNovoTelefoneInput(venda.alunoTelefone || '');
          setEditandoTelefoneVendaId(venda.id);
        }
      }
    } catch (e: any) {
      showToast(`⚠️ Erro: ${e.message}`);
    } finally {
      setEnviandoZap(null);
    }
  };

  // Executar Lembretes de Vencimento de 1 Dia (Automação de Vencimento)
  const handleExecutarLembretesAmanha = async () => {
    setExecutandoLembretesZap(true);
    showToast('🔔 Verificando parcelas que vencem amanhã e disparando lembretes...');

    try {
      const res = await fetch('/whatsapp_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enviar_lembretes_vencimento' }),
      });
      const data = await res.json();
      if (data.sucesso) {
        fetch('/vendas.php')
          .then((r) => r.json())
          .then((limpas) => {
            if (Array.isArray(limpas)) {
              setVendas(limpas.filter((v: any) => !isClienteFicticio(v)));
            }
          })
          .catch(() => {});

        showToast(`🎉 ${data.mensagem}`);
      } else {
        showToast(`⚠️ ${data.erro || 'Falha ao executar lembretes.'}`);
      }
    } catch (e: any) {
      showToast(`⚠️ Erro: ${e.message}`);
    } finally {
      setExecutandoLembretesZap(false);
    }
  };

  // Salvar Configuração do WhatsApp da Agência
  const handleSalvarConfigWhatsApp = async () => {
    try {
      const res = await fetch('/whatsapp_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          config: {
            ativo: true,
            status: whatsAppConectado ? 'conectado' : 'desconectado',
            numeroConectado: whatsAppNumero,
            provedor: whatsAppProvedor,
            apiUrl: whatsAppApiUrl,
            apiKey: whatsAppApiKey,
            instancia: whatsAppInstancia,
            chavePix: whatsAppChavePix,
            nomeBeneficiarioPix: whatsAppNomeBeneficiarioPix,
            cidadePix: whatsAppCidadePix,
            lembreteAutomaticoAtivo: whatsAppLembreteAtivo,
            rodapeAviso: whatsAppRodape,
          },
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        showToast('✓ Configurações do WhatsApp da agência salvas com sucesso!');
        setModalWhatsAppAberto(false);
      } else {
        showToast(`⚠️ ${data.erro || 'Erro ao salvar configurações.'}`);
      }
    } catch (e: any) {
      showToast(`⚠️ Erro: ${e.message}`);
    }
  };

  // Buscar QR Code atual da Evolution API
  const handleCarregarQrCode = async () => {
    setCarregandoQrCode(true);
    try {
      const res = await fetch('/whatsapp_api.php?action=get_qrcode');
      const data = await res.json();
      if (data.sucesso && data.base64) {
        setQrCodeBase64(data.base64);
        showToast('QR Code atualizado! Aponte a câmera do WhatsApp.');
      } else {
        showToast('⚠️ QR Code ainda não disponível ou a instância já está conectada!');
      }
    } catch (e: any) {
      showToast(`⚠️ Falha ao carregar QR Code: ${e.message}`);
    } finally {
      setCarregandoQrCode(false);
    }
  };

  // Verificar status de conexão da instância
  const handleVerificarConexaoWhatsApp = async () => {
    try {
      const res = await fetch('/whatsapp_api.php?action=verificar_conexao');
      const data = await res.json();
      if (data.conectado) {
        setWhatsAppConectado(true);
        showToast('🎉 Parabéns! WhatsApp da agência conectado com sucesso na instância on-cobranca!');
      } else {
        setWhatsAppConectado(false);
        showToast(`Status: ${data.estado || 'aguardando'}. Aponte a câmera do WhatsApp para o QR Code.`);
      }
    } catch (e: any) {
      showToast(`⚠️ Erro ao verificar conexão: ${e.message}`);
    }
  };

  // Disparar Mensagem de Teste em Tempo Real
  const handleDispararTesteZap = async () => {
    if (!telefoneTesteZap.trim()) {
      showToast('Digite um número de telefone para teste (ex: 11999998888).');
      return;
    }
    setTestandoZap(true);
    showToast(`📤 Disparando teste para ${telefoneTesteZap}...`);
    try {
      const res = await fetch('/whatsapp_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'testar_conexao',
          telefone: telefoneTesteZap,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        showToast('🎉 Mensagem de teste enviada com sucesso no seu WhatsApp!');
      } else {
        showToast(`⚠️ ${data.erro || 'Falha no disparo de teste.'}`);
      }
    } catch (e: any) {
      showToast(`⚠️ Erro: ${e.message}`);
    } finally {
      setTestandoZap(false);
    }
  };

  // Submeter Criação de Nova Venda do Kit
  const handleSubmitNovaVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formCpf.trim()) {
      showToast('Por favor, preencha o nome e CPF do formando.');
      return;
    }

    const instFinal = (formInstituicaoNome.trim() || formInstituicaoBusca.trim() || 'Geral').trim();
    const periodoFinal = (formPeriodo.trim() || '2025.2').trim();
    const cursoFinal = (formCursoNome.trim() || 'Geral').trim();
    const turmaFinal = `${cursoFinal} - ${instFinal} (${periodoFinal})`;

    const novoCodigo = `ALB-2026-${String(vendas.length + 90).padStart(3, '0')}`;
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let parcelasGeradas: ParcelaBoleto[] | undefined = undefined;
    if (formFormaPagamento === 'BOLETO') {
      parcelasGeradas = gerarParcelasBoletos(somaTotalKit, parseInt(formBoletoParcelas) || 1, formPrimeiroVencimento);
    }

    const nova: VendaAlbum = {
      id: `venda-${Date.now()}`,
      codigoPedido: novoCodigo,
      dataVenda: dataHoje,
      alunoNome: formNome.trim(),
      alunoCpf: formCpf.trim(),
      alunoTelefone: formTelefone.trim() || '(11) 99999-9999',
      alunoEmail: formEmail.trim(),
      instituicaoNome: instFinal,
      periodo: periodoFinal,
      turmaNome: turmaFinal,
      modeloAlbum: formModeloAlbum,
      valorAlbum: numValorAlbum,
      brindes: formBrindes,
      valorTotalBrindes: numValorBrindes,
      valorTotalKit: somaTotalKit,
      formaPagamento: formFormaPagamento,
      cartaoQtdParcelas: formFormaPagamento === 'CARTAO' ? parseInt(formCartaoParcelas) : undefined,
      cartaoBandeira: formFormaPagamento === 'CARTAO' ? formCartaoBandeira : undefined,
      cartaoNsu: formFormaPagamento === 'CARTAO' ? (formCartaoNsu.trim() || `NSU-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
      cartaoStatus: formFormaPagamento === 'CARTAO' ? 'Aprovado / Liquidado' : undefined,
      boletoQtdParcelas: formFormaPagamento === 'BOLETO' ? parseInt(formBoletoParcelas) : undefined,
      parcelasBoletos: parcelasGeradas,
      statusProducao: 'EM_DIAGRAMACAO',
      observacoes: formObservacoes.trim(),
      responsavelNome: formResponsavelNome.trim() || usuarioLogado?.nome || 'Equipe de Produção',
      responsavelEmail: formResponsavelEmail.trim() || usuarioLogado?.email || '',
      prazoLayout: formPrazoLayout || undefined,
      prazoAprovacaoCliente: formPrazoAprovacao || undefined,
      prazoConfeccao: formPrazoConfeccao || undefined,
      prazoProducao: formPrazoLayout || formPrazoAprovacao || formPrazoConfeccao || undefined,
    };

    // Se for uma instituição nova que não existe na lista, cadastrá-la no sistema
    const instExiste = instituicoesCadastradas.some(
      (i) => i.nome.toLowerCase() === instFinal.toLowerCase()
    );
    if (!instExiste && instFinal && instFinal !== 'Geral') {
      try {
        const novaInst = await adicionarInstituicao({
          nome: instFinal,
          sigla: instFinal.slice(0, 6).toUpperCase(),
          tipo: 'FACULDADE',
          campus: 'Principal',
          cidade: 'São Paulo',
          uf: 'SP',
          contatoResponsavel: 'Coordenação',
          telefone: '',
          whatsapp: '',
          email: '',
          status: 'ATIVO',
          cor: 'from-purple-600 to-indigo-600',
        });
        setInstituicoesCadastradas((prev) => [novaInst, ...prev]);
      } catch (err) {}
    }

    const atualizadas = [nova, ...vendas];
    salvarVendasLocal(atualizadas);
    setModalNovaVendaAberto(false);
    showToast(`Venda ${novoCodigo} (${instFinal}) cadastrada com sucesso!`);

    // Se for boleto, registra imediatamente na API do Sicredi na mesma hora
    if (formFormaPagamento === 'BOLETO' && nova.parcelasBoletos && nova.parcelasBoletos.length > 0) {
      showToast(`⚡ Venda ${novoCodigo} criada! Registrando parcelas na API Sicredi automaticamente...`);
      handleRegistrarBoletosApi(nova.id, nova);
    }

    // Reset
    setFormNome('');
    setFormCpf('');
    setFormTelefone('');
    setFormEmail('');
    setFormObservacoes('');
    setFormCartaoNsu('');
    setFormAbaAtiva('ALBUM');
    const dReset = new Date();
    dReset.setDate(dReset.getDate() + 15);
    setFormPrazoLayout(dReset.toISOString().split('T')[0]);
    setFormPrazoAprovacao('');
    setFormPrazoConfeccao('');
    setFormPrazoProducao('');
  };

  // Alternar pagamento de parcela no boleto
  const alternarStatusParcela = (vendaId: string, parcelaNumero: number) => {
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaId && v.parcelasBoletos) {
        const novasParcelas = v.parcelasBoletos.map((p) => {
          if (p.numero === parcelaNumero) {
            return {
              ...p,
              status: (p.status === 'PAGO' ? 'PENDENTE' : 'PAGO') as 'PENDENTE' | 'PAGO',
            };
          }
          return p;
        });
        return { ...v, parcelasBoletos: novasParcelas };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    const atualizada = atualizadas.find((v) => v.id === vendaId);
    if (atualizada) setVendaSelecionadaBoletos(atualizada);
    showToast(`Status da parcela ${parcelaNumero} atualizado!`);
  };

  // Avançar status de produção
  const avancarStatusProducao = (vendaId: string) => {
    const ordem: VendaAlbum['statusProducao'][] = [
      'EM_DIAGRAMACAO',
      'APROVACAO_CLIENTE',
      'EM_GRAFICA',
      'PRONTO_ENTREGA',
      'ENTREGUE',
    ];
    const hoje = new Date().toLocaleDateString('pt-BR');
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaId) {
        const idx = ordem.indexOf(v.statusProducao);
        const proximo = idx < ordem.length - 1 ? ordem[idx + 1] : ordem[idx];
        return {
          ...v,
          statusProducao: proximo,
          concluidoEm: proximo === 'ENTREGUE' ? hoje : v.concluidoEm,
        };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    const vendaAtual = atualizadas.find((v) => v.id === vendaId);
    if (vendaAtual) {
      const info = obterEtapaInfo(vendaAtual.statusProducao);
      showToast(`Álbum avançou para: ${info.nome}!`);
    } else {
      showToast('Etapa de produção avançada!');
    }
  };

  // Filtragem completa com busca, modelo, pagamento, status, instituição, período, responsável e prazo
  const vendasFiltradas = vendas.filter((v) => {
    if (isClienteFicticio(v)) return false;

    const info = extrairInfoTurma(v);
    const infoEtapa = obterPrazoEtapaAtual(v);
    const stPrazo = calcularStatusPrazo(infoEtapa.prazo, v.statusProducao, infoEtapa.etapaCurto);

    const matchBusca =
      v.alunoNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.alunoCpf.includes(busca) ||
      v.codigoPedido.toLowerCase().includes(busca.toLowerCase()) ||
      v.turmaNome.toLowerCase().includes(busca.toLowerCase()) ||
      info.instituicao.toLowerCase().includes(busca.toLowerCase()) ||
      info.periodo.toLowerCase().includes(busca.toLowerCase()) ||
      v.modeloAlbum.toLowerCase().includes(busca.toLowerCase()) ||
      (v.responsavelNome && v.responsavelNome.toLowerCase().includes(busca.toLowerCase()));

    const matchModelo = filtroModelo === 'TODOS' || v.modeloAlbum === filtroModelo;
    const matchPagamento =
      filtroPagamento === 'TODOS' ||
      (filtroPagamento === 'A_VISTA' && (v.formaPagamento === 'PIX' || v.formaPagamento === 'DINHEIRO')) ||
      v.formaPagamento === filtroPagamento;
    const matchStatus = filtroStatus === 'TODOS' || v.statusProducao === filtroStatus;

    const matchInstituicao =
      filtroInstituicao === 'TODAS' ||
      info.instituicao.toLowerCase() === filtroInstituicao.toLowerCase() ||
      v.turmaNome.toLowerCase().includes(filtroInstituicao.toLowerCase());

    const matchPeriodo =
      filtroPeriodo === 'TODOS' ||
      info.periodo.toLowerCase() === filtroPeriodo.toLowerCase() ||
      v.turmaNome.toLowerCase().includes(filtroPeriodo.toLowerCase());

    const matchResponsavel =
      filtroResponsavel === 'TODOS'
        ? true
        : filtroResponsavel === 'MEUS'
        ? (v.responsavelNome?.toLowerCase() === usuarioLogado?.nome.toLowerCase() ||
           (v.responsavelEmail &&
             usuarioLogado?.email &&
             v.responsavelEmail.toLowerCase() === usuarioLogado.email.toLowerCase()))
        : filtroResponsavel === 'SEM_RESPONSAVEL'
        ? !v.responsavelNome
        : v.responsavelNome?.toLowerCase() === filtroResponsavel.toLowerCase();

    const matchPrazo =
      filtroPrazo === 'TODOS'
        ? true
        : filtroPrazo === 'ATRASADOS'
        ? stPrazo.atrasado
        : filtroPrazo === 'HOJE'
        ? stPrazo.venceHoje
        : filtroPrazo === 'URGENTES'
        ? stPrazo.urgente || stPrazo.atrasado
        : filtroPrazo === 'NO_PRAZO'
        ? !stPrazo.atrasado && v.statusProducao !== 'ENTREGUE'
        : filtroPrazo === 'CONCLUIDOS'
        ? v.statusProducao === 'ENTREGUE'
        : true;

    return (
      matchBusca &&
      matchModelo &&
      matchPagamento &&
      matchStatus &&
      matchInstituicao &&
      matchPeriodo &&
      matchResponsavel &&
      matchPrazo
    );
  });

  const temFiltroAtivo =
    filtroInstituicao !== 'TODAS' ||
    filtroPeriodo !== 'TODOS' ||
    filtroModelo !== 'TODOS' ||
    filtroPagamento !== 'TODOS' ||
    filtroResponsavel !== 'TODOS' ||
    filtroPrazo !== 'TODOS' ||
    busca.trim() !== '';

  // Métricas reativas: calculam pelo período/filtro ativo OU pelo consolidado total geral (apenas vendas reais)
  const vendasBaseMetricas = (
    visaoMetricas === 'TOTAL_GERAL'
      ? vendas
      : temFiltroAtivo
      ? vendasFiltradas
      : vendas
  ).filter((v) => !isClienteFicticio(v));

  const totalFaturamento = vendasBaseMetricas.reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalAVista = vendasBaseMetricas
    .filter((v) => v.formaPagamento === 'PIX' || v.formaPagamento === 'DINHEIRO')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalPix = vendasBaseMetricas
    .filter((v) => v.formaPagamento === 'PIX')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalDinheiro = vendasBaseMetricas
    .filter((v) => v.formaPagamento === 'DINHEIRO')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalCartao = vendasBaseMetricas
    .filter((v) => v.formaPagamento === 'CARTAO')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalBoleto = vendasBaseMetricas
    .filter((v) => v.formaPagamento === 'BOLETO')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalEmProducao = vendasBaseMetricas.filter(
    (v) => v.statusProducao === 'EM_DIAGRAMACAO' || v.statusProducao === 'APROVACAO_CLIENTE' || v.statusProducao === 'EM_GRAFICA'
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Flutuante Roxa com Relevo Tátil e Logo Oficial */}
      <Sidebar paginaAtiva="fotos" />

      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#36218A] text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(54,33,138,0.45)] border border-purple-400/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Conteúdo Principal Direito */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior com Relevo Tátil e Ação de Nova Venda */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_6px_16px_rgba(192,38,211,0.25)] flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Vendas de Álbuns & Kits Fotográficos
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                  {vendas.filter((v) => !isClienteFicticio(v)).length} pedidos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monte kits com <strong>Álbum Premium, Preto, Slim ou Colégio</strong> + brindes e emita cartão ou boletos Sicredi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalIaFacialAberto(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100 hover:from-purple-100 hover:to-indigo-100 text-purple-900 border border-purple-300 text-xs font-black shadow-sm transition hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
              title="Separar fotos por reconhecimento facial usando IA da AWS Rekognition"
            >
              <Sparkles className="w-4 h-4 text-purple-700 animate-pulse" />
              <span>IA Facial</span>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider ml-1 shadow-2xs">
                AWS
              </span>
            </button>

            <button
              onClick={() => setModalAuditoriaAberto(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-black shadow-sm transition hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
              title="Ver Histórico de Álbuns Excluídos e Registro de Segurança"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Registro de Segurança</span>
              {registrosExclusoes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black ml-1">
                  {registrosExclusoes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setModalWhatsAppAberto(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black shadow-sm transition hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
              title="Central WhatsApp da Agência: Conexão e Lembretes Automáticos de Vencimento"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp Agência</span>
            </button>

            <button
              onClick={() => setModalHomologacaoSicrediAberto(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black shadow-sm transition hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
              title="Central Sicredi: Remessas CNAB 400 e Baixa Automática de Boletos"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Sicredi Cobrança</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider ml-1">
                Homologado
              </span>
            </button>

            <button
              onClick={abrirModalNovaVenda}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Venda de Álbum</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            ALERTA PERSISTENTE NA TELA PARA ÁLBUNS ATRASADOS
            ========================================================================= */}
        {albunsAtrasados.length > 0 && (
          <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white rounded-[24px] p-4.5 mb-6 shadow-[0_8px_24px_rgba(225,29,72,0.3)] border border-rose-300/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/30 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center">
                    <Bell className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-bounce" />
                    Alerta de Produção: Prazo Limite Vencido
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white text-rose-700 shadow-xs">
                    {albunsAtrasados.length} {albunsAtrasados.length === 1 ? 'álbum em atraso' : 'álbuns em atraso'}
                  </span>
                </div>
                <p className="text-xs text-rose-50 mt-1">
                  Você possui álbuns em produção cuja data limite expirou. <strong>Este aviso permanecerá ativo na tela</strong> até que o processo seja concluído ou o prazo prorrogado.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setModalAlertaPrazoAberto(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-extrabold shadow-sm transition hover:scale-102 cursor-pointer flex items-center space-x-1.5"
              >
                <CheckSquare className="w-4 h-4 text-rose-600" />
                <span>Ver & Resolver Atrasos ({albunsAtrasados.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            BARRA DE CONTROLE: POR PERÍODO VS TOTAL GERAL ACUMULADO
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center">
              <DollarSign className="w-4 h-4 text-purple-600 mr-1" />
              Painel Financeiro & Vendas:
            </span>
            {visaoMetricas === 'FILTRO_PERIODO' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                <Calendar className="w-3 h-3 mr-1 text-purple-600" />
                {filtroPeriodo === 'TODOS'
                  ? 'Exibindo Todos os Períodos (Dinâmico)'
                  : `Filtrado pelo Período: ${filtroPeriodo}`}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                <Globe className="w-3 h-3 mr-1 text-emerald-600" />
                Total Geral Acumulado (Todos os Períodos)
              </span>
            )}
          </div>

          <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setVisaoMetricas('FILTRO_PERIODO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                visaoMetricas === 'FILTRO_PERIODO'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Filtrar valores de acordo com o período selecionado no filtro"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Período {filtroPeriodo !== 'TODOS' ? `(${filtroPeriodo})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setVisaoMetricas('TOTAL_GERAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                visaoMetricas === 'TOTAL_GERAL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Exibir o total financeiro acumulado de todos os períodos"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Total Geral</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            CARDS DE MÉTRICAS COM RELEVO TÁTIL 3D (REATIVOS AO MODO SELECIONADO)
            ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          {/* Card 1: Total Vendido */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Vendido (Kits)
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>
                {vendasBaseMetricas.length} {vendasBaseMetricas.length === 1 ? 'kit contratado' : 'kits contratados'}
                {visaoMetricas === 'TOTAL_GERAL' ? ' (geral)' : filtroPeriodo !== 'TODOS' ? ` (${filtroPeriodo})` : ''}
              </span>
            </div>
          </div>

          {/* Card 2: À Vista (Dinheiro / PIX) */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                À Vista (Dinheiro/PIX)
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalAVista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-500" />
              <span>
                {vendasBaseMetricas.filter((v) => v.formaPagamento === 'PIX' || v.formaPagamento === 'DINHEIRO').length} liquidadas à vista
                {visaoMetricas === 'TOTAL_GERAL' ? ' (geral)' : filtroPeriodo !== 'TODOS' ? ` (${filtroPeriodo})` : ''}
              </span>
            </div>
          </div>

          {/* Card 3: Cartão de Crédito */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cartão de Crédito
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {vendasBaseMetricas.filter((v) => v.formaPagamento === 'CARTAO').length} vendas liquidadas
              {visaoMetricas === 'TOTAL_GERAL' ? ' (geral)' : filtroPeriodo !== 'TODOS' ? ` (${filtroPeriodo})` : ''}
            </div>
          </div>

          {/* Card 4: Boleto / Carnê */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Boleto Bancário / Carnê
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Barcode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-amber-600 font-semibold">
              {vendasBaseMetricas.filter((v) => v.formaPagamento === 'BOLETO').length} carnês Sicredi
              {visaoMetricas === 'TOTAL_GERAL' ? ' (geral)' : filtroPeriodo !== 'TODOS' ? ` (${filtroPeriodo})` : ''}
            </div>
          </div>

          {/* Card 5: Em Produção */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Em Produção
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {totalEmProducao} <span className="text-sm font-medium text-slate-500">álbuns</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-600 font-semibold">
              Layout, Aprovação & Gráfica
            </div>
          </div>
        </section>

        {/* =========================================================================
            BANNER INFORMATIVO DE CONTROLE POR INSTITUIÇÃO & PERÍODO & RESPONSÁVEL
            ========================================================================= */}
        {temFiltroAtivo && (
          <div className="bg-gradient-to-r from-[#2A176B] via-[#3B1F8C] to-[#4C1D95] text-white rounded-[24px] p-4.5 mb-6 shadow-[0_8px_24px_rgba(59,31,140,0.25)] border border-purple-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md text-purple-200 flex items-center justify-center shrink-0 border border-white/20">
                <Filter className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                    Controle de Vendas Filtrado
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                    {vendasFiltradas.length} {vendasFiltradas.length === 1 ? 'álbum encontrado' : 'álbuns encontrados'}
                  </span>
                </div>
                <p className="text-xs text-purple-100/90 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {filtroInstituicao !== 'TODAS' && (
                    <span>
                      🏛️ Instituição: <strong className="text-white underline">{filtroInstituicao}</strong>
                    </span>
                  )}
                  {filtroPeriodo !== 'TODOS' && (
                    <span>
                      📅 Período: <strong className="text-white underline">{filtroPeriodo}</strong>
                    </span>
                  )}
                  {filtroModelo !== 'TODOS' && (
                    <span>
                      📖 Modelo: <strong className="text-white underline">{filtroModelo}</strong>
                    </span>
                  )}
                  {filtroResponsavel !== 'TODOS' && (
                    <span>
                      👤 Responsável:{' '}
                      <strong className="text-white underline">
                        {filtroResponsavel === 'MEUS'
                          ? `Atribuídos a Mim (${usuarioLogado?.nome})`
                          : filtroResponsavel === 'SEM_RESPONSAVEL'
                          ? 'Sem Responsável'
                          : filtroResponsavel}
                      </strong>
                    </span>
                  )}
                  {filtroPrazo !== 'TODOS' && (
                    <span>
                      ⏱️ Prazo:{' '}
                      <strong className="text-amber-300 underline">
                        {filtroPrazo === 'ATRASADOS'
                          ? '🚨 Apenas Atrasados'
                          : filtroPrazo === 'HOJE'
                          ? '⚠️ Vence Hoje'
                          : filtroPrazo === 'URGENTES'
                          ? '⏳ Urgentes'
                          : filtroPrazo === 'NO_PRAZO'
                          ? '✅ No Prazo'
                          : '📦 Concluídos'}
                      </strong>
                    </span>
                  )}
                  <span>
                    Total Apurado: <strong className="text-emerald-300 font-mono">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFiltroInstituicao('TODAS');
                setFiltroPeriodo('TODOS');
                setFiltroModelo('TODOS');
                setFiltroPagamento('TODOS');
                setFiltroResponsavel('TODOS');
                setFiltroPrazo('TODOS');
                setBusca('');
              }}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 shadow-sm transition hover:scale-102 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            BARRA DE BUSCA E FILTROS RÁPIDOS (COM INSTITUIÇÃO, PERÍODO, RESPONSÁVEL & PRAZOS)
            ========================================================================= */}
        <div className="bg-white rounded-[24px] p-4 mb-6 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Campo de Busca Geral */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por formando, CPF, turma, modelo, responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#F4F6FB] text-slate-900 placeholder:text-slate-400 text-xs rounded-2xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] shadow-inner transition"
            />
          </div>

          {/* Filtro por Instituição de Ensino */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroInstituicao}
              onChange={(e) => setFiltroInstituicao(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] max-w-[190px]"
              title="Filtrar por Instituição de Ensino"
            >
              <option value="TODAS">🏛️ Todas as Instituições</option>
              {todasInstituicoesParaFiltro.map(({ nome, total }) => (
                <option key={nome} value={nome}>
                  {nome} {total > 0 ? `(${total})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Período */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              title="Filtrar por Período de Formatura"
            >
              <option value="TODOS">📅 Todos os Períodos</option>
              {todosPeriodosParaFiltro.map(({ periodo, total }) => (
                <option key={periodo} value={periodo}>
                  {periodo} {total > 0 ? `(${total})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Responsável */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] max-w-[170px]"
              title="Filtrar por Usuário Responsável"
            >
              <option value="TODOS">👤 Todos os Responsáveis</option>
              {usuarioLogado && (
                <option value="MEUS">⭐ Meus Álbuns</option>
              )}
              <option value="SEM_RESPONSAVEL">❓ Sem Responsável</option>
              {usuariosSistema.map((u) => (
                <option key={u.id} value={u.nome}>
                  👤 {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Prazo / Atrasos */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroPrazo}
              onChange={(e) => setFiltroPrazo(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              title="Filtrar por Situação do Prazo"
            >
              <option value="TODOS">⏱️ Prazos (Todos)</option>
              <option value="ATRASADOS">🚨 Apenas Atrasados</option>
              <option value="HOJE">⚠️ Vence Hoje</option>
              <option value="URGENTES">⏳ Urgentes (≤3d)</option>
              <option value="NO_PRAZO">✅ Em Aberto (No Prazo)</option>
              <option value="CONCLUIDOS">📦 Concluídos / Entregues</option>
            </select>
          </div>

          {/* Filtro por Modelo de Álbum */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
              className="bg-[#F4F6FB] text-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">Modelos (Todos)</option>
              <option value="Album premium">Album premium</option>
              <option value="Album Preto">Album Preto</option>
              <option value="Album Slim">Album Slim</option>
              <option value="Album Colégio">Album Colégio</option>
            </select>
          </div>

          {/* Filtros de Forma de Pagamento */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F6FB] p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setFiltroPagamento('TODOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroPagamento === 'TODOS'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroPagamento('A_VISTA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                filtroPagamento === 'A_VISTA'
                  ? 'bg-white text-teal-700 shadow-2xs border border-teal-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Filtrar por pagamentos à vista (Dinheiro ou PIX)"
            >
              <Wallet className="w-3.5 h-3.5 mr-1 text-teal-600" /> Dinheiro/PIX
            </button>
            <button
              onClick={() => setFiltroPagamento('CARTAO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                filtroPagamento === 'CARTAO'
                  ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1" /> Cartão
            </button>
            <button
              onClick={() => setFiltroPagamento('BOLETO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                filtroPagamento === 'BOLETO'
                  ? 'bg-white text-amber-700 shadow-2xs border border-amber-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Barcode className="w-3.5 h-3.5 mr-1" /> Boleto
            </button>
          </div>
        </div>

        {/* =========================================================================
            TABELA DE VENDAS COM DETALHAMENTO DO KIT (ÁLBUM + BRINDES)
            ========================================================================= */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-28">Pedido</th>
                  <th className="py-3 px-4 min-w-[220px]">Formando / Turma</th>
                  <th className="py-3 px-4 min-w-[180px]">Kit & Brindes</th>
                  <th className="py-3 px-4 w-32">Total do Kit</th>
                  <th className="py-3 px-4 min-w-[170px]">Pagamento</th>
                  <th className="py-3 px-4 min-w-[170px]">Produção</th>
                  <th className="py-3 px-4 text-right min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
                          <Camera className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-black text-slate-800">Pronto para cadastrar suas vendas reais</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Todos os dados de teste foram limpos. Clique no botão abaixo para registrar a primeira venda de álbum, configurar o kit de brindes e emitir boletos ou cartão.
                        </p>
                        <button
                          onClick={abrirModalNovaVenda}
                          className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:translate-y-[-1px] active:translate-y-[1px] transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Primeira Venda</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendasFiltradas.map((venda) => {
                    const parcelasPagas = venda.parcelasBoletos?.filter((p) => p.status === 'PAGO').length || 0;
                    const totalParcelasBoleto = venda.parcelasBoletos?.length || 0;
                    const brindesAtivos = venda.brindes?.filter((b) => b.selecionado) || [];

                    return (
                      <tr key={venda.id} className="hover:bg-slate-50/70 transition border-b border-slate-100 align-top">
                        {/* 1. Pedido */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-black text-slate-900 block text-xs tracking-tight">
                            {venda.codigoPedido}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{venda.dataVenda}</span>
                        </td>

                        {/* 2. Formando & Turma (Clique no Nome para abrir Prontuário/Observações) */}
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalObservacoes(venda);
                              }}
                              className="text-left font-bold text-xs text-slate-900 hover:text-purple-700 hover:underline flex items-center space-x-1 group cursor-pointer transition"
                              title="Clique para ver ou adicionar observações e ocorrências deste formando"
                            >
                              <span className="truncate max-w-[190px]">{venda.alunoNome}</span>
                              <FileText className="w-3.5 h-3.5 text-purple-600 opacity-60 group-hover:opacity-100 shrink-0" />
                            </button>
                            {((venda.observacoes && venda.observacoes.trim().length > 0) || (venda.historicoObservacoes && venda.historicoObservacoes.length > 0)) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalObservacoes(venda);
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] font-bold border border-amber-300 cursor-pointer shrink-0 transition"
                                title="Possui observações gravadas. Clique para ver!"
                              >
                                📝 {venda.historicoObservacoes?.length ? `${venda.historicoObservacoes.length} notas` : 'Obs'}
                              </button>
                            )}
                          </div>
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-1 max-w-full truncate">
                            <span>🏛️ {extrairInfoTurma(venda).instituicao}</span>
                            <span>&bull;</span>
                            <span>{extrairInfoTurma(venda).periodo}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap mt-1">
                            CPF: {venda.alunoCpf}
                          </div>
                        </td>

                        {/* 3. Kit & Brindes (com Lápis para Corrigir Brindes e Modelo) */}
                        <td className="py-3.5 px-4 min-w-[190px]">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                venda.modeloAlbum === 'Album premium'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : venda.modeloAlbum === 'Album Preto'
                                  ? 'bg-slate-900 text-white border-slate-700'
                                  : venda.modeloAlbum === 'Album Slim'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {venda.modeloAlbum}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalEditarBrindes(venda);
                              }}
                              className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition shadow-2xs cursor-pointer hover:scale-110 active:scale-95 shrink-0"
                              title="Corrigir brindes ou modelo do álbum deste kit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          {brindesAtivos.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-[200px]">
                              {brindesAtivos.map((b) => (
                                <span
                                  key={b.id || b.nome}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  +{b.nome}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-1 italic">Sem brindes</span>
                          )}
                        </td>

                        {/* 4. Total do Kit (com Lápis para Corrigir Valor Total) */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-36">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-black text-slate-950 text-sm block">
                              R$ {venda.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalEditarValorTotal(venda);
                              }}
                              className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition shadow-2xs cursor-pointer hover:scale-110 active:scale-95 shrink-0"
                              title="Corrigir valor total do kit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                            Kit Completo
                          </span>
                        </td>

                        {/* 5. Forma de Pagamento com Botão de Correção Imediata */}
                        <td className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">
                          {venda.formaPagamento === 'CARTAO' && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Cartão {venda.cartaoQtdParcelas}x
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {venda.cartaoBandeira} &bull; {venda.cartaoNsu}
                              </div>
                              <button
                                onClick={() => abrirModalEditarPagamento(venda)}
                                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 hover:underline cursor-pointer"
                              >
                                <Edit3 className="w-2.5 h-2.5 text-amber-600" />
                                <span>Corrigir pagamento</span>
                              </button>
                            </div>
                          )}

                          {venda.formaPagamento === 'BOLETO' && (
                            <div className="space-y-1">
                              <button
                                onClick={() => abrirCarneBoletos(venda)}
                                className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                                  parcelasPagas === totalParcelasBoleto && totalParcelasBoleto > 0
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                    : parcelasPagas > 0
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {parcelasPagas === totalParcelasBoleto && totalParcelasBoleto > 0 ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                ) : (
                                  <Barcode className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                )}
                                <span>
                                  {parcelasPagas === totalParcelasBoleto && totalParcelasBoleto > 0
                                    ? `Quitado (${parcelasPagas}/${totalParcelasBoleto})`
                                    : `Carnê ${venda.boletoQtdParcelas || totalParcelasBoleto}x (${parcelasPagas}/${totalParcelasBoleto})`}
                                </span>
                              </button>
                              <div className="text-[10px] text-slate-500">Banco Sicredi</div>
                              <button
                                onClick={() => abrirModalEditarPagamento(venda)}
                                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 hover:underline cursor-pointer"
                              >
                                <Edit3 className="w-2.5 h-2.5 text-amber-600" />
                                <span>Corrigir pagamento</span>
                              </button>
                            </div>
                          )}

                          {venda.formaPagamento === 'PIX' && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
                                PIX À Vista
                              </span>
                              <div>
                                <button
                                  onClick={() => abrirModalEditarPagamento(venda)}
                                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 hover:underline cursor-pointer"
                                >
                                  <Edit3 className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Corrigir pagamento</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {venda.formaPagamento === 'DINHEIRO' && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                <Wallet className="w-3.5 h-3.5 mr-1 text-teal-600" />
                                Dinheiro À Vista
                              </span>
                              <div>
                                <button
                                  onClick={() => abrirModalEditarPagamento(venda)}
                                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 hover:underline cursor-pointer"
                                >
                                  <Edit3 className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Corrigir pagamento</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 6. Produção & Prazos */}
                        <td className="py-3.5 px-4 min-w-[170px]">
                          {(() => {
                            const infoEtapa = obterPrazoEtapaAtual(venda);
                            const st = calcularStatusPrazo(infoEtapa.prazo, venda.statusProducao, infoEtapa.etapaCurto);
                            const etapa = obterEtapaInfo(venda.statusProducao);

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => avancarStatusProducao(venda.id)}
                                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${etapa.corBadge} hover:brightness-95 transition shadow-2xs group cursor-pointer`}
                                    title={`Etapa atual: ${etapa.nome}. Clique para avançar!`}
                                  >
                                    <span>{etapa.icone}</span>
                                    <span>{etapa.nomeCurto}</span>
                                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      abrirModalEditarPrazo(venda);
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition shadow-2xs cursor-pointer hover:scale-110 active:scale-95"
                                    title="Corrigir prazos de produção e responsável deste pedido"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirModalEditarPrazo(venda);
                                  }}
                                  className="text-[10px] font-mono text-slate-600 flex items-center space-x-1 hover:text-purple-700 cursor-pointer group"
                                  title="Clique para corrigir o prazo de produção"
                                >
                                  <Clock className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
                                  <span>{infoEtapa.prazo ? formatarDataBR(infoEtapa.prazo) : 'Sem prazo'}</span>
                                  <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-purple-600 transition-opacity ml-0.5" />
                                </div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirModalEditarPrazo(venda);
                                  }}
                                  className="text-[10px] text-slate-500 truncate max-w-[130px] hover:text-purple-700 cursor-pointer"
                                  title="Clique para alterar o responsável"
                                >
                                  👤 {venda.responsavelNome || 'Equipe'}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 7. Ações Organizadas e Alinhadas */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[180px]">
                          <div className="inline-flex items-center space-x-1.5">
                            {venda.formaPagamento === 'BOLETO' && (
                              <button
                                onClick={() => abrirCarneBoletos(venda)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 transition shadow-2xs inline-flex items-center space-x-1 cursor-pointer"
                                title="Visualizar Carnê de Boletos Sicredi"
                              >
                                <Barcode className="w-3.5 h-3.5 text-amber-700" />
                                <span>Boletos</span>
                              </button>
                            )}

                            {venda.formaPagamento === 'CARTAO' && (
                              <button
                                onClick={() => setVendaSelecionadaCartao(venda)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 transition shadow-2xs inline-flex items-center space-x-1 cursor-pointer"
                                title="Ver Comprovante do Cartão"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Recibo</span>
                              </button>
                            )}

                            <button
                              onClick={() => abrirModalEditarPagamento(venda)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition shadow-2xs inline-flex items-center justify-center cursor-pointer"
                              title="Corrigir forma de pagamento ou parcelas"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            </button>

                            {venda.statusProducao !== 'ENTREGUE' && (
                              <button
                                onClick={() => handleConcluirProducao(venda.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs inline-flex items-center space-x-1 transition cursor-pointer"
                                title="Concluir processo de produção e entregar álbum"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Concluir</span>
                              </button>
                            )}

                            <a
                              href={`https://wa.me/55${venda.alunoTelefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(
                                venda.alunoNome
                              )},%20seu%20Kit%20com%20${encodeURIComponent(venda.modeloAlbum)}%20está%20com%20status:%20${venda.statusProducao}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition shadow-2xs inline-flex items-center justify-center cursor-pointer"
                              title="Enviar no WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            </a>

                            <button
                              onClick={() => abrirModalExclusaoSegura(venda)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-2xs inline-flex items-center justify-center cursor-pointer"
                              title="Excluir Álbum com Segurança"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* =========================================================================
          MODAL 1: MONTADOR DO KIT DE ÁLBUM & VENDA
          ========================================================================= */}
      {modalNovaVendaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100">
            {/* Header do Montador */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#C026D3] text-white flex items-center justify-center shadow-md">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Montagem do Kit de Álbum & Venda</h3>
                  <p className="text-xs text-slate-500">Escolha o modelo, configure os brindes e defina a forma de pagamento</p>
                </div>
              </div>
              <button
                onClick={() => setModalNovaVendaAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas do Configurador */}
            <div className="flex items-center space-x-2 mt-5 p-1.5 bg-[#F4F6FB] rounded-2xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setFormAbaAtiva('ALBUM')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  formAbaAtiva === 'ALBUM'
                    ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-purple-600" />
                <span>1. Modelo do Álbum</span>
              </button>

              <button
                type="button"
                onClick={() => setFormAbaAtiva('BRINDES')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  formAbaAtiva === 'BRINDES'
                    ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 text-fuchsia-600" />
                <span>2. Brindes do Kit ({formBrindes.filter((b) => b.selecionado).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFormAbaAtiva('PAGAMENTO')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  formAbaAtiva === 'PAGAMENTO'
                    ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>3. Pagamento & Boletos</span>
              </button>
            </div>

            <form onSubmit={handleSubmitNovaVenda} className="mt-5 space-y-5">
              {/* ABA 1: MODELO DO ÁLBUM E DADOS DO ALUNO */}
              {formAbaAtiva === 'ALBUM' && (
                <div className="space-y-4">
                  {/* Dados Básicos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Formando *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Rafaela Medeiros"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CPF do Aluno *</label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={formCpf}
                        onChange={(e) => setFormCpf(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Contato do Aluno */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="(11) 90000-0000"
                        value={formTelefone}
                        onChange={(e) => setFormTelefone(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">E-mail do Formando</label>
                      <input
                        type="email"
                        placeholder="aluno@email.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Seção Inteligente: Instituição de Ensino, Curso e Período */}
                  <div className="bg-[#FAF8FE] border border-purple-200/80 rounded-2xl p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-[#7C3AED]" />
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Instituição de Ensino, Curso & Período
                        </label>
                      </div>
                      <Link
                        href="/instituicoes"
                        target="_blank"
                        className="text-[11px] font-bold text-[#7C3AED] hover:underline inline-flex items-center space-x-1"
                        title="Cadastrar ou gerenciar instituições e cursos"
                      >
                        <span>Gerenciar Instituições</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>

                    {/* Autocomplete / Busca em Tempo Real de Instituição */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Instituição de Ensino * <span className="text-[11px] font-normal text-slate-500">(digite para buscar ou digite um novo nome)</span>
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Digite o nome da Faculdade / Instituição (ex: Mackenzie, Anhembi, USP, juan...)"
                          value={formInstituicaoBusca}
                          onFocus={() => setDropdownInstAberto(true)}
                          onChange={(e) => {
                            setFormInstituicaoBusca(e.target.value);
                            setFormInstituicaoNome(e.target.value);
                            setDropdownInstAberto(true);
                          }}
                          className="w-full bg-white text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-10 py-3 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] shadow-xs"
                        />
                        {formInstituicaoBusca && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormInstituicaoBusca('');
                              setFormInstituicaoNome('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown de sugestões e pesquisa inteligente */}
                      {dropdownInstAberto && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setDropdownInstAberto(false)}
                          />
                          <div className="absolute left-0 right-0 mt-1 z-40 bg-white rounded-2xl shadow-2xl border border-purple-200 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                            {/* Opção para usar texto digitado como nova instituição */}
                            {formInstituicaoBusca.trim() && (
                              <div
                                onClick={() => {
                                  setFormInstituicaoNome(formInstituicaoBusca.trim());
                                  setDropdownInstAberto(false);
                                }}
                                className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-900 text-xs font-bold cursor-pointer flex items-center justify-between transition"
                              >
                                <div className="flex items-center space-x-2">
                                  <Plus className="w-4 h-4 text-[#7C3AED] shrink-0" />
                                  <span>
                                    Usar <strong className="underline">&quot;{formInstituicaoBusca.trim()}&quot;</strong> como instituição
                                  </span>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                                  Confirmar
                                </span>
                              </div>
                            )}

                            {/* Instituições cadastradas correspondentes */}
                            {instituicoesCadastradas
                              .filter((inst) => {
                                if (!formInstituicaoBusca.trim()) return true;
                                const q = formInstituicaoBusca.toLowerCase();
                                return (
                                  inst.nome.toLowerCase().includes(q) ||
                                  inst.sigla.toLowerCase().includes(q) ||
                                  inst.cidade.toLowerCase().includes(q)
                                );
                              })
                              .map((inst) => (
                                <div
                                  key={inst.id}
                                  onClick={() => {
                                    setFormInstituicaoNome(inst.nome);
                                    setFormInstituicaoBusca(inst.nome);
                                    setDropdownInstAberto(false);
                                  }}
                                  className={`p-3 text-xs hover:bg-purple-50/50 cursor-pointer flex items-center justify-between transition ${
                                    formInstituicaoNome.toLowerCase() === inst.nome.toLowerCase()
                                      ? 'bg-purple-50/80 font-bold'
                                      : ''
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-slate-800">{inst.nome}</span>
                                      {inst.sigla && (
                                        <span className="text-[10px] font-black px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                                          {inst.sigla}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                      {inst.campus} &bull; {inst.cidade}/{inst.uf}
                                    </span>
                                  </div>
                                  {formInstituicaoNome.toLowerCase() === inst.nome.toLowerCase() && (
                                    <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                                  )}
                                </div>
                              ))}

                            {instituicoesCadastradas.length === 0 && !formInstituicaoBusca.trim() && (
                              <div className="p-4 text-center text-xs text-slate-400">
                                Nenhuma instituição cadastrada ainda. Digite o nome acima para cadastrar.
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Curso e Período */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Curso */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Curso do Formando *</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Direito, Medicina, Administração..."
                          value={formCursoNome}
                          onChange={(e) => setFormCursoNome(e.target.value)}
                          className="w-full bg-white text-slate-900 text-xs font-semibold rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                        />

                        {/* Sugestões de cursos da instituição selecionada */}
                        {cursosDaInstituicaoSelecionada.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-slate-400">Sugestões:</span>
                            {cursosDaInstituicaoSelecionada.slice(0, 4).map((c) => (
                              <button
                                type="button"
                                key={c.id}
                                onClick={() => setFormCursoNome(c.nome)}
                                className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md border border-purple-200 transition cursor-pointer"
                              >
                                {c.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Período */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Período de Formatura *</label>
                        <select
                          value={formPeriodo}
                          onChange={(e) => setFormPeriodo(e.target.value)}
                          className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                        >
                          {PERIODOS_DISPONIVEIS.map((p) => (
                            <option key={p} value={p}>
                              {formatarLabelPeriodo(p)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Resumo da identificação da turma */}
                    <div className="bg-white/80 rounded-xl p-2.5 border border-purple-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Turma vinculada:</span>
                      <span className="font-bold text-purple-900">
                        {formCursoNome.trim() || 'Curso'} - {formInstituicaoNome.trim() || formInstituicaoBusca.trim() || 'Instituição'} ({formPeriodo.trim() || 'Período'})
                      </span>
                    </div>
                  </div>

                  {/* Seleção do Modelo de Álbum */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Selecione o Modelo de Álbum:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODELOS_DISPONIVEIS.map((item) => {
                        const isSelecionado = formModeloAlbum === item.modelo;

                        return (
                          <div
                            key={item.modelo}
                            onClick={() => {
                              setFormModeloAlbum(item.modelo);
                              setFormValorAlbum(item.valorSugerido.toString());
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelecionado
                                ? 'border-[#7C3AED] bg-purple-50/70 shadow-md ring-2 ring-purple-400'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <strong className="text-slate-900 text-sm font-extrabold">{item.modelo}</strong>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                Sugerido: R$ {item.valorSugerido}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{item.descricao}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campo para Definir o Valor que Foi Vendido */}
                  <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <strong className="text-slate-900 text-xs block font-bold">
                        Valor Negociado para o {formModeloAlbum}:
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Você pode editar livremente o valor acordado com o formando.
                      </span>
                    </div>
                    <div className="relative w-full sm:w-48">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formValorAlbum}
                        onChange={(e) => setFormValorAlbum(e.target.value)}
                        className="w-full bg-white text-slate-950 font-mono font-black text-base rounded-xl pl-9 pr-3 py-2 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('BRINDES')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <span>Avançar para Brindes do Kit</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 2: BRINDES DO KIT */}
              {formAbaAtiva === 'BRINDES' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Brindes & Opcionais do Kit
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Marque os itens que acompanharão o álbum e defina se é cortesia (R$ 0,00) ou valor adicional.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {BRINDES_DISPONIVEIS.map((brindeDef) => {
                      const brindeAtual = formBrindes.find((b) => b.nome === brindeDef.nome);
                      const isAtivo = brindeAtual?.selecionado || false;
                      const Icone = brindeDef.icone;

                      return (
                        <div
                          key={brindeDef.nome}
                          className={`p-4 rounded-2xl border transition-all ${
                            isAtivo
                              ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                              : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => toggleBrinde(brindeDef.nome)}>
                              <input
                                type="checkbox"
                                checked={isAtivo}
                                onChange={() => toggleBrinde(brindeDef.nome)}
                                className="w-4 h-4 text-[#7C3AED] rounded-md focus:ring-purple-400"
                              />
                              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                <Icone className="w-4 h-4" />
                              </div>
                              <div>
                                <strong className="text-slate-900 text-xs block font-bold">{brindeDef.nome}</strong>
                                <span className="text-[11px] text-slate-500">{brindeDef.descricao}</span>
                              </div>
                            </div>

                            {/* Valor Adicional / Cortesia */}
                            {isAtivo && (
                              <div className="flex items-center space-x-2 self-end sm:self-auto">
                                <span className="text-[11px] font-bold text-slate-600">Valor Adicional:</span>
                                <div className="relative w-28">
                                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={brindeAtual?.valorAdicional || 0}
                                    onChange={(e) => setBrindeValor(brindeDef.nome, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white text-slate-900 font-mono text-xs rounded-lg pl-7 pr-2 py-1.5 border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
                                  {(brindeAtual?.valorAdicional || 0) === 0 ? 'Cortesia' : 'Adicional'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('ALBUM')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Voltar ao Modelo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('PAGAMENTO')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <span>Avançar para Pagamento</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 3: RESUMO DO KIT & FORMA DE PAGAMENTO */}
              {formAbaAtiva === 'PAGAMENTO' && (
                <div className="space-y-4">
                  {/* Resumo do Kit Montado com a Soma Total */}
                  <div className="p-5 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-indigo-50 rounded-2xl border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-purple-900 mb-3">
                      <Sparkles className="w-4 h-4 text-fuchsia-600" />
                      <span>Resumo do Kit Montado:</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 pb-3 border-b border-purple-200/80">
                      <div className="flex justify-between">
                        <span>
                          Modelo: <strong>{formModeloAlbum}</strong>
                        </span>
                        <span className="font-mono font-bold">R$ {numValorAlbum.toFixed(2)}</span>
                      </div>

                      {formBrindes
                        .filter((b) => b.selecionado)
                        .map((b) => (
                          <div key={b.nome} className="flex justify-between text-slate-600 text-[11px]">
                            <span>
                              &bull; Brinde: <strong>{b.nome}</strong>
                            </span>
                            <span className="font-mono">
                              {b.valorAdicional === 0 ? 'Cortesia (R$ 0,00)' : `+ R$ ${b.valorAdicional.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase block">SOMA TOTAL DO KIT:</span>
                        <span className="text-[11px] text-purple-700 font-medium">
                          Valor que será cobrado no cartão ou parcelado no boleto
                        </span>
                      </div>
                      <div className="font-mono font-black text-2xl text-purple-950">
                        R$ {somaTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Seleção da Forma de Pagamento */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Forma de Pagamento *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('PIX')}
                        className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'PIX'
                            ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm ring-2 ring-purple-400 font-black'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>PIX À Vista</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('DINHEIRO')}
                        className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'DINHEIRO'
                            ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm ring-2 ring-teal-400 font-black'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Wallet className="w-5 h-5 text-teal-600" />
                        <span>Dinheiro À Vista</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('CARTAO')}
                        className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'CARTAO'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-400 font-black'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <span>Cartão de Crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('BOLETO')}
                        className={`py-3 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'BOLETO'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-400 font-black'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Barcode className="w-5 h-5 text-amber-600" />
                        <span>Boleto / Carnê</span>
                      </button>
                    </div>
                  </div>

                  {/* Detalhes do PIX */}
                  {formFormaPagamento === 'PIX' && (
                    <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-900 flex items-center">
                          <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
                          Pagamento À Vista via PIX:
                        </span>
                        <span className="font-mono font-black text-sm text-purple-950">
                          R$ {somaTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800">
                        Chave CNPJ Sicredi: <strong>financeiro@onagenciadeeventos.com.br</strong> &bull; Quitação e baixa imediata no sistema.
                      </p>
                    </div>
                  )}

                  {/* Detalhes do Dinheiro */}
                  {formFormaPagamento === 'DINHEIRO' && (
                    <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-teal-900 flex items-center">
                          <Wallet className="w-4 h-4 mr-1.5 text-teal-600" />
                          Pagamento À Vista em Dinheiro / Espécie:
                        </span>
                        <span className="font-mono font-black text-sm text-teal-950">
                          R$ {somaTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-800">
                        Valor total recebido em espécie no ato da contratação &bull; Quitação à vista confirmada.
                      </p>
                    </div>
                  )}

                  {/* Detalhes do Cartão */}
                  {formFormaPagamento === 'CARTAO' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                      <span className="text-xs font-extrabold text-emerald-900 block">Dados da Transação no Cartão:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Parcelamento do Kit</label>
                          <select
                            value={formCartaoParcelas}
                            onChange={(e) => setFormCartaoParcelas(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 24].map((p) => (
                              <option key={p} value={p}>
                                {p}x de R$ {(somaTotalKit / p).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Bandeira</label>
                          <select
                            value={formCartaoBandeira}
                            onChange={(e) => setFormCartaoBandeira(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                          >
                            <option value="Mastercard">Mastercard</option>
                            <option value="Visa">Visa</option>
                            <option value="Elo">Elo</option>
                            <option value="American Express">American Express</option>
                            <option value="Hipercard">Hipercard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Código NSU / Autorização</label>
                          <input
                            type="text"
                            placeholder="ex: NSU-849102"
                            value={formCartaoNsu}
                            onChange={(e) => setFormCartaoNsu(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalhes do Boleto */}
                  {formFormaPagamento === 'BOLETO' && (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                      <span className="text-xs font-extrabold text-amber-900 block flex items-center">
                        <Barcode className="w-4 h-4 mr-1.5" />
                        Emissão de Carnê Sicredi:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Parcelamento do Kit</label>
                          <select
                            value={formBoletoParcelas}
                            onChange={(e) => setFormBoletoParcelas(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 24].map((p) => (
                              <option key={p} value={p}>
                                {p} parcelas de R$ {(somaTotalKit / p).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">1º Vencimento</label>
                          <input
                            type="date"
                            required
                            value={formPrimeiroVencimento}
                            onChange={(e) => setFormPrimeiroVencimento(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        O sistema gerará automaticamente a linha digitável e o QR Code PIX para cada parcela do carnê.
                      </p>
                    </div>
                  )}

                  {/* Seção: Responsável e Prazos por Etapa de Produção */}
                  <div className="p-4.5 bg-purple-50/70 rounded-2xl border border-purple-200/90 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-purple-950 flex items-center">
                          <UserCheck className="w-4 h-4 mr-1.5 text-purple-600" />
                          Responsável & Prazos por Etapa de Produção
                        </span>
                        <p className="text-[11px] text-purple-800 mt-0.5">
                          Defina o prazo de cada fase. As etapas posteriores podem ser deixadas em branco e preenchidas conforme o processo avançar.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 self-start sm:self-auto shrink-0">
                        Alerta de Atraso por Etapa
                      </span>
                    </div>

                    {/* Usuário Responsável */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Usuário Responsável pelo Processo *
                      </label>
                      <select
                        value={formResponsavelNome}
                        onChange={(e) => {
                          const nome = e.target.value;
                          setFormResponsavelNome(nome);
                          const achei = usuariosSistema.find((u) => u.nome === nome);
                          if (achei) setFormResponsavelEmail(achei.email);
                        }}
                        className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-purple-200 font-bold focus:ring-2 focus:ring-[#7C3AED]"
                      >
                        {usuariosSistema.length === 0 && (
                          <option value={usuarioLogado?.nome || 'Administrador'}>
                            {usuarioLogado?.nome || 'Administrador'} (Você)
                          </option>
                        )}
                        {usuariosSistema.map((u) => (
                          <option key={u.id} value={u.nome}>
                            {u.nome} ({u.perfil})
                          </option>
                        ))}
                        {usuarioLogado && !usuariosSistema.some((u) => u.nome === usuarioLogado.nome) && (
                          <option value={usuarioLogado.nome}>
                            {usuarioLogado.nome} (Você)
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Grid com as 3 Etapas de Produção */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Etapa 1: Layout */}
                      <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-900 flex items-center">
                            <span className="mr-1">🎨</span> 1. Criação de Layout
                          </span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            Etapa Atual
                          </span>
                        </div>
                        <input
                          type="date"
                          value={formPrazoLayout}
                          onChange={(e) => setFormPrazoLayout(e.target.value)}
                          className="w-full bg-[#F8FAFC] text-slate-900 text-xs rounded-lg p-2 border border-blue-200 font-mono font-bold focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[15, 30].map((dias) => (
                            <button
                              key={dias}
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + dias);
                                setFormPrazoLayout(d.toISOString().split('T')[0]);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200"
                            >
                              +{dias}d
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setFormPrazoLayout('')}
                            className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200"
                            title="Deixar em branco"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>

                      {/* Etapa 2: Aprovação do Cliente */}
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-900 flex items-center">
                            <span className="mr-1">👤</span> 2. Aprovação Cliente
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            (Opcional)
                          </span>
                        </div>
                        <input
                          type="date"
                          value={formPrazoAprovacao}
                          onChange={(e) => setFormPrazoAprovacao(e.target.value)}
                          placeholder="Em branco..."
                          className="w-full bg-[#F8FAFC] text-slate-900 text-xs rounded-lg p-2 border border-amber-200 font-mono font-bold focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[15, 30].map((dias) => (
                            <button
                              key={dias}
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + dias);
                                setFormPrazoAprovacao(d.toISOString().split('T')[0]);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200"
                            >
                              +{dias}d
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setFormPrazoAprovacao('')}
                            className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200"
                            title="Deixar em branco"
                          >
                            Em branco
                          </button>
                        </div>
                      </div>

                      {/* Etapa 3: Confecção do Álbum */}
                      <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-900 flex items-center">
                            <span className="mr-1">🏭</span> 3. Confecção Álbum
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            (Opcional)
                          </span>
                        </div>
                        <input
                          type="date"
                          value={formPrazoConfeccao}
                          onChange={(e) => setFormPrazoConfeccao(e.target.value)}
                          placeholder="Em branco..."
                          className="w-full bg-[#F8FAFC] text-slate-900 text-xs rounded-lg p-2 border border-purple-200 font-mono font-bold focus:ring-1 focus:ring-purple-500"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[15, 30, 45].map((dias) => (
                            <button
                              key={dias}
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + dias);
                                setFormPrazoConfeccao(d.toISOString().split('T')[0]);
                              }}
                              className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200"
                            >
                              +{dias}d
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setFormPrazoConfeccao('')}
                            className="px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200"
                            title="Deixar em branco"
                          >
                            Em branco
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-purple-900 bg-white/70 p-2.5 rounded-xl border border-purple-200/60 leading-relaxed">
                      💡 <strong>Prazos por etapa:</strong> Você pode estipular apenas o prazo da etapa atual (ex: <em>Layout - 15 dias</em>) e deixar as seguintes em branco. Quando o status for avançado, o prazo da etapa seguinte poderá ser estipulado ou prorrogado.
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Produção</label>
                    <textarea
                      rows={2}
                      placeholder="ex: Fotos com os avós nas páginas centrais, gravação personalizada..."
                      value={formObservacoes}
                      onChange={(e) => setFormObservacoes(e.target.value)}
                      className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  {/* Botões Finais de Confirmação */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('BRINDES')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Voltar aos Brindes
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalNovaVendaAberto(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar Venda do Kit (R$ {somaTotalKit.toFixed(2)})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VISUALIZADOR E EMISSOR DE BOLETOS / CARNÊ SICREDI
          ========================================================================= */}
      {vendaSelecionadaBoletos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100">
            {/* Header do Carnê */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900">
                      Carnê de Boletos Sicredi • {vendaSelecionadaBoletos.codigoPedido}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Sicredi 748-X
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Formando: <strong>{vendaSelecionadaBoletos.alunoNome}</strong> ({vendaSelecionadaBoletos.turmaNome})
                  </p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-slate-600">
                    <span className="font-semibold">📱 WhatsApp:</span>
                    {editandoTelefoneVendaId === vendaSelecionadaBoletos.id ? (
                      <div className="flex items-center space-x-1.5 bg-purple-50 p-1 rounded-lg border border-purple-200">
                        <input
                          type="text"
                          value={novoTelefoneInput}
                          onChange={(e) => setNovoTelefoneInput(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="px-2 py-0.5 rounded border border-purple-300 font-mono text-xs w-36 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSalvarTelefoneFormando(vendaSelecionadaBoletos.id, novoTelefoneInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSalvarTelefoneFormando(vendaSelecionadaBoletos.id, novoTelefoneInput)}
                          className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[11px] hover:bg-purple-700 cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoTelefoneVendaId(null)}
                          className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] hover:bg-slate-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <strong className="font-mono text-slate-800">
                          {vendaSelecionadaBoletos.alunoTelefone || 'Sem telefone cadastrado'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => {
                            setNovoTelefoneInput(vendaSelecionadaBoletos.alunoTelefone || '');
                            setEditandoTelefoneVendaId(vendaSelecionadaBoletos.id);
                          }}
                          className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                          title="Clique para corrigir ou alterar o número de WhatsApp deste formando"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Alterar Número</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => abrirModalRenegociacao(vendaSelecionadaBoletos)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer transition hover:scale-102"
                  title="Ajuste de parcelas em lote / renegociação de vencimento ou valores por atraso"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renegociar Parcelas</span>
                </button>
                <button
                  onClick={() => abrirModalEditarPagamento(vendaSelecionadaBoletos)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer transition hover:scale-102"
                  title="Corrigir a forma de pagamento (Boleto, Cartão, Pix, Dinheiro) ou a quantidade de parcelas"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Corrigir Pagamento</span>
                </button>
                <button
                  onClick={() => setVendaSelecionadaBoletos(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Informações Resumidas do Kit no Carnê */}
            <div className="my-4 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-amber-950 font-extrabold text-sm block">
                  Kit: {vendaSelecionadaBoletos.modeloAlbum}
                </span>
                <div className="text-amber-800 text-[11px] mt-0.5">
                  Brindes Inclusos:{' '}
                  {vendaSelecionadaBoletos.brindes?.filter((b) => b.selecionado).map((b) => b.nome).join(', ') || 'Nenhum'}
                </div>
                <span className="text-amber-900 font-bold text-xs mt-1 block">
                  Soma Total do Kit: <strong>R$ {vendaSelecionadaBoletos.valorTotalKit.toFixed(2)}</strong> em{' '}
                  {vendaSelecionadaBoletos.parcelasBoletos?.length} parcelas
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cobrança Sicredi Digital</span>
                </div>
                <button
                  onClick={sincronizarBaixasSicredi}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer transition"
                  title="Consultar na API do Sicredi se algum boleto ou Pix já foi pago e atualizar a baixa automaticamente"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  <span>🔄 Atualizar Status Sicredi</span>
                </button>

                {/* Botão de Renegociação Direto */}
                <button
                  type="button"
                  onClick={() => abrirModalRenegociacao(vendaSelecionadaBoletos)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer transition hover:scale-102"
                  title="Ajuste em lote das parcelas não pagas (alterar vencimentos, redividir ou aplicar acréscimo/desconto)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renegociar Parcelas</span>
                </button>

                {/* Menu de Opções idêntico ao Print do Usuário (Image 2) */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setMenuOpcoesCarneAberto(!menuOpcoesCarneAberto)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer transition"
                    title="Menu de Opções de Parcelamento"
                  >
                    <span>Opções de Parcelas ▾</span>
                  </button>
                  {menuOpcoesCarneAberto && (
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpcoesCarneAberto(false);
                          abrirModalEditarPagamento(vendaSelecionadaBoletos);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Gerar Parcelas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpcoesCarneAberto(false);
                          const primeiraPendente = vendaSelecionadaBoletos.parcelasBoletos?.find(
                            (p) => p.status !== 'PAGO'
                          );
                          if (primeiraPendente) {
                            abrirModalQuitacaoManual(vendaSelecionadaBoletos, primeiraPendente);
                          } else {
                            showToast('Todas as parcelas deste carnê já foram quitadas!');
                          }
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Quitar Parcelas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpcoesCarneAberto(false);
                          abrirModalRenegociacao(vendaSelecionadaBoletos);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Renegociar Parcelas</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => abrirModalEditarPagamento(vendaSelecionadaBoletos)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer transition hover:scale-102"
                  title="Corrigir a forma de pagamento (Boleto, Cartão, Pix, Dinheiro) ou a quantidade de parcelas"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Corrigir Pagamento</span>
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Carnê</span>
                </button>
                {(() => {
                  const proximaPendente = vendaSelecionadaBoletos.parcelasBoletos?.find((p) => p.status !== 'PAGO');
                  return (
                    <>
                      {proximaPendente && (
                        <button
                          type="button"
                          onClick={() => handleEnviarParcelaWhatsApp(vendaSelecionadaBoletos, proximaPendente)}
                          disabled={enviandoZap === `parcela-${proximaPendente.numero}`}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer transition hover:scale-102"
                          title={`Enviar a próxima parcela pendente (Boleto #${proximaPendente.numero}) com código e Pix avulsos`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {enviandoZap === `parcela-${proximaPendente.numero}`
                              ? 'Enviando...'
                              : `Enviar Boleto #${proximaPendente.numero} no Zap`}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEnviarCarneWhatsApp(vendaSelecionadaBoletos)}
                        disabled={enviandoZap === 'carne'}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer transition hover:scale-102"
                        title="Enviar todas as parcelas pendentes separadamente pelo WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{enviandoZap === 'carne' ? 'Enviando Boletos...' : 'Enviar Todos Boletos Separados'}</span>
                      </button>
                    </>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setModalWhatsAppAberto(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs flex items-center space-x-1 cursor-pointer transition"
                  title="Gerenciar conexão do WhatsApp da agência e lembretes de vencimento"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Zap Agência</span>
                </button>
              </div>
            </div>

            {/* Lista de Parcelas e Boletos */}
            <div className="space-y-3.5">
              {vendaSelecionadaBoletos.parcelasBoletos?.map((parcela) => {
                const isPaga = parcela.status === 'PAGO';

                return (
                  <div
                    key={parcela.numero}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPaga
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isPaga ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {parcela.numero}
                        </span>
                        <div>
                          <strong className="text-slate-900 text-xs block">
                            Parcela {parcela.numero} de {vendaSelecionadaBoletos.parcelasBoletos?.length}
                          </strong>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-500">
                              Vencimento: <strong>{parcela.vencimento}</strong>
                            </span>
                            {parcela.ultimoEnvioZap && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Zap enviado {parcela.ultimoEnvioZap}</span>
                              </span>
                            )}
                            {parcela.lembrete1DiaEnviado && (
                              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>Lembrete 1 dia enviado ({parcela.lembrete1DiaData})</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Sicredi Registrado</span>
                          {parcela.nossoNumero && <span className="font-mono ml-0.5">({parcela.nossoNumero})</span>}
                        </span>

                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-sm block">
                            R$ {parcela.valor.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              isPaga
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isPaga ? '✓ Liquidado / Pago' : 'Aguardando Pagamento'}
                          </span>
                        </div>

                        {!isPaga && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleEnviarParcelaWhatsApp(vendaSelecionadaBoletos, parcela)}
                              disabled={enviandoZap === `parcela-${parcela.numero}`}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center space-x-1 cursor-pointer transition hover:scale-102"
                              title="Enviar boleto, linha digitável e código PIX desta parcela diretamente para o WhatsApp do formando"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-700" />
                              <span>
                                {enviandoZap === `parcela-${parcela.numero}` ? 'Enviando...' : 'Enviar Boleto no Zap'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModalQuitacaoManual(vendaSelecionadaBoletos, parcela)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs flex items-center space-x-1 cursor-pointer transition hover:scale-102"
                              title="Quitação manual da parcela via PIX, dinheiro ou transferência"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Quitar Parcela</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quando Liquidado: Banner de Confirmação e Detalhes da Quitação */}
                    {isPaga ? (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                        <div>
                          <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Pagamento liquidado com sucesso!</span>
                            {parcela.formaBaixa && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black">
                                via {parcela.formaBaixa}
                              </span>
                            )}
                          </div>
                          {parcela.observacoesBaixa && (
                            <p className="text-[11px] text-emerald-700 italic mt-0.5">
                              Obs: {parcela.observacoesBaixa}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {parcela.dataPagamento && (
                            <span className="text-[11px] font-semibold text-emerald-700 block">
                              Data de quitação: {parcela.dataPagamento}
                            </span>
                          )}
                          {parcela.valorPago !== undefined && (
                            <span className="text-[11px] text-emerald-800 font-bold block">
                              Valor recebido: R$ {parcela.valorPago.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Linha Digitável e PIX quando PENDENTE */
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {/* Linha Digitável */}
                        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-500 block uppercase">Linha Digitável:</span>
                            <code className="text-[11px] font-mono text-slate-800 truncate block select-all">
                              {parcela.linhaDigitavel}
                            </code>
                          </div>
                          <button
                            onClick={() => copiarTexto(parcela.linhaDigitavel, `linha-${parcela.numero}`)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
                            title="Copiar Linha Digitável"
                          >
                            {copiadoIdx === `linha-${parcela.numero}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* PIX Copia e Cola */}
                        <div className="bg-[#FAF5FF] p-2.5 rounded-xl border border-purple-200/70 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-purple-700 block uppercase">PIX Copia e Cola:</span>
                            <code className="text-[11px] font-mono text-purple-900 truncate block select-all">
                              {parcela.codigoPix}
                            </code>
                          </div>
                          <button
                            onClick={() => copiarTexto(parcela.codigoPix, `pix-${parcela.numero}`)}
                            className="p-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:text-purple-900 shrink-0"
                            title="Copiar Código PIX"
                          >
                            {copiadoIdx === `pix-${parcela.numero}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: COMPROVANTE DE PAGAMENTO NO CARTÃO DO KIT
          ========================================================================= */}
      {vendaSelecionadaCartao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 lg:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Comprovante de Cartão</h3>
                  <p className="text-xs text-slate-500">{vendaSelecionadaCartao.codigoPedido}</p>
                </div>
              </div>
              <button
                onClick={() => setVendaSelecionadaCartao(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recibo Tátil da Maquininha */}
            <div className="my-5 p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 font-mono text-xs space-y-2.5">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <span className="font-bold text-slate-900 text-sm block">ON AGÊNCIA DE EVENTOS</span>
                <span className="text-[10px] text-slate-500">CNPJ: 00.000.000/0001-00</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Formando:</span>
                <strong className="text-slate-900">{vendaSelecionadaCartao.alunoNome}</strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Turma:</span>
                <span className="text-slate-800">{vendaSelecionadaCartao.turmaNome}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Modelo:</span>
                <strong className="text-purple-900">{vendaSelecionadaCartao.modeloAlbum}</strong>
              </div>

              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Brindes do Kit:</span>
                <span className="text-right text-slate-800 max-w-[180px]">
                  {vendaSelecionadaCartao.brindes?.filter((b) => b.selecionado).map((b) => b.nome).join(', ') || 'Nenhum'}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Bandeira:</span>
                <strong className="text-slate-900">{vendaSelecionadaCartao.cartaoBandeira}</strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Parcelamento:</span>
                <strong className="text-slate-900">
                  {vendaSelecionadaCartao.cartaoQtdParcelas}x de R${' '}
                  {(vendaSelecionadaCartao.valorTotalKit / (vendaSelecionadaCartao.cartaoQtdParcelas || 1)).toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Autorização / NSU:</span>
                <span className="text-slate-900 font-bold">{vendaSelecionadaCartao.cartaoNsu}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Status da Transação:</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  {vendaSelecionadaCartao.cartaoStatus}
                </span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">SOMA TOTAL DO KIT:</span>
                <span className="font-black text-slate-900 text-base">
                  R$ {vendaSelecionadaCartao.valorTotalKit.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Recibo de Venda</span>
            </button>

            <button
              onClick={() => abrirModalEditarPagamento(vendaSelecionadaCartao)}
              className="w-full mt-2.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>Corrigir Forma de Pagamento ou Parcelas</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ALERTA DE PRAZOS DE PRODUÇÃO VENCIDOS (INSISTENTE NA TELA)
          ========================================================================= */}
      {modalAlertaPrazoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-200">
            {/* Header do Alerta */}
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 animate-pulse shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-rose-950">
                      Alerta de Prazos Vencidos na Produção
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      {albunsAtrasados.length} {albunsAtrasados.length === 1 ? 'pendente' : 'pendentes'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Os álbuns abaixo ultrapassaram o prazo limite de entrega e requerem ação imediata:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAlertaPrazoAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                title="Fechar janela (o alerta permanece na barra superior)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Álbuns Atrasados */}
            <div className="my-5 space-y-3.5">
              {albunsAtrasados.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                  <CheckSquare className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-950">Excelente! Não há nenhum álbum atrasado no momento.</p>
                  <p className="text-xs text-emerald-700 mt-1">Todos os processos estão dentro do prazo estipulado.</p>
                </div>
              ) : (
                albunsAtrasados.map((venda) => {
                  const infoEtapa = obterPrazoEtapaAtual(venda);
                  const st = calcularStatusPrazo(infoEtapa.prazo, venda.statusProducao, infoEtapa.etapaCurto);
                  const etapaInfo = obterEtapaInfo(venda.statusProducao);

                  return (
                    <div
                      key={venda.id}
                      className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50/80 transition shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {venda.codigoPedido}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center space-x-1 ${etapaInfo.badge}`}>
                              <span>{etapaInfo.icone}</span>
                              <span>{etapaInfo.nome}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                              {st.texto}
                            </span>
                          </div>
                          <strong className="text-slate-900 text-sm block mt-1">
                            {venda.alunoNome}
                          </strong>
                          <span className="text-xs text-slate-600 block">
                            {venda.turmaNome} &bull; Modelo: <strong className="text-purple-900">{venda.modeloAlbum}</strong>
                          </span>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[11px] text-slate-500 block">
                            Prazo da Etapa: <strong className="text-rose-700 font-mono text-xs">{formatarDataBR(infoEtapa.prazo)}</strong>
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Responsável: <strong className="text-slate-800">{venda.responsavelNome || 'Não Atribuído'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Mini visualização dos prazos das 3 etapas */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-white/80 rounded-xl border border-rose-100 text-[10px]">
                        <div className="text-center">
                          <span className="text-slate-400 block font-bold">1. Layout</span>
                          <span className={`font-mono font-semibold ${venda.statusProducao === 'EM_DIAGRAMACAO' ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
                            {venda.prazoLayout ? formatarDataBR(venda.prazoLayout) : 'Em branco'}
                          </span>
                        </div>
                        <div className="text-center border-x border-slate-100">
                          <span className="text-slate-400 block font-bold">2. Aprovação</span>
                          <span className={`font-mono font-semibold ${venda.statusProducao === 'APROVACAO_CLIENTE' ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
                            {venda.prazoAprovacaoCliente ? formatarDataBR(venda.prazoAprovacaoCliente) : 'Em branco'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block font-bold">3. Confecção</span>
                          <span className={`font-mono font-semibold ${venda.statusProducao === 'EM_GRAFICA' ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
                            {venda.prazoConfeccao ? formatarDataBR(venda.prazoConfeccao) : 'Em branco'}
                          </span>
                        </div>
                      </div>

                      {/* Botões Rápidos de Resolução */}
                      <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-slate-500 mr-1">Prorrogar:</span>
                          <button
                            onClick={() => handleEstenderPrazo(venda.id, 7)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition"
                            title="Adicionar mais 7 dias ao prazo da etapa atual"
                          >
                            +7 dias
                          </button>
                          <button
                            onClick={() => handleEstenderPrazo(venda.id, 15)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition"
                            title="Adicionar mais 15 dias ao prazo da etapa atual"
                          >
                            +15 dias
                          </button>
                          <button
                            onClick={() => {
                              setModalAlertaPrazoAberto(false);
                              abrirModalEditarPrazo(venda);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 shadow-2xs transition flex items-center space-x-1"
                            title="Ajustar prazos de cada etapa ou alterar responsável"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Prazos</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => avancarStatusProducao(venda.id)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition flex items-center space-x-1"
                            title="Concluir esta etapa e avançar para a próxima fase"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>Avançar Etapa</span>
                          </button>

                          <button
                            onClick={() => handleConcluirProducao(venda.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition flex items-center space-x-1.5"
                            title="Finalizar este álbum como entregue e remover alerta"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Entregue</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer do Alerta */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>O aviso permanece no topo da tela até a conclusão ou prorrogação de todos os itens.</span>
              </span>
              <button
                onClick={() => setModalAlertaPrazoAberto(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition shrink-0"
              >
                Entendido / Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: EDIÇÃO DE ETAPA, RESPONSÁVEL E PRAZOS POR ETAPA
          ========================================================================= */}
      {vendaEditandoPrazo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 lg:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ajustar Etapa, Responsável & Prazos
                  </h3>
                  <p className="text-xs text-slate-500">
                    {vendaEditandoPrazo.codigoPedido} &bull; {vendaEditandoPrazo.alunoNome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVendaEditandoPrazo(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoPrazo} className="mt-4 space-y-4">
              {/* Etapa Atual de Produção */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  Etapa Atual de Produção:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'EM_DIAGRAMACAO', rotulo: '1. Criação Layout', icone: '🎨' },
                    { id: 'APROVACAO_CLIENTE', rotulo: '2. Aprovação', icone: '👤' },
                    { id: 'EM_GRAFICA', rotulo: '3. Confecção Gráfica', icone: '🏭' },
                    { id: 'PRONTO_ENTREGA', rotulo: '4. Pronto p/ Entrega', icone: '📦' },
                    { id: 'ENTREGUE', rotulo: '5. Entregue / Fim', icone: '✅' },
                  ].map((et) => (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => setEditStatusProducao(et.id as any)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center space-x-2 ${
                        editStatusProducao === et.id
                          ? 'ring-2 ring-purple-600 border-purple-500 bg-purple-50 text-purple-950 font-black'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{et.icone}</span>
                      <span className="truncate">{et.rotulo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Usuário Responsável */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  Usuário Responsável pelo Álbum:
                </label>
                <select
                  value={editResponsavelNome}
                  onChange={(e) => {
                    const nome = e.target.value;
                    setEditResponsavelNome(nome);
                    const achei = usuariosSistema.find((u) => u.nome === nome);
                    if (achei) setEditResponsavelEmail(achei.email);
                  }}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  <option value="">Selecione um usuário...</option>
                  {usuariosSistema.map((u) => (
                    <option key={u.id} value={u.nome}>
                      {u.nome} ({u.email}) - {u.perfil}
                    </option>
                  ))}
                  {usuarioLogado && !usuariosSistema.some((u) => u.nome === usuarioLogado.nome) && (
                    <option value={usuarioLogado.nome}>
                      {usuarioLogado.nome} (Você)
                    </option>
                  )}
                </select>
              </div>

              {/* Informação explicativa sobre prazos por etapa */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Prazos por Etapa:</strong> Defina o prazo da etapa em andamento e deixe as seguintes em branco se preferir estipular quando o álbum avançar.
                </span>
              </div>

              {/* 3 Etapas de Prazo */}
              <div className="space-y-3">
                {/* 1. Layout */}
                <div className={`p-3.5 rounded-2xl border transition ${editStatusProducao === 'EM_DIAGRAMACAO' ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center">
                      <span className="mr-1.5">🎨</span>
                      <span>1. Prazo da Criação de Layout</span>
                      {editStatusProducao === 'EM_DIAGRAMACAO' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                          Etapa Ativa
                        </span>
                      )}
                    </label>
                  </div>
                  <input
                    type="date"
                    value={editPrazoLayout}
                    onChange={(e) => setEditPrazoLayout(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <div className="flex items-center space-x-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400">Atalhos:</span>
                    {[15, 30].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + dias);
                          setEditPrazoLayout(d.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-100 hover:text-purple-800 text-[10px] font-bold text-slate-600 transition"
                      >
                        +{dias}d
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditPrazoLayout('')}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold text-slate-500 transition"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* 2. Aprovação */}
                <div className={`p-3.5 rounded-2xl border transition ${editStatusProducao === 'APROVACAO_CLIENTE' ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center">
                      <span className="mr-1.5">👤</span>
                      <span>2. Prazo de Aprovação do Cliente</span>
                      {editStatusProducao === 'APROVACAO_CLIENTE' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                          Etapa Ativa
                        </span>
                      )}
                    </label>
                    {!editPrazoAprovacao && (
                      <span className="text-[10px] text-slate-400 font-medium">Em branco</span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editPrazoAprovacao}
                    onChange={(e) => setEditPrazoAprovacao(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <div className="flex items-center space-x-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400">Atalhos:</span>
                    {[15, 30].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + dias);
                          setEditPrazoAprovacao(d.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-100 hover:text-purple-800 text-[10px] font-bold text-slate-600 transition"
                      >
                        +{dias}d
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditPrazoAprovacao('')}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold text-slate-500 transition"
                    >
                      Limpar (em branco)
                    </button>
                  </div>
                </div>

                {/* 3. Confecção */}
                <div className={`p-3.5 rounded-2xl border transition ${editStatusProducao === 'EM_GRAFICA' ? 'border-purple-300 bg-purple-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center">
                      <span className="mr-1.5">🏭</span>
                      <span>3. Prazo de Confecção do Álbum (Gráfica)</span>
                      {editStatusProducao === 'EM_GRAFICA' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                          Etapa Ativa
                        </span>
                      )}
                    </label>
                    {!editPrazoConfeccao && (
                      <span className="text-[10px] text-slate-400 font-medium">Em branco</span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editPrazoConfeccao}
                    onChange={(e) => setEditPrazoConfeccao(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <div className="flex items-center space-x-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400">Atalhos:</span>
                    {[20, 30].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + dias);
                          setEditPrazoConfeccao(d.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-100 hover:text-purple-800 text-[10px] font-bold text-slate-600 transition"
                      >
                        +{dias}d
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditPrazoConfeccao('')}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold text-slate-500 transition"
                    >
                      Limpar (em branco)
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setVendaEditandoPrazo(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: CENTRAL DE HOMOLOGAÇÃO SICREDI (TROCA DE ARQUIVOS & BOLETO PDF)
          ========================================================================= */}
      {modalHomologacaoSicrediAberto && (() => {
        const anoHomolog = parseInt(String(new Date().getFullYear()).slice(-2), 10);
        const nossoNumHomolog = gerarNossoNumeroSicredi(
          SICREDI_CONFIG_OFICIAL,
          anoHomolog,
          BOLETO_HOMOLOGACAO_PADRAO.nossoNumeroSequencial
        );
        const barrasHomolog = gerarLinhaDigitavelECodigoBarrasSicredi(
          SICREDI_CONFIG_OFICIAL,
          nossoNumHomolog.nossoNumeroSemFormatacao.slice(0, 8),
          nossoNumHomolog.dv,
          BOLETO_HOMOLOGACAO_PADRAO.valor,
          BOLETO_HOMOLOGACAO_PADRAO.dataVencimento
        );
        const svgBarrasHomolog = gerarSvgCodigoBarrasI25(barrasHomolog.codigoBarras);
        const nomeArquivoRemessa = gerarNomeArquivoRemessaSicredi(SICREDI_CONFIG_OFICIAL.convenio, new Date(), 'REM');

        const textoRespostaEmail = `Olá Luiz Henrique,

Seguem em anexo os arquivos solicitados para validação dos parâmetros de cobrança da ON AGENCIA DE EVENTOS LTDA:

- 1 Boleto em PDF de Homologação (Nosso Número: ${nossoNumHomolog.nossoNumeroFormatado}, Valor: R$ ${BOLETO_HOMOLOGACAO_PADRAO.valor.toFixed(2)}, Vencimento: ${formatarDataBR(BOLETO_HOMOLOGACAO_PADRAO.dataVencimento)}).
- 1 Arquivo de Remessa CNAB 400 correspondente (${nomeArquivoRemessa}).

Parâmetros utilizados:
- Banco: 748 (Sicredi)
- Agência: 0726 | Posto: 86
- Convênio: 04220 | Conta: 26102-1
- CNPJ: 30.988.070/0001-60

Ficamos no aguardo da aprovação para liberação em produção.

Atenciosamente,
ON AGENCIA DE EVENTOS LTDA`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[94vh] overflow-y-auto p-5 md:p-8 shadow-2xl border border-emerald-200 animate-in zoom-in-95 duration-150">
              {/* Header da Homologação */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        Homologação de Cobrança Sicredi (Banco 748)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Padrão Oficial CNAB 400
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Arquivos prontos para validação e resposta ao analista <strong>Luiz Henrique</strong> (Sicredi Vale do Piquiri Abcd PR/SP).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalHomologacaoSicrediAberto(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card com os Dados Oficiais Confirmados */}
              <div className="my-4 p-4.5 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 rounded-2xl border border-emerald-200 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                  <span className="font-extrabold text-emerald-950 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Parâmetros Bancários Confirmados pelo Sicredi:
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    Beneficiário: ON AGENCIA DE EVENTOS LTDA
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Banco</span>
                    <strong className="text-slate-800">748 (Sicredi)</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Agência</span>
                    <strong className="text-slate-800 font-mono">0726</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Posto / UA</span>
                    <strong className="text-slate-800 font-mono">86</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Convênio</span>
                    <strong className="text-emerald-700 font-mono font-bold">04220</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Conta Corrente</span>
                    <strong className="text-slate-800 font-mono">26102-1</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">CNPJ</span>
                    <strong className="text-slate-800 font-mono text-[10px]">30.988.070/0001-60</strong>
                  </div>
                </div>
              </div>

              {/* Card de Conexão Oficial da API Sicredi */}
              <div className="my-4 p-4.5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 rounded-2xl border border-teal-200 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-black text-slate-900 text-sm flex items-center">
                      <Zap className="w-4 h-4 mr-1 text-emerald-600" />
                      API de Cobrança Online Sicredi: ATIVA & CONECTADA
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      OAuth2 Bearer OK
                    </span>
                  </div>
                  <button
                    onClick={handleTestarConexaoSicrediApi}
                    disabled={testandoConexaoApi}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${testandoConexaoApi ? 'animate-spin' : ''}`} />
                    <span>{testandoConexaoApi ? 'Testando Conexão...' : '⚡ Testar Token em Tempo Real'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Username</span>
                    <strong className="text-slate-800 font-mono">042200726</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">x-api-key</span>
                    <strong className="text-slate-800 font-mono text-[10px] truncate block" title="8112a356-4953-439f-9767-50660649706b">8112a356...9706b</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Código de Acesso</span>
                    <strong className="text-emerald-700 font-mono text-[10px] truncate block" title="9321D4CC1CA5BCE64E3DCBB74458C510DD11BA165F04D70C0B856A9267B907D1">9321D4CC...07D1</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Status da Emissão</span>
                    <strong className="text-emerald-700 font-bold flex items-center mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Instantâneo com Pix
                    </strong>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Direta para Homologação */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadRemessaSicredi}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition cursor-pointer hover:scale-102"
                  >
                    <Download className="w-4 h-4" />
                    <span>1. Baixar Remessa ({nomeArquivoRemessa})</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md transition cursor-pointer hover:scale-102"
                  >
                    <Printer className="w-4 h-4" />
                    <span>2. Imprimir / Salvar Boleto PDF</span>
                  </button>
                </div>

                <button
                  onClick={() => copiarTexto(textoRespostaEmail, 'email-sicredi')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-2xs transition cursor-pointer"
                >
                  {copiadoIdx === 'email-sicredi' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Copiar Mensagem do E-mail</span>
                </button>
              </div>

              {/* Visualizador do Boleto de Homologação (Padrão Oficial do Manual Sicredi) */}
              <div className="mt-5 border-2 border-slate-300 rounded-2xl p-4 md:p-6 bg-white shadow-inner font-sans text-slate-900 printable-boleto">
                {/* PARTE 1: RECIBO DO PAGADOR */}
                <div className="border border-slate-400 p-3 rounded-lg mb-4 text-[11px] leading-tight space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-400 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black tracking-tight text-emerald-800">Sicredi</span>
                      <span className="text-lg font-black font-mono border-l-2 border-r-2 border-slate-700 px-2">| 748-X |</span>
                    </div>
                    <span className="font-bold text-xs uppercase text-slate-600">Recibo do Pagador</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-b border-slate-300 pb-2">
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Local de Pagamento</span>
                      <strong className="text-[10px] block">PAGÁVEL PREFERENCIALMENTE NAS COOP. DE CRÉDITO DO SICREDI</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Vencimento</span>
                      <strong className="text-xs font-mono font-black">{formatarDataBR(BOLETO_HOMOLOGACAO_PADRAO.dataVencimento)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Agência / Código Beneficiário</span>
                      <strong className="text-xs font-mono font-bold">0726.86.04220</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Nosso Número</span>
                      <strong className="text-xs font-mono font-black text-purple-900">{nossoNumHomolog.nossoNumeroFormatado}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-b border-slate-300 pb-2">
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Beneficiário</span>
                      <strong className="text-[10px] block">ON AGENCIA DE EVENTOS LTDA</strong>
                      <span className="text-[9px] text-slate-600">CNPJ: 30.988.070/0001-60</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Nº Documento / Espécie</span>
                      <span className="font-mono text-[11px] font-bold">HOMOLOG01 / DMI</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Data Emissão / Processamento</span>
                      <span className="font-mono text-[11px]">{formatarDataBR(BOLETO_HOMOLOGACAO_PADRAO.dataEmissao)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block font-bold">Valor do Documento</span>
                      <strong className="text-sm font-mono font-black text-slate-900">R$ {BOLETO_HOMOLOGACAO_PADRAO.valor.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[9px] uppercase text-slate-500 block font-bold">Pagador</span>
                    <strong className="text-xs block">{BOLETO_HOMOLOGACAO_PADRAO.sacadoNome} - CPF: {BOLETO_HOMOLOGACAO_PADRAO.sacadoCpfCnpj}</strong>
                    <span className="text-[10px] text-slate-600 block">{BOLETO_HOMOLOGACAO_PADRAO.sacadoEndereco} &bull; CEP: {BOLETO_HOMOLOGACAO_PADRAO.sacadoCep} - {BOLETO_HOMOLOGACAO_PADRAO.sacadoCidade}/{BOLETO_HOMOLOGACAO_PADRAO.sacadoUf}</span>
                  </div>
                </div>

                {/* LINHA DE CORTE */}
                <div className="border-t-2 border-dashed border-slate-400 my-4 relative flex items-center justify-center">
                  <span className="bg-white px-3 text-[9px] text-slate-400 uppercase tracking-widest -mt-2">
                    Corte na linha abaixo para Ficha de Compensação
                  </span>
                </div>

                {/* PARTE 2: FICHA DE COMPENSAÇÃO OFICIAL */}
                <div className="border-2 border-slate-700 p-3 rounded-lg text-[11px] leading-tight space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-700 pb-2 gap-2">
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xl font-black tracking-tight text-emerald-800">Sicredi</span>
                      <span className="text-xl font-black font-mono border-l-2 border-r-2 border-slate-900 px-2.5">748-X</span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="font-mono font-black text-xs md:text-sm tracking-wider text-slate-950 block select-all">
                        {barrasHomolog.linhaDigitavel}
                      </span>
                    </div>
                  </div>

                  {/* Tabela de Campos da Ficha de Compensação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-400">
                    {/* Coluna 1 & 2: Dados do Título */}
                    <div className="md:col-span-2 divide-y divide-slate-300 border-r border-slate-400">
                      <div className="p-2">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Local de Pagamento</span>
                        <strong className="text-[10px]">PAGÁVEL PREFERENCIALMENTE NAS COOP. DE CRÉDITO DO SICREDI</strong>
                      </div>
                      <div className="p-2">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Beneficiário</span>
                        <strong className="text-[10px] block">ON AGENCIA DE EVENTOS LTDA - CNPJ: 30.988.070/0001-60</strong>
                        <span className="text-[9px] text-slate-500">Cooperativa Sicredi Vale do Piquiri Abcd PR/SP - Palotina PR</span>
                      </div>
                      <div className="grid grid-cols-4 divide-x divide-slate-300 p-2 text-[10px]">
                        <div>
                          <span className="text-[8px] uppercase text-slate-500 block font-bold">Data Documento</span>
                          <span className="font-mono">{formatarDataBR(BOLETO_HOMOLOGACAO_PADRAO.dataEmissao)}</span>
                        </div>
                        <div className="pl-2">
                          <span className="text-[8px] uppercase text-slate-500 block font-bold">Nº Documento</span>
                          <span className="font-mono font-bold">HOMOLOG01</span>
                        </div>
                        <div className="pl-2">
                          <span className="text-[8px] uppercase text-slate-500 block font-bold">Espécie Doc</span>
                          <span className="font-mono">DMI</span>
                        </div>
                        <div className="pl-2">
                          <span className="text-[8px] uppercase text-slate-500 block font-bold">Aceite</span>
                          <span className="font-mono">N</span>
                        </div>
                      </div>
                      <div className="p-2 min-h-[90px] bg-slate-50/50">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold mb-1">Instruções de Responsabilidade do Beneficiário</span>
                        <div className="space-y-0.5 text-[10px] text-slate-800 font-mono">
                          {BOLETO_HOMOLOGACAO_PADRAO.instrucoes?.map((ins, i) => (
                            <p key={i}>&bull; {ins}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Coluna 3: Valores e Prazos */}
                    <div className="divide-y divide-slate-300 text-[10px]">
                      <div className="p-2 bg-slate-50">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Vencimento</span>
                        <strong className="text-sm font-mono font-black text-slate-900 block">{formatarDataBR(BOLETO_HOMOLOGACAO_PADRAO.dataVencimento)}</strong>
                      </div>
                      <div className="p-2">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Agência / Código Beneficiário</span>
                        <strong className="font-mono text-xs block">0726.86.04220</strong>
                      </div>
                      <div className="p-2">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">Nosso Número</span>
                        <strong className="font-mono text-xs text-purple-900 block">{nossoNumHomolog.nossoNumeroFormatado}</strong>
                      </div>
                      <div className="p-2 bg-slate-50">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">(=) Valor do Documento</span>
                        <strong className="text-base font-mono font-black text-slate-950 block">R$ {BOLETO_HOMOLOGACAO_PADRAO.valor.toFixed(2)}</strong>
                      </div>
                      <div className="p-2">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">(-) Descontos / Abatimento</span>
                        <span className="font-mono text-slate-400">R$ 0,00</span>
                      </div>
                      <div className="p-2">
                        <span className="text-[9px] uppercase text-slate-500 block font-bold">(+) Mora / Multa</span>
                        <span className="font-mono text-slate-400">R$ 0,00</span>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Pagador */}
                  <div className="p-2 border border-slate-400 rounded-sm text-[10px] bg-white">
                    <span className="text-[9px] uppercase text-slate-500 block font-bold">Pagador</span>
                    <strong className="text-[11px] block text-slate-950">{BOLETO_HOMOLOGACAO_PADRAO.sacadoNome} &bull; CPF: {BOLETO_HOMOLOGACAO_PADRAO.sacadoCpfCnpj}</strong>
                    <span className="text-slate-700 block">{BOLETO_HOMOLOGACAO_PADRAO.sacadoEndereco} - {BOLETO_HOMOLOGACAO_PADRAO.sacadoCidade}/{BOLETO_HOMOLOGACAO_PADRAO.sacadoUf} - CEP: {BOLETO_HOMOLOGACAO_PADRAO.sacadoCep}</span>
                  </div>

                  {/* Código de Barras I25 Vetorial */}
                  <div className="pt-3 pb-1">
                    <div
                      className="w-full max-w-xl mx-auto overflow-hidden bg-white py-1"
                      dangerouslySetInnerHTML={{ __html: svgBarrasHomolog }}
                    />
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-1">
                      <span>Código de Barras FEBRABAN I25: {barrasHomolog.codigoBarras}</span>
                      <span className="font-bold uppercase text-slate-600">Ficha de Compensação</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 mt-5">
                <span className="text-emerald-800 font-semibold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Os arquivos gerados estão 100% alinhados com o Manual CNAB 400 Versão 2.00 do Sicredi.
                </span>
                <button
                  onClick={() => setModalHomologacaoSicrediAberto(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO SEGURA COM AUDITORIA */}
      {modalExclusaoSeguraAberto && vendaParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 my-8">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Exclusão com Registro de Segurança
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold flex items-center mt-0.5">
                    <span>Operação monitorada e registrada para conformidade</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModalExclusaoSeguraAberto(false);
                  setVendaParaExcluir(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso */}
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-bold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600 shrink-0" />
                Atenção: Esta ação removerá o álbum da listagem ativa.
              </p>
              <p className="text-rose-800 leading-relaxed">
                Para manter o registro por segurança, todos os dados da venda, parcelas e histórico serão arquivados no <strong>Histórico de Auditoria</strong> com data, hora e assinatura do seu usuário. Você poderá restaurá-lo a qualquer momento.
              </p>
            </div>

            {/* Dados do Álbum a Excluir */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Formando:</span>
                <span className="text-slate-900 font-bold text-sm">{vendaParaExcluir.alunoNome}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">CPF:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">{vendaParaExcluir.alunoCpf || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Pedido:</span>{' '}
                  <span className="font-mono font-bold text-purple-700">{vendaParaExcluir.codigoPedido}</span>
                </div>
                <div>
                  <span className="text-slate-400">Turma:</span>{' '}
                  <span className="font-medium text-slate-800">{vendaParaExcluir.turmaNome}</span>
                </div>
                <div>
                  <span className="text-slate-400">Valor Total:</span>{' '}
                  <span className="font-bold text-emerald-700">
                    R$ {vendaParaExcluir.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Pagamento:</span>{' '}
                  <span className="font-bold text-slate-800">{vendaParaExcluir.formaPagamento}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status atual:</span>{' '}
                  <span className="font-bold text-slate-800">{vendaParaExcluir.statusProducao}</span>
                </div>
              </div>
            </div>

            {/* Seleção do Motivo */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Motivo da Exclusão <span className="text-rose-500">*</span>
                </label>
                <select
                  value={motivoExclusaoTipo}
                  onChange={(e) => setMotivoExclusaoTipo(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                >
                  <option value="Desistência formal do formando">Desistência formal do formando</option>
                  <option value="Cancelamento de contrato / rescisão">Cancelamento de contrato / rescisão</option>
                  <option value="Duplicidade ou erro de digitação no cadastro">Duplicidade ou erro de digitação no cadastro</option>
                  <option value="Inadimplência definitiva sem entrega">Inadimplência definitiva sem entrega</option>
                  <option value="Substituição por outro pacote / upgrade">Substituição por outro pacote / upgrade</option>
                  <option value="Outro motivo (especificar abaixo)">Outro motivo (especificar abaixo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observações / Detalhamento do Motivo
                </label>
                <textarea
                  value={motivoExclusaoDetalhe}
                  onChange={(e) => setMotivoExclusaoDetalhe(e.target.value)}
                  placeholder="Ex: Formando solicitou cancelamento via protocolo WhatsApp #1042..."
                  rows={2}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                Registrado por: <strong>{usuarioLogado?.nome || 'Administrador'}</strong> ({usuarioLogado?.email || 'admin@sistema'})
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setModalExclusaoSeguraAberto(false);
                  setVendaParaExcluir(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusaoSegura}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition inline-flex items-center space-x-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Confirmar Exclusão com Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE AUDITORIA E RESTAURAÇÃO DE ÁLBUNS EXCLUÍDOS */}
      {modalAuditoriaAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Histórico de Segurança & Auditoria de Exclusões
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                      {registrosExclusoes.length} registros
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registro permanente e auditado de álbuns excluídos. Cada registro preserva a assinatura do gestor e pode ser restaurado.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAuditoriaAberto(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo da Tabela / Lista */}
            <div className="flex-1 overflow-y-auto pr-1">
              {registrosExclusoes.length === 0 ? (
                <div className="py-14 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Nenhum álbum foi excluído</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Todas as vendas e pedidos cadastrados estão íntegros e na listagem ativa do sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrosExclusoes.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-4 border border-slate-200 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-mono font-bold text-xs">
                            {log.codigoPedido}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{log.alunoNome}</span>
                          <span className="text-xs text-slate-400">({log.turmaNome})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-1 rounded-lg border border-slate-200">
                            🕒 Excluído em: {log.dataHoraExclusao}
                          </span>
                          <button
                            onClick={() => handleRestaurarVenda(log.id)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs hover:shadow transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Restaurar este álbum de volta à lista ativa"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar Álbum</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Valor / Pagamento:</span>{' '}
                          <span className="font-bold text-slate-800">
                            R$ {log.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">({log.formaPagamento})</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Excluído por:</span>{' '}
                          <span className="font-semibold text-slate-800">{log.excluidoPorNome}</span>
                          {log.excluidoPorEmail && (
                            <span className="text-[10px] text-slate-400 block truncate">{log.excluidoPorEmail}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400">Motivo registrado:</span>{' '}
                          <span className="font-semibold text-rose-700 block truncate" title={log.motivo}>
                            {log.motivo}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Auditoria vinculada ao sistema ON Eventos</span>
              <button
                onClick={() => setModalAuditoriaAberto(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CORRIGIR FORMA OU QUANTIDADE DE PAGAMENTO
          ========================================================================= */}
      {modalEditarPagamentoAberto && vendaParaEditarPagamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-6 lg:p-7 shadow-2xl border border-slate-100 animate-in fade-in duration-150 my-6">
            {/* Topo */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md font-black">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Corrigir Pagamento</h3>
                  <p className="text-xs text-slate-500">
                    Pedido: <strong>{vendaParaEditarPagamento.codigoPedido}</strong> • {vendaParaEditarPagamento.alunoNome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEditarPagamentoAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Atuais */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Kit Contratado:</span>
                <strong className="text-slate-900">{vendaParaEditarPagamento.modeloAlbum}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total do Kit:</span>
                <span className="text-sm font-black font-mono text-purple-700">
                  R$ {vendaParaEditarPagamento.valorTotalKit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulário de Correção */}
            <div className="space-y-4">
              {/* Seleção da Forma de Pagamento */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Escolha a Nova Forma de Pagamento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'BOLETO', label: 'Boleto', sub: 'Sicredi', icone: Barcode, cor: 'border-amber-300 bg-amber-50 text-amber-900' },
                    { id: 'CARTAO', label: 'Cartão', sub: 'Crédito', icone: CreditCard, cor: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                    { id: 'PIX', label: 'PIX', sub: 'À Vista', icone: Sparkles, cor: 'border-purple-300 bg-purple-50 text-purple-900' },
                    { id: 'DINHEIRO', label: 'Dinheiro', sub: 'À Vista', icone: Wallet, cor: 'border-teal-300 bg-teal-50 text-teal-900' },
                  ].map((item) => {
                    const Icone = item.icone;
                    const ativo = editFormaPagamento === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditFormaPagamento(item.id as any)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          ativo
                            ? 'ring-2 ring-purple-600 font-black shadow-sm ' + item.cor
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        <Icone className="w-5 h-5 mb-1" />
                        <span className="text-xs block font-bold leading-tight">{item.label}</span>
                        <span className="text-[10px] opacity-75">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OPÇÕES QUANDO BOLETO */}
              {editFormaPagamento === 'BOLETO' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Configuração das Parcelas de Boleto:
                    </span>
                    <span className="text-[11px] font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg">
                      {editBoletoParcelas}x de R${' '}
                      {(
                        (parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit) /
                        editBoletoParcelas
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Quantidade de Parcelas:
                      </label>
                      <select
                        value={editBoletoParcelas}
                        onChange={(e) => setEditBoletoParcelas(parseInt(e.target.value) || 1)}
                        className="w-full bg-white text-slate-900 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map((n) => {
                          const valParcela = (
                            (parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit) /
                            n
                          ).toFixed(2);
                          return (
                            <option key={n} value={n}>
                              {n}x de R$ {valParcela}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        1º Vencimento:
                      </label>
                      <input
                        type="date"
                        value={editPrimeiroVencimento}
                        onChange={(e) => setEditPrimeiroVencimento(e.target.value)}
                        className="w-full bg-white text-slate-900 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    ⚡ Ao confirmar, o sistema recalcula o carnê inteiro com os novos valores e registra as parcelas na API do Sicredi.
                  </p>
                </div>
              )}

              {/* OPÇÕES QUANDO CARTÃO */}
              {editFormaPagamento === 'CARTAO' && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      Parcelamento no Cartão de Crédito:
                    </span>
                    <span className="text-[11px] font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      {editCartaoParcelas}x de R${' '}
                      {(
                        (parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit) /
                        editCartaoParcelas
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Parcelas do Cartão:
                      </label>
                      <select
                        value={editCartaoParcelas}
                        onChange={(e) => setEditCartaoParcelas(parseInt(e.target.value) || 1)}
                        className="w-full bg-white text-slate-900 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <option key={n} value={n}>
                            {n === 1 ? '1x À vista' : `${n}x no Cartão`} (R${' '}
                            {(
                              (parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit) /
                              n
                            ).toFixed(2)}
                            )
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Bandeira:
                      </label>
                      <select
                        value={editCartaoBandeira}
                        onChange={(e) => setEditCartaoBandeira(e.target.value)}
                        className="w-full bg-white text-slate-900 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Mastercard">Mastercard</option>
                        <option value="Visa">Visa</option>
                        <option value="Elo">Elo</option>
                        <option value="Hipercard">Hipercard</option>
                        <option value="American Express">American Express</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Código NSU / Autorização Maquininha:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NSU-481920"
                      value={editCartaoNsu}
                      onChange={(e) => setEditCartaoNsu(e.target.value)}
                      className="w-full bg-white text-slate-900 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* OPÇÕES QUANDO PIX OU DINHEIRO */}
              {editFormaPagamento === 'PIX' && (
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-xs text-purple-900">
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Pagamento À Vista no PIX</span>
                  </div>
                  <p className="text-[11px] text-purple-800">
                    Ao salvar, o pedido será marcado como liquidado à vista via chave PIX no valor de{' '}
                    <strong>
                      R$ {(parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit).toFixed(2)}
                    </strong>
                    .
                  </p>
                </div>
              )}

              {editFormaPagamento === 'DINHEIRO' && (
                <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 text-xs text-teal-900">
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <Wallet className="w-4 h-4 text-teal-600" />
                    <span>Pagamento À Vista em Dinheiro</span>
                  </div>
                  <p className="text-[11px] text-teal-800">
                    O valor de{' '}
                    <strong>
                      R$ {(parseFloat(editValorTotalKit) || vendaParaEditarPagamento.valorTotalKit).toFixed(2)}
                    </strong>{' '}
                    será registrado como quitado diretamente no caixa da agência.
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé com botões de ação */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setModalEditarPagamentoAberto(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarEdicaoPagamento}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer hover:scale-102"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações do Pagamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: QUITAÇÃO MANUAL DE PARCELAS - CONFIRME OS DADOS (IMAGE 4)
          ========================================================================= */}
      {modalQuitarParcelaAberto && quitacaoVenda && quitacaoParcela && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-3xl p-6 lg:p-7 shadow-2xl border border-slate-200 animate-in fade-in duration-150 my-6">
            {/* Topo / Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Quitação manual de parcelas - confirme os dados - {quitacaoParcela.numero} de{' '}
                  {quitacaoVenda.parcelasBoletos?.length || quitacaoVenda.boletoQtdParcelas || 1}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formando: <strong>{quitacaoVenda.alunoNome}</strong> • Pedido {quitacaoVenda.codigoPedido}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalQuitarParcelaAberto(false)}
                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo em 2 colunas com divisor vertical */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100">
              {/* Coluna Esquerda: Dados da parcela e dropdowns de pagamento */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-700 font-bold block text-xs">Nº da Parcela:</span>
                    <span className="text-slate-800 font-medium text-sm mt-0.5 block">
                      {quitacaoParcela.numero}/
                      {quitacaoVenda.parcelasBoletos?.length || quitacaoVenda.boletoQtdParcelas || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block text-xs">Data Venc.:</span>
                    <span className="text-slate-800 font-medium text-sm mt-0.5 block">
                      {quitacaoParcela.vencimento}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-700 font-bold block text-xs">Valor Original:</span>
                    <span className="text-slate-800 font-medium text-sm mt-0.5 block">
                      R$ {quitacaoParcela.valor.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-bold block text-xs">Valor Atualizado:</span>
                    <span className="text-slate-800 font-medium text-sm mt-0.5 block border-b border-dotted border-slate-400 pb-0.5 inline-block">
                      R$ {quitacaoParcela.valor.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Local Pag. */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Local Pag.</label>
                  <select
                    value={quitacaoLocalPag}
                    onChange={(e) => setQuitacaoLocalPag(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Balcão / Caixa Físico">Balcão / Caixa Físico</option>
                    <option value="PIX Direto">PIX Direto (Conta Empresa)</option>
                    <option value="Escritório">Escritório Central</option>
                    <option value="Cobrança Bancária">Cobrança Bancária</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Forma Pag. */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Forma Pag.</label>
                  <select
                    value={quitacaoFormaPag}
                    onChange={(e) => setQuitacaoFormaPag(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="PIX Direto">PIX Direto</option>
                    <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Transferência / TED">Transferência / TED</option>
                    <option value="Depósito Bancário">Depósito Bancário</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Conta */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Conta</label>
                  <select
                    value={quitacaoConta}
                    onChange={(e) => setQuitacaoConta(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Sicredi C/C">Sicredi C/C (Conta Principal)</option>
                    <option value="Caixa Interno">Caixa Interno (Balcão)</option>
                    <option value="Banco Inter">Banco Inter (Secundário)</option>
                  </select>
                </div>

                {/* Notas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Notas</label>
                  <input
                    type="text"
                    value={quitacaoNotas}
                    onChange={(e) => setQuitacaoNotas(e.target.value)}
                    placeholder="Ex: Comprovante de PIX enviado no WhatsApp..."
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coluna Direita: Datas, Desconto e Valor Pago */}
              <div className="space-y-4 md:border-l md:border-slate-200 md:pl-8">
                {/* Data Pag. */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Data Pag.</label>
                    <button
                      type="button"
                      onClick={usarDataVencimento}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer underline"
                    >
                      usar a data do vencimento
                    </button>
                  </div>
                  <input
                    type="date"
                    value={quitacaoDataPag}
                    onChange={(e) => {
                      setQuitacaoDataPag(e.target.value);
                      setQuitacaoDataCredito(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Data de Crédito */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Data de Crédito</label>
                  <input
                    type="date"
                    value={quitacaoDataCredito}
                    onChange={(e) => setQuitacaoDataCredito(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Desconto */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Desconto (R$)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('input-desconto-quitacao');
                        input?.focus();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer underline"
                    >
                      conceder desconto
                    </button>
                  </div>
                  <input
                    id="input-desconto-quitacao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={quitacaoDesconto || ''}
                    onChange={(e) => handleDescontoChange(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-sm font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>

                {/* Valor Pago */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Valor Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quitacaoValorPago || ''}
                    onChange={(e) => setQuitacaoValorPago(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-lg bg-amber-50/60 border-l-4 border-l-amber-500 border-amber-200 text-slate-900 text-base font-black focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Resumo do Pagamento */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Valor Final Quitado:</span>
                    <span>R$ {quitacaoValorPago.toFixed(2)}</span>
                  </div>
                  {quitacaoDesconto > 0 && (
                    <div className="flex justify-between text-emerald-700 text-[11px]">
                      <span>Desconto concedido:</span>
                      <span>- R$ {quitacaoDesconto.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé com Botão Registrar Pagamento (Image 4) */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalQuitarParcelaAberto(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarQuitacaoManual}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md transition flex items-center space-x-2 cursor-pointer hover:scale-102"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Pagamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AJUSTE DE PARCELAS EM LOTE / RENEGOCIAÇÃO (IMAGE 3)
          ========================================================================= */}
      {modalRenegociarParcelasAberto && renegociarVenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[24px] w-full max-w-xl p-6 lg:p-7 shadow-2xl border border-slate-200 animate-in fade-in duration-150 my-6">
            {/* Topo / Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Ajuste de parcelas em lote
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formando: <strong>{renegociarVenda.alunoNome}</strong> • Pedido {renegociarVenda.codigoPedido}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalRenegociarParcelasAberto(false)}
                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Caixa de Atenção / Warning (Idêntica ao Print Image 3) */}
            <div className="my-4 p-4 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-900 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-red-800 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Atenção!</span>
              </div>
              <p className="text-red-800/90 leading-relaxed text-[11px]">
                Só serão ajustadas as parcelas <strong>ATIVAS ainda NÃO PAGAS</strong> e, as do tipo &quot;cota única&quot; não serão alteradas.
                Caso o cliente já tenha o boleto impresso em mãos, poderão ocorrer divergências nos valores.
                Todas as chaves PIX geradas serão canceladas para as parcelas alteradas.
              </p>
            </div>

            <div className="space-y-4 my-5 text-sm">
              {/* Opção 1: Ajuste de Valores */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renegociarCheckValores}
                    onChange={(e) => setRenegociarCheckValores(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Ajuste de Valores</span>
                </label>

                {renegociarCheckValores && (
                  <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <select
                      value={renegociarTipoAjuste}
                      onChange={(e: any) => setRenegociarTipoAjuste(e.target.value)}
                      className="px-3.5 py-2 rounded-lg bg-blue-50/70 border border-blue-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      <option value="SELECIONE">(Selecione)</option>
                      <option value="ACRESCIMO_PORC">Acréscimo (%)</option>
                      <option value="ACRESCIMO_VAL">Acréscimo (R$)</option>
                      <option value="DECRESCIMO_PORC">Decréscimo (%)</option>
                      <option value="DECRESCIMO_VAL">Decréscimo (R$)</option>
                      <option value="NOVO_VALOR">Novo Valor (R$)</option>
                      <option value="REDIVIDIR_SALDO">Rateio entre Parcelas Restantes</option>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={renegociarValorAjuste || ''}
                      onChange={(e) => setRenegociarValorAjuste(parseFloat(e.target.value) || 0)}
                      className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Opção 2: Ajuste de Datas (Prorrogação de Vencimento por Atraso) */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renegociarCheckDatas}
                    onChange={(e) => setRenegociarCheckDatas(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Ajuste de Datas (Prorrogação de Vencimento)</span>
                </label>

                {renegociarCheckDatas && (
                  <div className="ml-6 space-y-1 pt-1">
                    <span className="text-[11px] text-slate-600 block">
                      Novo vencimento da 1ª parcela não paga:
                    </span>
                    <input
                      type="date"
                      value={renegociarNovaDataPrimeira}
                      onChange={(e) => setRenegociarNovaDataPrimeira(e.target.value)}
                      className="w-full sm:w-64 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      As parcelas restantes seguirão mensalmente a partir desta data.
                    </span>
                  </div>
                )}
              </div>

              {/* Opção 3: Troca de Parcelamento caso o cliente atrase (Redividir saldo restante) */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={renegociarCheckQtdParcelas}
                    onChange={(e) => setRenegociarCheckQtdParcelas(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Troca de Parcelamento / Redividir Saldo por Atraso</span>
                </label>

                {renegociarCheckQtdParcelas && (
                  <div className="ml-6 space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-600 block">
                      Nova quantidade de parcelas para o saldo não pago:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={renegociarNovaQtdParcelas}
                      onChange={(e) => setRenegociarNovaQtdParcelas(parseInt(e.target.value) || 1)}
                      className="w-32 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Ex: Se o cliente atrasou e quer estender o saldo restante em mais meses.
                    </span>
                  </div>
                )}
              </div>

              {/* Resumo da Simulação da Renegociação */}
              {(() => {
                const parcelasPagas = renegociarVenda.parcelasBoletos?.filter((p) => p.status === 'PAGO') || [];
                const parcelasNaoPagas = renegociarVenda.parcelasBoletos?.filter((p) => p.status !== 'PAGO') || [];
                const saldoRestante = parcelasNaoPagas.reduce((acc, p) => acc + p.valor, 0);

                let saldoAjustado = saldoRestante;
                if (renegociarCheckValores) {
                  if (renegociarTipoAjuste === 'ACRESCIMO_PORC') saldoAjustado *= 1 + renegociarValorAjuste / 100;
                  else if (renegociarTipoAjuste === 'ACRESCIMO_VAL')
                    saldoAjustado += renegociarValorAjuste * parcelasNaoPagas.length;
                  else if (renegociarTipoAjuste === 'DECRESCIMO_PORC')
                    saldoAjustado = Math.max(1, saldoAjustado * (1 - renegociarValorAjuste / 100));
                  else if (renegociarTipoAjuste === 'DECRESCIMO_VAL')
                    saldoAjustado = Math.max(1, saldoAjustado - renegociarValorAjuste * parcelasNaoPagas.length);
                  else if (renegociarTipoAjuste === 'NOVO_VALOR')
                    saldoAjustado =
                      renegociarValorAjuste *
                      (renegociarCheckQtdParcelas ? renegociarNovaQtdParcelas : parcelasNaoPagas.length);
                }

                const qtdFinal =
                  renegociarCheckQtdParcelas && renegociarNovaQtdParcelas > 0
                    ? renegociarNovaQtdParcelas
                    : parcelasNaoPagas.length;
                const valorAprox = qtdFinal > 0 ? saldoAjustado / qtdFinal : 0;

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Parcelas já quitadas:</span>
                      <strong className="text-emerald-700">
                        {parcelasPagas.length} pagas (permanecem intactas)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Parcelas ativas não pagas:</span>
                      <strong>{parcelasNaoPagas.length} parcelas</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo original não pago:</span>
                      <strong>R$ {saldoRestante.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-xs">
                      <span>Simulação do novo parcelamento:</span>
                      <span className="text-blue-700 font-black">
                        {qtdFinal}x de R$ {valorAprox.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rodapé com Botões Cancelar e Ajustar Parcelas (Idêntico ao Print Image 3) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setModalRenegociarParcelasAberto(false)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRenegociacao}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer hover:scale-102"
              >
                Ajustar Parcelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: WHATSAPP DA AGÊNCIA & LEMBRETES AUTOMÁTICOS DE VENCIMENTO
          ========================================================================= */}
      {modalWhatsAppAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[28px] w-full max-w-2xl p-6 lg:p-7 shadow-2xl border border-slate-200 animate-in fade-in duration-150 my-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900">
                      WhatsApp da Agência & Lembretes
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>Conectado</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Disparo direto de boletos e lembretes automáticos de vencimento (1 dia antes)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalWhatsAppAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="space-y-5 my-5 text-xs text-slate-700">
              {/* Card 1: Automação do Lembrete de 1 Dia */}
              <div className="p-4.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 font-black text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Lembrete de Vencimento de 1 Dia Antes</span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-blue-950">
                    <input
                      type="checkbox"
                      checked={whatsAppLembreteAtivo}
                      onChange={(e) => setWhatsAppLembreteAtivo(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-blue-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Ativo</span>
                  </label>
                </div>

                <p className="text-blue-900/90 text-xs leading-relaxed">
                  Quando faltar <strong>exatamente 1 dia para vencer a parcela</strong>, o sistema dispara uma mensagem amigável no WhatsApp do formando contendo a linha digitável e o código PIX Copia e Cola.
                </p>

                <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-[11px] text-slate-600 font-mono space-y-1">
                  <strong className="text-blue-900 block font-sans text-xs">Exemplo da mensagem enviada:</strong>
                  <p>Olá, Formando! Passando para lembrar que a Parcela 3/12 da sua Formatura vence amanhã (22/10/2026) no valor de R$ 124,50.</p>
                  <p>📄 Linha Digitável: 74891.12003 ...</p>
                  <p>💠 PIX Copia e Cola: 00020126 ...</p>
                  <p className="italic text-slate-500">{whatsAppRodape}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-blue-200/80">
                  <div className="text-[11px] text-blue-800">
                    {ultimoScanLembretes ? (
                      <span>Último scan executado: <strong>{ultimoScanLembretes}</strong></span>
                    ) : (
                      <span>Scan diário automático ativo às <strong>08:00</strong></span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleExecutarLembretesAmanha}
                    disabled={executandoLembretesZap}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer hover:scale-102 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{executandoLembretesZap ? 'Verificando e Enviando...' : 'Disparar Lembretes de Amanhã Agora'}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Regra de Somente Envio (Sem Respostas / Sem Agente) */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Canal Exclusivo para Notificações e Cobrança</strong>
                  <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                    Este número de WhatsApp é configurado apenas para envio de avisos e boletos. Não possui chatbot ou agentes de resposta automática. As mensagens incluem o rodapé informativo alertando os alunos.
                  </span>
                </div>
              </div>

              {/* Card Conectar via QR Code da Evolution API */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">📲</span>
                    <strong className="text-slate-900 font-black text-sm">
                      Conexão do WhatsApp da Agência (Instância: <code className="text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded text-xs">{whatsAppInstancia}</code>)
                    </strong>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      whatsAppConectado
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    }`}
                  >
                    {whatsAppConectado ? '🟢 Conectado' : '🟡 Aguardando QR Code'}
                  </span>
                </div>

                {!whatsAppConectado ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
                    <div className="w-44 h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-1 relative shrink-0">
                      <img
                        src={qrCodeBase64 ? (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`) : '/whatsapp_qrcode.png'}
                        alt="QR Code WhatsApp"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 flex-1">
                      <p className="font-bold text-slate-800">
                        1. Abra o WhatsApp no celular oficial da agência.
                      </p>
                      <p>
                        2. Vá em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar um aparelho</strong>.
                      </p>
                      <p>
                        3. Aponte a câmera para o QR Code ao lado.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleCarregarQrCode}
                          disabled={carregandoQrCode}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${carregandoQrCode ? 'animate-spin' : ''}`} />
                          <span>{carregandoQrCode ? 'Atualizando...' : 'Atualizar QR Code'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleVerificarConexaoWhatsApp}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs cursor-pointer flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Já Escaneei / Verificar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp conectado e pronto para enviar mensagens pelo número da agência!</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerificarConexaoWhatsApp}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition cursor-pointer"
                    >
                      Checar Status
                    </button>
                  </div>
                )}

                {/* Teste de Disparo Real */}
                <div className="pt-3 border-t border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      🧪 Testar Disparo Real no Celular:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={telefoneTesteZap}
                        onChange={(e) => setTelefoneTesteZap(e.target.value)}
                        placeholder="Ex: 11999998888"
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full max-w-[200px]"
                      />
                      <button
                        type="button"
                        onClick={handleDispararTesteZap}
                        disabled={testandoZap}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-black text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {testandoZap ? 'Disparando...' : 'Enviar Teste'}
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 italic max-w-[220px]">
                    Receba uma mensagem de teste para confirmar que o canal está entregando.
                  </span>
                </div>
              </div>

              {/* Card 3: Configurações Técnicas de Conexão */}
              <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                    Configuração da Conexão da Agência
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    🟢 Ativo para Disparos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Número do WhatsApp Conectado:
                    </label>
                    <input
                      type="text"
                      value={whatsAppNumero}
                      onChange={(e) => setWhatsAppNumero(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Provedor / Tipo de Integração:
                    </label>
                    <select
                      value={whatsAppProvedor}
                      onChange={(e) => setWhatsAppProvedor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="evolution">Evolution API (Node / VPS / Hostinger)</option>
                      <option value="zapi">Z-API WhatsApp</option>
                      <option value="meta">Meta WhatsApp Cloud API (Oficial)</option>
                      <option value="custom">Gateway Direto ON Eventos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      URL da API / Endpoint:
                    </label>
                    <input
                      type="text"
                      value={whatsAppApiUrl}
                      onChange={(e) => setWhatsAppApiUrl(e.target.value)}
                      placeholder="https://api.oneventos.com.br"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nome da Instância:
                    </label>
                    <input
                      type="text"
                      value={whatsAppInstancia}
                      onChange={(e) => setWhatsAppInstancia(e.target.value)}
                      placeholder="on-eventos-oficial"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Rodapé Informativo das Mensagens:
                  </label>
                  <input
                    type="text"
                    value={whatsAppRodape}
                    onChange={(e) => setWhatsAppRodape(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Configuração do PIX Copia e Cola Oficial (BACEN / EMV BR Code) */}
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                      💠 PIX Copia e Cola Oficial (Padrão Banco Central / CRC16-CCITT)
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      BACEN Ativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Chave PIX da Agência:
                      </label>
                      <input
                        type="text"
                        value={whatsAppChavePix}
                        onChange={(e) => setWhatsAppChavePix(e.target.value)}
                        placeholder="30.988.070/0001-60"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Nome Beneficiário (Até 25 car.):
                      </label>
                      <input
                        type="text"
                        value={whatsAppNomeBeneficiarioPix}
                        onChange={(e) => setWhatsAppNomeBeneficiarioPix(e.target.value)}
                        placeholder="ON EVENTOS LTDA"
                        maxLength={25}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Cidade Beneficiário:
                      </label>
                      <input
                        type="text"
                        value={whatsAppCidadePix}
                        onChange={(e) => setWhatsAppCidadePix(e.target.value)}
                        placeholder="SAO PAULO"
                        maxLength={15}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Códigos Pix gerados com cálculo matemático oficial CRC16-CCITT (0x1021). Funciona instantaneamente em qualquer app bancário (Nubank, Itaú, Bradesco, Sicredi, etc.).
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Disparos em segundo plano sem abrir o app local do usuário.
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setModalWhatsAppAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarConfigWhatsApp}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer hover:scale-102 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CORRIGIR VALOR TOTAL DO KIT (LÁPIS DO VALOR)
          ========================================================================= */}
      {modalEditarValorTotalAberto && vendaEditandoValorTotal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[28px] w-full max-w-lg p-6 lg:p-7 shadow-2xl border border-slate-200 animate-in fade-in duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Corrigir Valor Total do Kit
                  </h3>
                  <p className="text-xs text-slate-500">
                    {vendaEditandoValorTotal.codigoPedido} &bull; {vendaEditandoValorTotal.alunoNome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarValorTotalAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarValorTotal} className="mt-5 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Valor Atual do Kit:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    R$ {vendaEditandoValorTotal.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Forma de Pagamento:</span>
                  <span className="font-bold text-slate-800">
                    {vendaEditandoValorTotal.formaPagamento === 'BOLETO'
                      ? `Boleto Sicredi (${vendaEditandoValorTotal.parcelasBoletos?.length || vendaEditandoValorTotal.boletoQtdParcelas || 1}x)`
                      : vendaEditandoValorTotal.formaPagamento}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Novo Valor Total do Kit (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={novoValorTotalInput}
                    onChange={(e) => setNovoValorTotalInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {vendaEditandoValorTotal.formaPagamento === 'BOLETO' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recalcularParcelasBoleto}
                      onChange={(e) => setRecalcularParcelasBoleto(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-amber-600 border-amber-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <strong className="text-amber-950 block font-bold">
                        Recalcular parcelas pendentes automaticamente
                      </strong>
                      <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                        Mantém as parcelas já pagas intactas e distribui o novo saldo restante igualmente entre as parcelas pendentes, atualizando os códigos de barras e PIX.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalEditarValorTotalAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition cursor-pointer hover:scale-102 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Novo Valor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CORRIGIR MODELO DO ÁLBUM & BRINDES DO KIT (LÁPIS DOS BRINDES)
          ========================================================================= */}
      {modalEditarBrindesAberto && vendaEditandoBrindes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[28px] w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 lg:p-7 shadow-2xl border border-slate-200 animate-in fade-in duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Corrigir Modelo do Álbum & Brindes
                  </h3>
                  <p className="text-xs text-slate-500">
                    {vendaEditandoBrindes.codigoPedido} &bull; {vendaEditandoBrindes.alunoNome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarBrindesAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarBrindes} className="mt-5 space-y-5">
              {/* Modelo do Álbum */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1">
                  <Package className="w-3.5 h-3.5 text-purple-600" />
                  <span>Modelo Principal do Álbum:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Album premium', 'Album Preto', 'Album Slim', 'Album Colégio'] as ModeloAlbumTipo[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditModeloAlbum(m)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                        editModeloAlbum === m
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brindes do Kit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <Gift className="w-3.5 h-3.5 text-purple-600" />
                    <span>Brindes e Itens Inclusos no Kit:</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {editListaBrindes.filter((b) => b.selecionado).length} selecionado(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {editListaBrindes.map((brinde) => (
                    <div
                      key={brinde.id || brinde.nome}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        brinde.selecionado
                          ? 'bg-purple-50/70 border-purple-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <label className="flex items-center space-x-3 cursor-pointer flex-1 mr-2">
                        <input
                          type="checkbox"
                          checked={brinde.selecionado}
                          onChange={() => toggleBrindeEdicao(brinde.id || brinde.nome)}
                          className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <strong className="text-xs font-bold text-slate-900 block">
                            {brinde.nome}
                          </strong>
                          <span className="text-[10px] text-slate-500 block">
                            {brinde.descricao}
                          </span>
                        </div>
                      </label>

                      {brinde.id && brinde.id.startsWith('brinde_extra_') && (
                        <button
                          type="button"
                          onClick={() => handleRemoverBrindeExtra(brinde.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Remover este brinde extra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Adicionar Brinde Personalizado / Extra */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  + Adicionar Brinde Personalizado / Extra:
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={novoBrindeNome}
                    onChange={(e) => setNovoBrindeNome(e.target.value)}
                    placeholder="Nome do brinde (ex: Quadro 50x70, Estojo)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarBrindeExtra}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalEditarBrindesAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md transition cursor-pointer hover:scale-102 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Brindes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL / PRONTUÁRIO: OBSERVAÇÕES & HISTÓRICO DO FORMANDO (CLIQUE NO NOME)
          ========================================================================= */}
      {modalObservacoesAberto && vendaObservacoes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 lg:p-7 shadow-2xl border border-slate-200 animate-in fade-in duration-150 my-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-slate-900">
                      {vendaObservacoes.alunoNome}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {vendaObservacoes.codigoPedido}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {extrairInfoTurma(vendaObservacoes).instituicao} &bull; {vendaObservacoes.turmaNome}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <a
                  href={`/fotos?alunoId=${vendaObservacoes.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 font-bold text-xs border border-slate-200 transition flex items-center space-x-1 cursor-pointer"
                  title="Abrir a ficha completa deste formando em uma nova aba do navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nova Aba</span>
                </a>
                <button
                  type="button"
                  onClick={() => setModalObservacoesAberto(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-abas de Navegação */}
            <div className="flex border-b border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => setAbaObservacoesAtiva('NOTAS')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  abaObservacoesAtiva === 'NOTAS'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Observações & Ocorrências ({vendaObservacoes.historicoObservacoes?.length || (vendaObservacoes.observacoes ? 1 : 0)})</span>
              </button>
              <button
                type="button"
                onClick={() => setAbaObservacoesAtiva('CADASTRO')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  abaObservacoesAtiva === 'CADASTRO'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Dados & Contato</span>
              </button>
              <button
                type="button"
                onClick={() => setAbaObservacoesAtiva('PEDIDO')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  abaObservacoesAtiva === 'PEDIDO'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Resumo do Pedido</span>
              </button>
            </div>

            {/* Conteúdo da Aba 1: NOTAS & OCORRÊNCIAS */}
            {abaObservacoesAtiva === 'NOTAS' && (
              <div className="py-4 space-y-5">
                {/* Observações Gerais */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Observações Gerais do Formando / Pedido:</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSalvarObservacoesGerais}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                    >
                      Salvar Texto
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={textoObservacoesGerais}
                    onChange={(e) => setTextoObservacoesGerais(e.target.value)}
                    placeholder="Digite anotações gerais, preferências, restrições ou recados sobre este formando..."
                    className="w-full p-2.5 rounded-xl bg-white border border-amber-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Adicionar Nova Ocorrência Rápida */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <strong className="text-xs font-bold text-slate-900 block">
                    + Registrar Nova Ocorrência / Contato com o Formando:
                  </strong>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textoNovaObservacao}
                      onChange={(e) => setTextoNovaObservacao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAdicionarNovaNotaObservacao();
                        }
                      }}
                      placeholder="Ex: Formando solicitou troca de foto da colação; Entregue comprovante via WhatsApp..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarNovaNotaObservacao}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition cursor-pointer shrink-0"
                    >
                      + Registrar
                    </button>
                  </div>
                </div>

                {/* Linha do Tempo de Ocorrências */}
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Linha do Tempo de Anotações</span>
                  </h4>

                  {Array.isArray(vendaObservacoes.historicoObservacoes) && vendaObservacoes.historicoObservacoes.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {vendaObservacoes.historicoObservacoes.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-purple-700">👤 {item.autorNome}</span>
                            <span>📅 {item.dataHora}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {item.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-400 text-xs">
                      Nenhuma anotação registrada ainda. Use o campo acima para registrar qualquer contato ou ocorrência com o formando!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 2: DADOS & CONTATO */}
            {abaObservacoesAtiva === 'CADASTRO' && (
              <div className="py-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Nome Completo:</span>
                    <strong className="text-slate-900 text-sm">{vendaObservacoes.alunoNome}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">CPF:</span>
                    <span className="font-mono font-bold text-slate-900">{vendaObservacoes.alunoCpf}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 block text-[11px]">Telefone / WhatsApp:</span>
                      {editandoTelefoneVendaId !== vendaObservacoes.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setNovoTelefoneInput(vendaObservacoes.alunoTelefone || '');
                            setEditandoTelefoneVendaId(vendaObservacoes.id);
                          }}
                          className="text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>
                    {editandoTelefoneVendaId === vendaObservacoes.id ? (
                      <div className="flex items-center space-x-1.5 mt-1">
                        <input
                          type="text"
                          value={novoTelefoneInput}
                          onChange={(e) => setNovoTelefoneInput(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="px-2 py-1 rounded-lg border border-purple-300 font-mono text-xs w-full bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSalvarTelefoneFormando(vendaObservacoes.id, novoTelefoneInput);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSalvarTelefoneFormando(vendaObservacoes.id, novoTelefoneInput)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoTelefoneVendaId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs hover:bg-slate-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-bold text-slate-900 font-mono">{vendaObservacoes.alunoTelefone || 'Não informado'}</span>
                        {vendaObservacoes.alunoTelefone && (
                          <a
                            href={`https://wa.me/55${vendaObservacoes.alunoTelefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] transition"
                          >
                            Chamar no Zap
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">E-mail:</span>
                    <span className="font-bold text-slate-900">{vendaObservacoes.alunoEmail || 'Não informado'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Turma & Instituição:</span>
                    <strong className="text-slate-900 block mt-0.5">
                      {vendaObservacoes.turmaNome} ({extrairInfoTurma(vendaObservacoes).instituicao} - {extrairInfoTurma(vendaObservacoes).periodo})
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 3: RESUMO DO PEDIDO */}
            {abaObservacoesAtiva === 'PEDIDO' && (
              <div className="py-4 space-y-3.5 text-xs">
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-purple-900/70 block text-[11px]">Modelo Escolhido:</span>
                    <strong className="text-purple-950 text-sm">{vendaObservacoes.modeloAlbum}</strong>
                  </div>
                  <div>
                    <span className="text-purple-900/70 block text-[11px]">Valor Total do Kit:</span>
                    <strong className="font-mono text-purple-950 text-base">
                      R$ {vendaObservacoes.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-purple-900/70 block text-[11px]">Forma de Pagamento:</span>
                    <span className="font-bold text-purple-900">{vendaObservacoes.formaPagamento}</span>
                  </div>
                  <div>
                    <span className="text-purple-900/70 block text-[11px]">Status de Produção:</span>
                    <span className="font-bold text-purple-900">{vendaObservacoes.statusProducao}</span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1.5">Brindes e Itens do Kit:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vendaObservacoes.brindes?.filter((b) => b.selecionado).map((b) => (
                      <span
                        key={b.id || b.nome}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200"
                      >
                        ✓ {b.nome}
                      </span>
                    )) || <span className="text-slate-400 italic">Nenhum brinde selecionado.</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Data do Pedido: {vendaObservacoes.dataVenda}
              </span>
              <button
                type="button"
                onClick={() => setModalObservacoesAberto(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Fechar Prontuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reconhecimento Facial com IA (AWS Rekognition) */}
      <ReconhecimentoFacialModal
        aberto={modalIaFacialAberto}
        onFechar={() => setModalIaFacialAberto(false)}
        alunosCadastrados={vendas.map((v) => ({ nome: v.alunoNome, cpf: v.alunoCpf }))}
      />
    </div>
  );
}
