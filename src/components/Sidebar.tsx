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
  ChevronDown,
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
  Handshake,
  Search,
  ExternalLink,
} from 'lucide-react';
import { getUsuarios, salvarUsuarios } from '@/lib/usuarios';

export interface SidebarProps {
  paginaAtiva?: string;
}

export interface SubMenuItem {
  id: string;
  titulo: string;
  href: string;
  badge?: string;
  badgeCor?: string;
}

export interface MenuItem {
  id: string;
  titulo: string;
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeCor?: string;
  matchIds?: string[];
  subItens?: SubMenuItem[];
}

export interface MenuSection {
  secao: string;
  itens: MenuItem[];
}

export const menuSections: MenuSection[] = [
  {
    secao: 'VISÃO GERAL',
    itens: [
      {
        id: 'admin',
        titulo: 'Menu Principal',
        href: '/admin/index.html',
        icone: LayoutDashboard,
        badge: 'Início',
        badgeCor: 'bg-slate-100 text-slate-600 border border-slate-200',
      },
      {
        id: 'dashboard',
        titulo: 'Central do Sistema',
        href: '/sistema/index.html',
        icone: Activity,
        badge: 'Ao Vivo',
        badgeCor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      },
    ],
  },
  {
    secao: 'EVENTOS & VENDAS',
    itens: [
      {
        id: 'fotos',
        titulo: 'Vendas de Álbuns',
        href: '/fotos/index.html',
        icone: Camera,
        matchIds: ['fotos'],
        subItens: [
          { id: 'fotos-painel', titulo: 'Painel de Vendas', href: '/fotos/index.html' },
          { id: 'fotos-carnes', titulo: 'Boletos & Carnês Sicredi', href: '/fotos/index.html' },
        ],
      },
      {
        id: 'parceiros',
        titulo: 'Parceiros & Locais',
        href: '/parceiros/index.html',
        icone: Handshake,
        badge: 'Novo',
        badgeCor: 'bg-purple-100 text-purple-700 border border-purple-200',
        matchIds: ['parceiros'],
        subItens: [
          { id: 'profissionais', titulo: 'Profissionais Liberais', href: '/parceiros/index.html?aba=profissionais' },
          { id: 'espacos', titulo: 'Espaços para Evento', href: '/parceiros/index.html?aba=espacos' },
        ],
      },
      {
        id: 'comercial',
        titulo: 'Comercial & Turmas',
        href: '/crm/index.html',
        icone: GraduationCap,
        matchIds: ['crm', 'projetos', 'alunos'],
        subItens: [
          { id: 'crm', titulo: 'CRM de Turmas', href: '/crm/index.html' },
          { id: 'projetos', titulo: 'Projetos Formatura', href: '/projetos/index.html' },
          { id: 'alunos', titulo: 'Pesquisa de Alunos', href: '/alunos/index.html' },
        ],
      },
      {
        id: 'operacoes',
        titulo: 'Operações & Tarefas',
        href: '/demandas/index.html',
        icone: ClipboardList,
        matchIds: ['demandas', 'instituicoes'],
        subItens: [
          { id: 'demandas', titulo: 'Demandas & Kanban', href: '/demandas/index.html' },
          { id: 'instituicoes', titulo: 'Instituições / Cursos', href: '/instituicoes/index.html' },
        ],
      },
    ],
  },
  {
    secao: 'GESTÃO & FINANCEIRO',
    itens: [
      {
        id: 'financas',
        titulo: 'Módulo Financeiro',
        href: '/financeiro/index.html',
        icone: Wallet,
        matchIds: ['financeiro', 'comissoes', 'relatorios'],
        subItens: [
          { id: 'financeiro', titulo: 'Financeiro & Custos', href: '/financeiro/index.html' },
          { id: 'comissoes', titulo: 'Comissões (Regra 4%)', href: '/comissoes/index.html' },
          { id: 'relatorios', titulo: 'Relatórios Gerenciais', href: '/relatorios/index.html' },
        ],
      },
      {
        id: 'campanhas',
        titulo: 'Campanhas WhatsApp',
        href: '/campanhas/index.html',
        icone: Megaphone,
        badge: 'Disparos',
        badgeCor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      },
    ],
  },
  {
    secao: 'SISTEMA & PORTAIS',
    itens: [
      {
        id: 'usuarios',
        titulo: 'Usuários & Permissões',
        href: '/usuarios/index.html',
        icone: UserCheck,
      },
      {
        id: 'metricas',
        titulo: 'Métricas do Site',
        href: '/metricas/index.html',
        icone: Activity,
        badge: 'Ao Vivo',
        badgeCor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      },
      {
        id: 'app-aluno',
        titulo: 'Portal do Aluno (App)',
        href: '/app-aluno/index.html',
        icone: Smartphone,
        badge: 'App',
        badgeCor: 'bg-purple-100 text-purple-700 border border-purple-200',
      },
      {
        id: 'site',
        titulo: 'Site Institucional',
        href: '/',
        icone: Globe,
        badge: 'Web',
        badgeCor: 'bg-slate-100 text-slate-600 border border-slate-200',
      },
    ],
  },
];

// Compatibilidade retroativa caso algum arquivo acesse menuItens plano
export const menuItens: MenuItem[] = menuSections.flatMap((s) => s.itens);

export interface UsuarioSessao {
  nome: string;
  email: string;
  perfil: string;
  telefone?: string;
  foto?: string;
  cargo?: string;
}

export default function Sidebar({ paginaAtiva = 'dashboard' }: SidebarProps) {
  const [mobileAberto, setMobileAberto] = useState(false);
  const [albunsAtrasadosCount, setAlbunsAtrasadosCount] = useState<number>(0);
  const [currentSearch, setCurrentSearch] = useState('');
  const [buscaMenu, setBuscaMenu] = useState('');
  const [usuario, setUsuario] = useState<UsuarioSessao>({
    nome: 'Administrador ON',
    email: 'admin@formatura.com.br',
    perfil: 'ADMIN',
    telefone: '',
    foto: '',
  });

  // Estado de controle de abertura dos menus expansíveis
  const [menusAbertos, setMenusAbertos] = useState<Record<string, boolean>>(() => {
    const iniciais: Record<string, boolean> = {};
    menuSections.forEach((sec) => {
      sec.itens.forEach((item) => {
        if (item.subItens && item.subItens.length > 0) {
          const isAtivo =
            paginaAtiva === item.id ||
            (item.matchIds && item.matchIds.includes(paginaAtiva)) ||
            item.subItens.some((s) => s.id === paginaAtiva);
          if (isAtivo) {
            iniciais[item.id] = true;
          }
        }
      });
    });
    return iniciais;
  });

  const toggleSubmenu = (itemId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMenusAbertos((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

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
      setCurrentSearch(window.location.search || '');
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
            avatarUrl: formFoto || (u as any).avatarUrl,
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

  // Renderização do Conteúdo de Navegação (Estilo Cartpanda Minimalista e Limpo)
  const navContent = (
    <div className="flex flex-col h-full justify-between bg-white select-none">
      <div className="flex flex-col min-h-0">
        {/* Topo / Marca ON EVENTOS */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link
            href="/admin/index.html"
            className="flex items-center space-x-3 group cursor-pointer transition min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/images/logo-on-agencia.png"
                alt="ON Agência Oficial"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                  ON AGÊNCIA
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 truncate">
                Portal de Gestão SaaS
              </p>
            </div>
          </Link>
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Campo de Busca Rápida no Menu */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar no menu..."
              value={buscaMenu}
              onChange={(e) => setBuscaMenu(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Lista de Navegação com Seções e Submenus Estilo Cartpanda */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          {menuSections.map((secao, idx) => {
            const itensFiltrados = secao.itens.filter((item) => {
              if (!buscaMenu.trim()) return true;
              const termo = buscaMenu.toLowerCase();
              const matchItem = item.titulo.toLowerCase().includes(termo);
              const matchSub = item.subItens?.some((s) => s.titulo.toLowerCase().includes(termo));
              return matchItem || matchSub;
            });

            if (itensFiltrados.length === 0) return null;

            return (
              <div key={idx} className="space-y-0.5">
                {/* Cabeçalho da Seção */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pt-2 pb-1">
                  {secao.secao}
                </p>

                {/* Itens da Seção */}
                <div className="space-y-0.5">
                  {itensFiltrados.map((item) => {
                    const Icone = item.icone;
                    const hasSub = !!(item.subItens && item.subItens.length > 0);
                    const isAtivoDireto = paginaAtiva === item.id;
                    const isSubAtivoGeral =
                      item.matchIds?.includes(paginaAtiva) ||
                      item.subItens?.some((s) => s.id === paginaAtiva);
                    const isParentAtivo = isAtivoDireto || isSubAtivoGeral;
                    const estaAberto = !!menusAbertos[item.id] || (!!buscaMenu.trim() && hasSub);

                    return (
                      <div key={item.id} className="space-y-0.5">
                        {/* Linha Principal do Item */}
                        {hasSub ? (
                          <div
                            onClick={() => toggleSubmenu(item.id)}
                            className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition cursor-pointer select-none ${
                              isParentAtivo
                                ? 'bg-purple-50/90 text-purple-800 font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <Icone
                                className={`w-4 h-4 shrink-0 transition-colors ${
                                  isParentAtivo
                                    ? 'text-purple-600'
                                    : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                              />
                              <span className="truncate">{item.titulo}</span>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              {item.id === 'fotos' && albunsAtrasadosCount > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                                  🚨 {albunsAtrasadosCount}
                                </span>
                              ) : item.badge ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    item.badgeCor || 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              ) : null}

                              <ChevronRight
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                  estaAberto ? 'rotate-90 text-purple-600' : 'group-hover:text-slate-600'
                                }`}
                              />
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition select-none ${
                              isAtivoDireto
                                ? 'bg-purple-50/90 text-purple-800 font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <Icone
                                className={`w-4 h-4 shrink-0 transition-colors ${
                                  isAtivoDireto
                                    ? 'text-purple-600'
                                    : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                              />
                              <span className="truncate">{item.titulo}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                  item.badgeCor || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )}

                        {/* Submenus Recuados com Linha Guia Estilo Cartpanda */}
                        {hasSub && estaAberto && (
                          <div className="ml-4 pl-3.5 border-l-2 border-slate-100 space-y-0.5 py-0.5 animate-in fade-in-50 duration-150">
                            {item.subItens?.map((sub) => {
                              // Determina se este subitem específico é o ativo
                              let isSubAtivo = false;
                              if (item.id === 'parceiros') {
                                if (sub.id === 'espacos') {
                                  isSubAtivo = paginaAtiva === 'parceiros' && currentSearch.includes('aba=espacos');
                                } else if (sub.id === 'profissionais') {
                                  isSubAtivo =
                                    paginaAtiva === 'parceiros' &&
                                    (!currentSearch || currentSearch.includes('aba=profissionais'));
                                }
                              } else if (item.id === 'fotos') {
                                isSubAtivo = paginaAtiva === 'fotos' && sub.id === 'fotos-painel';
                              } else {
                                isSubAtivo = paginaAtiva === sub.id;
                              }

                              return (
                                <Link
                                  key={sub.id}
                                  href={sub.href}
                                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition ${
                                    isSubAtivo
                                      ? 'bg-purple-100/80 text-purple-900 font-bold'
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                        isSubAtivo ? 'bg-purple-600' : 'bg-slate-300'
                                      }`}
                                    />
                                    <span className="truncate">{sub.titulo}</span>
                                  </div>

                                  {sub.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Rodapé da Sidebar: Perfil do Usuário e Logout */}
      <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50/60">
        <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs mb-2">
          <div className="flex items-center space-x-2.5">
            <div className="relative shrink-0">
              {usuario.foto ? (
                <img
                  src={usuario.foto}
                  alt={usuario.nome}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                  {usuario.nome.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{usuario.nome}</p>
              <p className="text-[10px] text-slate-400 truncate">{usuario.email}</p>
            </div>
          </div>

          {/* Botão Meu Perfil */}
          <button
            onClick={abrirModalPerfil}
            className="w-full mt-2 flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
          >
            <Edit3 className="w-3 h-3 text-slate-500" />
            <span>Editar Perfil</span>
          </button>
        </div>

        {/* Botão Sair */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-xs font-semibold transition cursor-pointer"
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
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileAberto(!mobileAberto)}
          className="p-2 rounded-xl bg-white text-slate-700 shadow-md border border-slate-200 active:scale-95 transition cursor-pointer"
          aria-label="Abrir menu lateral"
        >
          {mobileAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay Mobile */}
      {mobileAberto && (
        <div
          onClick={() => setMobileAberto(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Desktop Fixa na Lateral Esquerda (Design Limpo SaaS) */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-white border-r border-slate-200/90 min-h-screen sticky top-0 h-screen z-20">
        {navContent}
      </aside>

      {/* Drawer Mobile */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl border-r border-slate-200 transition-transform duration-300 ease-in-out ${
          mobileAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>

      {/* Toast Flutuante de Perfil */}
      {toastPerfil && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastPerfil}</span>
        </div>
      )}

      {/* Modal Meu Perfil (Dados Cadastrais, E-mail, Senha, Telefone e Foto) */}
      {modalPerfilAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Meu Perfil de Usuário</h3>
                  <p className="text-xs text-slate-300">Atualize seus dados, foto de perfil e senha.</p>
                </div>
              </div>
              <button
                onClick={() => setModalPerfilAberto(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário do Perfil */}
            <form onSubmit={handleSalvarPerfil} className="p-5 space-y-3.5">
              {/* Seção Foto de Perfil */}
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="relative shrink-0">
                  {formFoto ? (
                    <img
                      src={formFoto}
                      alt="Foto Prévia"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-lg border border-purple-200">
                      {formNome ? formNome.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      <span>{formFoto ? 'Trocar Foto' : 'Enviar Foto'}</span>
                    </button>
                    {formFoto && (
                      <button
                        type="button"
                        onClick={handleRemoverFoto}
                        className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">PNG, JPG até 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha <span className="font-normal text-slate-400">(deixe em branco para manter a atual)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalPerfilAberto(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoPerfil}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {salvandoPerfil ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
