import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Megaphone, Send, Clock, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default async function CampanhasPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="campanhas" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-white shadow-[0_6px_14px_rgba(6,182,212,0.25)] flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Campanhas de Notificação & Cobrança
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Cadência Segura
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Disparos por E-mail (Gmail) e WhatsApp com cancelamento instantâneo se liquidado.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/sistema/index.html"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-[0_3px_0_0_#D1D5DB] border border-slate-200 hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 space-y-6">
          {/* Painel de Criação e Configuração de Cadência */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 lg:p-7 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                  <Megaphone className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Nova Campanha de Mensagens com Ritmo Seguro
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Anti-Bloqueio Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Turma / Projeto Alvo
                </label>
                <select className="w-full text-xs font-semibold rounded-2xl border border-slate-200 p-3 bg-[#F4F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F39F6]">
                  <option>Saúde Cruzeiro do Sul 2026.2 (Enfermagem e Biomedicina)</option>
                  <option>Direito Mackenzie 2026.1 (Turma A e B)</option>
                  <option>Engenharia Poli USP 2026.2</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Filtro de Destinatários
                </label>
                <select className="w-full text-xs font-semibold rounded-2xl border border-slate-200 p-3 bg-[#F4F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F39F6]">
                  <option>Apenas Alunos com Parcelas Pendentes / Vencidas</option>
                  <option>Todos os Alunos da Turma</option>
                  <option>Alunos sem 1ª Parcela Paga</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Canal de Envio
                </label>
                <select className="w-full text-xs font-semibold rounded-2xl border border-slate-200 p-3 bg-[#F4F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F39F6]">
                  <option>E-mail (Gmail Oficial) + WhatsApp Oficial</option>
                  <option>Apenas WhatsApp Oficial</option>
                  <option>Apenas E-mail (Gmail)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Texto da Notificação / Mensagem de Regularização
                </label>
                <textarea
                  rows={5}
                  defaultValue="Olá {aluno_nome}! Lembramos que sua parcela da formatura vence em breve. Acesse seu aplicativo do formando para obter a 2ª via ou efetuar o pagamento via Pix sem burocracia."
                  className="w-full text-xs rounded-2xl border border-slate-200 p-3.5 bg-[#F4F6FB] focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner"
                />
              </div>

              <div className="p-5 bg-[#FAF7FF] rounded-2xl border border-purple-100 text-xs text-slate-600 space-y-3.5 flex flex-col justify-center">
                <span className="font-bold text-purple-900 block text-sm">
                  Mecanismo de Proteção & Anti-Bloqueio
                </span>
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>
                    <strong>Cadência Controlada:</strong> Envio gradual espaçado (ex: 1 mensagem a cada 45-90 segundos) para evitar bloqueios de linha ou quotas do provedor.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>
                    <strong>Checagem Instantânea (JIT):</strong> Se o formando pagar a parcela enquanto a mensagem aguarda na fila, o disparo é cancelado no mesmo instante.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                className="px-6 py-3 bg-[#4F39F6] hover:bg-[#432CB8] text-white rounded-2xl text-xs font-bold shadow-[0_3px_0_0_#3824B0,0_8px_16px_rgba(79,57,246,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Iniciar Campanha na Fila Segura
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
