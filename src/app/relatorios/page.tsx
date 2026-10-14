import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, FileBarChart2, AlertCircle, CheckCircle, Clock, ShieldCheck, TrendingUp } from 'lucide-react';
import { RelatorioFinanceiroEngine, ParcelaRegistro } from '@/lib/financeiro/relatorios-engine';
import Sidebar from '@/components/Sidebar';

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
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Roxa Tátil */}
      <Sidebar paginaAtiva="relatorios" />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Arredondado Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-[0_6px_14px_rgba(244,63,94,0.25)] flex items-center justify-center shrink-0">
              <FileBarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Relatórios Financeiros & Inadimplência
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Dupla Visão Temporal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Competência: Junho/2026 (01/06/2026 a 30/06/2026) • Fotografia estática vs posição hoje
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
          {/* Resumo do Período com Relevo Tátil */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Vencido no Período
              </span>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                R$ {relatorio.totalVencidoNoPeriodo.toFixed(2)}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {relatorio.quantidadeAlunosComParcelaNoPeriodo} aluno(s) com cobrança ativa
              </span>
            </div>

            <div className="bg-white rounded-[24px] border border-emerald-100 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Recebimentos Efetivos no Mês
              </span>
              <div className="text-3xl font-black text-emerald-700 mt-2 font-mono tracking-tight">
                R$ {relatorio.totalRecebidoNoPeriodo.toFixed(2)}
              </div>
              <span className="text-xs text-emerald-600 mt-1 block">
                Liquidado dentro do mês de competência
              </span>
            </div>

            <div className="bg-gradient-to-br from-[#4F39F6] to-[#36218A] text-white rounded-[24px] p-5 shadow-[0_12px_24px_rgba(79,57,246,0.25)] border border-white/20">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider block">
                Índice de Liquidação no Mês
              </span>
              <div className="text-3xl font-black text-emerald-300 mt-2 tracking-tight">
                {relatorio.totalVencidoNoPeriodo > 0
                  ? `${Math.round((relatorio.totalRecebidoNoPeriodo / relatorio.totalVencidoNoPeriodo) * 100)}%`
                  : '100%'}
              </div>
              <span className="text-xs text-purple-200 mt-1 block">
                Taxa de pontualidade da turma
              </span>
            </div>
          </div>

          {/* AS DUAS VISÕES OBRIGATÓRIAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visão 1: No Fechamento do Período */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-base mb-1">
                <Clock className="w-5 h-5" />
                <h2>1. Situação no Fechamento do Período</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Fotografia congelada da inadimplência no último dia do mês analisado (30/06/2026).
              </p>

              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 mb-4">
                <span className="text-xs text-rose-700 font-medium block">Total Inadimplente no Fechamento:</span>
                <strong className="text-xl font-black font-mono text-rose-800">
                  R$ {relatorio.visaoFechamento.totalInadimplenteFechamento.toFixed(2)}
                </strong>
              </div>

              {relatorio.visaoFechamento.alunosInadimplentesFechamento.length === 0 ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  Nenhum formando estava inadimplente no fechamento deste período.
                </div>
              ) : (
                <div className="space-y-2">
                  {relatorio.visaoFechamento.alunosInadimplentesFechamento.map((item) => (
                    <div
                      key={item.alunoId}
                      className="flex justify-between items-center text-xs p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100"
                    >
                      <span className="font-bold text-slate-800">{item.alunoNome}</span>
                      <span className="font-mono font-black text-rose-700">
                        R$ {item.valorDevidoNaData.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visão 2: Situação Atual daquele Período */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base mb-1">
                <CheckCircle className="w-5 h-5" />
                <h2>2. Situação Atual das Pendências daquele Mês</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Posição em tempo real: quem ainda deve hoje e quem quitou com atraso posterior.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-medium block">Regularizado Depois:</span>
                  <strong className="text-base font-black font-mono text-emerald-800">
                    R$ {relatorio.visaoAtual.totalRegularizadoAposFechamento.toFixed(2)}
                  </strong>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block">Ainda Pendente Hoje:</span>
                  <strong className="text-base font-black font-mono text-slate-800">
                    R$ {relatorio.visaoAtual.totalAindaPendenteHoje.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                {relatorio.visaoAtual.alunosRegularizadosPosteriormente.map((reg) => (
                  <div
                    key={reg.alunoId}
                    className="flex justify-between items-center text-xs p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{reg.alunoNome}</span>
                      <span className="text-emerald-700 text-xs">
                        Quitado com atraso em {new Date(reg.dataLiquidacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-800">
                      R$ {reg.valorPago.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
