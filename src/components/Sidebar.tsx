'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  Kanban,
  GraduationCap,
  BadgePercent,
  Users,
  Wallet,
  FileBarChart2,
  Megaphone,
  Smartphone,
  Globe,
  Camera,
  Activity,
  UserCheck,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  paginaAtiva?: string;
}

interface MenuItem {
  id: string;
  titulo: string;
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeCor?: string;
}

export const menuItens: MenuItem[] = [
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    href: '/sistema/index.html',
    icone: LayoutDashboard,
    badge: 'Ao Vivo',
    badgeCor: 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40',
  },
  {
    id: 'crm',
    titulo: 'CRM de Turmas',
    href: '/crm/index.html',
    icone: Kanban,
    badge: '14',
    badgeCor: 'bg-amber-400/30 text-amber-200 border border-amber-300/40',
  },
  {
    id: 'projetos',
    titulo: 'Projetos Formatura',
    href: '/projetos/index.html',
    icone: GraduationCap,
    badge: '8',
    badgeCor: 'bg-teal-400/30 text-teal-200 border border-teal-300/40',
  },
  {
    id: 'instituicoes',
    titulo: 'Instituição / Cursos',
    href: '/instituicoes/index.html',
    icone: Building2,
    badge: 'Novo',
    badgeCor: 'bg-indigo-400/30 text-indigo-200 border border-indigo-300/40',
  },
  {
    id: 'fotos',
    titulo: 'Vendas de Álbuns',
    href: '/fotos/index.html',
    icone: Camera,
    badge: 'Novo',
    badgeCor: 'bg-fuchsia-400/30 text-fuchsia-200 border border-fuchsia-300/40',
  },
  {
    id: 'metricas',
    titulo: 'Métricas do Site',
    href: '/metricas/index.html',
    icone: Activity,
    badge: 'Ao Vivo',
    badgeCor: 'bg-emerald-400/30 text-emerald-200 border border-emerald-300/40',
  },
  {
    id: 'usuarios',
    titulo: 'Usuários & Níveis',
    href: '/usuarios/index.html',
    icone: UserCheck,
    badge: 'Admin/Básico',
    badgeCor: 'bg-indigo-400/30 text-indigo-200 border border-indigo-300/40',
  },
  {
    id: 'comissoes',
    titulo: 'Comissões (Regra 4%)',
    href: '/comissoes/index.html',
    icone: BadgePercent,
    badge: '4%',
    badgeCor: 'bg-purple-400/30 text-purple-200 border border-purple-300/40',
  },
  {
    id: 'alunos',
    titulo: 'Pesquisa Alunos',
    href: '/alunos/index.html',
    icone: Users,
    badge: '420',
    badgeCor: 'bg-blue-400/30 text-blue-200 border border-blue-300/40',
  },
  {
    id: 'financeiro',
    titulo: 'Financeiro & Custos',
    href: '/financeiro/index.html',
    icone: Wallet,
    badge: 'R$',
    badgeCor: 'bg-emerald-400/30 text-emerald-200 border border-emerald-300/40',
  },
  {
    id: 'relatorios',
    titulo: 'Relatórios Gerenciais',
    href: '/relatorios/index.html',
    icone: FileBarChart2,
    badge: 'Tempo Real',
    badgeCor: 'bg-rose-400/30 text-rose-200 border border-rose-300/40',
  },
  {
    id: 'campanhas',
    titulo: 'Campanhas WhatsApp',
    href: '/campanhas/index.html',
    icone: Megaphone,
    badge: 'Fila',
    badgeCor: 'bg-cyan-400/30 text-cyan-200 border border-cyan-300/40',
  },
  {
    id: 'app-aluno',
    titulo: 'Portal do Aluno',
    href: '/app-aluno/index.html',
    icone: Smartphone,
    badge: 'App',
    badgeCor: 'bg-violet-400/30 text-violet-200 border border-violet-300/40',
  },
  {
    id: 'site',
    titulo: 'Site Institucional',
    href: '/',
    icone: Globe,
    badge: 'Web',
    badgeCor: 'bg-white/20 text-white border border-white/30',
  },
];

export default function Sidebar({ paginaAtiva = 'dashboard' }: SidebarProps) {
  const [mobileAberto, setMobileAberto] = useState(false);
  const [albunsAtrasadosCount, setAlbunsAtrasadosCount] = useState<number>(0);
  const [usuario, setUsuario] = useState<{ nome: string; email: string; perfil: string }>({
    nome: 'Administrador ON',
    email: 'admin@formatura.com.br',
    perfil: 'ADMIN',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem('on_usuario_logado');
        if (!salvo) {
          // Bloqueia acesso: se não estiver autenticado, redireciona imediatamente para o login
          window.location.replace('/login/index.html');
          return;
        }

        const parsed = JSON.parse(salvo);
        if (!parsed.email || !parsed.perfil) {
          localStorage.removeItem('on_usuario_logado');
          window.location.replace('/login/index.html');
          return;
        }

        // Verifica se a sessão expirou
        if (parsed.expiraEm && Date.now() > parsed.expiraEm) {
          localStorage.removeItem('on_usuario_logado');
          window.location.replace('/login/index.html');
          return;
        }

        setUsuario({
          nome: parsed.nome || 'Administrador ON',
          email: parsed.email || 'admin@formatura.com.br',
          perfil: parsed.perfil || 'ADMIN',
        });

        // Contabiliza álbuns com prazo vencido para alerta no menu
        const albunsRaw = localStorage.getItem('on_vendas_albuns_estado');
        if (albunsRaw) {
          const albuns = JSON.parse(albunsRaw);
          if (Array.isArray(albuns)) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const atrasados = albuns.filter((v: any) => {
              if (v.statusProducao === 'ENTREGUE') return false;
              if (!v.prazoProducao) return false;
              const p = String(v.prazoProducao).split('-');
              if (p.length !== 3) return false;
              const dPrazo = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
              dPrazo.setHours(0, 0, 0, 0);
              return dPrazo.getTime() < hoje.getTime();
            });
            setAlbunsAtrasadosCount(atrasados.length);
          }
        }
      } catch (e) {
        localStorage.removeItem('on_usuario_logado');
        window.location.replace('/login/index.html');
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('on_usuario_logado');
      window.location.href = '/login/index.html';
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Topo / Marca ON EVENTOS */}
      <div>
        <div className="flex items-center space-x-3 px-3 py-3.5 mb-4 border-b border-white/10">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-[0_5px_0_0_#C7D2FE,0_10px_20px_rgba(0,0,0,0.2)] flex items-center justify-center p-1.5 transform hover:scale-105 transition-transform duration-200 border border-white/40">
              <Image
                src="/images/logo-on-agencia.png"
                alt="ON Agência Oficial"
                width={38}
                height={38}
                className="object-contain"
                priority
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#432CB8]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-white drop-shadow-sm font-sans truncate">
                ON AGÊNCIA
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
            </div>
            <p className="text-[10px] font-bold tracking-wider text-purple-200 uppercase truncate">
              Eventos & Formaturas
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="px-3 mb-5">
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl px-3 py-2 flex items-center justify-between text-xs text-white/90 shadow-[0_2px_0_0_rgba(0,0,0,0.1)]">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-[11px]">Nuvem Hostinger</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
              100% Online
            </span>
          </div>
        </div>

        {/* Lista de Navegação com Efeito Tátil */}
        <nav className="space-y-1.5 px-1">
          {menuItens.map((item) => {
            const Icone = item.icone;
            const isAtivo = paginaAtiva === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium transition-all duration-150 ${
                  isAtivo
                    ? 'bg-white text-[#432CB8] font-bold shadow-[0_5px_0_0_#C7D2FE,0_10px_20px_rgba(0,0,0,0.18)] translate-y-[-1px]'
                    : 'text-white/85 hover:text-white bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 shadow-[0_2px_0_0_rgba(0,0,0,0.15)] hover:translate-y-[-1px] active:translate-y-[1px]'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-150 ${
                      isAtivo
                        ? 'bg-[#4F39F6]/10 text-[#4F39F6]'
                        : 'bg-white/10 text-white group-hover:bg-white/20'
                    }`}
                  >
                    <Icone className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="text-sm truncate">{item.titulo}</span>
                </div>

                {item.id === 'fotos' && albunsAtrasadosCount > 0 ? (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 bg-rose-600 text-white border border-rose-300 animate-pulse shadow-sm">
                    🚨 {albunsAtrasadosCount} {albunsAtrasadosCount > 1 ? 'Atrasados' : 'Atrasado'}
                  </span>
                ) : item.badge ? (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isAtivo
                        ? 'bg-[#4F39F6] text-white shadow-xs'
                        : item.badgeCor || 'bg-white/15 text-white/90'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Rodapé da Sidebar: Perfil do Usuário e Logout */}
      <div className="pt-4 mt-6 border-t border-white/15 px-2">
        <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15 shadow-[0_3px_0_0_rgba(0,0,0,0.12)] mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 font-extrabold flex items-center justify-center text-sm shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
              {usuario.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{usuario.nome}</p>
              <p className="text-[10px] text-purple-200 truncate">{usuario.email}</p>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${usuario.perfil.toUpperCase().includes('ADMIN') ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'}`}></span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  usuario.perfil.toUpperCase().includes('ADMIN')
                    ? 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                    : 'bg-cyan-400/20 text-cyan-200 border-cyan-300/40'
                }`}>
                  {usuario.perfil.toUpperCase().includes('ADMIN') ? '👑 ADMIN (TOTAL)' : '👤 BÁSICO (OPERACIONAL)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Sair com Relevo */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-semibold shadow-[0_2px_0_0_rgba(239,68,68,0.2)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão Hambúrguer Mobile Flutuante */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileAberto(!mobileAberto)}
          className="p-2.5 rounded-2xl bg-[#4F39F6] text-white shadow-[0_4px_12px_rgba(79,57,246,0.4)] border border-white/20 active:scale-95 transition"
        >
          {mobileAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay Mobile */}
      {mobileAberto && (
        <div
          onClick={() => setMobileAberto(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Desktop Flutuante com Cantos Arredondados Modernos */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 p-4">
        <div className="sticky top-4 h-[calc(100vh-2rem)] w-full rounded-[28px] bg-gradient-to-b from-[#5842BD] via-[#4833A8] to-[#36218A] p-4 text-white shadow-[0_16px_36px_rgba(54,33,138,0.28)] border border-white/15 overflow-y-auto scrollbar-none">
          {navContent}
        </div>
      </aside>

      {/* Drawer Mobile */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 p-4 transition-transform duration-300 ease-in-out ${
          mobileAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full w-full rounded-[28px] bg-gradient-to-b from-[#5842BD] via-[#4833A8] to-[#36218A] p-4 text-white shadow-2xl border border-white/15 overflow-y-auto">
          {navContent}
        </div>
      </div>
    </>
  );
}
