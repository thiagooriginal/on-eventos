import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Building2 } from 'lucide-react';
import { CrmKanbanBoard } from './crm-kanban-board';

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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Topo */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/sistema/index.html"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">CRM Comercial por Turma</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-medium">
                SISTEMA DE GESTÃO ON EVENTOS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cada cartão representa uma turma em negociação. Arraste e solte o cartão ou use o botão <strong>Avançar</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
            Regra: 1ª Adesão de Aluno transforma a Turma em Projeto
          </span>
        </div>
      </header>

      {/* Funil Interativo (Drag & Drop + Botão Avançar) */}
      <main className="flex-1 p-6 overflow-x-auto">
        <CrmKanbanBoard initialTurmas={oportunidades as any} />
      </main>
    </div>
  );
}
