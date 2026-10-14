import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, FileBarChart2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { RelatorioFinanceiroEngine, ParcelaRegistro } from '@/lib/financeiro/relatorios-engine';

export default async function RelatoriosPage() {
  // Coletar parcelas reais cadastradas
  const parcelasDb = await prisma.parcela.findMany({
    include: {
      adesao: {
        include: {
          aluno: true,
          projeto: {
            include: {
              oportunidade: true,
            },
          },
        },
      },
    },
  });

  const parcelasFormatadas: ParcelaRegistro[] = parcelasDb.map((p) => ({
    id: p.id,
    alunoId: p.adesao.alunoId,
    alunoNome: p.adesao.aluno.nome,
    projetoId: p.adesao.projetoId,
    projetoNome: p.adesao.projeto.oportunidade.tituloTurma,
    numeroParcela: p.numero,
    valor: p.valor,
    dataVencimento: new Date(p.vencimento),
    statusAtual: p.status as any,
    dataPagamento: p.dataPagamento ? new Date(p.dataPagamento) : null,
    valorPago: p.valorPago,
  }));

  // Período de consulta: Junho de 2026 (onde ocorreram os primeiros vencimentos)
  const inicioPeriodo = new Date('2026-06-01');
  const fimPeriodo = new Date('2026-06-30');

  const relatorio = RelatorioFinanceiroEngine.gerarRelatorioPeriodo(
    parcelasFormatadas,
    inicioPeriodo,
    fimPeriodo
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
              <h1 className="text-xl font-bold text-slate-900">Relatórios Financeiros & Inadimplência</h1>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                Dupla Visão Temporal
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Período selecionado: Junho/2026 (01/06/2026 a 30/06/2026)
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Resumo do Período */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Vencido no Período
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
              R$ {relatorio.totalVencidoNoPeriodo.toFixed(2)}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {relatorio.quantidadeAlunosComParcelaNoPeriodo} aluno(s) com cobrança ativa
            </span>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 p-6 shadow-xs">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Recebimentos Efetivos no Período
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
              R$ {relatorio.totalRecebidoNoPeriodo.toFixed(2)}
            </div>
            <span className="text-xs text-emerald-600 mt-1 block">
              Liquidado dentro do mês de competência
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-900 bg-slate-900 text-white p-6 shadow-xs">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Índice de Liquidação no Mês
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-2">
              {relatorio.totalVencidoNoPeriodo > 0
                ? `${Math.round((relatorio.totalRecebidoNoPeriodo / relatorio.totalVencidoNoPeriodo) * 100)}%`
                : '100%'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Taxa de pontualidade da turma
            </span>
          </div>
        </div>

        {/* AS DUAS VISÕES OBRIGATÓRIAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visão 1: No Fechamento do Período */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-base mb-1">
              <Clock className="w-5 h-5" />
              <h2>1. Situação no Fechamento do Período</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Fotografia congelada da inadimplência no último dia do mês analisado (30/06/2026).
            </p>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
              <span className="text-xs text-slate-500 block">Total Inadimplente no Fechamento:</span>
              <strong className="text-lg font-bold font-mono text-slate-800">
                R$ {relatorio.visaoFechamento.totalInadimplenteFechamento.toFixed(2)}
              </strong>
            </div>

            {relatorio.visaoFechamento.alunosInadimplentesFechamento.length === 0 ? (
              <div className="text-xs text-emerald-600 bg-emerald-50 p-3 rounded border border-emerald-200">
                Nenhum formando estava inadimplente no fechamento deste período.
              </div>
            ) : (
              <div className="space-y-2">
                {relatorio.visaoFechamento.alunosInadimplentesFechamento.map((item) => (
                  <div
                    key={item.alunoId}
                    className="flex justify-between items-center text-xs p-3 rounded bg-rose-50/50 border border-rose-100"
                  >
                    <span className="font-semibold text-slate-800">{item.alunoNome}</span>
                    <span className="font-mono font-bold text-rose-700">
                      R$ {item.valorDevidoNaData.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visão 2: Situação Atual daquele Período */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base mb-1">
              <CheckCircle className="w-5 h-5" />
              <h2>2. Situação Atual das Pendências daquele Mês</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Posição em tempo real: quem ainda deve hoje e quem quitou com atraso posterior.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-xs text-emerald-700 block">Regularizado Posteriormente:</span>
                <strong className="text-base font-bold font-mono text-emerald-800">
                  R$ {relatorio.visaoAtual.totalRegularizadoAposFechamento.toFixed(2)}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block">Ainda Pendente Hoje:</span>
                <strong className="text-base font-bold font-mono text-slate-800">
                  R$ {relatorio.visaoAtual.totalAindaPendenteHoje.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              {relatorio.visaoAtual.alunosRegularizadosPosteriormente.map((reg) => (
                <div
                  key={reg.alunoId}
                  className="flex justify-between items-center text-xs p-3 rounded bg-emerald-50/60 border border-emerald-200"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">{reg.alunoNome}</span>
                    <span className="text-emerald-700 text-xs">
                      Quitado com atraso em {new Date(reg.dataLiquidacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800">
                    R$ {reg.valorPago.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
