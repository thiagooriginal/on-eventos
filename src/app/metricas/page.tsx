'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Users,
  Clock,
  MousePointerClick,
  TrendingUp,
  Sparkles,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Flame,
  Zap,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
  Share2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Layers,
  MapPin,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import {
  getTelemetryData,
  recordClick,
  simulateTestClick,
  TelemetryData,
  ClickEvent,
} from '@/lib/telemetry';

export default function MetricasPage() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | '7dias' | '30dias' | 'tudo'>('30dias');
  const [simulando, setSimulando] = useState(false);
  const [sucessoSimulacao, setSucessoSimulacao] = useState<string | null>(null);

  const carregarDados = () => {
    const telemetria = getTelemetryData();
    setData(telemetria);
  };

  useEffect(() => {
    carregarDados();
    // Atualiza automaticamente a cada 4 segundos para capturar novos acessos e cliques
    const interval = setInterval(() => {
      carregarDados();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimularClique = () => {
    setSimulando(true);
    const novoClique = simulateTestClick();
    carregarDados();
    setSucessoSimulacao(`Clique registrado: "${novoClique.elemento}" em ${novoClique.secao}`);
    setTimeout(() => {
      setSimulando(false);
      setSucessoSimulacao(null);
    }, 3500);
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}m ${segs < 10 ? '0' : ''}${segs}s`;
  };

  const formatarHorario = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return `Há ${diffSecs}s`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `Há ${diffMins} min`;
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recentemente';
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-purple-700 font-bold">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Carregando métricas e telemetria do site...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral */}
      <Sidebar paginaAtiva="metricas" />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Moderno */}
        <header className="bg-white/90 backdrop-blur-md rounded-[28px] p-5 lg:px-7 lg:py-5 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-[0_6px_14px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Métricas & Telemetria do Site
                </h1>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Rastreamento em tempo real: visitantes únicos, tempo de navegação, volume de cliques e mapa de onde clicaram.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            {/* Seletor de Período */}
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
              <button
                onClick={() => setFiltroPeriodo('hoje')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === 'hoje' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Hoje
              </button>
              <button
                onClick={() => setFiltroPeriodo('7dias')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === '7dias' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setFiltroPeriodo('30dias')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === '30dias' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                30 Dias
              </button>
              <button
                onClick={() => setFiltroPeriodo('tudo')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === 'tudo' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Geral
              </button>
            </div>

            {/* Botão Simular Clique de Teste */}
            <button
              onClick={handleSimularClique}
              disabled={simulando}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2 rounded-2xl shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{simulando ? 'Registrando...' : 'Simular Clique ao Vivo'}</span>
            </button>

            {/* Link para o site real para testar */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-2xs hover:bg-slate-50 transition"
              title="Abrir o site institucional em nova aba para navegar e gerar cliques reais"
            >
              <span>Abrir Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </header>

        {/* Notificação Flutuante de Simulação */}
        {sucessoSimulacao && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-emerald-800 font-bold shadow-2xs animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{sucessoSimulacao}</span>
            </div>
            <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full text-emerald-900">
              Atualizado Agora
            </span>
          </div>
        )}

        {/* 4 CARDS PRINCIPAIS DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 1. QUANTAS PESSOAS ENTRARAM NO SITE */}
          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100 hover:translate-y-[-2px] transition duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Visitantes do Site
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {data.totalVisitantes.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +24%
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{data.visitantesUnicos.toLocaleString('pt-BR')} únicos</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {data.visitantesAtivosAgora} online agora
              </span>
            </div>
          </div>

          {/* 2. TEMPO DE NAVEGAÇÃO */}
          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100 hover:translate-y-[-2px] transition duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tempo Médio Navegação
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {formatarTempo(data.tempoMedioSegundos)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +18%
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Alta retenção</span>
              <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Engajamento Ótimo
              </span>
            </div>
          </div>

          {/* 3. QUANTOS CLIQUES */}
          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100 hover:translate-y-[-2px] transition duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Quantos Cliques Feitos
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <MousePointerClick className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {data.totalCliques.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-amber-600 flex items-center">
                <Flame className="w-3.5 h-3.5" /> Ativo
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Média de cliques</span>
              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {data.taxaCliquesPorSessao} cliques/sessão
              </span>
            </div>
          </div>

          {/* 4. CONVERSÕES EM ORÇAMENTO & WHATSAPP */}
          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100 hover:translate-y-[-2px] transition duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Conversão em Propostas
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                18.4%
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +5.2%
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Orçamentos + WhatsApp</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                706 contatos diretos
              </span>
            </div>
          </div>
        </div>

        {/* GRID CENTRAL: ONDE CLICARAM + MAPA VISUAL DE CALOR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* RANKING: ONDE CLICARAM (2 COLUNAS) */}
          <div className="lg:col-span-2 bg-white rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-slate-900">
                    Onde Clicaram? (Ranking de Elementos Mais Clicados)
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Mapeamento Completo
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Identificação precisa dos botões, links, cards e mídias que receberam mais interações no site.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                {data.heatmaps.length} elementos rastreados
              </span>
            </div>

            <div className="space-y-3.5">
              {data.heatmaps.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-purple-50/40 border border-slate-100 hover:border-purple-200 transition duration-150"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.nome}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Seção: <span className="font-semibold text-slate-700">{item.secao}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 text-right">
                      <div>
                        <span className="text-xs font-black text-slate-900">
                          {item.cliques.toLocaleString('pt-BR')} cliques
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {item.porcentagem}% do total
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.taxaConversao} conv.
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                          : idx === 1
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : idx === 2
                          ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600'
                          : idx === 3
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, item.porcentagem * 3.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAPA VISUAL ESQUEMÁTICO DE CALOR (HEATMAP POR SEÇÃO) */}
          <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-black text-slate-900">
                    Mapa de Calor do Site
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Heatmap
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Concentração percentual de cliques nas áreas da página inicial:
              </p>

              {/* Blocos Esquemáticos da Página */}
              <div className="space-y-2.5">
                {/* 1. Header & WhatsApp */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">1. Header Superior & WhatsApp</p>
                      <p className="text-[10px] text-amber-800">Menu, Logo e Botão WhatsApp</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 bg-white/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    23.5% dos cliques
                  </span>
                </div>

                {/* 2. Hero CTA (Zona Mais Quente) */}
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-400 flex items-center justify-between shadow-[0_4px_12px_rgba(244,63,94,0.15)]">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
                    <div>
                      <p className="text-xs font-black text-rose-950">2. Hero Banner & Orçamento</p>
                      <p className="text-[10px] text-rose-800 font-semibold">🔥 Zona Mais Quente do Site</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white bg-rose-600 px-2.5 py-1 rounded-xl shadow-xs">
                    38.2% dos cliques
                  </span>
                </div>

                {/* 3. Venda de Álbuns & Vídeos */}
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <div>
                      <p className="text-xs font-bold text-purple-950">3. Álbuns, Brindes & Vídeos</p>
                      <p className="text-[10px] text-purple-800">Aftermovie e Mostruário</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-white/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    21.8% dos cliques
                  </span>
                </div>

                {/* 4. Galeria de Fotos & Cenografia */}
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-xs font-bold text-blue-950">4. Galeria & Cenografia</p>
                      <p className="text-[10px] text-blue-800">Espaços e Decorações</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-white/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    9.6% dos cliques
                  </span>
                </div>

                {/* 5. Depoimentos & Rodapé */}
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">5. Depoimentos & Rodapé</p>
                      <p className="text-[10px] text-slate-600">Comissões e Redes Sociais</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700 bg-white/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    6.9% dos cliques
                  </span>
                </div>
              </div>
            </div>

            {/* Legenda de Intensidade */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1" /> Alta Densidade
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1" /> Média
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-1" /> Regular
              </span>
            </div>
          </div>
        </div>

        {/* FEED AO VIVO DE CLIQUES + DISPOSITIVOS E ORIGENS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TABELA: FEED DE CLIQUES EM TEMPO REAL (2 COLUNAS) */}
          <div className="lg:col-span-2 bg-white rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MousePointerClick className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  Feed de Cliques em Tempo Real (Live Clickstream)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Últimos acessos gravados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Elemento Clicado</th>
                    <th className="pb-3 px-2">Seção & Página</th>
                    <th className="pb-3 px-2">Tempo Navegado</th>
                    <th className="pb-3 px-2">Dispositivo / Local</th>
                    <th className="pb-3 px-2 text-right">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data.ultimosCliques.slice(0, 7).map((clk) => (
                    <tr key={clk.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 font-bold text-slate-900 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="truncate max-w-[210px]" title={clk.elemento}>
                          {clk.elemento}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {clk.secao}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-600">
                        {clk.tempoNaPagina}s na página
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-[11px]">
                        <div>{clk.dispositivo}</div>
                        <div className="text-[10px] text-slate-400">{clk.cidade}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-indigo-600 text-[11px]">
                        {formatarHorario(clk.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DISPOSITIVOS & ORIGENS DE TRÁFEGO (1 COLUNA) */}
          <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-black text-slate-900">
                    Dispositivos & Origens
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Analytics
                </span>
              </div>

              {/* Distribuição por Dispositivo */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-700 mb-3">
                  Aparelho do Visitante:
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center text-slate-700">
                        <Smartphone className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Mobile (Celulares)
                      </span>
                      <span className="text-purple-700">{data.dispositivos.mobile}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${data.dispositivos.mobile}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center text-slate-700">
                        <Monitor className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Desktop (Computadores)
                      </span>
                      <span className="text-blue-700">{data.dispositivos.desktop}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${data.dispositivos.desktop}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center text-slate-700">
                        <Tablet className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Tablets & iPads
                      </span>
                      <span className="text-teal-700">{data.dispositivos.tablet}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${data.dispositivos.tablet}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Origens de Tráfego */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2.5">
                  De onde vieram os visitantes:
                </p>
                <div className="space-y-2 text-xs">
                  {data.origensTrafego.map((origem) => (
                    <div
                      key={origem.origem}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700 truncate mr-2">
                        {origem.origem}
                      </span>
                      <span className="font-black text-slate-900 shrink-0">
                        {origem.porcentagem}% ({origem.visitas})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                Telemetria integrada via script no site institucional e álbum de fotos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
