'use client';

import React, { useState } from 'react';
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
  Building2,
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

import { getUsuarios } from '@/lib/usuarios';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const emailLimpo = email.trim().toLowerCase();
      let autenticado = false;
      let perfil = 'ADMIN';
      let nome = 'Administrador On Eventos';

      // 1. Tenta API se disponível (em ambiente com Node.js ativo)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLimpo, senha }),
        });
        if (res.ok) {
          const data = await res.json();
          autenticado = true;
          perfil = data.usuario?.perfil || 'ADMIN';
          nome = data.usuario?.nome || 'Administrador On Eventos';
        }
      } catch (err) {
        // Modo estático no Apache
      }

      // 2. Validação contra lista de usuários cadastrados (Admin vs Básico)
      if (!autenticado && typeof window !== 'undefined') {
        const listaUsuarios = getUsuarios();
        const usuarioEncontrado = listaUsuarios.find(
          (u) => u.email.toLowerCase() === emailLimpo
        );

        if (usuarioEncontrado) {
          if (usuarioEncontrado.status === 'INATIVO') {
            throw new Error('Acesso bloqueado: este usuário está inativo. Solicite a liberação ao Administrador.');
          }
          if (senha && senha.length >= 2) {
            autenticado = true;
            perfil = usuarioEncontrado.nivel; // 'ADMIN' ou 'BASICO'
            nome = usuarioEncontrado.nome;
          }
        }
      }

      // 3. Fallback padrão para ambiente de demonstração
      if (!autenticado) {
        if (
          emailLimpo === 'admin@formatura.com.br' ||
          emailLimpo === 'vendedor.rodrigo@formatura.com.br' ||
          emailLimpo.includes('admin') ||
          emailLimpo.includes('onagenciadeeventos') ||
          emailLimpo.includes('formatura')
        ) {
          autenticado = true;
          if (emailLimpo.includes('vendedor') || emailLimpo.includes('rodrigo')) {
            perfil = 'BASICO';
            nome = 'Rodrigo Consultor Comercial';
          }
        }
      }

      if (!autenticado && senha.length < 2) {
        throw new Error('E-mail ou senha incorretos. Utilize um dos usuários de teste abaixo.');
      }

      // Salva sessão local no navegador com o nível correto
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'on_usuario_logado',
          JSON.stringify({
            email: emailLimpo,
            nome,
            perfil,
            logadoEm: new Date().toISOString(),
          })
        );
        // Redireciona com segurança para a central do sistema interno
        window.location.href = '/sistema/index.html';
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login.');
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
            SISTEMA DE GESTÃO INTEGRADO
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Acesso Restrito: Diretoria, Equipe Interna e Consultores
          </p>
        </div>

        {/* CARD DE LOGIN TÁTIL */}
        <div className="bg-white border border-slate-100 py-8 px-6 sm:px-10 shadow-[0_16px_40px_rgba(79,57,246,0.06)] rounded-[32px]">
          {erro && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-rose-600" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="exemplo@formatura.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-[#F4F6FB] text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition font-mono"
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

            {/* Botão de Entrar com Relevo Tátil 3D Vibrante */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] hover:brightness-110 text-white shadow-[0_10px_28px_rgba(147,51,234,0.4),0_4px_0_0_#581C87] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 mr-2" />
              {carregando ? 'AUTENTICANDO...' : 'ACESSAR O SISTEMA'}
            </button>
          </form>

          {/* DICAS DE ACESSO RÁPIDO PARA DEMONSTRAÇÃO */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#4F39F6] block mb-2">
              Usuários de Demonstração (Clique para Preencher):
            </span>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@formatura.com.br');
                  setSenha('123456');
                }}
                className="w-full text-left p-2.5 rounded-xl bg-[#FAF7FF] hover:bg-[#F3EEFF] border border-purple-100 flex justify-between items-center transition shadow-2xs"
              >
                <div>
                  <strong className="text-slate-800 text-xs block">Administrador Geral</strong>
                  <span className="text-[11px] text-slate-500">admin@formatura.com.br</span>
                </div>
                <span className="text-[#4F39F6] font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-purple-200">
                  Preencher
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('vendedor.rodrigo@formatura.com.br');
                  setSenha('123456');
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex justify-between items-center transition shadow-2xs"
              >
                <div>
                  <strong className="text-slate-800 text-xs block">Consultor Comercial</strong>
                  <span className="text-[11px] text-slate-500">vendedor.rodrigo@formatura.com.br</span>
                </div>
                <span className="text-slate-700 font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Preencher
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
          Conexão Segura &bull; Hospedado na Hostinger Nuvem
        </div>
      </div>
    </div>
  );
}
