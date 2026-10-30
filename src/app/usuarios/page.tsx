'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
  Building,
  Edit2,
  Trash2,
  Crown,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import {
  getUsuarios,
  adicionarUsuario,
  atualizarUsuario,
  alternarNivelUsuario,
  alternarStatusUsuario,
  removerUsuario,
  sincronizarUsuariosServidor,
  UsuarioSistema,
  NivelUsuario,
} from '@/lib/usuarios';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'TODOS' | 'ADMIN' | 'BASICO'>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioSistema | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Form de Novo Usuário
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('On@2026');
  const [formNivel, setFormNivel] = useState<NivelUsuario>('BASICO');
  const [formCargo, setFormCargo] = useState('Consultor Comercial');
  const [formDepartamento, setFormDepartamento] = useState('Comercial');
  const [formTelefone, setFormTelefone] = useState('');

  const carregar = async () => {
    try {
      const serverUsers = await sincronizarUsuariosServidor();
      if (serverUsers) {
        setUsuarios(serverUsers);
        return;
      }
    } catch (e) {}
    setUsuarios(getUsuarios());
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem('on_usuario_logado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (parsed.perfil !== 'ADMIN') {
            alert('Acesso restrito: Apenas administradores têm permissão para acessar a gestão de equipe e usuários.');
            window.location.replace('/sistema/index.html');
            return;
          }
        }
      } catch (e) {}
    }
    carregar();
  }, []);

  const exibirFeedback = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setFeedbackMsg({ tipo, texto });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleCadastrarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim()) {
      exibirFeedback('Preencha pelo menos Nome e E-mail.', 'erro');
      return;
    }

    setSalvando(true);
    try {
      const novo = await adicionarUsuario({
        nome: formNome.trim(),
        email: formEmail.trim().toLowerCase(),
        credencialAcesso: formSenha || 'On@2026',
        nivel: formNivel,
        cargo: formCargo.trim() || 'Colaborador',
        departamento: formDepartamento || 'Operações',
        telefone: formTelefone.trim() || '(11) 99999-9999',
        status: 'ATIVO',
      });

      // Atualização imediata do estado React
      setUsuarios((prev) => [
        novo,
        ...prev.filter((u) => u.email.toLowerCase() !== novo.email.toLowerCase()),
      ]);

      setModalNovoAberto(false);
      // Limpa campos
      setFormNome('');
      setFormEmail('');
      setFormSenha('On@2026');
      setFormTelefone('');
      setFormNivel('BASICO');
      exibirFeedback(`Novo usuário "${novo.nome}" cadastrado com sucesso!`);
      await carregar();
    } catch (err: any) {
      exibirFeedback(err.message || 'Erro ao cadastrar usuário.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setSalvando(true);
    try {
      const atualizado = await atualizarUsuario(usuarioEditando.id, {
        nome: usuarioEditando.nome,
        email: usuarioEditando.email,
        cargo: usuarioEditando.cargo,
        departamento: usuarioEditando.departamento,
        telefone: usuarioEditando.telefone,
        nivel: usuarioEditando.nivel,
        status: usuarioEditando.status,
      });

      if (atualizado) {
        setUsuarios((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)));
      }

      setModalEditarAberto(false);
      setUsuarioEditando(null);
      exibirFeedback('Dados do usuário atualizados com sucesso!');
      await carregar();
    } catch (err: any) {
      exibirFeedback('Erro ao atualizar dados do usuário.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarNivel = async (id: string, nome: string, nivelAtual: NivelUsuario) => {
    const novoNivel = nivelAtual === 'ADMIN' ? 'BÁSICO' : 'ADMINISTRADOR';
    if (confirm(`Deseja alterar o nível de "${nome}" para ${novoNivel}?`)) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, nivel: nivelAtual === 'ADMIN' ? 'BASICO' : 'ADMIN' } : u))
      );
      await alternarNivelUsuario(id);
      exibirFeedback(`Nível de ${nome} alterado para ${novoNivel}!`);
      await carregar();
    }
  };

  const handleAlternarStatus = async (id: string, nome: string, statusAtual: string) => {
    const novo = statusAtual === 'ATIVO' ? 'Inativo' : 'Ativo';
    const novoStatus = statusAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: novoStatus } : u))
    );
    await alternarStatusUsuario(id);
    exibirFeedback(`Usuário ${nome} agora está ${novo}!`);
    await carregar();
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) {
      // Remove da interface visual de imediato
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      const ok = await removerUsuario(id);
      if (ok) {
        exibirFeedback(`Usuário ${nome} foi removido com sucesso.`);
        await carregar();
      } else {
        exibirFeedback(`Não é permitido excluir o Administrador principal da agência.`, 'erro');
        await carregar();
      }
    }
  };

  const enviarWhatsAppCredenciais = (u: UsuarioSistema) => {
    const tel = u.telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${u.nome}! Seu acesso ao portal administrativo da ON Agência de Eventos foi habilitado:\n\n` +
      `🌐 Link de Acesso: https://onagenciadeeventos.com.br/login/index.html\n` +
      `📧 E-mail: ${u.email}\n` +
      `🛡️ Nível de Acesso: ${u.nivel === 'ADMIN' ? 'Administrador (Acesso Total)' : 'Básico (Operacional & Vendas)'}\n\n` +
      `Por segurança institucional, sua senha temporária foi enviada pelo administrador. Altere-a no primeiro acesso.`
    );
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
  };

  // Filtragem
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.cargo.toLowerCase().includes(busca.toLowerCase()) ||
      u.departamento.toLowerCase().includes(busca.toLowerCase());

    const matchNivel = filtroNivel === 'TODOS' || u.nivel === filtroNivel;
    const matchStatus = filtroStatus === 'TODOS' || u.status === filtroStatus;

    return matchBusca && matchNivel && matchStatus;
  });

  const totalAdmins = usuarios.filter((u) => u.nivel === 'ADMIN').length;
  const totalBasicos = usuarios.filter((u) => u.nivel === 'BASICO').length;
  const totalAtivos = usuarios.filter((u) => u.status === 'ATIVO').length;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral */}
      <Sidebar paginaAtiva="usuarios" />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Moderno */}
        <header className="bg-white/90 backdrop-blur-md rounded-[28px] p-5 lg:px-7 lg:py-5 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_6px_14px_rgba(124,58,237,0.25)] flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Gestão de Usuários & Níveis de Acesso
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {usuarios.length} Usuários
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cadastre membros da equipe e defina o nível de permissão: <strong>Administrador (Admin)</strong> ou <strong>Básico (Operacional)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setModalNovoAberto(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2.5 rounded-2xl shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Novo Usuário</span>
            </button>
          </div>
        </header>

        {/* Notificação Flutuante de Feedback */}
        {feedbackMsg && (
          <div
            className={`mb-4 p-3.5 px-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-2xs animate-fade-in ${
              feedbackMsg.tipo === 'sucesso'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedbackMsg.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.texto}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 CARDS RESUMO DE USUÁRIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Total de Membros</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{usuarios.length}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Colaboradores no sistema</p>
          </div>

          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Nível Administrador</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">{totalAdmins}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">👑 Acesso total irrestrito</p>
          </div>

          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Nível Básico</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600">{totalBasicos}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">👤 Operacional & Vendas</p>
          </div>

          <div className="bg-white rounded-[26px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Status Ativos</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{totalAtivos}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Podem autenticar normalmente</p>
          </div>
        </div>

        {/* BANNER EXPLICATIVO DOS NÍVEIS (ADMIN vs BÁSICO) */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-[28px] p-6 text-white mb-6 shadow-xl relative overflow-hidden border border-purple-500/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 className="text-base font-black tracking-tight">
                Regras & Permissões por Nível de Usuário
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-amber-400/30">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-black">
                    👑
                  </span>
                  <span className="text-sm font-extrabold text-amber-300">
                    Administrador (Admin)
                  </span>
                </div>
                <ul className="space-y-1.5 text-slate-200">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                    Acesso total e irrestrito a todos os módulos e configurações.
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                    Gerenciar, cadastrar, editar e excluir usuários da equipe.
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                    Acesso a relatórios financeiros confidenciais e métricas de tráfego.
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                    Emissão e cancelamento de boletos Sicredi e regras de comissões (4%).
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-blue-400/30">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black">
                    👤
                  </span>
                  <span className="text-sm font-extrabold text-blue-300">
                    Básico (Operacional)
                  </span>
                </div>
                <ul className="space-y-1.5 text-slate-200">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                    <strong>Aba Completa de Vendas de Álbuns:</strong> cadastro de kits, brindes, cartão, PIX e boletos Sicredi.
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                    <strong>Aba Completa de Projetos de Formatura:</strong> gestão de eventos, colação, baile e adesões.
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                    <strong>Aba Completa do CRM da Turma:</strong> funil comercial, qualificação e conversão de turmas.
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
                    <strong>Demandas Internas:</strong> execução de tarefas, checklists e avanço de etapas de trabalho.
                  </li>
                  <li className="flex items-center text-slate-400">
                    <XCircle className="w-3.5 h-3.5 text-rose-400 mr-1.5 shrink-0" />
                    Sem permissão apenas para gerenciar senhas de equipe ou editar parâmetros bancários.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS & BUSCA */}
        <div className="bg-white rounded-[24px] p-4 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, cargo ou setor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto flex-wrap">
            {/* Filtro por Nível */}
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
              <button
                onClick={() => setFiltroNivel('TODOS')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroNivel === 'TODOS' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Todos Níveis
              </button>
              <button
                onClick={() => setFiltroNivel('ADMIN')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroNivel === 'ADMIN' ? 'bg-white text-amber-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                👑 Admins ({totalAdmins})
              </button>
              <button
                onClick={() => setFiltroNivel('BASICO')}
                className={`px-3 py-1.5 rounded-xl transition ${filtroNivel === 'BASICO' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                👤 Básicos ({totalBasicos})
              </button>
            </div>

            {/* Filtro por Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="TODOS">Todos Status</option>
              <option value="ATIVO">Somente Ativos</option>
              <option value="INATIVO">Somente Inativos</option>
            </select>
          </div>
        </div>

        {/* TABELA DE USUÁRIOS CADASTRADOS */}
        <div className="bg-white rounded-[28px] shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              Colaboradores Cadastrados ({usuariosFiltrados.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Clique no nível para alternar entre Admin e Básico
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Colaborador</th>
                  <th className="py-3.5 px-5">E-mail de Login</th>
                  <th className="py-3.5 px-5">Cargo / Setor</th>
                  <th className="py-3.5 px-5">Nível de Acesso</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Último Acesso</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const isAdmin = u.nivel === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        {/* Avatar e Nome */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${u.avatarCor || 'from-purple-600 to-indigo-600 text-white'} font-black flex items-center justify-center text-xs shadow-2xs shrink-0`}
                            >
                              {u.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>{u.nome}</span>
                                {isAdmin && (
                                  <span title="Administrador Master">👑</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{u.telefone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="py-4 px-5 font-medium text-slate-700">
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        </td>

                        {/* Cargo & Setor */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-900">{u.cargo}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {u.departamento}
                          </span>
                        </td>

                        {/* Nível de Acesso (ADMIN vs BASICO) com Botão para Alternar */}
                        <td className="py-4 px-5">
                          <button
                            onClick={() => handleAlternarNivel(u.id, u.nome, u.nivel)}
                            className={`group inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition hover:scale-105 ${
                              isAdmin
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            }`}
                            title="Clique para alternar o nível deste usuário"
                          >
                            <span>{isAdmin ? '👑 ADMIN' : '👤 BÁSICO'}</span>
                            <span className="text-[9px] text-slate-400 group-hover:text-slate-600 underline">
                              (alternar)
                            </span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          <button
                            onClick={() => handleAlternarStatus(u.id, u.nome, u.status)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              u.status === 'ATIVO'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Clique para ativar/inativar"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{u.status}</span>
                          </button>
                        </td>

                        {/* Último Acesso */}
                        <td className="py-4 px-5 text-slate-500 font-medium text-[11px]">
                          {u.ultimoAcesso}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Enviar credenciais WhatsApp */}
                          <button
                            onClick={() => enviarWhatsAppCredenciais(u)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                            title="Enviar login e senha no WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setUsuarioEditando({ ...u });
                              setModalEditarAberto(true);
                            }}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="Editar Dados do Usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => handleExcluir(u.id, u.nome)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition"
                            title="Remover Usuário"
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

        {/* MODAL: ADICIONAR NOVO USUÁRIO */}
        {modalNovoAberto && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] p-6 lg:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Adicionar Novo Usuário
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cadastre o colaborador e defina o nível de acesso.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalNovoAberto(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCadastrarNovo} className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Gabriela Castro"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* E-mail de Login */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    E-mail de Login (Corporativo) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: gabriela@formatura.com.br"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* NÍVEL DE ACESSO: SELEÇÃO VISUAL (ADMIN vs BÁSICO) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Nível de Acesso ao Sistema *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Opção BÁSICO */}
                    <div
                      onClick={() => setFormNivel('BASICO')}
                      className={`cursor-pointer p-3.5 rounded-2xl border-2 transition ${
                        formNivel === 'BASICO'
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-base">👤</span>
                        <span className="text-xs font-black text-slate-900">
                          Básico
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Operacional, vendas de álbuns e CRM comercial. Sem acesso financeiro ou de equipe.
                      </p>
                    </div>

                    {/* Opção ADMIN */}
                    <div
                      onClick={() => setFormNivel('ADMIN')}
                      className={`cursor-pointer p-3.5 rounded-2xl border-2 transition ${
                        formNivel === 'ADMIN'
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-base">👑</span>
                        <span className="text-xs font-black text-amber-900">
                          Administrador
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Acesso total: gerenciar equipe, relatórios gerenciais, métricas do site e finanças.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cargo e Departamento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={formCargo}
                      onChange={(e) => setFormCargo(e.target.value)}
                      placeholder="Ex: Consultor Comercial"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Departamento
                    </label>
                    <select
                      value={formDepartamento}
                      onChange={(e) => setFormDepartamento(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="Comercial">Comercial</option>
                      <option value="Fotografia & Vídeo">Fotografia & Vídeo</option>
                      <option value="Atendimento & Suporte">Atendimento</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Produção & Eventos">Produção de Eventos</option>
                      <option value="Diretoria">Diretoria</option>
                    </select>
                  </div>
                </div>

                {/* Telefone WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telefone WhatsApp (para envio do login)
                  </label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Senha Provisória */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Senha Provisória
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormSenha('On@' + Math.floor(1000 + Math.random() * 9000))}
                      className="text-[11px] font-bold text-purple-700 hover:underline"
                    >
                      Gerar Senha Aleatória
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Botões do Modal */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setModalNovoAberto(false)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-1.5"
                  >
                    {salvando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <span>Salvar e Cadastrar Usuário</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDITAR USUÁRIO */}
        {modalEditarAberto && usuarioEditando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[32px] p-6 lg:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Editar Usuário
                    </h3>
                    <p className="text-xs text-slate-500">
                      Atualize permissões, cargo ou dados de contato.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalEditarAberto(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarEdicao} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={usuarioEditando.nome}
                    onChange={(e) =>
                      setUsuarioEditando({ ...usuarioEditando, nome: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={usuarioEditando.email}
                    onChange={(e) =>
                      setUsuarioEditando({ ...usuarioEditando, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Seleção de Nível */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Nível de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() =>
                        setUsuarioEditando({ ...usuarioEditando, nivel: 'BASICO' })
                      }
                      className={`cursor-pointer p-3 rounded-2xl border-2 transition ${
                        usuarioEditando.nivel === 'BASICO'
                          ? 'border-blue-500 bg-blue-50/70'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-900">👤 Básico</div>
                      <p className="text-[10px] text-slate-500">Operacional & Vendas</p>
                    </div>

                    <div
                      onClick={() =>
                        setUsuarioEditando({ ...usuarioEditando, nivel: 'ADMIN' })
                      }
                      className={`cursor-pointer p-3 rounded-2xl border-2 transition ${
                        usuarioEditando.nivel === 'ADMIN'
                          ? 'border-amber-500 bg-amber-50/70'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs font-black text-amber-900">👑 Administrador</div>
                      <p className="text-[10px] text-slate-500">Acesso Total Irrestrito</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={usuarioEditando.cargo}
                      onChange={(e) =>
                        setUsuarioEditando({ ...usuarioEditando, cargo: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={usuarioEditando.departamento}
                      onChange={(e) =>
                        setUsuarioEditando({ ...usuarioEditando, departamento: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telefone WhatsApp
                  </label>
                  <input
                    type="text"
                    value={usuarioEditando.telefone}
                    onChange={(e) =>
                      setUsuarioEditando({ ...usuarioEditando, telefone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setModalEditarAberto(false)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-1.5"
                  >
                    {salvando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>Salvar Alterações</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
