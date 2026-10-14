import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Wallet, ShieldCheck } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default async function FinanceiroPage() {
  const contas = await prisma.contaPagar.findMany({
    orderBy: { vencimento: 'asc' },
  });

  const custosProjetos = await prisma.custoProjeto.findMany({
    include: {
      projeto: {
        include: {
          oportunidade: true,
        },
      },
    },
    orderBy: { dataCompetencia: 'desc' },
  });

  const totalGeralEmpresa = contas
    .filter((c) => c.tipoDespesa === 'GERAL_EMPRESA')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalCustosTurmas = custosProjetos.reduce((acc, c) => acc + c.valor, 0);

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="financeiro" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-[0_6px_14px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Financeiro & Contas a Pagar
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Separação Estrita
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Despesas gerais da empresa vs custos específicos de cada turma.
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
          {/* Resumo de Separação Contábil com Relevo Tátil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[26px] border border-slate-100 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Despesas Gerais da Empresa
                </span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Building2 className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                R$ {totalGeralEmpresa.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Aluguel, luz, salários, contabilidade e impostos corporativos (sem rateio forçado entre turmas).
              </p>
            </div>

            <div className="bg-white rounded-[26px] border border-amber-100 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Custos Diretos Acumulados das Turmas
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <TrendingDown className="w-5 h-5" />
                </span>
              </div>
              <div className="text-3xl font-black text-amber-800 font-mono tracking-tight">
                R$ {totalCustosTurmas.toFixed(2)}
              </div>
              <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                Gastos vinculados a turmas específicas (cervejadas, brindes, buffet, atrações e segurança).
              </p>
            </div>
          </div>

          {/* Tabelas Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contas a Pagar Corporativas */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Agenda de Contas Gerais a Pagar</h2>
                  <p className="text-xs text-slate-500">Vencimentos e despesas operacionais da empresa</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-[#FAF7FF] text-slate-500 uppercase font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3">Vencimento</th>
                        <th className="px-5 py-3">Descrição / Favorecido</th>
                        <th className="px-5 py-3">Valor</th>
                        <th className="px-5 py-3">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contas.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-mono text-slate-500">
                            {new Date(c.vencimento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-5 py-3.5">
                            <strong className="text-slate-800 block text-xs">{c.descricao}</strong>
                            <span className="text-[11px] text-slate-400">{c.favorecido}</span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                            R$ {c.valor.toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Custos de Projetos */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Custos Específicos das Turmas</h2>
                  <p className="text-xs text-slate-500">Ações preliminares e fornecedores por projeto</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-[#FAF7FF] text-slate-500 uppercase font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3">Data</th>
                        <th className="px-5 py-3">Projeto / Turma</th>
                        <th className="px-5 py-3">Descrição do Custo</th>
                        <th className="px-5 py-3">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {custosProjetos.map((custo) => (
                        <tr key={custo.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-mono text-slate-500">
                            {new Date(custo.dataCompetencia).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-800 block text-xs">
                              {custo.projeto.oportunidade.tituloTurma}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {custo.projeto.codigoAdesao}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {custo.descricao}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-rose-600">
                            - R$ {custo.valor.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
