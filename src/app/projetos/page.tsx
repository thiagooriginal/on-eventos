import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Plus, ShieldCheck } from 'lucide-react';
import { ProjetosGerenciador } from './projetos-gerenciador';
import Sidebar from '@/components/Sidebar';

export default async function ProjetosPage() {
  const projetos = await prisma.projeto.findMany({
    include: {
      oportunidade: {
        include: {
          vendedor: {
            select: {
              nome: true,
            },
          },
        },
      },
      planos: true,
      adesoes: {
        include: {
          aluno: {
            select: {
              nome: true,
            },
          },
        },
      },
      custos: true,
    },
    orderBy: { dataCriacaoProjeto: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="projetos" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-[0_6px_14px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Gestão de Projetos & Turmas
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {projetos.length} bailes ativos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle completo de turmas, campus, planos e valores previstos vs contratados reais.
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

        {/* Conteúdo dos Projetos */}
        <main className="flex-1 bg-white/60 backdrop-blur-xs rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)] border border-slate-100">
          <ProjetosGerenciador initialProjetos={projetos as any} />
        </main>
      </div>
    </div>
  );
}
