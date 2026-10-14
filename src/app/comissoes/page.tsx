import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, BadgePercent, CheckCircle, Clock, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { ComissaoEngine } from '@/lib/financeiro/comissao-engine';
import Sidebar from '@/components/Sidebar';

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
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="comissoes" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-[0_6px_14px_rgba(147,51,234,0.25)] flex items-center justify-center shrink-0">
              <BadgePercent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Extrato de Comissões dos Vendedores
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Regra 4% Rigorosa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendedor ativo: <strong>{vendedor?.nome || 'Rodrigo Consultor'}</strong> ({vendedor?.email || 'vendedor.rodrigo@formatura.com.br'})
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
          {/* Cards de Indicadores de Saldo com Altura Tátil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Comissão Prevista
              </span>
              <span className="text-[11px] text-amber-600 font-medium">Aguardando 1ª parcela</span>
              <div className="mt-2 text-2xl font-black text-slate-800 tracking-tight">
                R$ {resumo.comissaoPrevista.toFixed(2)}
              </div>
              <p className="mt-2 text-[11px] text-slate-500 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
                Liberada na 1ª parcela confirmada
              </p>
            </div>

            <div className="bg-white rounded-[24px] border border-emerald-100 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Comissão Liberada (Bruto)
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">1ª Parcela liquidada</span>
              <div className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">
                R$ {resumo.comissaoLiberadaBruta.toFixed(2)}
              </div>
              <p className="mt-2 text-[11px] text-emerald-700 flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                Disponível para acerto
              </p>
            </div>

            <div className="bg-white rounded-[24px] border border-rose-100 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                Estornos / Compensações
              </span>
              <span className="text-[11px] text-rose-500 font-medium">Cancelamentos &lt; 3 parcelas</span>
              <div className="mt-2 text-2xl font-black text-rose-700 tracking-tight">
                - R$ {resumo.debitosACompensar.toFixed(2)}
              </div>
              <p className="mt-2 text-[11px] text-rose-600 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500 shrink-0" />
                Abate nos próximos acertos
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#4F39F6] to-[#36218A] text-white rounded-[24px] p-5 shadow-[0_12px_24px_rgba(79,57,246,0.25)] border border-white/20">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider block">
                Saldo Líquido p/ Acerto
              </span>
              <span className="text-[11px] text-emerald-300 font-medium">Total a transferir</span>
              <div className="mt-2 text-2xl font-black text-emerald-300 tracking-tight">
                R$ {resumo.saldoLiquidoParaAcerto.toFixed(2)}
              </div>
              <p className="mt-2 text-[11px] text-purple-200 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-300 shrink-0" />
                Livro-razão imutável
              </p>
            </div>
          </div>

          {/* Livro-Razão Imutável (Ledger de Lançamentos) */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Extrato Detalhado de Lançamentos (Ledger)</h2>
                <p className="text-xs text-slate-500">Histórico cronológico de cada crédito, liberação e estorno</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {lancamentos.length} lançamentos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-[#FAF7FF] text-xs uppercase text-slate-500 border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Data</th>
                    <th className="px-6 py-3.5">Aluno / Turma</th>
                    <th className="px-6 py-3.5">Tipo</th>
                    <th className="px-6 py-3.5">Base Cálculo</th>
                    <th className="px-6 py-3.5">% Comiss.</th>
                    <th className="px-6 py-3.5">Valor</th>
                    <th className="px-6 py-3.5">Status de Garantia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lancamentos.map((l) => {
                    const isPositivo = l.valor > 0;
                    const isLiberada = l.tipo === 'LIBERADA';
                    const isPrevista = l.tipo === 'PREVISTA';

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {new Date(l.dataLancamento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">
                            {l.adesao.aluno.nome}
                          </span>
                          <span className="text-xs text-slate-500">
                            {l.adesao.codigoIndividualAluno} &bull; {l.adesao.cursoNome}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isLiberada
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPrevista
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {l.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          R$ {l.baseCalculo.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-purple-700">
                          {l.percentual}%
                        </td>
                        <td className={`px-6 py-4 font-mono font-extrabold ${isPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositivo ? '+' : ''} R$ {l.valor.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {l.adesao.parcelasPagasCount >= 3 ? (
                            <span className="text-emerald-700 font-bold flex items-center">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              Garantida (3 parcelas)
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
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
    </div>
  );
}
