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
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
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
  responsavelId?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  
  // Prazos específicos por etapa de produção
  prazoLayout?: string;            // YYYY-MM-DD (1. Criação de Layout)
  prazoAprovacaoCliente?: string;  // YYYY-MM-DD (2. Aprovação do Cliente)
  prazoConfeccao?: string;         // YYYY-MM-DD (3. Confecção do Álbum)
  
  // Prazo geral ou da etapa ativa (retrocompatibilidade)
  prazoProducao?: string;          // YYYY-MM-DD
  concluidoEm?: string;            // Data DD/MM/AAAA em que foi finalizado
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
  const [vendaSelecionadaBoletos, setVendaSelecionadaBoletos] = useState<VendaAlbum | null>(null);
  const [vendaSelecionadaCartao, setVendaSelecionadaCartao] = useState<VendaAlbum | null>(null);
  const [copiadoIdx, setCopiadoIdx] = useState<string | null>(null);

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

  // Carregar do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Limpa dados de teste anteriores caso ainda estejam no localStorage
        const jaLimpo = localStorage.getItem('on_vendas_albuns_zeradas_limpas_v1');
        if (!jaLimpo) {
          localStorage.removeItem('on_vendas_albuns_estado');
          localStorage.setItem('on_vendas_albuns_zeradas_limpas_v1', 'true');
          setVendas([]);
          return;
        }

        const salvo = localStorage.getItem('on_vendas_albuns_estado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed)) {
            setVendas(parsed);
          } else {
            setVendas([]);
          }
        } else {
          setVendas([]);
        }
      } catch (e) {
        setVendas([]);
      }
    }
  }, []);

  const salvarVendasLocal = (novas: VendaAlbum[]) => {
    setVendas(novas);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(novas));
      } catch (e) {}
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
      const pix = `00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef12345678520400005303986540${val.toFixed(2).length}${val.toFixed(2)}5802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304${dig1.toString().slice(0, 4)}`;

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

  // Métricas reativas: recalculam em tempo real quando houver filtro ativo
  const vendasBaseMetricas = temFiltroAtivo ? vendasFiltradas : vendas;

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
                  {vendas.length} pedidos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monte kits com <strong>Álbum Premium, Preto, Slim ou Colégio</strong> + brindes e emita cartão ou boletos Sicredi.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {vendas.length > 0 && (
              <button
                onClick={handleZerarVendas}
                className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold shadow-sm transition hover:translate-y-[-1px] active:translate-y-[1px]"
                title="Limpar todos os dados e começar do zero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Vendas</span>
              </button>
            )}

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
            CARDS DE MÉTRICAS COM RELEVO TÁTIL 3D (REATIVOS AO FILTRO ATIVO)
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
                {temFiltroAtivo ? ' (filtrado)' : ''}
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
              {vendasBaseMetricas.filter((v) => v.formaPagamento === 'BOLETO').length} carnês emitidos Sicredi
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
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-5">Pedido</th>
                  <th className="py-4 px-5">Formando / Turma</th>
                  <th className="py-4 px-5">Modelo do Álbum</th>
                  <th className="py-4 px-5">Brindes do Kit</th>
                  <th className="py-4 px-5">Soma Total do Kit</th>
                  <th className="py-4 px-5">Forma de Pagamento</th>
                  <th className="py-4 px-5">Produção</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
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
                      <tr key={venda.id} className="hover:bg-slate-50/60 transition">
                        {/* Pedido */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-slate-900 block">
                            {venda.codigoPedido}
                          </span>
                          <span className="text-[10px] text-slate-400">{venda.dataVenda}</span>
                        </td>

                        {/* Formando / Turma */}
                        <td className="py-4 px-5">
                          <strong className="text-slate-900 block text-xs">{venda.alunoNome}</strong>
                          <div className="flex flex-wrap items-center gap-1.5 my-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              🏛️ {extrairInfoTurma(venda).instituicao}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              📅 {extrairInfoTurma(venda).periodo}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{venda.turmaNome}</span>
                          <span className="text-[10px] text-slate-400 font-mono">CPF: {venda.alunoCpf}</span>
                        </td>

                        {/* Modelo de Álbum */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border ${
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
                          <span className="text-[11px] font-mono text-slate-600 block mt-1">
                            R$ {venda.valorAlbum.toFixed(2)}
                          </span>
                        </td>

                        {/* Brindes do Kit */}
                        <td className="py-4 px-5 max-w-[220px]">
                          {brindesAtivos.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Nenhum brinde incluso</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {brindesAtivos.map((b) => (
                                <span
                                  key={b.id || b.nome}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                                >
                                  <Gift className="w-2.5 h-2.5 mr-1 text-purple-500" />
                                  {b.nome}
                                  {b.valorAdicional > 0 && ` (+R$ ${b.valorAdicional})`}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Soma Total do Kit */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-black text-slate-950 text-sm block">
                            R$ {venda.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Total do Kit
                          </span>
                        </td>

                        {/* Forma de Pagamento */}
                        <td className="py-4 px-5">
                          {venda.formaPagamento === 'CARTAO' && (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                Cartão {venda.cartaoQtdParcelas}x de R${' '}
                                {(venda.valorTotalKit / (venda.cartaoQtdParcelas || 1)).toFixed(2)}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                                <span>{venda.cartaoBandeira}</span>
                                <span>&bull;</span>
                                <span className="font-mono">{venda.cartaoNsu}</span>
                              </div>
                            </div>
                          )}

                          {venda.formaPagamento === 'BOLETO' && (
                            <div>
                              <button
                                onClick={() => setVendaSelecionadaBoletos(venda)}
                                className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                              >
                                <Barcode className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                Carnê {venda.boletoQtdParcelas}x ({parcelasPagas}/{totalParcelasBoleto} pagas)
                              </button>
                              <span className="text-[10px] text-slate-500 block mt-1">
                                Banco Sicredi &bull; Clique para ver boletos
                              </span>
                            </div>
                          )}

                          {venda.formaPagamento === 'PIX' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              PIX À Vista
                            </span>
                          )}

                          {venda.formaPagamento === 'DINHEIRO' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              <Wallet className="w-3.5 h-3.5 mr-1 text-teal-600" />
                              Dinheiro À Vista
                            </span>
                          )}
                        </td>

                        {/* Status de Produção & Prazos por Etapa (Visual Limpo e Despoluído) */}
                        <td className="py-3 px-5">
                          {(() => {
                            const infoEtapa = obterPrazoEtapaAtual(venda);
                            const st = calcularStatusPrazo(infoEtapa.prazo, venda.statusProducao, infoEtapa.etapaCurto);
                            const etapa = obterEtapaInfo(venda.statusProducao);

                            return (
                              <div className="space-y-1.5 min-w-[155px]">
                                {/* Linha 1: Etapa de Produção Atual com ação rápida de avançar */}
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
                                </div>

                                {/* Linha 2: Prazo da Etapa Atual com botão de ajuste */}
                                <div className="flex items-center space-x-1.5">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border font-mono ${st.badgeClasse}`}
                                    title={infoEtapa.prazo ? `Prazo da etapa ${infoEtapa.etapaNome}: ${formatarDataBR(infoEtapa.prazo)}` : 'Prazo desta etapa ainda não definido'}
                                  >
                                    <Clock className="w-3 h-3 mr-1 shrink-0" />
                                    {infoEtapa.prazo ? `${formatarDataBR(infoEtapa.prazo)} • ${st.texto.replace(/^.*?: /, '')}` : 'Sem prazo'}
                                  </span>
                                  <button
                                    onClick={() => abrirModalEditarPrazo(venda)}
                                    className="p-1 rounded-lg hover:bg-purple-100 text-slate-400 hover:text-purple-700 transition cursor-pointer"
                                    title="Editar prazos das 3 etapas ou responsável"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Linha 3: Usuário Responsável */}
                                <div className="flex items-center space-x-1 text-[11px] text-slate-600">
                                  <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[140px] font-medium text-slate-700">
                                    {venda.responsavelNome || 'Não atribuído'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          {venda.formaPagamento === 'BOLETO' && (
                            <button
                              onClick={() => setVendaSelecionadaBoletos(venda)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition shadow-2xs"
                              title="Visualizar Carnê de Boletos Sicredi"
                            >
                              <Barcode className="w-3.5 h-3.5 inline mr-1" /> Boletos
                            </button>
                          )}

                          {venda.formaPagamento === 'CARTAO' && (
                            <button
                              onClick={() => setVendaSelecionadaCartao(venda)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition shadow-2xs"
                              title="Ver Comprovante da Transação no Cartão"
                            >
                              <CreditCard className="w-3.5 h-3.5 inline mr-1" /> Comprovante
                            </button>
                          )}

                          {venda.statusProducao !== 'ENTREGUE' ? (
                            <>
                              <button
                                onClick={() => handleConcluirProducao(venda.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs hover:translate-y-[-1px]"
                                title="Concluir processo de produção e entregar álbum"
                              >
                                <CheckSquare className="w-3.5 h-3.5 inline mr-1" />
                                <span>Concluir</span>
                              </button>
                              <button
                                onClick={() => avancarStatusProducao(venda.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-200 transition shadow-2xs hover:translate-y-[-1px]"
                                title="Avançar etapa de produção do álbum"
                              >
                                <span>Avançar</span>
                                <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                              </button>
                            </>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 font-bold text-[11px] border border-slate-200">
                              ✓ Concluído
                            </span>
                          )}

                          <a
                            href={`https://wa.me/55${venda.alunoTelefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(
                              venda.alunoNome
                            )},%20seu%20Kit%20com%20${encodeURIComponent(venda.modeloAlbum)}%20está%20com%20status:%20${venda.statusProducao}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white inline-flex items-center justify-center transition shadow-2xs"
                            title="Enviar status no WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
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
                </div>
              </div>
              <button
                onClick={() => setVendaSelecionadaBoletos(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Carnê</span>
                </button>
                <a
                  href={`https://wa.me/55${vendaSelecionadaBoletos.alunoTelefone.replace(
                    /\D/g,
                    ''
                  )}?text=Olá%20${encodeURIComponent(
                    vendaSelecionadaBoletos.alunoNome
                  )},%20seguem%20os%20dados%20do%20seu%20carnê%20de%20boletos%20do%20Kit%20(${encodeURIComponent(
                    vendaSelecionadaBoletos.modeloAlbum
                  )}%20-%20${encodeURIComponent(vendaSelecionadaBoletos.codigoPedido)}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Enviar no WhatsApp</span>
                </a>
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
                          <span className="text-[11px] text-slate-500">
                            Vencimento: <strong>{parcela.vencimento}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-sm block">
                            R$ {parcela.valor.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              isPaga
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPaga ? 'Liquidado' : 'Aguardando Pagamento'}
                          </span>
                        </div>

                        {/* Botão de Dar Baixa / Alternar */}
                        <button
                          onClick={() => alternarStatusParcela(vendaSelecionadaBoletos.id, parcela.numero)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                            isPaga
                              ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isPaga ? 'Desfazer Baixa' : 'Confirmar Pagamento'}
                        </button>
                      </div>
                    </div>

                    {/* Linha Digitável e PIX */}
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
    </div>
  );
}
