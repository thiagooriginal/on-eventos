'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  Lock,
  Send,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Sparkles,
  Award,
  PartyPopper,
  Music,
  UtensilsCrossed,
  Wine,
  Camera,
  Layers,
  ChevronRight,
  GraduationCap,
  Play,
  Star,
  Quote,
  Video,
} from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "w-4 h-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function SiteInstitucionalPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const abrirVideo = (url: string) => {
    setVideoModalUrl(url);
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('on-video-modal');
      const video = document.getElementById('on-active-video-player') as HTMLVideoElement | null;
      if (modal) {
        modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto', 'flex');
      }
      if (video) {
        if (!video.src.endsWith(url)) {
          video.src = url;
        }
        const p = video.play();
        if (p !== undefined) {
          p.catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      }
    }
  };

  const fecharVideo = () => {
    setVideoModalUrl(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('on-video-modal');
      const video = document.getElementById('on-active-video-player') as HTMLVideoElement | null;
      if (modal) {
        modal.classList.remove('opacity-100', 'pointer-events-auto', 'flex');
        modal.classList.add('opacity-0', 'pointer-events-none', 'hidden');
      }
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
  };

  useEffect(() => {
    if (videoModalUrl && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [videoModalUrl]);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    contato: '',
    curso: '',
    faculdade: '',
    cidade: '',
    qtdAlunos: '',
    semestre: '',
    mensagem: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    try {
      const res = await fetch('/api/site-orcamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem');

      setSucesso(true);
      setForm({
        nome: '',
        email: '',
        contato: '',
        curso: '',
        faculdade: '',
        cidade: '',
        qtdAlunos: '',
        semestre: '',
        mensagem: '',
      });
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-600 selection:text-white">
      {/* =========================================================================
          1. HEADER FIXO COM EFEITO DE VIDRO, LOGO DA ON AGÊNCIA E ACESSO FORMANDO
         ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-purple-900/40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          {/* LOGO OFICIAL ON AGÊNCIA EM EVIDÊNCIA */}
          <Link href="/site" className="flex items-center space-x-3.5 group">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 transition-transform group-hover:scale-105 drop-shadow-[0_0_15px_rgba(168,85,247,0.35)]">
              <Image
                src="/images/logo-on-agencia.png"
                alt="On Agência de Eventos"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-sm sm:text-base tracking-widest text-slate-200 group-hover:text-white transition">
                ON AGÊNCIA
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-medium">
                EVENTOS & FORMATURAS
              </span>
            </div>
          </Link>

          {/* NAVEGAÇÃO DESKTOP COM EFEITO CROSS-DISSOLVE SUAVE DA ESQUERDA PARA A DIREITA */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold tracking-widest uppercase">
            <a
              href="#home"
              className="text-slate-200 hover:text-purple-400 transition"
            >
              HOME
            </a>
            <a
              href="#quemsomos"
              className="text-slate-200 hover:text-purple-400 transition"
            >
              QUEM SOMOS
            </a>
            <a
              href="#servicos"
              className="text-slate-200 hover:text-purple-400 transition"
            >
              SERVIÇOS
            </a>
            <a
              href="#on-online"
              className="text-slate-200 hover:text-purple-400 transition"
            >
              ON ONLINE
            </a>
            <a
              href="#depoimentos"
              className="text-slate-200 hover:text-purple-400 transition"
            >
              DEPOIMENTOS
            </a>
            <a
              href="#contato"
              className="text-slate-200 hover:text-purple-400 transition"
            >
              CONTATO
            </a>
          </nav>

          {/* BOTÕES NO TOPO: DESKTOP COM BOTÕES COMPLETOS, MOBILE APENAS HAMBÚRGUER LIMPO */}
          <div className="flex items-center space-x-3">
            {/* BOTÃO DE ACESSO AO SISTEMA (DESKTOP) */}
            <Link
              href="/login/"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              <span>Acesso Sistema</span>
            </Link>

            {/* ÁREA FORMANDO (DESKTOP) */}
            <Link
              href="/app-aluno/"
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-purple-500/50 hover:bg-purple-950/80 text-purple-200 hover:text-white transition shadow-sm"
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              Área Formando
            </Link>

            {/* INSTAGRAM OFICIAL DESKTOP */}
            <a
              href="https://www.instagram.com/onagenciadeeventos"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex p-2 rounded-full bg-slate-900 border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-600 transition"
              title="@onagenciadeeventos"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>

            {/* BOTÃO MOBILE HAMBÚRGUER LIMPO E DESTACADO (3 RISCOS) */}
            <button
              id="btn-menu-hamburguer"
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden p-2.5 rounded-xl bg-slate-900/90 border border-purple-700/60 text-white hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg active:scale-95 transition cursor-pointer"
            >
              {menuAberto ? <X className="w-6 h-6 text-fuchsia-400" /> : <Menu className="w-6 h-6 text-purple-200" />}
            </button>
          </div>
        </div>

        {/* OVERLAY ESCURO AO ABRIR O MENU MOBILE */}
        <div
          id="menu-mobile-overlay"
          className={`lg:hidden fixed inset-0 top-24 bg-black/85 backdrop-blur-md z-40 transition-opacity duration-200 ${
            menuAberto ? 'opacity-100 pointer-events-auto block' : 'opacity-0 pointer-events-none hidden'
          }`}
          onClick={() => setMenuAberto(false)}
        />

        {/* MENU MOBILE EXPANSÍVEL TIPO DRAWER */}
        <div
          id="menu-mobile-drawer"
          className={`lg:hidden absolute top-24 left-0 right-0 bg-slate-950 border-b-2 border-purple-600 px-6 py-6 space-y-5 shadow-2xl z-50 transition-all duration-200 ${
            menuAberto ? 'opacity-100 block' : 'opacity-0 pointer-events-none hidden'
          }`}
        >
          {/* BOTÕES DE ACESSO RÁPIDO AO SISTEMA E FORMANDO */}
          <div className="grid grid-cols-1 gap-2.5 pb-4 border-b border-purple-900/40">
            <Link
              href="/login/"
              onClick={() => setMenuAberto(false)}
              className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center shadow-xl shadow-purple-600/40"
            >
              <Lock className="w-4 h-4 mr-2" />
              ACESSAR SISTEMA INTERNO
            </Link>
            <Link
              href="/app-aluno/"
              onClick={() => setMenuAberto(false)}
              className="w-full text-center py-3 rounded-xl bg-slate-900 border border-purple-700/60 text-purple-200 text-xs font-bold uppercase tracking-wider hover:bg-purple-950 flex items-center justify-center"
            >
              <GraduationCap className="w-4 h-4 mr-2 text-purple-400" />
              PORTAL DO FORMANDO (ALUNO)
            </Link>
          </div>

          {/* LINKS DE NAVEGAÇÃO DA PÁGINA */}
          <nav className="flex flex-col space-y-3 text-sm font-bold uppercase tracking-wider">
            <a
              href="#home"
              onClick={() => setMenuAberto(false)}
              className="text-slate-200 hover:text-purple-400 py-1.5 flex items-center justify-between border-b border-slate-900"
            >
              <span>HOME</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </a>
            <a
              href="#quemsomos"
              onClick={() => setMenuAberto(false)}
              className="text-slate-200 hover:text-purple-400 py-1.5 flex items-center justify-between border-b border-slate-900"
            >
              <span>QUEM SOMOS</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </a>
            <a
              href="#servicos"
              onClick={() => setMenuAberto(false)}
              className="text-slate-200 hover:text-purple-400 py-1.5 flex items-center justify-between border-b border-slate-900"
            >
              <span>SERVIÇOS</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </a>
            <a
              href="#on-online"
              onClick={() => setMenuAberto(false)}
              className="text-slate-200 hover:text-purple-400 py-1.5 flex items-center justify-between border-b border-slate-900"
            >
              <span>ON ONLINE</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </a>
            <a
              href="#depoimentos"
              onClick={() => setMenuAberto(false)}
              className="text-slate-200 hover:text-purple-400 py-1.5 flex items-center justify-between border-b border-slate-900"
            >
              <span>DEPOIMENTOS EM VÍDEO</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </a>
            <a
              href="#contato"
              onClick={() => setMenuAberto(false)}
              className="text-slate-200 hover:text-purple-400 py-1.5 flex items-center justify-between"
            >
              <span>CONTATO & ORÇAMENTO</span>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </a>
          </nav>
        </div>
      </header>

      {/* =========================================================================
          2. SEÇÃO HERO: "PENSE NO SEU SONHO, E NÓS O REALIZAMOS"
         ========================================================================= */}
      <section
        id="home"
        className="relative min-h-[96vh] sm:min-h-screen pt-32 sm:pt-40 pb-12 sm:pb-24 flex flex-col justify-end sm:justify-center overflow-hidden bg-cover bg-no-repeat bg-[position:78%_15%] sm:bg-[position:right_18%]"
        style={{
          backgroundImage:
            'linear-gradient(to top, rgba(5, 2, 15, 0.98) 0%, rgba(10, 5, 25, 0.85) 45%, rgba(15, 7, 34, 0.15) 100%), url("/images/hero-formanda-vestido-vermelho-neon.jpg")',
        }}
      >
        {/* EFEITO FLASH DISCRETO: SAINDO DO CANTO SUPERIOR DIREITO SENTIDO O MEIO */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden z-2">
          {/* Foco de luz principal no canto superior direito */}
          <div
            className="absolute -top-12 -right-12 w-[650px] h-[650px] rounded-full animate-subtle-flash"
            style={{
              background: 'radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.45) 0%, rgba(232, 185, 255, 0.25) 20%, rgba(168, 85, 247, 0.12) 45%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
          {/* Feixe direcional diagonal suave cruzando em direção ao meio */}
          <div
            className="absolute top-0 right-0 w-[800px] h-[500px] animate-subtle-flash"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(216, 180, 254, 0.15) 30%, transparent 65%)',
              filter: 'blur(45px)',
              transformOrigin: 'top right',
            }}
          />
        </div>

        {/* Glow e Partículas de Fundo inspiradas na Logo On Agência */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* MARCA D'ÁGUA TIPOGRÁFICA (VISÍVEL APENAS EM TELAS MÉDIAS E GRANDES PARA NÃO POLUIR O CELULAR) */}
        <div className="hidden sm:block absolute left-4 sm:left-12 bottom-6 sm:bottom-12 select-none pointer-events-none z-0 opacity-40 overflow-hidden leading-none max-w-full">
          <p className="font-extrabold text-5xl sm:text-7xl md:text-8xl tracking-tight text-stroke-purple uppercase whitespace-nowrap">
            ÚNICA
          </p>
          <p className="font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight text-stroke-purple uppercase whitespace-nowrap mt-1">
            COMO A SUA
          </p>
          <p className="font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight text-stroke-purple uppercase whitespace-nowrap mt-1">
            FORMATURA
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full z-10 relative">
          <div className="max-w-xl sm:max-w-3xl">
            {/* TAG SUPERIOR ELEGANTE */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-purple-950/60 text-purple-200 border border-purple-700/40 mb-4 sm:mb-6 uppercase tracking-[0.18em] backdrop-blur-md shadow-lg shadow-purple-950/50">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-fuchsia-400" />
              Especialistas em Formaturas
            </div>

            {/* TIPOGRAFIA EDITORIAL LIMPA E ELEGANTE */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-4xl md:text-5xl font-light uppercase tracking-[0.18em] text-slate-100 font-sans">
                PENSE NO
              </h2>
              <h2 className="text-xl sm:text-4xl md:text-5xl font-light uppercase tracking-[0.18em] text-slate-100 font-sans">
                SEU SONHO
              </h2>
              <h1 className="text-3xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white font-sans drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] pt-1 sm:pt-2 leading-tight sm:leading-none">
                E NÓS O <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-200">
                  REALIZAMOS
                </span>
              </h1>
            </div>

            <p className="mt-4 sm:mt-6 text-xs sm:text-base text-slate-300 leading-relaxed font-light max-w-lg">
              A <strong className="text-white font-semibold">ON AGÊNCIA DE EVENTOS</strong> transforma a conquista acadêmica da sua turma em uma noite inesquecível, com alta gastronomia, open bar premium e cenografia cinematográfica.
            </p>

            {/* BOTÃO ELEGÂNTE ÚNICO E LIMPO NO CELULAR */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <a
                href="#contato"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-red-900 via-rose-900 to-purple-950 hover:from-red-800 hover:to-purple-900 text-white shadow-xl shadow-red-950/60 border border-rose-700/40 transition transform hover:-translate-y-0.5 text-center flex items-center justify-center group"
              >
                <span>ORÇAMENTO DE FORMATURA</span>
                <ChevronRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1 text-rose-300" />
              </a>

              <a
                href="https://wa.me/5511951364159?text=Ol%C3%A1!%20Gostaria%20de%20um%20or%C3%A7amento%20para%20a%20nossa%20formatura."
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-slate-900/80 hover:bg-slate-800/90 border border-purple-800/50 text-slate-200 hover:text-white transition text-center items-center justify-center backdrop-blur-md shadow-md"
              >
                <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                (11) 95136-4159
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SEÇÃO QUEM SOMOS
         ========================================================================= */}
      <section id="quemsomos" className="py-24 bg-slate-900 border-t border-purple-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Imagem Institucional */}
            <div className="relative rounded-2xl overflow-hidden border border-purple-800/40 shadow-2xl group">
              <div className="aspect-w-16 aspect-h-10 w-full h-[430px] relative">
                <Image
                  src="/images/quem-somos-baile.jpg"
                  alt="Baile de Gala Realizado - On Agência de Eventos"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700 brightness-95 contrast-105 saturate-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-purple-900/10" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold block drop-shadow-md">
                  PRODUÇÃO EXCLUSIVA & CENOGRAFIA
                </span>
                <span className="text-xl font-bold text-white drop-shadow-md">
                  Grandes bailes de gala que marcam gerações
                </span>
              </div>
            </div>

            {/* Texto Descritivo */}
            <div className="space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold">
                CONHEÇA A ON AGÊNCIA
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                A realizadora oficial <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
                  dos melhores bailes e colações
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Trabalhando de forma responsável, sofisticada e moderna, a <strong>ON AGÊNCIA DE EVENTOS</strong> atua no segmento de formaturas universitárias e eventos corporativos com total dedicação à realização de sonhos.
              </p>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Nossa meta é transformar a jornada da formatura em um período inesquecível: desde os primeiros contatos comerciais, pré-eventos e cervejadas de integração, até a apoteose do Baile de Gala e a emoção solene da Colação de Grau. Não medimos esforços para que cada detalhe se torne realidade!
              </p>

              <div className="pt-4 grid grid-cols-2 gap-4 border-t border-purple-900/40">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-900/30">
                  <span className="text-2xl font-black text-fuchsia-400 block font-mono">100%</span>
                  <span className="text-xs text-slate-400">Dedicação e Atendimento Humanizado</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-900/30">
                  <span className="text-2xl font-black text-purple-400 block font-mono">ON ONLINE</span>
                  <span className="text-xs text-slate-400">Portal do Formando & Gestão Transparente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Infraestrutura: Sede Comercial & Pré-Eventos */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-950 rounded-2xl border border-purple-900/40 p-6 flex flex-col justify-between hover:border-purple-600 transition group shadow-xl">
              <div>
                <div className="h-64 sm:h-72 w-full relative rounded-xl overflow-hidden mb-4 border border-purple-900/30">
                  <Image
                    src="/images/sede-comercial-on.jpg"
                    alt="Sede Comercial Oficial - On Agência de Eventos - Rua Rodovalho Junior 281 Penha"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-white">Sede Comercial</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Para maior comodidade dos formandos e comissões, nossa sede conta com toda a infraestrutura necessária para planejar e organizar cada evento. Localizada na Rua Rodovalho Junior, 281 - Penha de França, São Paulo.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-purple-900/40 p-6 flex flex-col justify-between hover:border-purple-600 transition group shadow-xl">
              <div>
                <div className="h-64 sm:h-72 w-full relative rounded-xl overflow-hidden mb-4 border border-purple-900/30">
                  <Image
                    src="/images/pre-evento-copo-on.jpg"
                    alt="Pré-Eventos, Festas e Cervejadas - On Agência"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-white">Pré-Eventos & Cervejadas</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Infraestrutura planejada para os momentos pré-formatura da turma: cervejadas, churrascos, festas na piscina, provas de beca e copos personalizados exclusivos para integrar todos os alunos antes da grande noite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SEÇÃO SERVIÇOS: BAILE DE FORMATURA & ITENS DO EVENTO
         ========================================================================= */}
      <section id="servicos" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header do Serviço 1: Baile */}
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold">
              PRINCIPAIS SERVIÇOS
            </span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mt-2">
              Baile de <br />
              <span className="px-3 py-1 bg-gradient-to-r from-purple-700 to-fuchsia-700 rounded-lg inline-block text-white shadow-lg">
                FORMATURA
              </span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-6 leading-relaxed">
              É o evento que marca profundamente a vida de cada acadêmico como uma noite de muita alegria, comemoração e encerramento de um ciclo vitorioso. Trazemos à tona todas as melhores sensações da turma através de eventos inovadores, lindos e perfeitos em todos os aspectos.
            </p>
          </div>

          {/* Grid de 4 Banners de Destaque: OPEN FOOD, OPEN BAR, DECORAÇÃO, CENOGRAFIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Banner 1: Open Food */}
            <div className="group relative rounded-2xl overflow-hidden border border-purple-900/40 h-80 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop"
                alt="Open Food On Agência"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <UtensilsCrossed className="w-8 h-8 text-fuchsia-400 mb-2" />
                <h3 className="text-2xl font-black uppercase text-white tracking-wide">
                  OPEN <br /> FOOD
                </h3>
                <p className="text-2xs text-slate-300 mt-1">Gastronomia requintada e finger foods</p>
              </div>
            </div>

            {/* Banner 2: Open Bar */}
            <div className="group relative rounded-2xl overflow-hidden border border-purple-900/40 h-80 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop"
                alt="Open Bar On Agência"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Wine className="w-8 h-8 text-purple-400 mb-2" />
                <h3 className="text-2xl font-black uppercase text-white tracking-wide">
                  OPEN <br /> BAR
                </h3>
                <p className="text-2xs text-slate-300 mt-1">Drinks autorais, chopp e bartenders</p>
              </div>
            </div>

            {/* Banner 3: Decoração Exclusiva */}
            <div className="group relative rounded-2xl overflow-hidden border border-purple-900/40 h-80 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop"
                alt="Decoração Exclusiva On Agência"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Sparkles className="w-8 h-8 text-fuchsia-400 mb-2" />
                <h3 className="text-2xl font-black uppercase text-white tracking-wide">
                  DECORAÇÃO <br /> EXCLUSIVA
                </h3>
                <p className="text-2xs text-slate-300 mt-1">Lounges instagramáveis e mesas nobres</p>
              </div>
            </div>

            {/* Banner 4: Cenografia */}
            <div className="group relative rounded-2xl overflow-hidden border border-purple-900/40 h-80 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop"
                alt="Cenografia On Agência"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <Layers className="w-8 h-8 text-indigo-400 mb-2" />
                <h3 className="text-2xl font-black uppercase text-white tracking-wide">
                  CENOGRAFIA <br /> & LUZ
                </h3>
                <p className="text-2xs text-slate-300 mt-1">Painéis de LED e efeitos especiais</p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              5. SEÇÃO COLAÇÃO DE GRAU
             ========================================================================= */}
          <div className="mt-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold">
                SOLENIDADE & RESPEITO
              </span>
              <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                COLAÇÃO <br />
                <span className="px-3 py-1 bg-gradient-to-r from-purple-700 to-fuchsia-700 rounded-lg inline-block text-white shadow-lg">
                  de GRAU
                </span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                No evento solene mais esperado por todos os formandos, a <strong>ON AGÊNCIA</strong> assessora e planeja rigorosamente cada protocolo: mestre de cerimônias, becas higienizadas, canudos personalizados, transmissão ao vivo e recepção calorosa para famílias e convidados.
              </p>
              <div className="flex items-center space-x-4 text-xs font-semibold text-purple-300">
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Becas Premium
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Protocolo Completo
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Cobertura Foto/Vídeo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80 border border-purple-900/40 shadow-xl group">
                <Image
                  src="/images/colacao-formanda-beca-azul.jpg"
                  alt="Colação de Grau - Formanda com Beca Oficial On Agência"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </div>
              <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80 border border-purple-900/40 shadow-xl group">
                <Image
                  src="/images/colacao-formanda-canudo.jpg"
                  alt="Entrega solene de canudo de formatura - On Agência"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SEÇÃO ON ONLINE (PORTAL DO FORMANDO)
         ========================================================================= */}
      <section id="on-online" className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-y border-purple-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold block mb-2">
            TECNOLOGIA EXCLUSIVA PARA A SUA TURMA
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            #ON<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">formaturas</span>
          </h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
            Fique por dentro de todas as novidades! Cada formando tem acesso exclusivo ao seu portal para emitir 2ª via de boletos, consultar contrato, convites extras e avisos da turma.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app-aluno/"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition flex items-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              ACESSAR PORTAL DO FORMANDO
            </Link>
            <a
              href="https://www.instagram.com/onagenciadeeventos"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-700/60 text-purple-300 hover:bg-purple-950 transition flex items-center"
            >
              <InstagramIcon className="w-4 h-4 mr-2" />
              SEGUIR @ONAGENCIADEEVENTOS
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6.5 SEÇÃO DEPOIMENTOS EM VÍDEO (REAIS & EMOCIONANTES)
         ========================================================================= */}
      <section id="depoimentos" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Glows de Fundo */}
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold block mb-2">
              QUEM VIVEU O SONHO CONTA
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              DEPOIMENTOS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-300">
                EM VÍDEO
              </span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed font-light">
              Assista à emoção real de formandos, membros de comissões e familiares compartilhando como foi viver a formatura dos sonhos com a produção da <strong>ON AGÊNCIA DE EVENTOS</strong>.
            </p>
          </div>

          {/* Grid de Vídeos de Depoimento Reais da On Agência */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Depoimento 1 */}
            <div
              role="button"
              tabIndex={0}
              data-video-src="/videos/depoimento-1.mp4"
              onClick={() => abrirVideo("/videos/depoimento-1.mp4")}
              className="bg-slate-900/90 rounded-2xl border border-purple-900/40 overflow-hidden hover:border-purple-500 transition-all duration-300 group shadow-2xl flex flex-col cursor-pointer active:scale-[0.98] select-none"
            >
              <div className="relative h-64 w-full overflow-hidden bg-slate-950" data-video-src="/videos/depoimento-1.mp4">
                <Image
                  src="/images/hero-formanda-vestido-vermelho-neon.jpg"
                  alt="Depoimento Formatura On Agência - Vídeo 1"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700 opacity-85 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/50 backdrop-blur-xs flex items-center">
                    <Video className="w-3 h-3 mr-1 text-fuchsia-400" />
                    Depoimento Real
                  </span>
                </div>

                <div
                  data-video-src="/videos/depoimento-1.mp4"
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:from-purple-500 group-hover:to-fuchsia-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 group-hover:scale-110 transition-transform z-20 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white translate-x-0.5 pointer-events-none" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide leading-snug">
                    "A On Agência superou 100% das nossas expectativas"
                  </h4>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between" data-video-src="/videos/depoimento-1.mp4">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <p className="text-2xs text-slate-300 italic leading-relaxed">
                    "Produção impecável, muita animação e cuidado em todos os momentos do baile!"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase">Isabela Mendes</h5>
                    <p className="text-2xs text-slate-400">Comissão de Formatura</p>
                  </div>
                  <span className="text-2xs font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    2024.2
                  </span>
                </div>

                <div className="mt-3 w-full py-2 rounded-lg bg-purple-950/60 border border-purple-800/50 text-[11px] font-bold text-purple-200 uppercase tracking-wider flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  <Play className="w-3 h-3 fill-current mr-1.5" />
                  Toque para Assistir
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div
              role="button"
              tabIndex={0}
              data-video-src="/videos/depoimento-2.mp4"
              onClick={() => abrirVideo("/videos/depoimento-2.mp4")}
              className="bg-slate-900/90 rounded-2xl border border-purple-900/40 overflow-hidden hover:border-purple-500 transition-all duration-300 group shadow-2xl flex flex-col cursor-pointer active:scale-[0.98] select-none"
            >
              <div className="relative h-64 w-full overflow-hidden bg-slate-950" data-video-src="/videos/depoimento-2.mp4">
                <Image
                  src="/images/colacao-formanda-canudo.jpg"
                  alt="Depoimento Formatura On Agência - Vídeo 2"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700 opacity-85 object-top pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/50 backdrop-blur-xs flex items-center">
                    <Video className="w-3 h-3 mr-1 text-fuchsia-400" />
                    Depoimento Real
                  </span>
                </div>

                <div
                  data-video-src="/videos/depoimento-2.mp4"
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:from-purple-500 group-hover:to-fuchsia-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 group-hover:scale-110 transition-transform z-20 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white translate-x-0.5 pointer-events-none" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide leading-snug">
                    "A colação de grau foi emocionante do início ao fim"
                  </h4>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between" data-video-src="/videos/depoimento-2.mp4">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <p className="text-2xs text-slate-300 italic leading-relaxed">
                    "Organização da solenidade impecável e atendimento muito carinhoso com os alunos."
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase">Larissa Vasconcelos</h5>
                    <p className="text-2xs text-slate-400">Direito UNICID</p>
                  </div>
                  <span className="text-2xs font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    2025.1
                  </span>
                </div>

                <div className="mt-3 w-full py-2 rounded-lg bg-purple-950/60 border border-purple-800/50 text-[11px] font-bold text-purple-200 uppercase tracking-wider flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  <Play className="w-3 h-3 fill-current mr-1.5" />
                  Toque para Assistir
                </div>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div
              role="button"
              tabIndex={0}
              data-video-src="/videos/depoimento-3.mp4"
              onClick={() => abrirVideo("/videos/depoimento-3.mp4")}
              className="bg-slate-900/90 rounded-2xl border border-purple-900/40 overflow-hidden hover:border-purple-500 transition-all duration-300 group shadow-2xl flex flex-col cursor-pointer active:scale-[0.98] select-none"
            >
              <div className="relative h-64 w-full overflow-hidden bg-slate-950" data-video-src="/videos/depoimento-3.mp4">
                <Image
                  src="/images/hero-formandas-neon.jpg"
                  alt="Depoimento Formatura On Agência - Vídeo 3"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700 opacity-85 object-top pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/50 backdrop-blur-xs flex items-center">
                    <Video className="w-3 h-3 mr-1 text-fuchsia-400" />
                    Depoimento Real
                  </span>
                </div>

                <div
                  data-video-src="/videos/depoimento-3.mp4"
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:from-purple-500 group-hover:to-fuchsia-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 group-hover:scale-110 transition-transform z-20 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white translate-x-0.5 pointer-events-none" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide leading-snug">
                    "A energia da pista e o open bar foram lendários!"
                  </h4>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between" data-video-src="/videos/depoimento-3.mp4">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <p className="text-2xs text-slate-300 italic leading-relaxed">
                    "Toda a turma elogiou as atrações e a organização financeira pelo portal."
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase">Camila & Beatriz</h5>
                    <p className="text-2xs text-slate-400">Odontologia</p>
                  </div>
                  <span className="text-2xs font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    2025.2
                  </span>
                </div>

                <div className="mt-3 w-full py-2 rounded-lg bg-purple-950/60 border border-purple-800/50 text-[11px] font-bold text-purple-200 uppercase tracking-wider flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  <Play className="w-3 h-3 fill-current mr-1.5" />
                  Toque para Assistir
                </div>
              </div>
            </div>

            {/* Depoimento 4 */}
            <div
              role="button"
              tabIndex={0}
              data-video-src="/videos/depoimento-4.mp4"
              onClick={() => abrirVideo("/videos/depoimento-4.mp4")}
              className="bg-slate-900/90 rounded-2xl border border-purple-900/40 overflow-hidden hover:border-purple-500 transition-all duration-300 group shadow-2xl flex flex-col cursor-pointer active:scale-[0.98] select-none"
            >
              <div className="relative h-64 w-full overflow-hidden bg-slate-950" data-video-src="/videos/depoimento-4.mp4">
                <Image
                  src="/images/colacao-formanda-beca-azul.jpg"
                  alt="Depoimento Formatura On Agência - Vídeo 4"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-700 opacity-85 object-top pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/50 backdrop-blur-xs flex items-center">
                    <Video className="w-3 h-3 mr-1 text-fuchsia-400" />
                    Depoimento Real
                  </span>
                </div>

                <div
                  data-video-src="/videos/depoimento-4.mp4"
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:from-purple-500 group-hover:to-fuchsia-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 group-hover:scale-110 transition-transform z-20 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white translate-x-0.5 pointer-events-none" />
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide leading-snug">
                    "Melhor escolha que fizemos para a nossa formatura"
                  </h4>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between" data-video-src="/videos/depoimento-4.mp4">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <p className="text-2xs text-slate-300 italic leading-relaxed">
                    "Segurança, pontualidade e uma festa inesquecível para todos os formandos e famílias."
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase">Gabriel Souza</h5>
                    <p className="text-2xs text-slate-400">Engenharia</p>
                  </div>
                  <span className="text-2xs font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                    2026.1
                  </span>
                </div>

                <div className="mt-3 w-full py-2 rounded-lg bg-purple-950/60 border border-purple-800/50 text-[11px] font-bold text-purple-200 uppercase tracking-wider flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  <Play className="w-3 h-3 fill-current mr-1.5" />
                  Toque para Assistir
                </div>
              </div>
            </div>
          </div>

          {/* Chamada para Ação */}
          <div className="mt-16 text-center">
            <a
              href="#contato"
              className="inline-flex items-center px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5"
            >
              QUERO MINHA TURMA COM A ON AGÊNCIA
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAL DE VÍDEO NO FORMATO DE TELA DE CELULAR / REELS (PROPORÇÃO 9:16)
          SEMPRE RENDERIZADO NO DOM PARA ABERTURA INSTANTÂNEA E GARANTIDA NO CELULAR
         ========================================================================= */}
      <div
        id="on-video-modal"
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md transition-opacity duration-200 ${
          videoModalUrl ? 'opacity-100 pointer-events-auto flex' : 'opacity-0 pointer-events-none hidden'
        }`}
        onClick={fecharVideo}
      >
        {/* MOLDURA DE CELULAR REALISTA (SMARTPHONE FRAME) */}
        <div
          className="relative w-full max-w-[340px] sm:max-w-[370px] bg-slate-900 border-[7px] border-slate-800 rounded-[48px] shadow-[0_0_60px_rgba(168,85,247,0.45)] overflow-hidden flex flex-col ring-1 ring-purple-500/30"
          style={{ maxHeight: '92vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* NOTCH / ALTO-FALANTE E CÂMERA DO SMARTPHONE */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center space-x-2 bg-black/80 px-4 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-none">
            {/* Câmera Frontal */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
            {/* Alto-falante */}
            <div className="w-10 h-1.5 rounded-full bg-slate-800" />
          </div>

          {/* BOTÃO FECHAR FLUTUANTE DISCRETO NO TOPO */}
          <button
            id="btn-fechar-modal-topo"
            type="button"
            onClick={fecharVideo}
            className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition border border-white/20 active:scale-90 cursor-pointer shadow-lg"
            title="Fechar vídeo"
          >
            <X className="w-4 h-4" />
          </button>

          {/* IDENTIFICAÇÃO ON AGÊNCIA DISCRETA NO TOPO DO CELULAR */}
          <div className="absolute top-4 left-4 z-30 flex items-center space-x-1.5 bg-black/70 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">
              ON AGÊNCIA
            </span>
          </div>

          {/* ÁREA DA TELA DO CELULAR (ASPECT RATIO 9:16 PERFEITO) */}
          <div className="relative w-full aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              id="on-active-video-player"
              key={videoModalUrl || 'default-player'}
              src={videoModalUrl || undefined}
              controls
              playsInline
              // @ts-ignore
              webkit-playsinline="true"
              x5-playsinline="true"
              preload="none"
              className="w-full h-full object-cover bg-black"
            >
              {videoModalUrl && <source src={videoModalUrl} type="video/mp4" />}
              Seu navegador não suporta a reprodução deste vídeo.
            </video>
          </div>

          {/* BARRA INFERIOR DE NAVEGAÇÃO DO SMARTPHONE + BOTÃO FECHAR */}
          <div className="py-2.5 px-4 bg-slate-950 flex items-center justify-between border-t border-white/5">
            <button
              id="btn-fechar-modal-inferior"
              type="button"
              onClick={fecharVideo}
              className="text-[11px] font-bold uppercase tracking-wider text-purple-300 hover:text-white px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800/50 cursor-pointer active:scale-95 transition"
            >
              ✕ Fechar Vídeo
            </button>
            <div className="w-24 h-1 bg-slate-600 rounded-full" />
            <span className="text-[10px] text-slate-500 font-mono">9:16 HD</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. SEÇÃO CONTATO COM DADOS SOLICITADOS + FORMULÁRIO COMPLETO
         ========================================================================= */}
      <section id="contato" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Lado Esquerdo: Dados da Empresa e Canais Oficiais */}
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-fuchsia-400 font-bold block mb-1">
                FALE COM NOSSA EQUIPE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-6">
                ON AGÊNCIA DE EVENTOS
              </h2>

              <ul className="space-y-5 text-sm text-slate-300">
                {/* Horário */}
                <li className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-fuchsia-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Horário de Atendimento</strong>
                    <span className="text-xs text-slate-400">
                      Segunda a quinta-feira: 09h às 12h / 13h30 às 19h <br />
                      Sexta-feira: 09h às 12h / 13h30 às 18h
                    </span>
                  </div>
                </li>

                {/* Telefone / WhatsApp Solicitado */}
                <li className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Telefone & WhatsApp Comercial</strong>
                    <a
                      href="https://wa.me/5511951364159"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline font-mono font-bold text-base block mt-0.5"
                    >
                      (11) 95136-4159
                    </a>
                    <span className="text-2xs text-slate-400">Atendimento rápido para comissões e formandos</span>
                  </div>
                </li>

                {/* Instagram Oficial Solicitado */}
                <li className="flex items-start space-x-3">
                  <InstagramIcon className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Instagram Oficial</strong>
                    <a
                      href="https://www.instagram.com/onagenciadeeventos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:underline font-bold block mt-0.5"
                    >
                      @onagenciadeeventos
                    </a>
                    <span className="text-2xs text-slate-400">Acompanhe coberturas de bailes e fotos dos eventos</span>
                  </div>
                </li>

                {/* E-mail de Contato */}
                <li className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">E-mail Comercial</strong>
                    <span className="text-xs text-slate-400">contato@onagenciadeeventos.com.br</span>
                  </div>
                </li>

                {/* Localização Atualizada */}
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Endereço & Sede Comercial</strong>
                    <span className="text-xs text-slate-300 font-medium">
                      Rua Rodovalho Junior, 281 - Penha de França - São Paulo - SP
                    </span>
                    <span className="text-2xs text-slate-400 block mt-0.5">
                      CEP 03605-000 &bull; Fácil acesso e estrutura para reuniões de comissão
                    </span>
                  </div>
                </li>
              </ul>

              {/* Mapa Incorporado com o Endereço Exato */}
              <div className="mt-8 rounded-2xl overflow-hidden border border-purple-900/40 h-56 shadow-lg">
                <iframe
                  src="https://maps.google.com/maps?q=Rua%20Rodovalho%20Junior%2C%20281%20-%20Penha%20de%20Fran%C3%A7a%2C%20S%C3%A3o%20Paulo%20-%20SP&t=m&z=15&output=embed&iwloc=near"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="Localização On Agência - Rua Rodovalho Junior 281 Penha"
                />
              </div>
            </div>

            {/* Lado Direito: Formulário "Fale Conosco" (idêntico ao modelo da Polly) */}
            <div className="bg-slate-900/90 rounded-2xl border border-purple-800/40 p-8 shadow-2xl backdrop-blur-md">
              <h3 className="text-2xl font-black uppercase text-white mb-2">FALE CONOSCO</h3>
              <p className="text-xs text-slate-400 mb-6">
                Use o formulário abaixo para mais informações ou para agendar a reunião da sua turma com um de nossos consultores.
              </p>

              {sucesso && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                  Solicitação enviada com sucesso! O lead já foi registrado e nossa equipe entrará em contato.
                </div>
              )}

              {erro && (
                <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-300 text-xs flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nome Completo *"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="E-mail *"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Telefone / WhatsApp *"
                      value={form.contato}
                      onChange={(e) => setForm({ ...form, contato: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Curso *"
                      value={form.curso}
                      onChange={(e) => setForm({ ...form, curso: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Faculdade / Instituição *"
                      value={form.faculdade}
                      onChange={(e) => setForm({ ...form, faculdade: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      placeholder="Qtd. Estimada de Alunos"
                      value={form.qtdAlunos}
                      onChange={(e) => setForm({ ...form, qtdAlunos: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Semestre (ex: 2026.2, 2027.1)"
                      value={form.semestre}
                      onChange={(e) => setForm({ ...form, semestre: e.target.value })}
                      className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="Digite sua mensagem ou dúvidas sobre a formatura..."
                    value={form.mensagem}
                    onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                    className="w-full text-xs rounded-lg border border-purple-900/60 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-xl shadow-purple-600/30 transition disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {enviando ? 'ENVIANDO SOLICITAÇÃO...' : 'ENVIAR PEDIDO DE ORÇAMENTO'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER COM COPYRIGHT E LINKS
         ========================================================================= */}
      <footer className="py-8 bg-slate-950 border-t border-purple-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-300">© ON AGÊNCIA DE EVENTOS – Todos os direitos reservados</p>
            <p className="text-2xs text-slate-400 mt-0.5">Rua Rodovalho Junior, 281 - Penha de França, São Paulo - SP</p>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="https://www.instagram.com/onagenciadeeventos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-white flex items-center"
            >
              <InstagramIcon className="w-4 h-4 mr-1" /> @onagenciadeeventos
            </a>
            <a
              href="https://wa.me/5511951364159"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-white flex items-center"
            >
              <Phone className="w-4 h-4 mr-1" /> (11) 95136-4159
            </a>
            <Link
              href="/login/"
              className="text-purple-300 hover:text-white flex items-center font-semibold transition"
            >
              <Lock className="w-3.5 h-3.5 mr-1 text-purple-400" /> Login Colaborador
            </Link>
          </div>
        </div>
      </footer>

      {/* Script nativo vanilla para garantia total de abertura imediata de vídeo e menu hambúrguer no mobile */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function setupDelegation() {
                document.addEventListener('click', function(e) {
                  // Abertura do vídeo de depoimento
                  var vCard = e.target.closest('[data-video-src]');
                  if (vCard) {
                    var vSrc = vCard.getAttribute('data-video-src');
                    var modal = document.getElementById('on-video-modal');
                    var player = document.getElementById('on-active-video-player');
                    if (modal && player && vSrc) {
                      modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                      modal.classList.add('opacity-100', 'pointer-events-auto', 'flex');
                      if (!player.src.endsWith(vSrc)) {
                        player.src = vSrc;
                      }
                      var p = player.play();
                      if (p !== undefined) {
                        p.catch(function() {
                          player.muted = true;
                          player.play().catch(function() {});
                        });
                      }
                    }
                  }

                  // Fechamento do modal de vídeo
                  if (e.target.closest('#btn-fechar-modal-topo') || e.target.closest('#btn-fechar-modal-inferior') || e.target.id === 'on-video-modal') {
                    var m = document.getElementById('on-video-modal');
                    var p = document.getElementById('on-active-video-player');
                    if (m) {
                      m.classList.remove('opacity-100', 'pointer-events-auto', 'flex');
                      m.classList.add('opacity-0', 'pointer-events-none', 'hidden');
                    }
                    if (p) {
                      p.pause();
                      p.currentTime = 0;
                    }
                  }

                  // Abertura e fechamento do menu hambúrguer no celular
                  var mBtn = e.target.closest('#btn-menu-hamburguer');
                  if (mBtn) {
                    var drawer = document.getElementById('menu-mobile-drawer');
                    var overlay = document.getElementById('menu-mobile-overlay');
                    if (drawer && overlay) {
                      var isClosed = drawer.classList.contains('hidden');
                      if (isClosed) {
                        drawer.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                        drawer.classList.add('block', 'opacity-100');
                        overlay.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
                        overlay.classList.add('block', 'opacity-100', 'pointer-events-auto');
                      } else {
                        drawer.classList.remove('block', 'opacity-100');
                        drawer.classList.add('hidden', 'opacity-0', 'pointer-events-none');
                        overlay.classList.remove('block', 'opacity-100', 'pointer-events-auto');
                        overlay.classList.add('hidden', 'opacity-0', 'pointer-events-none');
                      }
                    }
                  }

                  // Fechar menu mobile ao clicar no overlay ou link
                  if (e.target.id === 'menu-mobile-overlay' || (e.target.closest('#menu-mobile-drawer a'))) {
                    var d = document.getElementById('menu-mobile-drawer');
                    var o = document.getElementById('menu-mobile-overlay');
                    if (d) {
                      d.classList.remove('block', 'opacity-100');
                      d.classList.add('hidden', 'opacity-0', 'pointer-events-none');
                    }
                    if (o) {
                      o.classList.remove('block', 'opacity-100', 'pointer-events-auto');
                      o.classList.add('hidden', 'opacity-0', 'pointer-events-none');
                    }
                  }
                });
              }

              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupDelegation);
              } else {
                setupDelegation();
              }
            })();
          `,
        }}
      />
    </div>
  );
}
