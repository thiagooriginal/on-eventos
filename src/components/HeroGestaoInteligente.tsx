'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FolderKanban,
  Coins,
  CreditCard,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function HeroGestaoInteligente() {
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);

  return (
    <section className="relative w-full bg-gradient-to-b from-white via-[#FAF9FF] to-[#F1EAFF] pt-20 sm:pt-28 pb-16 overflow-hidden border-t border-b border-purple-100 text-slate-900">
      {/* Luz ambiente e brilho radial de fundo */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[400px] pointer-events-none rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.16) 0%, rgba(217, 70, 239, 0.08) 40%, rgba(255, 255, 255, 0) 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* BADGE PÍLULA NOVIDADE */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-6 text-xs text-slate-700 transition cursor-pointer">
          <span className="bg-white text-slate-900 font-bold px-2.5 py-0.5 rounded-full shadow-2xs border border-slate-200/50 text-[11px]">
            Novidade
          </span>
          <span className="font-semibold text-slate-700">Gestão de Turmas v1.0</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* TÍTULO PRINCIPAL EDITORIAL */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
          Gestão Inteligente de <br />
          <span>Formaturas & Eventos</span>
        </h2>

        {/* SUBTÍTULO */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Ganhe clareza e controle absoluto sobre suas turmas e comissões com a ON Eventos. Nosso dashboard oferece visibilidade total.
        </p>

        {/* BOTÕES TÁTEIS COM RELEVO 3D */}
        <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          <a
            href="#servicos"
            className="px-6 py-3 rounded-full bg-white text-slate-800 font-bold text-xs sm:text-sm border border-slate-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.05),0_2px_0_0_#E2E8F0] hover:bg-slate-50 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1.5"
          >
            <span>Saiba Mais</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </a>

          <a
            href="/login/index.html"
            className="px-7 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] text-white font-bold text-xs sm:text-sm shadow-[0_10px_25px_-4px_rgba(124,58,237,0.45),0_3px_0_0_#4C1D95] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1.5"
          >
            <span>Começar Agora</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* =========================================================================
            ANEL METÁLICO IRIDESCENTE 3D (FIEL À REFERÊNCIA VISUAL 2)
           ========================================================================= */}
        <div className="relative mt-8 sm:mt-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-[840px] h-[190px] sm:h-[260px] md:h-[300px] overflow-hidden relative flex items-end justify-center">
            {/* SVG Anel Metálico Toroidal em Degradê Iridescente Violeta/Cromo */}
            <svg
              className="w-[720px] sm:w-[900px] md:w-[1040px] max-w-none h-auto -mb-1 select-none pointer-events-none drop-shadow-[0_15px_35px_rgba(139,92,246,0.35)]"
              viewBox="0 0 1000 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Degradê Cromado e Iridescente do Corpo Principal do Anel */}
                <linearGradient id="ringIridescent" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#432874" />
                  <stop offset="12%" stopColor="#8B5CF6" />
                  <stop offset="25%" stopColor="#D8B4FE" />
                  <stop offset="38%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#C084FC" />
                  <stop offset="62%" stopColor="#F472B6" />
                  <stop offset="75%" stopColor="#E0E7FF" />
                  <stop offset="88%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#311956" />
                </linearGradient>

                {/* Degradê da Borda Externa Metálica com Brilho Cromado */}
                <linearGradient id="ringHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                  <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#E9D5FF" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.4" />
                </linearGradient>

                {/* Sombra Interna Profunda para Volume 3D */}
                <radialGradient id="ringCoreShadow" cx="50%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                  <stop offset="65%" stopColor="#9333EA" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2E1065" stopOpacity="0.8" />
                </radialGradient>

                {/* Brilho Especular Refletivo Fino */}
                <filter id="ringGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Arco Sombra de Apoio */}
              <ellipse
                cx="500"
                cy="440"
                rx="420"
                ry="240"
                stroke="#6B21A8"
                strokeWidth="48"
                strokeOpacity="0.15"
                filter="url(#ringGlow)"
              />

              {/* Corpo Principal do Arco Metálico */}
              <ellipse
                cx="500"
                cy="440"
                rx="410"
                ry="230"
                stroke="url(#ringIridescent)"
                strokeWidth="38"
                strokeLinecap="round"
              />

              {/* Filete Cromado Superior (Specular Reflection Line) */}
              <ellipse
                cx="500"
                cy="436"
                rx="404"
                ry="226"
                stroke="url(#ringHighlight)"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Segundo Filete Interno Metálico */}
              <ellipse
                cx="500"
                cy="444"
                rx="416"
                ry="234"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeOpacity="0.75"
              />

              {/* Reflexos Cromados Finais na Crista */}
              <ellipse
                cx="500"
                cy="434"
                rx="398"
                ry="220"
                stroke="url(#ringHighlight)"
                strokeWidth="2"
                strokeOpacity="0.6"
              />
            </svg>
          </div>

          {/* =========================================================================
              FLOATING GLASS CAPSULE DOCK (CÁPSULA DE NAVEGAÇÃO FLUTUANTE)
             ========================================================================= */}
          <div className="relative -mt-10 sm:-mt-14 z-30 max-w-full px-2 sm:px-4">
            <div className="backdrop-blur-xl bg-white/80 border border-white/90 shadow-[0_20px_50px_rgba(79,70,229,0.16),0_1px_3px_rgba(0,0,0,0.06)] rounded-full px-3 sm:px-5 py-2.5 flex items-center justify-between sm:justify-center gap-1.5 sm:gap-4 md:gap-5 overflow-x-auto max-w-[95vw] no-scrollbar">
              {/* ITEM 1: CRM Turmas (Ativo com Relevo Tátil) */}
              <a
                href="/crm/index.html"
                className="bg-white text-slate-900 rounded-full px-3.5 sm:px-4 py-2 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_3px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-100 hover:translate-y-[-1px] transition shrink-0"
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span>CRM Turmas</span>
              </a>

              {/* ITEM 2: Projetos */}
              <a
                href="/projetos/index.html"
                className="text-slate-700 hover:text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
              >
                <FolderKanban className="w-4 h-4 text-slate-400" />
                <span>Projetos</span>
              </a>

              {/* ITEM 3: Comissões */}
              <a
                href="/comissoes/index.html"
                className="text-slate-700 hover:text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
              >
                <Coins className="w-4 h-4 text-slate-400" />
                <span>Comissões</span>
              </a>

              {/* ITEM 4: Financeiro */}
              <a
                href="/financeiro/index.html"
                className="text-slate-700 hover:text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/60 transition shrink-0"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Financeiro</span>
              </a>

              {/* Divisor sutil */}
              <div className="h-5 w-[1px] bg-slate-200 hidden sm:block shrink-0" />

              {/* Sino Notificações Interativo */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setNotificacoesAbertas(!notificacoesAbertas)}
                  className="w-9 h-9 rounded-full bg-white/90 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-white transition relative cursor-pointer"
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
                </button>

                {/* Dropdown de Alertas do Sino */}
                {notificacoesAbertas && (
                  <div className="absolute right-0 bottom-12 w-64 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-left z-50 text-xs">
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Novas Atualizações
                    </p>
                    <p className="text-slate-500 text-[11px] leading-snug">
                      Turma <strong>Direito Mackenzie 2027.1</strong> avançou para Reunião de Representante.
                    </p>
                  </div>
                )}
              </div>

              {/* Avatar do Usuário */}
              <a
                href="/sistema/index.html"
                title="Acessar Painel do Usuário"
                className="w-9 h-9 rounded-full ring-2 ring-white border border-purple-200 overflow-hidden bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0 hover:scale-105 transition"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                  alt="Perfil Usuário"
                  className="w-full h-full object-cover"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
