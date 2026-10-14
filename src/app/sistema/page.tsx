'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Kanban,
  BadgePercent,
  CalendarDays,
  FileBarChart2,
  Megaphone,
  Smartphone,
  ShieldCheck,
  Building2,
  Globe,
  Search,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  DollarSign,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Camera,
  ArrowRight,
  Activity,
  UserCheck,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const modulosCompletos = [
  {
    titulo: 'Métricas & Telemetria do Site',
    descricao: 'Acompanhamento ao vivo de acessos: visitantes únicos, tempo de navegação, volume de cliques e mapa de onde clicaram.',
    href: '/metricas/index.html',
    icone: Activity,
    tag: 'Telemetria & Tráfego',
    corFundo: 'from-emerald-500 to-teal-600',
    corBorda: 'border-emerald-200',
    corTexto: 'text-emerald-600',
    corBg: 'bg-emerald-50',
    badge: 'Ao Vivo',
  },
  {
    titulo: 'Gestão de Usuários & Níveis',
    descricao: 'Cadastro de equipe com níveis de permissão estritos: Administrador (Acesso Total) ou Básico (Operacional & Vendas).',
    href: '/usuarios/index.html',
    icone: UserCheck,
    tag: 'Segurança & Equipe',
    corFundo: 'from-purple-600 to-indigo-600',
    corBorda: 'border-purple-200',
    corTexto: 'text-purple-600',
    corBg: 'bg-purple-50',
    badge: 'Admin/Básico',
  },
  {
    titulo: 'CRM de Turmas & Oportunidades',
    descricao: 'Funil comercial por turma em negociação. Converte automaticamente a oportunidade em projeto na 1ª adesão.',
    href: '/crm/index.html',
    icone: Kanban,
    tag: 'Comercial',
    corFundo: 'from-amber-500 to-orange-500',
    corBorda: 'border-amber-200',
    corTexto: 'text-amber-600',
    corBg: 'bg-amber-50',
    badge: '14 turmas',
  },
  {
    titulo: 'Gestão de Projetos & Turmas',
    descricao: 'Controle de bailes e colações, planos, adesões ativas, cálculo de valores previstos vs contratados.',
    href: '/projetos/index.html',
    icone: GraduationCap,
    tag: 'Operacional',
    corFundo: 'from-emerald-500 to-teal-600',
    corBorda: 'border-emerald-200',
    corTexto: 'text-emerald-600',
    corBg: 'bg-emerald-50',
    badge: '8 projetos',
  },
  {
    titulo: 'Vendas de Álbuns & Fotografia',
    descricao: 'Gestão comercial de álbuns, compras no cartão de crédito/débito e emissão de boletos Sicredi com QR Code PIX.',
    href: '/fotos/index.html',
    icone: Camera,
    tag: 'Fotografia & Vendas',
    corFundo: 'from-fuchsia-500 to-purple-600',
    corBorda: 'border-fuchsia-200',
    corTexto: 'text-fuchsia-600',
    corBg: 'bg-fuchsia-50',
    badge: 'Álbuns & Boletos',
  },
  {
    titulo: 'Comissões de Vendedores (Regra 4%)',
    descricao: 'Livro-razão imutável: 4% liberados na 1ª parcela, garantia com 3 parcelas pagas e controle de estornos.',
    href: '/comissoes/index.html',
    icone: BadgePercent,
    tag: 'Prioridade Máxima',
    corFundo: 'from-purple-600 to-indigo-600',
    corBorda: 'border-purple-200',
    corTexto: 'text-purple-600',
    corBg: 'bg-purple-50',
    badge: 'Regra 4%',
  },
  {
    titulo: 'Pesquisa Restrita de Alunos',
    descricao: 'Busca por CPF, nome ou código exclusivo ALU-XXX com isolamento rigoroso de permissões.',
    href: '/alunos/index.html',
    icone: Users,
    tag: 'Administrativo',
    corFundo: 'from-blue-500 to-cyan-600',
    corBorda: 'border-blue-200',
    corTexto: 'text-blue-600',
    corBg: 'bg-blue-50',
    badge: '420 alunos',
  },
  {
    titulo: 'Financeiro, Contas a Pagar & Custos',
    descricao: 'Separação estrita de despesas gerais vs custos específicos de projetos (cervejadas, fornecedores).',
    href: '/financeiro/index.html',
    icone: CalendarDays,
    tag: 'Financeiro',
    corFundo: 'from-indigo-500 to-blue-700',
    corBorda: 'border-indigo-200',
    corTexto: 'text-indigo-600',
    corBg: 'bg-indigo-50',
    badge: 'R$ 1.84M',
  },
  {
    titulo: 'Relatórios & Inadimplência Temporal',
    descricao: 'Visão histórica no fechamento do período vs posição atualizada hoje das pendências.',
    href: '/relatorios/index.html',
    icone: FileBarChart2,
    tag: 'Gerencial',
    corFundo: 'from-rose-500 to-pink-600',
    corBorda: 'border-rose-200',
    corTexto: 'text-rose-600',
    corBg: 'bg-rose-50',
    badge: 'Tempo Real',
  },
  {
    titulo: 'Campanhas, E-mail & WhatsApp',
    descricao: 'Fila de disparos com ritmo seguro e cancelamento instantâneo se a parcela foi quitada.',
    href: '/campanhas/index.html',
    icone: Megaphone,
    tag: 'Comunicação',
    corFundo: 'from-cyan-500 to-teal-500',
    corBorda: 'border-cyan-200',
    corTexto: 'text-cyan-600',
    corBg: 'bg-cyan-50',
    badge: 'WhatsApp On',
  },
  {
    titulo: 'Portal do Aluno (App)',
    descricao: 'Área do formando para consulta de boletos, código PIX, contrato assinado e convites extras.',
    href: '/app-aluno/index.html',
    icone: Smartphone,
    tag: 'Alunos',
    corFundo: 'from-violet-500 to-purple-600',
    corBorda: 'border-violet-200',
    corTexto: 'text-violet-600',
    corBg: 'bg-violet-50',
    badge: 'App Aluno',
  },
  {
    titulo: 'Site Institucional On Agência',
    descricao: 'Landing page oficial com fotos dos eventos, portfólio de formaturas e captação de novas comissões.',
    href: '/',
    icone: Globe,
    tag: 'Institucional',
    corFundo: 'from-slate-700 to-slate-900',
    corBorda: 'border-slate-300',
    corTexto: 'text-slate-700',
    corBg: 'bg-slate-100',
    badge: 'Online',
  },
];

export default function SistemaPage() {
  const [busca, setBusca] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState<'7D' | '30D' | '3M' | 'ANO'>('ANO');
  const [usuarioNome, setUsuarioNome] = useState('Administrador');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem('on_usuario_logado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (parsed.nome) {
            setUsuarioNome(parsed.nome.split(' ')[0]);
          }
        }
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const modulosFiltrados = modulosCompletos.filter((m) =>
    m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    m.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    m.tag.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Flutuante Roxa com Relevo Tátil */}
      <Sidebar paginaAtiva="dashboard" />

      {/* Conteúdo Principal Direito */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Barra Superior / Header do Dashboard */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-[0_4px_12px_rgba(124,58,237,0.12),0_2px_0_0_#EDE9FE] border border-purple-100 flex items-center justify-center shrink-0">
              <img
                src="/images/logo-on-agencia.png"
                alt="ON Agência Oficial"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Olá, {usuarioNome} 👋
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  Ambiente Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Painel Geral de Gestão • ON Agência de Eventos & Formaturas
              </p>
            </div>
          </div>

          {/* Campo de Busca Tátil e Ações Rápidas */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar módulo ou turma..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#F4F6FB] text-slate-800 placeholder-slate-400 text-xs rounded-2xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition"
              />
            </div>

            {/* Botão de Atalho Rápido Tátil 3D Vibrante */}
            <a
              href="/crm/index.html"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0 cursor-pointer"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Turma</span>
            </a>
          </div>
        </header>

        {/* =========================================================================
            FLOATING CAPSULE ISLAND DOCK (ESTILO REFERÊNCIA IMAGEM 2)
            ========================================================================= */}
        <div className="mb-6 flex justify-center">
          <div className="backdrop-blur-xl bg-white/90 border border-white/90 shadow-[0_12px_32px_rgba(79,70,229,0.08),0_1px_3px_rgba(0,0,0,0.04)] rounded-full px-3 sm:px-5 py-2 flex items-center justify-between sm:justify-center gap-1.5 sm:gap-4 md:gap-5 overflow-x-auto max-w-full">
            <a
              href="/crm/index.html"
              className="bg-white text-slate-900 rounded-full px-4 py-1.5 font-bold text-xs flex items-center gap-2 shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-slate-100 hover:translate-y-[-1px] transition shrink-0"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>CRM Turmas</span>
            </a>
            <a
              href="/projetos/index.html"
              className="text-slate-600 hover:text-slate-950 font-semibold text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
            >
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Projetos</span>
            </a>
            <a
              href="/fotos/index.html"
              className="text-slate-600 hover:text-slate-950 font-semibold text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>Vendas de Álbuns</span>
            </a>
            <a
              href="/comissoes/index.html"
              className="text-slate-600 hover:text-slate-950 font-semibold text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
            >
              <BadgePercent className="w-3.5 h-3.5 text-slate-400" />
              <span>Comissões</span>
            </a>
            <a
              href="/financeiro/index.html"
              className="text-slate-600 hover:text-slate-950 font-semibold text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
            >
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <span>Financeiro</span>
            </a>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block shrink-0" />
            <a
              href="/campanhas/index.html"
              className="text-slate-600 hover:text-slate-950 font-semibold text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
            >
              <Megaphone className="w-3.5 h-3.5 text-slate-400" />
              <span>Campanhas</span>
            </a>
            <div className="w-7 h-7 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 relative shrink-0">
              <Bell className="w-3.5 h-3.5" />
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-0.5 right-0.5 ring-2 ring-white" />
            </div>
            <a
              href="/sistema/index.html"
              title="ON Agência Oficial"
              className="w-7 h-7 rounded-full ring-2 ring-purple-200 overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs hover:scale-110 transition"
            >
              <img
                src="/images/logo-on-agencia.png"
                alt="ON Agência Oficial"
                className="w-full h-full object-contain"
              />
            </a>
          </div>
        </div>

        {/* =========================================================================
            CARD HERO VISUAL: GRÁFICO DE RECEITA & ARRECADAÇÃO (ESTILO MODELOS 1 & 2)
            ========================================================================= */}
        <section className="bg-white rounded-[28px] p-6 lg:p-7 shadow-[0_12px_32px_rgba(0,0,0,0.03)] border border-slate-100 mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-purple-50 text-[#4F39F6] border border-purple-100">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Desempenho Geral de Arrecadação 2026
                  </h2>
                  <p className="text-xs text-slate-500">
                    Acompanhamento de mensalidades de formandos e projeção contratual
                  </p>
                </div>
              </div>
            </div>

            {/* Filtros em Pílula com Relevo Tátil */}
            <div className="flex items-center space-x-1.5 bg-[#F4F6FB] p-1.5 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
              {(['7D', '30D', '3M', 'ANO'] as const).map((periodo) => (
                <button
                  key={periodo}
                  onClick={() => setPeriodoFiltro(periodo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    periodoFiltro === periodo
                      ? 'bg-white text-[#4F39F6] shadow-[0_3px_0_0_#D1D5DB,0_4px_8px_rgba(0,0,0,0.06)]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {periodo === 'ANO' ? 'Ano 2026' : periodo}
                </button>
              ))}
            </div>
          </div>

          {/* Destaque Numérico Superior */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-[#FAF7FF] rounded-2xl p-4 border border-purple-100">
              <span className="text-xs font-medium text-purple-700">Total Previsto em Contratos</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-[#4F39F6] tracking-tight">
                  R$ 1.842.500,00
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  +24.8%
                </span>
              </div>
            </div>

            <div className="bg-[#F0FDF4] rounded-2xl p-4 border border-emerald-100">
              <span className="text-xs font-medium text-emerald-700">Parcelas Liquidadas (Receita Real)</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-emerald-700 tracking-tight">
                  R$ 1.250.000,00
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  67.8% pago
                </span>
              </div>
            </div>

            <div className="bg-[#FFFBEB] rounded-2xl p-4 border border-amber-100">
              <span className="text-xs font-medium text-amber-800">Saldo a Arrecadar (Em Aberto)</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl lg:text-3xl font-extrabold text-amber-900 tracking-tight">
                  R$ 592.500,00
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  32.2% saldo
                </span>
              </div>
            </div>
          </div>

          {/* Curva Visual de Gráfico SVG em Degradê Violeta */}
          <div className="relative h-48 sm:h-56 w-full pt-4">
            {/* Grade de Linhas Suaves */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div className="border-b border-slate-200 w-full"></div>
            </div>

            {/* Gráfico de Onda Suave Estilo Neumórfico / 3D */}
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F39F6" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B26BF" />
                  <stop offset="40%" stopColor="#6366F1" />
                  <stop offset="80%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366F1" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Área Preenchida com Degradê */}
              <path
                d="M 0,240 L 0,180 C 150,140 250,210 400,130 C 550,60 680,160 820,90 C 920,40 960,60 1000,30 L 1000,240 Z"
                fill="url(#waveGradient)"
              />

              {/* Linha Curva de Destaque */}
              <path
                d="M 0,180 C 150,140 250,210 400,130 C 550,60 680,160 820,90 C 920,40 960,60 1000,30"
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="4.5"
                filter="url(#glow)"
              />

              {/* Pontos de Destaque Flutuantes */}
              <circle cx="400" cy="130" r="6" fill="#FFFFFF" stroke="#4F39F6" strokeWidth="4" />
              <circle cx="820" cy="90" r="6" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="4" />
              <circle cx="1000" cy="30" r="7" fill="#FFFFFF" stroke="#A855F7" strokeWidth="5" />
            </svg>

            {/* Meses do Eixo X */}
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-1">
              <span>Jan</span>
              <span>Mar</span>
              <span>Mai</span>
              <span>Jul</span>
              <span>Set</span>
              <span>Nov</span>
              <span className="text-[#4F39F6] font-extrabold">Dez (Hoje)</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            GRADE DE 4 CARDS DE MÉTRICAS TÁTEIS COM ÍCONES 3D ELEVADOS
            ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 pt-4">
          {/* Card 1: CRM & Oportunidades */}
          <div className="group relative bg-white rounded-[26px] p-5 pt-8 shadow-[0_10px_24px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="absolute -top-5 left-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-[0_8px_16px_rgba(245,158,11,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <Kanban className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  CRM & Funil
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                  Ativo
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                14 Turmas
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                5 turmas aguardando 1ª adesão de formando para virar projeto definitivo.
              </p>
            </div>
            <a
              href="/crm/index.html"
              className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700 transition"
            >
              <span>Ver Funil Comercial</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 2: Projetos Confirmados */}
          <div className="group relative bg-white rounded-[26px] p-5 pt-8 shadow-[0_10px_24px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="absolute -top-5 left-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-[0_8px_16px_rgba(16,185,129,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Projetos
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  8 Turmas
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                8 Bailes
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                R$ 1.84M em contratos com controle de parcelas, colações e eventos.
              </p>
            </div>
            <a
              href="/projetos/index.html"
              className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700 transition"
            >
              <span>Gerenciar Projetos</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 3: Comissões Regra 4% */}
          <div className="group relative bg-white rounded-[26px] p-5 pt-8 shadow-[0_10px_24px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="absolute -top-5 left-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-[0_8px_16px_rgba(147,51,234,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <BadgePercent className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Comissões
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                  Regra 4%
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                R$ 36.850,00
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Livro-razão imutável, garantia de 3 parcelas e estorno automático.
              </p>
            </div>
            <a
              href="/comissoes/index.html"
              className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:text-purple-700 transition"
            >
              <span>Abrir Livro-Razão</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 4: Alunos Cadastrados */}
          <div className="group relative bg-white rounded-[26px] p-5 pt-8 shadow-[0_10px_24px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="absolute -top-5 left-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-[0_8px_16px_rgba(6,182,212,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Formandos
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  96.4% Adimplentes
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                420 Alunos
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Busca restrita por CPF, nome e código único ALU-XXX com total segurança.
              </p>
            </div>
            <a
              href="/alunos/index.html"
              className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700 transition"
            >
              <span>Consultar Alunos</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>

        {/* =========================================================================
            TODOS OS MÓDULOS DO SISTEMA COM DESIGN TÁTIL ARREDONDADO
            ========================================================================= */}
        <section className="mt-4 mb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                Módulos & Ferramentas do Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Clique nos cartões abaixo para acessar diretamente qualquer setor
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              {modulosFiltrados.length} módulos disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {modulosFiltrados.map((mod) => {
              const Icon = mod.icone;
              return (
                <a
                  key={mod.href}
                  href={mod.href}
                  className="group relative bg-white rounded-[24px] p-6 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] border border-slate-100 hover:border-slate-200 transition-all duration-200 flex flex-col justify-between hover:translate-y-[-2px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {/* Ícone com Botão Relevo */}
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mod.corFundo} text-white shadow-[0_6px_14px_rgba(0,0,0,0.15)] flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                        {mod.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#4F39F6] transition-colors">
                      {mod.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {mod.descricao}
                    </p>
                  </div>

                  {/* Botão de Acesso Tátil com Altura 3D */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#4F39F6] transition">
                      Acessar Módulo
                    </span>
                    <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-[#4F39F6] text-slate-600 group-hover:text-white shadow-[0_3px_0_0_#CBD5E1] group-hover:shadow-[0_3px_0_0_#3824B0] group-hover:translate-y-[-1px] group-active:translate-y-[1px] transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
