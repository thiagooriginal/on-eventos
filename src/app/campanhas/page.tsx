import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Megaphone, Send, Clock, ShieldCheck, Mail, MessageSquare } from 'lucide-react';

export default async function CampanhasPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topo */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/sistema/index.html"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Campanhas de Notificação & Cobrança</h1>
            <p className="text-xs text-slate-500">
              Disparos graduais por E-mail (Gmail) e WhatsApp com cancelamento instantâneo pós-pagamento
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Painel de Criação e Configuração de Cadência */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
            <Megaphone className="w-5 h-5 mr-2 text-cyan-600" />
            Nova Campanha de Mensagens com Ritmo Seguro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Turma / Projeto Alvo
              </label>
              <select className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white">
                <option>Saúde Cruzeiro do Sul 2026.2 (Enfermagem e Biomedicina)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Filtro de Destinatários
              </label>
              <select className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white">
                <option>Apenas Alunos com Parcelas Pendentes / Vencidas</option>
                <option>Todos os Alunos da Turma</option>
                <option>Alunos sem 1ª Parcela Paga</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Canal de Envio
              </label>
              <select className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white">
                <option>E-mail (Gmail Oficial) + WhatsApp Oficial Meta</option>
                <option>Apenas WhatsApp Oficial</option>
                <option>Apenas E-mail (Gmail)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Texto da Notificação / Mensagem de Regularização
              </label>
              <textarea
                rows={4}
                defaultValue="Olá {aluno_nome}! Lembramos que sua parcela da formatura vence em breve. Acesse seu aplicativo do formando para obter a 2ª via ou efetuar o pagamento via Pix sem burocracia."
                className="w-full text-sm rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-3">
              <span className="font-bold text-slate-800 block">
                Mecanismo de Proteção & Anti-Bloqueio
              </span>
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Cadência Controlada:</strong> Envio gradual espaçado (ex: 1 mensagem a cada 45-90 segundos) para evitar bloqueios de linha ou quotas do provedor.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Checagem de Último Segundo (JIT):</strong> Se o formando pagar a parcela enquanto a mensagem aguarda na fila, o envio é suprimido imediatamente para não constrangê-lo.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold flex items-center transition shadow-xs"
            >
              <Send className="w-4 h-4 mr-2" />
              Iniciar Campanha na Fila Segura
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
