import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

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
            <h1 className="text-xl font-bold text-slate-900">Financeiro & Contas a Pagar</h1>
            <p className="text-xs text-slate-500">
              Separação estrita de despesas gerais da empresa vs custos específicos de projetos
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Resumo de Separação Contábil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Despesas Gerais da Empresa
              </span>
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              R$ {totalGeralEmpresa.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Aluguel, luz, salários, contabilidade e impostos corporativos (sem rateio forçado entre turmas).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Custos Diretos Acumulados de Projetos
              </span>
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-800 font-mono">
              R$ {totalCustosTurmas.toFixed(2)}
            </div>
            <p className="text-xs text-amber-700 mt-2">
              Gastos vinculados a turmas específicas (cervejadas, brindes, buffet, atrações e segurança).
            </p>
          </div>
        </div>

        {/* Tabelas Lado a Lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contas a Pagar Corporativas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Agenda de Contas Gerais a Pagar</h2>
              <p className="text-xs text-slate-500">Vencimentos e despesas operacionais da empresa</p>
            </div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Descrição / Favorecido</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contas.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(c.vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <strong className="text-slate-800 block text-xs">{c.descricao}</strong>
                      <span className="text-xs text-slate-400">{c.favorecido}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      R$ {c.valor.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custos de Projetos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Custos Específicos das Turmas</h2>
              <p className="text-xs text-slate-500">Ações preliminares e fornecedores por projeto</p>
            </div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Projeto / Turma</th>
                  <th className="px-4 py-3">Descrição do Custo</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {custosProjetos.map((custo) => (
                  <tr key={custo.id}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(custo.dataCompetencia).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-800 block">
                        {custo.projeto.oportunidade.tituloTurma}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {custo.projeto.codigoAdesao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {custo.descricao}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-rose-700">
                      - R$ {custo.valor.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
