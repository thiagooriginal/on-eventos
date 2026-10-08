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
} from 'lucide-react';

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      // Redireciona para o painel de controle do sistema interno
      router.push(data.redirectTo || '/');
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      {/* Glows de Fundo inspirados na On Agência */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-fuchsia-700/20 rounded-full blur-3xl pointer-events-none" />

      {/* Botão de Retorno para o Site */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/site"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-2 rounded-lg bg-slate-900/60 border border-purple-900/40 backdrop-blur-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para o Site Oficial
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* LOGO E IDENTIDADE */}
        <div className="text-center">
          <Link href="/site" className="inline-block relative w-20 h-20 mb-3 hover:scale-105 transition-transform">
            <Image
              src="/images/logo-on-agencia.png"
              alt="Logo On Agência de Eventos"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            SISTEMA DE GESTÃO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-300">
              ON EVENTOS
            </span>
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Acesso Restrito: Diretoria, Equipe Interna e Vendedores
          </p>
        </div>

        {/* CARD DE LOGIN */}
        <div className="mt-8 bg-slate-900/90 border border-purple-900/50 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl backdrop-blur-md">
          {erro && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/80 text-rose-300 text-xs flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-rose-400" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="exemplo@formatura.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-900/60 bg-slate-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-purple-900/60 bg-slate-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center"
            >
              <Lock className="w-3.5 h-3.5 mr-2" />
              {carregando ? 'AUTENTICANDO...' : 'ENTRAR NA PLATAFORMA'}
            </button>
          </form>

          {/* DICAS DE ACESSO RÁPIDO PARA DEMONSTRAÇÃO */}
          <div className="mt-8 pt-6 border-t border-purple-900/30">
            <span className="text-2xs font-mono uppercase tracking-widest text-purple-400 font-bold block mb-2">
              Usuários Demonstrativos de Teste:
            </span>
            <div className="space-y-1.5 text-2xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@formatura.com.br');
                  setSenha('123456');
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-purple-900/30 flex justify-between items-center transition"
              >
                <span>
                  <strong className="text-slate-300">Admin:</strong> admin@formatura.com.br
                </span>
                <span className="text-fuchsia-400 font-bold">Preencher</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('vendedor.rodrigo@formatura.com.br');
                  setSenha('123456');
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-purple-900/30 flex justify-between items-center transition"
              >
                <span>
                  <strong className="text-slate-300">Vendedor:</strong> vendedor.rodrigo@formatura.com.br
                </span>
                <span className="text-fuchsia-400 font-bold">Preencher</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-6 text-center text-2xs text-slate-400 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          Conexão Segura & Criptografia Ponta a Ponta
        </div>
      </div>
    </div>
  );
}
