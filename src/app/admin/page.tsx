'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  GraduationCap,
  ClipboardList,
  Activity,
  Building2,
  Users,
  Wallet,
  Kanban,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { autenticarUsuario, sincronizarUsuariosServidor, UsuarioSistema } from '@/lib/usuarios';

interface SessaoUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  token: string;
  expiraEm: number;
  logadoEm: string;
}

export default function AdminPortalPage() {
  const router = useRouter();
  const [usuarioLogado, setUsuarioLogado] = useState<SessaoUsuario | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  // Estados do Formulário de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [tempoBloqueioRestante, setTempoBloqueioRestante] = useState(0);

  // Verifica sessão ativa ao carregar
  useEffect(() => {
    try {
      const sessaoStr = localStorage.getItem('on_usuario_logado');
      if (sessaoStr) {
        const sessao: SessaoUsuario = JSON.parse(sessaoStr);
        if (sessao && sessao.expiraEm > Date.now()) {
          setUsuarioLogado(sessao);
        } else {
          localStorage.removeItem('on_usuario_logado');
        }
      }
    } catch (e) {}
    setCarregandoSessao(false);

    // Sincroniza usuários do servidor
    sincronizarUsuariosServidor().catch(() => {});
  }, []);

  // Monitora bloqueio de tentativas sucessivas
  useEffect(() => {
    if (bloqueadoAte) {
      const interval = setInterval(() => {
        const restante = Math.ceil((bloqueadoAte - Date.now()) / 1000);
        if (restante <= 0) {
          setBloqueadoAte(null);
          setTentativasFalhas(0);
          setTempoBloqueioRestante(0);
          setErro(null);
        } else {
          setTempoBloqueioRestante(restante);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [bloqueadoAte]);

  // Executar Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bloqueadoAte && Date.now() < bloqueadoAte) {
      setErro(`Muitas tentativas incorretas. Aguarde ${tempoBloqueioRestante}s para tentar novamente.`);
      return;
    }

    setCarregandoLogin(true);
    setErro(null);

    try {
      const emailLimpo = email.trim().toLowerCase();
      const senhaLimpa = senha.trim();

      if (!emailLimpo || !senhaLimpa) {
        throw new Error('Por favor, informe seu e-mail corporativo e senha.');
      }

      let auth = autenticarUsuario(emailLimpo, senhaLimpa);
      if (!auth.sucesso) {
        try {
          await sincronizarUsuariosServidor();
          auth = autenticarUsuario(emailLimpo, senhaLimpa);
        } catch (e) {}
      }

      if (!auth.sucesso || !auth.usuario) {
        const novasFalhas = tentativasFalhas + 1;
        setTentativasFalhas(novasFalhas);
        if (novasFalhas >= 5) {
          const bloqueio = Date.now() + 60 * 1000;
          setBloqueadoAte(bloqueio);
          setTempoBloqueioRestante(60);
          throw new Error('Muitas tentativas inválidas. Acesso temporariamente bloqueado por 60 segundos por segurança.');
        }
        throw new Error(auth.erro || 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.');
      }

      const token = 'sec_tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
      const sessaoSegura: SessaoUsuario = {
        id: auth.usuario.id,
        nome: auth.usuario.nome,
        email: auth.usuario.email,
        perfil: auth.usuario.nivel,
        token,
        expiraEm: Date.now() + 24 * 60 * 60 * 1000,
        logadoEm: new Date().toISOString(),
      };

      localStorage.setItem('on_usuario_logado', JSON.stringify(sessaoSegura));
      setUsuarioLogado(sessaoSegura);
      // Redireciona diretamente para fotos (gestão de vendas e álbuns)
      router.push('/fotos');
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login.');
    } finally {
      setCarregandoLogin(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('on_usuario_logado');
    setUsuarioLogado(null);
    setEmail('');
    setSenha('');
  };

  if (carregandoSessao) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // TELA DE LOGIN INTERNO (SE NÃO ESTIVER LOGADO)
  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1145] via-[#2A165F] to-[#12082B] flex flex-col items-center justify-center p-4 antialiased font-sans">
        {/* Card Central de Login */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)] border border-white/20 relative overflow-hidden animate-fade-in">
          {/* Efeito luminoso topo */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Cabeçalho */}
          <div className="text-center relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5842BD] to-[#36218A] p-2.5 mx-auto shadow-lg shadow-purple-500/20 flex items-center justify-center mb-4">
              <Image
                src="/images/logo-on-agencia.png"
                alt="ON Agência Oficial"
                width={36}
                height={36}
                className="object-contain brightness-110"
              />
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-purple-100 text-purple-900 border border-purple-200 mb-2">
              <Lock className="w-3 h-3 mr-1 text-purple-700" />
              Painel Administrativo Interno
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Acesso da Equipe ON
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Digite suas credenciais autorizadas para gerenciar o sistema
            </p>
          </div>

          {/* Alerta de Erro */}
          {erro && (
            <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-800 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{erro}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="usuario@onagenciadeeventos.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={carregandoLogin || !!bloqueadoAte}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-3 focus:ring-purple-600/10 transition disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={carregandoLogin || !!bloqueadoAte}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-3 focus:ring-purple-600/10 transition disabled:opacity-60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg cursor-pointer transition"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregandoLogin || !!bloqueadoAte}
              className="w-full py-3.5 bg-gradient-to-r from-[#5842BD] via-[#4833A8] to-[#36218A] hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-60"
            >
              {carregandoLogin ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel Administrativo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link para Área do Formando */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-xs text-purple-700 hover:text-purple-900 font-bold inline-flex items-center space-x-1 transition"
            >
              <span>Voltar para a Área do Formando</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <p className="mt-6 text-[11px] text-purple-300/80 font-medium text-center flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ON Agência de Eventos LTDA &bull; Conexão Criptografada SSL</span>
        </p>
      </div>
    );
  }

  // TELA DO PORTAL ADMINISTRATIVO (QUANDO AUTENTICADO)
  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col antialiased font-sans">
      {/* Header do Painel Admin */}
      <header className="bg-gradient-to-r from-[#1E1145] via-[#2A165F] to-[#36218A] text-white px-4 sm:px-8 py-4 shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-2 shadow-md flex items-center justify-center">
              <Image
                src="/images/logo-on-agencia.png"
                alt="ON Agência Oficial"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-black text-sm tracking-wider text-white block leading-tight">
                ON AGÊNCIA
              </span>
              <span className="text-[10px] text-emerald-300 font-bold flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Portal Administrativo Interno
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/15 shadow-2xs flex items-center space-x-1.5 transition"
              title="Abrir o portal que o aluno vê"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Área do Aluno</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-xl border border-rose-300/30 shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner de Boas-Vindas */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Olá, {usuarioLogado.nome}! 👋
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                {usuarioLogado.perfil === 'ADMIN' ? 'Diretoria / Administrador' : 'Equipe Operacional'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Selecione o módulo administrativo que deseja gerenciar hoje.
            </p>
          </div>

          <Link
            href="/fotos"
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Acessar Vendas de Álbuns & Sicredi</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Grade de Módulos Administrativos */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
            Módulos de Gestão Disponíveis
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Vendas de Álbuns & Boletos Sicredi (DESTAQUE) */}
            <Link
              href="/fotos"
              className="p-5 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 rounded-3xl border-2 border-emerald-300 hover:border-emerald-500 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Principal &bull; Sicredi API
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                  Gestão de Álbuns & Fotos
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Cadastro de vendas de kits, emissão automática de carnês Sicredi, liquidações em tempo real e controle de produção.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Abrir Vendas</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 2: Alunos & Formandos */}
            <Link
              href="/alunos"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Base de Clientes
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                  Alunos & Adesões
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Consulta de formandos cadastrados, códigos individuais, turmas e adesões contratuais.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Ver Alunos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 3: Demandas & Processos */}
            <Link
              href="/demandas"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Operações
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition">
                  Demandas & Tarefas
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Kanban de tarefas operacionais, atribuição a colaboradores e contagem regressiva de prazos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Ver Demandas</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 4: Métricas & Telemetria */}
            <Link
              href="/metricas"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    Ao Vivo
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition">
                  Métricas & Telemetria
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Acompanhamento de visitantes únicos em tempo real, tempo de permanência e cliques nos botões.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>Ver Métricas</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 5: Instituições & Faculdades */}
            <Link
              href="/instituicoes"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Parceiros
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition">
                  Instituições & Faculdades
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Cadastro de faculdades, campi, colégios e contatos de coordenação das turmas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Ver Instituições</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 6: Usuários & Permissões */}
            <Link
              href="/usuarios"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                    Acessos
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-rose-700 transition">
                  Usuários & Equipe
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Gerenciamento de colaboradores autorizados, senhas, cargos e níveis de privilégio administrativo.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
                <span>Gerenciar Equipe</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 7: Financeiro Geral */}
            <Link
              href="/financeiro"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Finanças
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition">
                  Módulo Financeiro Geral
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Extratos de arrecadação, fluxo de caixa e relatórios consolidados de receitas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Abrir Financeiro</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 8: CRM & Campanhas */}
            <Link
              href="/crm"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Kanban className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Comercial
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                  CRM & Campanhas
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Funil comercial de captação de novas turmas de formandos e oportunidades de contrato.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Abrir CRM</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 9: Central do Sistema Completa */}
            <Link
              href="/sistema"
              className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-105 transition">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Visão Geral
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                  Central do Sistema
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Painel de controle executivo com visão integrada de todos os departamentos da ON Agência.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Acessar Central</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
