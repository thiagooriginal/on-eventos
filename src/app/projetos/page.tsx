import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { ProjetosGerenciador } from './projetos-gerenciador';

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-slate-900">Gestão e Projetos</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-medium">
                SISTEMA DE GESTÃO ON EVENTOS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Controle completo de turmas, campus, planos, valores previstos vs contratados reais.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ProjetosGerenciador initialProjetos={projetos as any} />
      </main>
    </div>
  );
}
