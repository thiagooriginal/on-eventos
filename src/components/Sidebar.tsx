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
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Mail,
  Upload,
  Trash2,
  Check,
  User,
  Edit3,
} from 'lucide-react';
import { getUsuarios, salvarUsuarios } from '@/lib/usuarios';

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
    id: 'demandas',
    titulo: 'Demandas Internas',
    href: '/demandas/index.html',
    icone: ClipboardList,
    badge: 'Equipe',
    badgeCor: 'bg-purple-400/30 text-purple-200 border border-purple-300/40',
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

export interface UsuarioSessao {
  nome: string;
  email: string;
  perfil: string;
  telefone?: string;
  foto?: string;
  senha?: string;
  cargo?: string;
}

export default function Sidebar({ paginaAtiva = 'dashboard' }: SidebarProps) {
  const [mobileAberto, setMobileAberto] = useState(false);
  const [albunsAtrasadosCount, setAlbunsAtrasadosCount] = useState<number>(0);
  const [usuario, setUsuario] = useState<UsuarioSessao>({
    nome: 'Administrador ON',
    email: 'admin@formatura.com.br',
    perfil: 'ADMIN',
    telefone: '',
    foto: '',
  });

  // Estados do Modal "Meu Perfil"
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formFoto, setFormFoto] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [toastPerfil, setToastPerfil] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

        const usrAtual: UsuarioSessao = {
          nome: parsed.nome || 'Administrador ON',
          email: parsed.email || 'admin@formatura.com.br',
          perfil: parsed.perfil || 'ADMIN',
          telefone: parsed.telefone || '',
          foto: parsed.foto || parsed.avatarUrl || '',
          senha: parsed.senha || '',
          cargo: parsed.cargo || '',
        };
        setUsuario(usrAtual);

        // Contabiliza álbuns com prazo vencido para alerta no menu (por etapa de produção)
        const albunsRaw = localStorage.getItem('on_vendas_albuns_estado');
        if (albunsRaw) {
          const albuns = JSON.parse(albunsRaw);
          if (Array.isArray(albuns)) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const isAdmin = (parsed.perfil || '').toUpperCase().includes('ADMIN');
            const userNomeLower = (parsed.nome || '').toLowerCase();
            const userEmailLower = (parsed.email || '').toLowerCase();

            const atrasados = albuns.filter((v: any) => {
              if (v.statusProducao === 'ENTREGUE') return false;

              // Filtrar por usuário responsável caso não seja admin
              if (!isAdmin) {
                const isMeu =
                  !v.responsavelNome ||
                  v.responsavelNome.toLowerCase() === userNomeLower ||
                  (v.responsavelEmail && v.responsavelEmail.toLowerCase() === userEmailLower);
                if (!isMeu) return false;
              }

              // Resolver prazo da etapa ativa de produção
              let prazoAtivo = '';
              if (v.statusProducao === 'EM_DIAGRAMACAO') {
                prazoAtivo = v.prazoLayout || v.prazoProducao;
              } else if (v.statusProducao === 'APROVACAO_CLIENTE') {
                prazoAtivo = v.prazoAprovacaoCliente;
              } else if (v.statusProducao === 'EM_GRAFICA') {
                prazoAtivo = v.prazoConfeccao;
              } else if (v.statusProducao === 'PRONTO_ENTREGA') {
                prazoAtivo = v.prazoConfeccao || v.prazoProducao;
              } else {
                prazoAtivo = v.prazoProducao;
              }

              // Se a etapa ativa estiver em branco (sem prazo definido ainda), não gera falso atraso
              if (!prazoAtivo) return false;

              const p = String(prazoAtivo).split('-');
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

      // Escuta evento global de atualização de perfil caso ocorra em outra aba/componente
      const handlePerfilAtualizadoEvent = () => {
        try {
          const u = localStorage.getItem('on_usuario_logado');
          if (u) {
            const p = JSON.parse(u);
            setUsuario((ant) => ({
              ...ant,
              nome: p.nome || ant.nome,
              email: p.email || ant.email,
              telefone: p.telefone || ant.telefone,
              foto: p.foto || p.avatarUrl || ant.foto,
            }));
          }
        } catch (e) {}
      };
      window.addEventListener('on_perfil_atualizado', handlePerfilAtualizadoEvent);
      return () => {
        window.removeEventListener('on_perfil_atualizado', handlePerfilAtualizadoEvent);
      };
    }
  }, []);

  const abrirModalPerfil = () => {
    setFormNome(usuario.nome);
    setFormEmail(usuario.email);
    setFormTelefone(usuario.telefone || '');
    setFormSenha('');
    setFormFoto(usuario.foto || '');
    setMostrarSenha(false);
    setModalPerfilAberto(true);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, escolha uma imagem válida (PNG, JPG, JPEG ou WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito pesada. Escolha um arquivo de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormFoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverFoto = () => {
    setFormFoto('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim()) {
      alert('Por favor, informe seu Nome Completo e E-mail.');
      return;
    }

    setSalvandoPerfil(true);
    try {
      const salvo = localStorage.getItem('on_usuario_logado');
      const sessaoAtual = salvo ? JSON.parse(salvo) : {};

      const novaSessao: UsuarioSessao = {
        ...sessaoAtual,
        nome: formNome.trim(),
        email: formEmail.trim(),
        telefone: formTelefone.trim(),
        foto: formFoto || undefined,
        senha: formSenha.trim() || sessaoAtual.senha,
      };

      localStorage.setItem('on_usuario_logado', JSON.stringify(novaSessao));
      setUsuario(novaSessao);

      // Sincroniza com a lista de usuários no banco centralizado
      const todosUsuarios = getUsuarios();
      const emailAntigo = (sessaoAtual.email || '').toLowerCase().trim();
      const usuariosAtualizados = todosUsuarios.map((u) => {
        if (
          u.email.toLowerCase().trim() === emailAntigo ||
          u.nome.toLowerCase().trim() === (sessaoAtual.nome || '').toLowerCase().trim()
        ) {
          return {
            ...u,
            nome: formNome.trim(),
            email: formEmail.trim(),
            telefone: formTelefone.trim() || u.telefone,
            senha: formSenha.trim() || u.senha,
            avatarUrl: formFoto || u.avatarUrl,
          };
        }
        return u;
      });

      await salvarUsuarios(usuariosAtualizados);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('on_perfil_atualizado'));
      }

      setToastPerfil('✓ Dados do seu perfil atualizados com sucesso!');
      setTimeout(() => setToastPerfil(null), 3500);
      setModalPerfilAberto(false);
    } catch (err) {
      alert('Erro ao salvar dados do perfil. Tente novamente.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

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
            <div className="relative shrink-0">
              {usuario.foto ? (
                <img
                  src={usuario.foto}
                  alt={usuario.nome}
                  className="w-10 h-10 rounded-xl object-cover border border-white/30 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 font-extrabold flex items-center justify-center text-sm shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
                  {usuario.nome.slice(0, 2).toUpperCase()}
                </div>
              )}
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

          {/* Botão Meu Perfil */}
          <button
            onClick={abrirModalPerfil}
            className="w-full mt-2.5 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
            <span>Editar Meu Perfil</span>
          </button>
        </div>

        {/* Botão Sair com Relevo */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-semibold shadow-[0_2px_0_0_rgba(239,68,68,0.2)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all cursor-pointer"
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

      {/* Toast Flutuante de Perfil */}
      {toastPerfil && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#36218A] text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastPerfil}</span>
        </div>
      )}

      {/* Modal Meu Perfil (Dados Cadastrais, E-mail, Senha, Telefone e Foto) */}
      {modalPerfilAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="bg-gradient-to-r from-[#4F39F6] to-[#7C3AED] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Meu Perfil de Usuário</h3>
                  <p className="text-xs text-purple-100">Atualize seus dados, foto de perfil, contato e senha.</p>
                </div>
              </div>
              <button
                onClick={() => setModalPerfilAberto(false)}
                className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário do Perfil */}
            <form onSubmit={handleSalvarPerfil} className="p-6 space-y-4">
              {/* Seção Foto de Perfil */}
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="relative shrink-0">
                  {formFoto ? (
                    <img
                      src={formFoto}
                      alt="Prévia"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 font-black flex items-center justify-center text-xl shadow-md">
                      {formNome ? formNome.slice(0, 2).toUpperCase() : 'ON'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block mb-1">Foto de Perfil</span>
                  <p className="text-[11px] text-slate-500 mb-2">JPG, PNG ou WebP até 5MB. Visível para toda a equipe.</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formFoto ? 'Alterar Foto' : 'Carregar Foto'}</span>
                    </button>
                    {formFoto && (
                      <button
                        type="button"
                        onClick={handleRemoverFoto}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold transition cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
                  />
                </div>
              </div>

              {/* E-mail de Acesso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail de Acesso / Login *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="exemplo@onagenciadeeventos.com.br"
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
                  />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
                  />
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl pl-9 pr-10 py-2.5 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Preencha apenas caso queira alterar sua senha de login.</p>
              </div>

              {/* Nível de Acesso (Informativo) */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900">Nível do Usuário:</span>
                <span className="font-black px-2.5 py-0.5 rounded-lg bg-purple-200 text-purple-900">
                  {usuario.perfil.toUpperCase().includes('ADMIN') ? '👑 Administrador Geral' : '👤 Usuário Básico (Operacional)'}
                </span>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalPerfilAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoPerfil}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4F39F6] to-[#7C3AED] hover:brightness-110 text-white text-xs font-extrabold shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
