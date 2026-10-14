import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, BadgePercent, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ComissaoEngine } from '@/lib/financeiro/comissao-engine';

export default async function ComissoesPage() {
  const vendedor = await prisma.usuario.findFirst({
    where: { perfil: 'VENDEDOR' },
    include: {
      lancamentosComissao: {
        include: {
          adesao: {
            include: {
              aluno: true,
              projeto: true,
            },
          },
        },
        orderBy: { dataLancamento: 'desc' },
      },
      adesoesVendedor: {
        include: {
          aluno: true,
          parcelas: true,
        },
      },
    },
  });

  const lancamentos = vendedor?.lancamentosComissao || [];
  const resumo = ComissaoEngine.calcularSaldoExtrato(
    lancamentos.map((l) => ({ tipo: l.tipo, valor: l.valor }))
  );

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
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Extrato de Comissões dos Vendedores</h1>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                Regra 4% Rigorosa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Vendedor ativo: {vendedor?.nome} ({vendedor?.email})
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Cards de Indicadores de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Comissão Prevista
            </span>
            <span className="text-xs text-slate-400">Aguardando 1ª parcela</span>
            <div className="mt-2 text-2xl font-bold text-slate-700">
              R$ {resumo.comissaoPrevista.toFixed(2)}
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Liberada somente com a confirmação bancária da 1ª parcela
            </p>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs bg-emerald-50/20">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Comissão Liberada (Saldo Bruto)
            </span>
            <span className="text-xs text-emerald-600">1ª Parcela liquidada</span>
            <div className="mt-2 text-2xl font-bold text-emerald-700">
              R$ {resumo.comissaoLiberadaBruta.toFixed(2)}
            </div>
            <p className="mt-2 text-xs text-emerald-700 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Disponível para fechamento/acerto
            </p>
          </div>

          <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs bg-rose-50/20">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
              Débitos a Compensar (Estornos)
            </span>
            <span className="text-xs text-rose-600">Cancelamentos &lt; 3 parcelas</span>
            <div className="mt-2 text-2xl font-bold text-rose-700">
              - R$ {resumo.debitosACompensar.toFixed(2)}
            </div>
            <p className="mt-2 text-xs text-rose-700 flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
              Abate individual nos próximos pagamentos
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-900 p-5 shadow-xs bg-slate-900 text-white">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Saldo Líquido p/ Próximo Acerto
            </span>
            <span className="text-xs text-slate-400">Total a transferir</span>
            <div className="mt-2 text-2xl font-bold text-emerald-400">
              R$ {resumo.saldoLiquidoParaAcerto.toFixed(2)}
            </div>
            <p className="mt-2 text-xs text-slate-300 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Calculado sem sobrescrever histórico
            </p>
          </div>
        </div>

        {/* Livro-Razão Imutável (Ledger de Lançamentos) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Extrato Detalhado de Lançamentos (Ledger)</h2>
              <p className="text-xs text-slate-500">Histórico cronológico de cada crédito, liberação e estorno</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Aluno / Turma</th>
                  <th className="px-6 py-3">Tipo Lançamento</th>
                  <th className="px-6 py-3">Base de Cálculo</th>
                  <th className="px-6 py-3">% Comissão</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Status de Garantia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lancamentos.map((l) => {
                  const isPositivo = l.valor > 0;
                  const isLiberada = l.tipo === 'LIBERADA';
                  const isPrevista = l.tipo === 'PREVISTA';

                  return (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs">
                        {new Date(l.dataLancamento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900 block">
                          {l.adesao.aluno.nome}
                        </span>
                        <span className="text-xs text-slate-500">
                          {l.adesao.codigoIndividualAluno} &bull; {l.adesao.cursoNome}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isLiberada
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPrevista
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {l.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        R$ {l.baseCalculo.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">
                        {l.percentual}%
                      </td>
                      <td className={`px-6 py-4 font-mono font-bold ${isPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositivo ? '+' : ''} R$ {l.valor.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {l.adesao.parcelasPagasCount >= 3 ? (
                          <span className="text-emerald-700 font-semibold flex items-center">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Garantida (3 parcelas pagas)
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {l.adesao.parcelasPagasCount}/3 pagas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
