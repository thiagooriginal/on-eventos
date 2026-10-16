'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  CheckSquare,
  AlertCircle,
  Edit3,
  Trash2,
  ArrowRight,
  CalendarClock,
  Users,
  Building2,
  Camera,
  Wallet,
  Palette,
  GraduationCap,
  Laptop,
  Check,
  Star,
  Tag,
  ListTodo,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { getUsuarios, UsuarioSistema } from '@/lib/usuarios';
import { getInstituicoes, Instituicao } from '@/lib/instituicoes';

export type DemandaSetor =
  | 'FOTOGRAFIA'
  | 'FINANCEIRO'
  | 'DESIGN'
  | 'COMERCIAL'
  | 'ATENDIMENTO'
  | 'TI'
  | 'GERAL';

export type DemandaPrioridade = 'URGENTE' | 'ALTA' | 'MEDIA' | 'NORMAL';

export type DemandaStatus =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'EM_REVISAO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface DemandaInterna {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  setor: DemandaSetor;
  prioridade: DemandaPrioridade;
  status: DemandaStatus;
  responsavelNome: string;
  responsavelEmail?: string;
  dataCriacao: string; // YYYY-MM-DD
  prazoLimite: string; // YYYY-MM-DD
  concluidoEm?: string; // DD/MM/AAAA
  turmaNome?: string;
  instituicaoNome?: string;
  periodo?: string; // ex: 2025.2, 2026.1
  checklist: ChecklistItem[];
  criadoPorNome?: string;
}

const STORAGE_KEY_DEMANDAS = 'on_demandas_internas_v1';

export const DEMANDAS_INICIAIS: DemandaInterna[] = [
  {
    id: 'dem-001',
    codigo: 'DEM-101',
    titulo: 'Diagramação de layout do Álbum Premium Medicina 2026.1',
    descricao: 'Confeccionar as lâminas iniciais incluindo fotos de família e sessão de estúdio.',
    setor: 'FOTOGRAFIA',
    prioridade: 'URGENTE',
    status: 'EM_ANDAMENTO',
    responsavelNome: 'Raphaela Rodrigues',
    responsavelEmail: 'raphaela@onagenciadeeventos.com.br',
    dataCriacao: '2026-10-10',
    prazoLimite: '2026-10-20',
    turmaNome: 'Medicina Mackenzie 2026.1',
    instituicaoNome: 'Universidade Presbiteriana Mackenzie',
    periodo: '2026.1',
    checklist: [
      { id: 'c1', texto: 'Receber fotos tratadas em alta definição', concluido: true },
      { id: 'c2', texto: 'Montar boneca das primeiras 40 páginas', concluido: true },
      { id: 'c3', texto: 'Enviar para revisão interna do diagramador', concluido: false },
    ],
    criadoPorNome: 'Thiago Original',
  },
  {
    id: 'dem-002',
    codigo: 'DEM-102',
    titulo: 'Transmitir primeiro lote de remessa CNAB 400 no Sicredi',
    descricao: 'Realizar upload do arquivo oficial 04220O16.CRM no Sicredi Internet até as 18h.',
    setor: 'FINANCEIRO',
    prioridade: 'ALTA',
    status: 'PENDENTE',
    responsavelNome: 'Valter Sá',
    responsavelEmail: 'valter.sa@hotmail.com',
    dataCriacao: '2026-10-14',
    prazoLimite: '2026-10-17',
    turmaNome: 'Direito Mackenzie 2027.1',
    instituicaoNome: 'Universidade Presbiteriana Mackenzie',
    periodo: '2027.1',
    checklist: [
      { id: 'c1', texto: 'Conferir sequencial inicial 123', concluido: true },
      { id: 'c2', texto: 'Baixar arquivo 04220O16.CRM gerado', concluido: true },
      { id: 'c3', texto: 'Transmitir no menu Cobrança > Transferir Arquivos', concluido: false },
    ],
    criadoPorNome: 'Thiago Original',
  },
  {
    id: 'dem-003',
    codigo: 'DEM-103',
    titulo: 'Revisão dos brindes da turma Direito USP 2025.2',
    descricao: 'Verificar se todos os formandos selecionaram entre o Trio de Quadros e o Porta-Diploma de acrílico.',
    setor: 'ATENDIMENTO',
    prioridade: 'MEDIA',
    status: 'EM_REVISAO',
    responsavelNome: 'Raphaela Rodrigues',
    responsavelEmail: 'raphaela@onagenciadeeventos.com.br',
    dataCriacao: '2026-10-08',
    prazoLimite: '2026-10-24',
    turmaNome: 'Direito USP 2025.2',
    instituicaoNome: 'Universidade de São Paulo (USP)',
    periodo: '2025.2',
    checklist: [
      { id: 'c1', texto: 'Enviar mensagem no grupo de WhatsApp da comissão', concluido: true },
      { id: 'c2', texto: 'Planilhar opções pendentes', concluido: true },
    ],
    criadoPorNome: 'Raphaela Rodrigues',
  },
  {
    id: 'dem-004',
    codigo: 'DEM-104',
    titulo: 'Aprovação de layout com a Comissão de Formatura FGV 2026.2',
    descricao: 'Coletar assinatura digital do termo de aprovação do convite e das capas do álbum.',
    setor: 'DESIGN',
    prioridade: 'URGENTE',
    status: 'EM_ANDAMENTO',
    responsavelNome: 'Thiago Original',
    responsavelEmail: 'thiago@onagenciadeeventos.com.br',
    dataCriacao: '2026-10-05',
    prazoLimite: '2026-10-15', // Propositalmente vencido para teste de alerta
    turmaNome: 'Administração FGV 2026.2',
    instituicaoNome: 'Fundação Getulio Vargas (FGV)',
    periodo: '2026.2',
    checklist: [
      { id: 'c1', texto: 'Disponibilizar PDF em alta resolução', concluido: true },
      { id: 'c2', texto: 'Validar dados institucionais da faculdade', concluido: true },
      { id: 'c3', texto: 'Coletar de acordo formal do presidente', concluido: false },
    ],
    criadoPorNome: 'Thiago Original',
  },
  {
    id: 'dem-005',
    codigo: 'DEM-105',
    titulo: 'Conferência de medidas das becas para prova solene',
    descricao: 'Organizar a listagem de tamanhos dos alunos da turma Odontologia Anhembi.',
    setor: 'GERAL',
    prioridade: 'NORMAL',
    status: 'CONCLUIDA',
    responsavelNome: 'Raphaela Rodrigues',
    responsavelEmail: 'raphaela@onagenciadeeventos.com.br',
    dataCriacao: '2026-09-28',
    prazoLimite: '2026-10-12',
    concluidoEm: '11/10/2026',
    turmaNome: 'Odontologia Anhembi 2026.1',
    instituicaoNome: 'Universidade Anhembi Morumbi',
    periodo: '2026.1',
    checklist: [
      { id: 'c1', texto: 'Receber grade de tamanhos da alfaiataria', concluido: true },
      { id: 'c2', texto: 'Identificar becas por aluno', concluido: true },
    ],
    criadoPorNome: 'Raphaela Rodrigues',
  },
];

export const SETORES_INFO: Record<
  DemandaSetor,
  { rotulo: string; icone: React.ComponentType<{ className?: string }>; corBadge: string }
> = {
  FOTOGRAFIA: {
    rotulo: 'Fotografia & Produção',
    icone: Camera,
    corBadge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  FINANCEIRO: {
    rotulo: 'Financeiro & Boletos',
    icone: Wallet,
    corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  DESIGN: {
    rotulo: 'Design & Criação',
    icone: Palette,
    corBadge: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  COMERCIAL: {
    rotulo: 'Comercial & Vendas',
    icone: Building2,
    corBadge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  ATENDIMENTO: {
    rotulo: 'Atendimento & Turmas',
    icone: GraduationCap,
    corBadge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  TI: {
    rotulo: 'TI & Sistema',
    icone: Laptop,
    corBadge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  GERAL: {
    rotulo: 'Administrativo & Geral',
    icone: Layers,
    corBadge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export const ETAPAS_DEMANDA: {
  id: DemandaStatus;
  nome: string;
  nomeCurto: string;
  icone: string;
  corBadge: string;
}[] = [
  {
    id: 'PENDENTE',
    nome: '1. Pendente / Fila',
    nomeCurto: 'Pendente',
    icone: '📥',
    corBadge: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  {
    id: 'EM_ANDAMENTO',
    nome: '2. Em Execução',
    nomeCurto: 'Em Andamento',
    icone: '⚙️',
    corBadge: 'bg-blue-50 text-blue-900 border-blue-300',
  },
  {
    id: 'EM_REVISAO',
    nome: '3. Em Revisão',
    nomeCurto: 'Em Revisão',
    icone: '🔍',
    corBadge: 'bg-indigo-50 text-indigo-900 border-indigo-300',
  },
  {
    id: 'CONCLUIDA',
    nome: '4. Concluída',
    nomeCurto: 'Concluída',
    icone: '✅',
    corBadge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
];

export const formatarDataBR = (iso: string) => {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
};

export default function DemandasInternasPage() {
  const [demandas, setDemandas] = useState<DemandaInterna[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('TODOS');
  const [filtroPrazo, setFiltroPrazo] = useState<string>('TODOS');
  const [filtroSetor, setFiltroSetor] = useState<string>('TODOS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('TODOS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Usuário Logado & Equipe
  const [usuarioLogado, setUsuarioLogado] = useState<{
    nome: string;
    email: string;
    perfil: string;
  } | null>(null);
  const [usuariosSistema, setUsuariosSistema] = useState<UsuarioSistema[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);

  // Modais
  const [modalNovaDemandaAberto, setModalNovaDemandaAberto] = useState(false);
  const [demandaEditando, setDemandaEditando] = useState<DemandaInterna | null>(null);
  const [demandaDetalhes, setDemandaDetalhes] = useState<DemandaInterna | null>(null);

  // Form Nova Demanda
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formSetor, setFormSetor] = useState<DemandaSetor>('FOTOGRAFIA');
  const [formPrioridade, setFormPrioridade] = useState<DemandaPrioridade>('MEDIA');
  const [formResponsavelNome, setFormResponsavelNome] = useState('');
  const [formPrazoLimite, setFormPrazoLimite] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formTurmaNome, setFormTurmaNome] = useState('');
  const [formPeriodo, setFormPeriodo] = useState('2026.1');
  const [formChecklistItems, setFormChecklistItems] = useState<string[]>(['']);

  // Modal Edição Rápida
  const [editStatus, setEditStatus] = useState<DemandaStatus>('PENDENTE');
  const [editResponsavelNome, setEditResponsavelNome] = useState('');
  const [editPrazoLimite, setEditPrazoLimite] = useState('');

  // Carregamento inicial do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const usrSalvo = localStorage.getItem('on_usuario_logado');
        if (usrSalvo) {
          const parsed = JSON.parse(usrSalvo);
          setUsuarioLogado(parsed);
          setFormResponsavelNome(parsed.nome || 'Raphaela Rodrigues');
        }
      } catch (e) {}

      setUsuariosSistema(getUsuarios());
      setInstituicoes(getInstituicoes());

      try {
        const salvo = localStorage.getItem(STORAGE_KEY_DEMANDAS);
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDemandas(parsed);
            return;
          }
        }
        localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify(DEMANDAS_INICIAIS));
        setDemandas(DEMANDAS_INICIAIS);
      } catch (e) {
        setDemandas(DEMANDAS_INICIAIS);
      }
    }
  }, []);

  const salvarDemandas = (novas: DemandaInterna[]) => {
    setDemandas(novas);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify(novas));
      } catch (e) {}
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper para calcular situação do prazo da demanda
  const calcularStatusPrazo = (prazoIso: string, status: DemandaStatus) => {
    if (status === 'CONCLUIDA' || status === 'CANCELADA') {
      return {
        texto: 'Concluída',
        diasRestantes: 0,
        atrasado: false,
        urgente: false,
        venceHoje: false,
        badgeClasse: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }

    if (!prazoIso) {
      return {
        texto: 'Sem prazo',
        diasRestantes: 999,
        atrasado: false,
        urgente: false,
        venceHoje: false,
        badgeClasse: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const partes = prazoIso.split('-');
    if (partes.length !== 3) {
      return {
        texto: 'Data inválida',
        diasRestantes: 0,
        atrasado: false,
        urgente: false,
        venceHoje: false,
        badgeClasse: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }

    const dPrazo = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    dPrazo.setHours(0, 0, 0, 0);

    const diffMs = dPrazo.getTime() - hoje.getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      const diasAtraso = Math.abs(diffDias);
      return {
        texto: `Atrasada há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`,
        diasRestantes: diffDias,
        atrasado: true,
        urgente: true,
        venceHoje: false,
        badgeClasse: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
      };
    }

    if (diffDias === 0) {
      return {
        texto: 'Vence HOJE!',
        diasRestantes: 0,
        atrasado: false,
        urgente: true,
        venceHoje: true,
        badgeClasse: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
      };
    }

    if (diffDias <= 3) {
      return {
        texto: `${diffDias} ${diffDias === 1 ? 'dia restante' : 'dias restantes'} (Urgente)`,
        diasRestantes: diffDias,
        atrasado: false,
        urgente: true,
        venceHoje: false,
        badgeClasse: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
      };
    }

    return {
      texto: `${diffDias} dias restantes`,
      diasRestantes: diffDias,
      atrasado: false,
      urgente: false,
      venceHoje: false,
      badgeClasse: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  };

  // Avançar etapa da demanda com 1 clique (igual ao avanço de vendas)
  const avancarStatusDemanda = (demandaId: string) => {
    const ordem: DemandaStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA'];
    const hoje = new Date().toLocaleDateString('pt-BR');

    const atualizadas = demandas.map((d) => {
      if (d.id === demandaId) {
        const idx = ordem.indexOf(d.status);
        const proximo = idx < ordem.length - 1 ? ordem[idx + 1] : ordem[idx];
        return {
          ...d,
          status: proximo,
          concluidoEm: proximo === 'CONCLUIDA' ? hoje : d.concluidoEm,
        };
      }
      return d;
    });

    salvarDemandas(atualizadas);
    const atual = atualizadas.find((d) => d.id === demandaId);
    if (atual) {
      const etapa = ETAPAS_DEMANDA.find((e) => e.id === atual.status);
      showToast(`Demanda ${atual.codigo} avançou para: ${etapa?.nome}!`);
    }
  };

  // Marcar como Concluída direto
  const handleConcluirDemanda = (demandaId: string) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const atualizadas = demandas.map((d) => {
      if (d.id === demandaId) {
        return {
          ...d,
          status: 'CONCLUIDA' as const,
          concluidoEm: hoje,
        };
      }
      return d;
    });
    salvarDemandas(atualizadas);
    showToast('Demanda marcada como CONCLUÍDA com sucesso! 🎉');
  };

  // Excluir demanda
  const handleExcluirDemanda = (demandaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta demanda interna?')) {
      const atualizadas = demandas.filter((d) => d.id !== demandaId);
      salvarDemandas(atualizadas);
      showToast('Demanda removida com sucesso!');
    }
  };

  // Abrir modal de edição rápida de prazo e responsável
  const abrirModalEditarPrazo = (demanda: DemandaInterna) => {
    setDemandaEditando(demanda);
    setEditStatus(demanda.status);
    setEditResponsavelNome(demanda.responsavelNome || usuarioLogado?.nome || '');
    setEditPrazoLimite(demanda.prazoLimite || '');
  };

  // Salvar edição rápida
  const handleSalvarEdicaoRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaEditando) return;

    const hoje = new Date().toLocaleDateString('pt-BR');
    const atualizadas = demandas.map((d) => {
      if (d.id === demandaEditando.id) {
        return {
          ...d,
          status: editStatus,
          responsavelNome: editResponsavelNome.trim() || 'Não atribuído',
          prazoLimite: editPrazoLimite,
          concluidoEm: editStatus === 'CONCLUIDA' ? hoje : undefined,
        };
      }
      return d;
    });

    salvarDemandas(atualizadas);
    setDemandaEditando(null);
    showToast('Demanda atualizada com sucesso!');
  };

  // Criar Nova Demanda
  const handleCriarDemanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      alert('Por favor, informe o título da demanda.');
      return;
    }

    const proximoNum = demandas.length + 101;
    const novoCodigo = `DEM-${proximoNum}`;
    const hojeIso = new Date().toISOString().split('T')[0];

    const checklistFiltrado: ChecklistItem[] = formChecklistItems
      .filter((txt) => txt.trim().length > 0)
      .map((texto, i) => ({
        id: `c_${Date.now()}_${i}`,
        texto: texto.trim(),
        concluido: false,
      }));

    const nova: DemandaInterna = {
      id: `dem_${Date.now()}`,
      codigo: novoCodigo,
      titulo: formTitulo.trim(),
      descricao: formDescricao.trim() || 'Sem descrição complementar.',
      setor: formSetor,
      prioridade: formPrioridade,
      status: 'PENDENTE',
      responsavelNome: formResponsavelNome.trim() || usuarioLogado?.nome || 'Equipe ON',
      dataCriacao: hojeIso,
      prazoLimite: formPrazoLimite,
      turmaNome: formTurmaNome.trim() || undefined,
      periodo: formPeriodo || undefined,
      checklist: checklistFiltrado,
      criadoPorNome: usuarioLogado?.nome || 'Sistema',
    };

    const atualizadas = [nova, ...demandas];
    salvarDemandas(atualizadas);
    setModalNovaDemandaAberto(false);
    showToast(`Demanda ${novoCodigo} cadastrada com sucesso!`);

    // Reset Form
    setFormTitulo('');
    setFormDescricao('');
    setFormTurmaNome('');
    setFormChecklistItems(['']);
    const dReset = new Date();
    dReset.setDate(dReset.getDate() + 7);
    setFormPrazoLimite(dReset.toISOString().split('T')[0]);
  };

  // Alternar item do checklist
  const toggleChecklistItem = (demandaId: string, itemId: string) => {
    const atualizadas = demandas.map((d) => {
      if (d.id === demandaId) {
        const novoChecklist = d.checklist.map((it) =>
          it.id === itemId ? { ...it, concluido: !it.concluido } : it
        );
        return { ...d, checklist: novoChecklist };
      }
      return d;
    });

    salvarDemandas(atualizadas);
    if (demandaDetalhes && demandaDetalhes.id === demandaId) {
      const atual = atualizadas.find((d) => d.id === demandaId);
      if (atual) setDemandaDetalhes(atual);
    }
  };

  // Filtragem completa
  const demandasFiltradas = useMemo(() => {
    return demandas.filter((d) => {
      const stPrazo = calcularStatusPrazo(d.prazoLimite, d.status);

      const matchBusca =
        busca.trim() === '' ||
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        d.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        d.responsavelNome.toLowerCase().includes(busca.toLowerCase()) ||
        (d.turmaNome && d.turmaNome.toLowerCase().includes(busca.toLowerCase()));

      const matchResponsavel =
        filtroResponsavel === 'TODOS'
          ? true
          : filtroResponsavel === 'MEUS'
          ? d.responsavelNome.toLowerCase() === (usuarioLogado?.nome || '').toLowerCase()
          : filtroResponsavel === 'SEM_RESPONSAVEL'
          ? !d.responsavelNome || d.responsavelNome === 'Não atribuído'
          : d.responsavelNome.toLowerCase() === filtroResponsavel.toLowerCase();

      const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
      const matchPrioridade = filtroPrioridade === 'TODOS' || d.prioridade === filtroPrioridade;
      const matchSetor = filtroSetor === 'TODOS' || d.setor === filtroSetor;
      const matchPeriodo = filtroPeriodo === 'TODOS' || d.periodo === filtroPeriodo;

      const matchPrazo =
        filtroPrazo === 'TODOS'
          ? true
          : filtroPrazo === 'ATRASADAS'
          ? stPrazo.atrasado
          : filtroPrazo === 'HOJE'
          ? stPrazo.venceHoje
          : filtroPrazo === 'URGENTES'
          ? stPrazo.urgente || stPrazo.atrasado
          : filtroPrazo === 'NO_PRAZO'
          ? !stPrazo.atrasado && d.status !== 'CONCLUIDA'
          : filtroPrazo === 'CONCLUIDAS'
          ? d.status === 'CONCLUIDA'
          : true;

      return (
        matchBusca &&
        matchResponsavel &&
        matchStatus &&
        matchPrioridade &&
        matchSetor &&
        matchPeriodo &&
        matchPrazo
      );
    });
  }, [
    demandas,
    busca,
    filtroResponsavel,
    filtroStatus,
    filtroPrioridade,
    filtroSetor,
    filtroPeriodo,
    filtroPrazo,
    usuarioLogado,
  ]);

  // Lista de demandas atrasadas pendentes para o alerta geral
  const demandasAtrasadas = useMemo(() => {
    return demandas.filter((d) => {
      if (d.status === 'CONCLUIDA' || d.status === 'CANCELADA') return false;
      const st = calcularStatusPrazo(d.prazoLimite, d.status);
      return st.atrasado;
    });
  }, [demandas]);

  // Contadores para métricas
  const totalDemandas = demandas.length;
  const totalMinhas = demandas.filter(
    (d) => d.responsavelNome.toLowerCase() === (usuarioLogado?.nome || '').toLowerCase()
  ).length;
  const totalEmAndamento = demandas.filter(
    (d) => d.status === 'EM_ANDAMENTO' || d.status === 'EM_REVISAO'
  ).length;
  const totalAtrasadas = demandasAtrasadas.length;
  const totalConcluidas = demandas.filter((d) => d.status === 'CONCLUIDA').length;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Oficial da ON Eventos */}
      <Sidebar paginaAtiva="demandas" />

      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#36218A] text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(54,33,138,0.45)] border border-purple-400/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Conteúdo Principal Direito */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior com Relevo Tátil e Ação de Nova Demanda */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white shadow-[0_6px_16px_rgba(124,58,237,0.25)] flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Demandas Internas & Processos da Equipe
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {demandas.length} demandas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribua tarefas entre a equipe, acompanhe prazos limites e avance as etapas operacionais até a conclusão.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setModalNovaDemandaAberto(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Demanda Interna</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            ALERTA PERSISTENTE NA TELA SE HOUVER DEMANDAS ATRASADAS
            ========================================================================= */}
        {totalAtrasadas > 0 && (
          <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white rounded-[24px] p-4.5 mb-6 shadow-[0_8px_24px_rgba(225,29,72,0.3)] border border-rose-300/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/30 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-amber-200" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-spin" />
                    Atenção: Prazos Limites Vencidos na Equipe
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white text-rose-700 shadow-xs">
                    {totalAtrasadas} {totalAtrasadas === 1 ? 'demanda em atraso' : 'demandas em atraso'}
                  </span>
                </div>
                <p className="text-xs text-rose-50 mt-1">
                  Existem demandas internas cujo prazo expirou sem conclusão. Este alerta permanecerá ativo até que as etapas sejam concluídas ou os prazos prorrogados.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setFiltroPrazo('ATRASADAS')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 text-xs font-extrabold shadow-sm transition hover:scale-102 cursor-pointer flex items-center space-x-1.5"
              >
                <Filter className="w-4 h-4 text-rose-600" />
                <span>Filtrar Apenas Atrasadas ({totalAtrasadas})</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            CARDS DE MÉTRICAS COM RELEVO TÁTIL 3D
            ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          {/* Card 1: Total */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total de Demandas
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ListTodo className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {totalDemandas}
            </div>
            <div className="mt-2 flex items-center text-[11px] text-purple-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>{demandasFiltradas.length} na visualização atual</span>
            </div>
          </div>

          {/* Card 2: Minhas Demandas */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Atribuídas a Você
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {totalMinhas}
            </div>
            <div className="mt-2 text-[11px] text-blue-700 font-semibold">
              {usuarioLogado?.nome || 'Usuário Atual'}
            </div>
          </div>

          {/* Card 3: Em Andamento */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Em Execução
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {totalEmAndamento}
            </div>
            <div className="mt-2 text-[11px] text-indigo-700 font-semibold">
              Etapas ativas de trabalho
            </div>
          </div>

          {/* Card 4: Atrasadas */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Em Atraso
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 tracking-tight font-mono">
              {totalAtrasadas}
            </div>
            <div className="mt-2 text-[11px] text-rose-700 font-semibold">
              {totalAtrasadas > 0 ? 'Exigem ação imediata' : 'Nenhuma atrasada 🎉'}
            </div>
          </div>

          {/* Card 5: Concluídas */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Concluídas
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              {totalConcluidas}
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
              Finalizadas e entregues
            </div>
          </div>
        </section>

        {/* =========================================================================
            BARRA DE BUSCA E FILTROS RÁPIDOS
            ========================================================================= */}
        <div className="bg-white rounded-[24px] p-4 mb-6 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Busca Geral */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar demanda por título, código (DEM-XXX), responsável, turma..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#F4F6FB] text-slate-900 placeholder:text-slate-400 text-xs rounded-2xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] shadow-inner transition"
            />
          </div>

          {/* Filtro por Responsável */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              title="Filtrar por Usuário Responsável"
            >
              <option value="TODOS">👤 Todos os Responsáveis</option>
              {usuarioLogado && <option value="MEUS">⭐ Minhas Demandas</option>}
              <option value="SEM_RESPONSAVEL">❓ Sem Responsável</option>
              {usuariosSistema.map((u) => (
                <option key={u.id} value={u.nome}>
                  👤 {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Etapa / Status */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">Etapas (Todas)</option>
              {ETAPAS_DEMANDA.map((et) => (
                <option key={et.id} value={et.id}>
                  {et.icone} {et.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Prioridade */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">Prioridade (Todas)</option>
              <option value="URGENTE">🚨 Urgente</option>
              <option value="ALTA">⚠️ Alta</option>
              <option value="MEDIA">🟡 Média</option>
              <option value="NORMAL">🟢 Normal</option>
            </select>
          </div>

          {/* Filtro por Prazo */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroPrazo}
              onChange={(e) => setFiltroPrazo(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">⏱️ Prazos (Todos)</option>
              <option value="ATRASADAS">🚨 Apenas Atrasadas</option>
              <option value="HOJE">⚠️ Vence Hoje</option>
              <option value="URGENTES">⏳ Urgentes (≤3d)</option>
              <option value="NO_PRAZO">✅ Em Aberto (No Prazo)</option>
              <option value="CONCLUIDAS">📦 Concluídas</option>
            </select>
          </div>

          {/* Filtro por Setor */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">🏢 Todos os Setores</option>
              {(Object.keys(SETORES_INFO) as DemandaSetor[]).map((s) => (
                <option key={s} value={s}>
                  {SETORES_INFO[s].rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =========================================================================
            TABELA DE DEMANDAS COM AVANÇO RÁPIDO DE ETAPAS
            ========================================================================= */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-5">Código & Setor</th>
                  <th className="py-4 px-5">Demanda & Contexto</th>
                  <th className="py-4 px-5">Prioridade</th>
                  <th className="py-4 px-5">Etapa do Fluxo (Clique p/ Avançar)</th>
                  <th className="py-4 px-5">Prazo Limite</th>
                  <th className="py-4 px-5">Responsável</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {demandasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ClipboardList className="w-10 h-10 text-slate-300" />
                        <span className="text-sm font-bold text-slate-600">
                          Nenhuma demanda interna encontrada com os filtros selecionados.
                        </span>
                        <button
                          onClick={() => {
                            setBusca('');
                            setFiltroResponsavel('TODOS');
                            setFiltroStatus('TODOS');
                            setFiltroPrioridade('TODOS');
                            setFiltroPrazo('TODOS');
                            setFiltroSetor('TODOS');
                          }}
                          className="text-xs text-purple-600 font-bold hover:underline"
                        >
                          Limpar todos os filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  demandasFiltradas.map((demanda) => {
                    const stPrazo = calcularStatusPrazo(demanda.prazoLimite, demanda.status);
                    const setor = SETORES_INFO[demanda.setor] || SETORES_INFO.GERAL;
                    const SetorIcon = setor.icone;
                    const etapa =
                      ETAPAS_DEMANDA.find((e) => e.id === demanda.status) || ETAPAS_DEMANDA[0];

                    return (
                      <tr
                        key={demanda.id}
                        className={`hover:bg-slate-50/80 transition group ${
                          demanda.status === 'CONCLUIDA' ? 'bg-slate-50/40 opacity-75' : ''
                        }`}
                      >
                        {/* Código & Setor */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <span className="font-mono font-black text-slate-800 block text-xs">
                            {demanda.codigo}
                          </span>
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border mt-1 ${setor.corBadge}`}
                          >
                            <SetorIcon className="w-3 h-3" />
                            <span>{setor.rotulo.split('&')[0].trim()}</span>
                          </span>
                        </td>

                        {/* Demanda & Contexto */}
                        <td className="py-3 px-5 max-w-[280px]">
                          <div className="font-black text-slate-900 group-hover:text-purple-700 transition">
                            {demanda.titulo}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {demanda.descricao}
                          </p>
                          {demanda.turmaNome && (
                            <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-medium mt-1">
                              <GraduationCap className="w-3 h-3 text-purple-500 shrink-0" />
                              <span className="truncate">{demanda.turmaNome}</span>
                            </div>
                          )}
                        </td>

                        {/* Prioridade */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                              demanda.prioridade === 'URGENTE'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : demanda.prioridade === 'ALTA'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : demanda.prioridade === 'MEDIA'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {demanda.prioridade === 'URGENTE'
                              ? '🚨 Urgente'
                              : demanda.prioridade === 'ALTA'
                              ? '⚠️ Alta'
                              : demanda.prioridade === 'MEDIA'
                              ? '🟡 Média'
                              : '🟢 Normal'}
                          </span>
                        </td>

                        {/* Etapa do Fluxo (com clique rápido para avançar) */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          {demanda.status === 'CONCLUIDA' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Concluída em {demanda.concluidoEm || 'recente'}
                            </span>
                          ) : (
                            <button
                              onClick={() => avancarStatusDemanda(demanda.id)}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${etapa.corBadge} hover:brightness-95 transition shadow-2xs group/btn cursor-pointer`}
                              title={`Etapa atual: ${etapa.nome}. Clique para avançar!`}
                            >
                              <span>{etapa.icone}</span>
                              <span>{etapa.nomeCurto}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </td>

                        {/* Prazo Limite */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border font-mono ${stPrazo.badgeClasse}`}
                            >
                              <Clock className="w-3 h-3 mr-1 shrink-0" />
                              {demanda.prazoLimite
                                ? `${formatarDataBR(demanda.prazoLimite)} • ${stPrazo.texto}`
                                : 'Sem prazo'}
                            </span>
                            <button
                              onClick={() => abrirModalEditarPrazo(demanda)}
                              className="p-1 rounded-lg hover:bg-purple-100 text-slate-400 hover:text-purple-700 transition cursor-pointer"
                              title="Editar prazo ou responsável da demanda"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Usuário Responsável */}
                        <td className="py-3 px-5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 border border-purple-200">
                              {demanda.responsavelNome.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 text-xs">
                              {demanda.responsavelNome}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-5 text-right whitespace-nowrap space-x-1.5">
                          {demanda.checklist.length > 0 && (
                            <button
                              onClick={() => setDemandaDetalhes(demanda)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition shadow-2xs"
                              title="Ver Checklist da Demanda"
                            >
                              <CheckSquare className="w-3.5 h-3.5 inline mr-1 text-purple-600" />
                              {demanda.checklist.filter((c) => c.concluido).length}/
                              {demanda.checklist.length}
                            </button>
                          )}

                          {demanda.status !== 'CONCLUIDA' && (
                            <button
                              onClick={() => handleConcluirDemanda(demanda.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition shadow-2xs"
                              title="Marcar Demanda como Concluída"
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                              Concluir
                            </button>
                          )}

                          <button
                            onClick={() => handleExcluirDemanda(demanda.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Excluir Demanda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: NOVA DEMANDA INTERNA
          ========================================================================= */}
      {modalNovaDemandaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 lg:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Nova Demanda Interna</h3>
                  <p className="text-xs text-slate-500">
                    Cadastre uma tarefa para membros da equipe com prazo e setor definido.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNovaDemandaAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarDemanda} className="mt-4 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Demanda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Diagramar álbum Medicina 2026.1, Enviar remessa Sicredi..."
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Setor & Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Setor / Área</label>
                  <select
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value as DemandaSetor)}
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    {(Object.keys(SETORES_INFO) as DemandaSetor[]).map((s) => (
                      <option key={s} value={s}>
                        {SETORES_INFO[s].rotulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={formPrioridade}
                    onChange={(e) => setFormPrioridade(e.target.value as DemandaPrioridade)}
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    <option value="NORMAL">🟢 Normal</option>
                    <option value="MEDIA">🟡 Média</option>
                    <option value="ALTA">⚠️ Alta</option>
                    <option value="URGENTE">🚨 Urgente (Crítica)</option>
                  </select>
                </div>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Usuário Responsável *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formResponsavelNome}
                    onChange={(e) => setFormResponsavelNome(e.target.value)}
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    {usuariosSistema.map((u) => (
                      <option key={u.id} value={u.nome}>
                        👤 {u.nome} ({u.cargo || u.departamento})
                      </option>
                    ))}
                    {usuarioLogado &&
                      !usuariosSistema.some((u) => u.nome === usuarioLogado.nome) && (
                        <option value={usuarioLogado.nome}>
                          👤 {usuarioLogado.nome} (Você)
                        </option>
                      )}
                  </select>
                  {usuarioLogado && (
                    <button
                      type="button"
                      onClick={() => setFormResponsavelNome(usuarioLogado.nome)}
                      className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 shrink-0"
                    >
                      Atribuir a Mim
                    </button>
                  )}
                </div>
              </div>

              {/* Prazo Limite com atalhos */}
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-950 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-purple-600" />
                    Data Limite de Conclusão *
                  </label>
                  <span className="text-[10px] text-purple-700 font-bold">
                    Alerta na tela se atrasar
                  </span>
                </div>
                <input
                  type="date"
                  required
                  value={formPrazoLimite}
                  onChange={(e) => setFormPrazoLimite(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-purple-200 font-mono font-bold"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-purple-700 self-center">Atalhos:</span>
                  {[3, 7, 15, 30].map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + dias);
                        setFormPrazoLimite(d.toISOString().split('T')[0]);
                      }}
                      className="px-2.5 py-0.5 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 text-[10px] font-bold transition"
                    >
                      +{dias}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Vínculo opcional de Turma */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vincular a uma Turma / Projeto (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: Medicina Mackenzie 2026.1, Direito USP 2025.2..."
                  value={formTurmaNome}
                  onChange={(e) => setFormTurmaNome(e.target.value)}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                />
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição / Orientações para a Execução
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva detalhes específicos da demanda, orientações sobre o que precisa ser feito..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200"
                />
              </div>

              {/* Botões do Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalNovaDemandaAberto(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md transition"
                >
                  Criar Demanda Interna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIÇÃO RÁPIDA DE PRAZO & RESPONSÁVEL (LÁPIS ✏️)
          ========================================================================= */}
      {demandaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ajustar Etapa, Responsável & Prazo
                  </h3>
                  <p className="text-xs text-slate-500">
                    {demandaEditando.codigo} &bull; {demandaEditando.titulo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDemandaEditando(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoRapida} className="mt-4 space-y-4">
              {/* Etapa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Etapa Atual do Fluxo:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ETAPAS_DEMANDA.map((et) => (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => setEditStatus(et.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center space-x-2 ${
                        editStatus === et.id
                          ? 'ring-2 ring-purple-600 border-purple-500 bg-purple-50 text-purple-950 font-black'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{et.icone}</span>
                      <span className="truncate">{et.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Usuário Responsável:
                </label>
                <select
                  value={editResponsavelNome}
                  onChange={(e) => setEditResponsavelNome(e.target.value)}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-bold"
                >
                  {usuariosSistema.map((u) => (
                    <option key={u.id} value={u.nome}>
                      👤 {u.nome}
                    </option>
                  ))}
                  {usuarioLogado &&
                    !usuariosSistema.some((u) => u.nome === usuarioLogado.nome) && (
                      <option value={usuarioLogado.nome}>
                        👤 {usuarioLogado.nome} (Você)
                      </option>
                    )}
                </select>
              </div>

              {/* Prazo Limite */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Prazo Limite:
                </label>
                <input
                  type="date"
                  value={editPrazoLimite}
                  onChange={(e) => setEditPrazoLimite(e.target.value)}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 self-center">Prorrogar:</span>
                  {[3, 7, 15, 30].map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + dias);
                        setEditPrazoLimite(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-purple-100 hover:text-purple-800 text-[10px] font-bold text-slate-600 transition"
                    >
                      +{dias}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDemandaEditando(null)}
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
          MODAL 3: CHECKLIST & DETALHES DA DEMANDA
          ========================================================================= */}
      {demandaDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Checklist da Demanda</h3>
                  <p className="text-xs text-slate-500">{demandaDetalhes.codigo}</p>
                </div>
              </div>
              <button
                onClick={() => setDemandaDetalhes(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <h4 className="text-sm font-black text-slate-900">{demandaDetalhes.titulo}</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {demandaDetalhes.descricao}
              </p>

              <div className="pt-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
                  Itens a Cumprir ({demandaDetalhes.checklist.filter((c) => c.concluido).length}/
                  {demandaDetalhes.checklist.length}):
                </span>
                <div className="space-y-2">
                  {demandaDetalhes.checklist.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklistItem(demandaDetalhes.id, item.id)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center space-x-3 transition cursor-pointer ${
                        item.concluido
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                          item.concluido
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {item.concluido && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs ${item.concluido ? 'line-through text-slate-400' : ''}`}>
                        {item.texto}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setDemandaDetalhes(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
