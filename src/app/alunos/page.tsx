import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Search, GraduationCap, Building2, User, CreditCard, Users, ShieldCheck } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

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
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="alunos" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-600 text-white shadow-[0_6px_14px_rgba(6,182,212,0.25)] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Pesquisa e Cadastro de Alunos
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {alunos.length} alunos encontrados
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Área administrativa restrita com busca por CPF, nome e código único ALU-XXX.
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
          {/* Barra de Pesquisa Tátil com Altura */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
            <form method="GET" className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Pesquisar por CPF, Nome Completo ou Código (ex: ALU-2026-001)..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F4F6FB] border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F39F6] shadow-inner transition"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#4F39F6] hover:bg-[#432CB8] text-white rounded-2xl text-xs font-bold shadow-[0_3px_0_0_#3824B0,0_6px_12px_rgba(79,57,246,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                Buscar Aluno
              </button>
            </form>
          </div>

          {/* Lista de Alunos e Adesões */}
          <div className="space-y-4">
            {alunos.length === 0 ? (
              <div className="bg-white rounded-[26px] border border-slate-100 p-12 text-center text-slate-400 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">Nenhum aluno localizado</p>
                <p className="text-xs text-slate-400 mt-1">Tente pesquisar por outro CPF, nome ou código.</p>
              </div>
            ) : (
              alunos.map((aluno) => {
                return (
                  <div
                    key={aluno.id}
                    className="bg-white rounded-[26px] border border-slate-100 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                      <div>
                        <div className="flex items-center space-x-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white font-extrabold flex items-center justify-center text-sm shadow-[0_4px_10px_rgba(6,182,212,0.25)]">
                            {aluno.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{aluno.nome}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
                              <span><strong>CPF:</strong> {aluno.cpf}</span>
                              <span><strong>E-mail:</strong> {aluno.email}</span>
                              <span><strong>Telefone:</strong> {aluno.telefone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Adesões deste Aluno */}
                    <div className="mt-4 space-y-3">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Adesões do Formando (Projetos e Planos Ativos)
                      </h4>
                      {aluno.adesoesAluno.map((adesao) => {
                        const totalParcelas = adesao.parcelas.length;
                        const parcelasPagas = adesao.parcelas.filter((p) => p.status === 'PAGA').length;

                        return (
                          <div
                            key={adesao.id}
                            className="bg-[#FAF7FF] rounded-2xl p-4 border border-purple-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#4F39F6] text-white shadow-2xs">
                                  {adesao.codigoIndividualAluno}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {adesao.instituicaoNome} &bull; {adesao.cursoNome} ({adesao.turno})
                                </span>
                              </div>
                              <div className="text-slate-500 mt-1">
                                Campus {adesao.campusNome} &bull; Plano: <strong className="text-purple-700">{adesao.plano.nome}</strong>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Contratado:</span>
                                <strong className="text-slate-900 font-mono text-sm">
                                  R$ {adesao.valorTotalContratado.toFixed(2)}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Quitação:</span>
                                <strong className="text-emerald-700 font-bold">
                                  {parcelasPagas}/{totalParcelas} pagas
                                </strong>
                              </div>
                              <span className="px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 text-xs border border-emerald-200">
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
    </div>
  );
}
