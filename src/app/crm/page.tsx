import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Building2, Kanban, Plus, ShieldCheck } from 'lucide-react';
import { CrmKanbanBoard } from './crm-kanban-board';
import Sidebar from '@/components/Sidebar';

export default async function CrmPage() {
  const oportunidades = await prisma.oportunidade.findMany({
    include: {
      vendedor: {
        select: {
          nome: true,
        },
      },
      projeto: {
        include: {
          adesoes: true,
        },
      },
    },
    orderBy: { criadoEm: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="crm" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-[0_6px_14px_rgba(245,158,11,0.25)] flex items-center justify-center shrink-0">
              <Kanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  CRM Comercial por Turma
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {oportunidades.length} turmas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Funil de vendas. Arraste e solte o cartão ou use o botão <strong>Avançar</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              1ª Adesão converte Turma em Projeto
            </span>
            <Link
              href="/sistema/index.html"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-[0_3px_0_0_#D1D5DB] border border-slate-200 hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Funil Interativo (Drag & Drop + Botão Avançar) */}
        <main className="flex-1 overflow-x-auto bg-white/60 backdrop-blur-xs rounded-[28px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100">
          <CrmKanbanBoard initialTurmas={oportunidades as any} />
        </main>
      </div>
    </div>
  );
}
