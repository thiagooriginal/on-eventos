import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Search, GraduationCap, Building2, User, CreditCard } from 'lucide-react';

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || '';

  const alunos = await prisma.usuario.findMany({
    where: {
      perfil: 'ALUNO',
      OR: query
        ? [
            { nome: { contains: query } },
            { cpf: { contains: query } },
            { email: { contains: query } },
            {
              adesoesAluno: {
                some: {
                  codigoIndividualAluno: { contains: query },
                },
              },
            },
          ]
        : undefined,
    },
    include: {
      adesoesAluno: {
        include: {
          projeto: true,
          plano: true,
          parcelas: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topo */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pesquisa e Cadastro de Alunos</h1>
            <p className="text-xs text-slate-500">
              Área restrita administrativa com validação rigorosa no servidor
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-8">
          <form method="GET" className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Pesquisar por CPF, Nome Completo ou Código Individual (ex: ALU-2026-001)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition"
            >
              Pesquisar
            </button>
          </form>
        </div>

        {/* Lista de Alunos e Adesões */}
        <div className="space-y-4">
          {alunos.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Nenhum aluno encontrado para os critérios de busca.
            </div>
          ) : (
            alunos.map((aluno) => {
              return (
                <div
                  key={aluno.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="p-2 rounded-full bg-slate-100 text-slate-700">
                          <User className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{aluno.nome}</h3>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 mt-0.5">
                            <span>CPF: {aluno.cpf}</span>
                            <span>E-mail: {aluno.email}</span>
                            <span>Telefone: {aluno.telefone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adesões deste Aluno */}
                  <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Adesões do Formando (Projetos e Planos Vinculados)
                    </h4>
                    {aluno.adesoesAluno.map((adesao) => {
                      const totalParcelas = adesao.parcelas.length;
                      const parcelasPagas = adesao.parcelas.filter((p) => p.status === 'PAGA').length;

                      return (
                        <div
                          key={adesao.id}
                          className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {adesao.codigoIndividualAluno}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {adesao.instituicaoNome} &bull; {adesao.cursoNome} ({adesao.turno})
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Campus {adesao.campusNome} &bull; Plano: <strong className="text-slate-700">{adesao.plano.nome}</strong>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-xs">
                            <div>
                              <span className="text-slate-400 block">Total Contratado:</span>
                              <strong className="text-slate-800 font-mono text-sm">
                                R$ {adesao.valorTotalContratado.toFixed(2)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Quitação:</span>
                              <strong className="text-emerald-700 font-semibold">
                                {parcelasPagas}/{totalParcelas} parcelas pagas
                              </strong>
                            </div>
                            <span className="px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 text-xs">
                              {adesao.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
