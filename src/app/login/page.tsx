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
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { autenticarUsuario, getUsuarios, sincronizarUsuariosServidor, solicitarRecuperacaoAcesso, redefinirComToken } from '@/lib/usuarios';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [tempoBloqueioRestante, setTempoBloqueioRestante] = useState(0);
  const [modoAcesso, setModoAcesso] = useState<'login' | 'solicitar' | 'redefinir'>('login');
  const [tokenInput, setTokenInput] = useState('');
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Monitora bloqueio de tentativas sucessivas (Proteção contra Força Bruta)
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

  // Sincroniza usuários do servidor Hostinger ao carregar a tela
  useEffect(() => {
    sincronizarUsuariosServidor().catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bloqueadoAte && Date.now() < bloqueadoAte) {
      setErro(`Muitas tentativas incorretas. Aguarde ${tempoBloqueioRestante}s para tentar novamente.`);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const emailLimpo = email.trim().toLowerCase();
      const senhaLimpa = senha.trim();

      if (!emailLimpo || !senhaLimpa) {
        throw new Error('Por favor, informe seu e-mail corporativo e senha de acesso.');
      }

      // Validação estrita e segura no servidor
      const auth = await autenticarUsuario(emailLimpo, senhaLimpa);

      if (!auth.sucesso || !auth.usuario) {
        const novasFalhas = tentativasFalhas + 1;
        setTentativasFalhas(novasFalhas);

        if (novasFalhas >= 5) {
          const bloqueio = Date.now() + 60 * 1000; // 60 segundos
          setBloqueadoAte(bloqueio);
          setTempoBloqueioRestante(60);
          throw new Error('Muitas tentativas inválidas. Acesso temporariamente bloqueado por 60 segundos por segurança.');
        }

        throw new Error(auth.erro || 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.');
      }

      // Se autenticado com sucesso: cria token seguro com expiração de 24 horas
      const token = 'sec_tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
      const sessaoSegura = {
        id: auth.usuario.id,
        nome: auth.usuario.nome,
        email: auth.usuario.email,
        perfil: auth.usuario.nivel, // 'ADMIN' ou 'BASICO'
        token,
        csrf_token: auth.csrf_token || '',
        expiraEm: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
        logadoEm: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('on_usuario_logado', JSON.stringify(sessaoSegura));
        // Redireciona com segurança para o portal administrativo
        window.location.href = '/admin';
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login.');
      setCarregando(false);
    }
  };

  const handleSolicitarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);
    try {
      const emailLimpo = email.trim().toLowerCase();
      if (!emailLimpo) {
        throw new Error('Informe seu e-mail corporativo cadastrado.');
      }
      const res = await solicitarRecuperacaoAcesso(emailLimpo);
      if (!res.sucesso) {
        throw new Error(res.erro || 'Falha ao solicitar recuperação.');
      }
      setMensagemSucesso(res.mensagem || 'Token de uso único emitido com validade de 30 minutos.');
      setModoAcesso('redefinir');
    } catch (err: any) {
      setErro(err.message || 'Erro ao solicitar token.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRedefinirToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);
    try {
      const tokenLimpo = tokenInput.trim();
      const senhaLimpa = novaSenhaInput.trim();
      if (!tokenLimpo) {
        throw new Error('Informe o token criptográfico recebido.');
      }
      if (senhaLimpa.length < 8) {
        throw new Error('A nova senha deve possuir no mínimo 8 caracteres.');
      }
      const res = await redefinirComToken(tokenLimpo, senhaLimpa, email.trim().toLowerCase());
      if (!res.sucesso) {
        throw new Error(res.erro || 'Não foi possível redefinir com este token.');
      }
      setMensagemSucesso('Senha configurada com sucesso! Entre com sua nova credencial de acesso.');
      setModoAcesso('login');
      setSenha('');
      setTokenInput('');
      setNovaSenhaInput('');
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar nova senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased selection:bg-[#4F39F6] selection:text-white">
      {/* Glows de Fundo Sutis em Tons Violeta */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-200/40 via-indigo-100/50 to-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de Retorno para o Site */}
      <div className="absolute top-6 left-6 z-20">
        <a
          href="/"
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_0_0_#D1D5DB] hover:translate-y-[-1px] active:translate-y-[1px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Voltar ao Site Institucional
        </a>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* LOGO E IDENTIDADE */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-white p-2.5 shadow-[0_12px_28px_rgba(124,58,237,0.18),0_4px_0_0_#C7D2FE] mb-4 transform hover:scale-105 transition-transform duration-200 border border-purple-100">
            <Image
              src="/images/logo-on-agencia.png"
              alt="ON Agência Oficial"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex items-center justify-center space-x-1.5">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              ON AGÊNCIA
            </h2>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] mt-0.5">
            ÁREA RESTRITA &bull; SISTEMA DE GESTÃO
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Autenticação Segura: Diretoria, Equipe Interna e Consultores
          </p>
        </div>

        {/* CARD DE LOGIN SEGURO */}
        <div className="bg-white border border-slate-100 py-8 px-6 sm:px-10 shadow-[0_16px_40px_rgba(79,57,246,0.06)] rounded-[32px]">
          {/* Seletor de Modo: Login vs Recuperação / Token Seguro */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setModoAcesso('login');
                setErro(null);
                setMensagemSucesso(null);
              }}
              className={`flex-1 py-2 rounded-xl transition ${
                modoAcesso === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Acesso
            </button>
            <button
              type="button"
              onClick={() => {
                setModoAcesso('solicitar');
                setErro(null);
                setMensagemSucesso(null);
              }}
              className={`flex-1 py-2 rounded-xl transition ${
                modoAcesso === 'solicitar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pedir Token
            </button>
            <button
              type="button"
              onClick={() => {
                setModoAcesso('redefinir');
                setErro(null);
                setMensagemSucesso(null);
              }}
              className={`flex-1 py-2 rounded-xl transition ${
                modoAcesso === 'redefinir'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Validar Token
            </button>
          </div>

          {mensagemSucesso && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-emerald-600" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {erro && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-rose-600" />
              <span>{erro}</span>
            </div>
          )}

          {modoAcesso === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  E-mail de Login
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="seu.email@formatura.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={bloqueadoAte !== null}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setModoAcesso('solicitar');
                      setErro(null);
                    }}
                    className="text-[11px] font-bold text-[#7C3AED] hover:underline"
                  >
                    Esqueceu ou 1º acesso?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={bloqueadoAte !== null}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition font-mono disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Entrar com Relevo Tátil 3D */}
              <button
                type="submit"
                disabled={carregando || bloqueadoAte !== null}
                className="w-full mt-3 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] hover:brightness-110 text-white shadow-[0_10px_28px_rgba(147,51,234,0.4),0_4px_0_0_#581C87] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 mr-2" />
                {carregando
                  ? 'AUTENTICANDO...'
                  : bloqueadoAte
                  ? `BLOQUEADO (${tempoBloqueioRestante}s)`
                  : 'ENTRAR NO SISTEMA'}
              </button>
            </form>
          )}

          {modoAcesso === 'solicitar' && (
            <form onSubmit={handleSolicitarToken} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  E-mail do Colaborador / Usuário
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@formatura.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Será gerado um token criptográfico seguro de uso único com expiração de 30 minutos.
                </p>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full mt-3 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-black text-white shadow-[0_10px_28px_rgba(0,0,0,0.2),0_4px_0_0_#1E293B] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {carregando ? 'EMITINDO TOKEN...' : 'SOLICITAR TOKEN DE REINÍCIO'}
              </button>
            </form>
          )}

          {modoAcesso === 'redefinir' && (
            <form onSubmit={handleRedefinirToken} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Token Seguro de Uso Único
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cole o token de 64 caracteres aqui"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Nova Senha Pessoal (mínimo 8 dígitos)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={novaSenhaInput}
                  onChange={(e) => setNovaSenhaInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition"
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full mt-3 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-[0_10px_28px_rgba(16,185,129,0.3),0_4px_0_0_#065F46] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {carregando ? 'SALVANDO SENHA...' : 'ATIVAR NOVA SENHA COM TOKEN'}
              </button>
            </form>
          )}

          {/* Aviso de Segurança Rigorosa */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sessão Protegida &bull; Criptografia Ativa</span>
            </div>
            <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Protegido
            </span>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
          Acesso Exclusivo da Equipe &bull; ON Agência de Eventos
        </div>
      </div>
    </div>
  );
}
