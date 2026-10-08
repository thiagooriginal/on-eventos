/**
 * Motor de Relatórios Financeiros de Formatura
 * 
 * Atende com precisão às 2 VISÕES OBRIGATÓRIAS de inadimplência:
 * 1. Situação no fechamento do período: quem estava devendo naquela data de corte.
 * 2. Situação atual das pendências daquele período: quem ainda deve hoje e quem regularizou depois.
 */

export interface ParcelaRegistro {
  id: string;
  alunoId: string;
  alunoNome: string;
  projetoId: string;
  projetoNome: string;
  numeroParcela: number;
  valor: number;
  dataVencimento: Date;
  statusAtual: 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
  dataPagamento?: Date | null;
  valorPago?: number | null;
}

export interface RelatorioPeriodoResultado {
  periodoInicio: Date;
  periodoFim: Date;
  
  // Resumo Geral
  totalRecebidoNoPeriodo: number;
  totalVencidoNoPeriodo: number;
  quantidadeAlunosComParcelaNoPeriodo: number;
  
  // Visão 1: No Fechamento do Período
  visaoFechamento: {
    totalInadimplenteFechamento: number;
    alunosInadimplentesFechamento: Array<{
      alunoId: string;
      alunoNome: string;
      valorDevidoNaData: number;
    }>;
  };

  // Visão 2: Situação Atual daquele Período
  visaoAtual: {
    totalAindaPendenteHoje: number;
    totalRegularizadoAposFechamento: number;
    alunosAindaInadimplentesHoje: Array<{
      alunoId: string;
      alunoNome: string;
      valorPendente: number;
    }>;
    alunosRegularizadosPosteriormente: Array<{
      alunoId: string;
      alunoNome: string;
      valorPago: number;
      dataLiquidacao: Date;
    }>;
  };
}

export class RelatorioFinanceiroEngine {
  public static gerarRelatorioPeriodo(
    todasParcelas: ParcelaRegistro[],
    inicioPeriodo: Date,
    fimPeriodo: Date,
    dataReferenciaHoje: Date = new Date()
  ): RelatorioPeriodoResultado {
    // Filtrar parcelas que venceram dentro do período consultado
    const parcelasDoPeriodo = todasParcelas.filter(
      (p) => p.dataVencimento >= inicioPeriodo && p.dataVencimento <= fimPeriodo
    );

    const alunosUnicosSet = new Set(parcelasDoPeriodo.map((p) => p.alunoId));

    let totalVencido = 0;
    let totalRecebidoDentroPeriodo = 0;

    const inadimplentesFechamentoMap = new Map<string, { nome: string; valor: number }>();
    const aindaInadimplentesHojeMap = new Map<string, { nome: string; valor: number }>();
    const regularizadosDepois: Array<{ alunoId: string; alunoNome: string; valorPago: number; dataLiquidacao: Date }> = [];

    let totalAindaPendenteHoje = 0;
    let totalRegularizadoDepois = 0;

    for (const p of parcelasDoPeriodo) {
      totalVencido += p.valor;

      const foiPagaAteFechamento = p.dataPagamento && p.dataPagamento <= fimPeriodo;
      const foiPagaAposFechamento = p.dataPagamento && p.dataPagamento > fimPeriodo;
      const naoFoiPagaAteHoje = !p.dataPagamento;

      if (foiPagaAteFechamento) {
        totalRecebidoDentroPeriodo += p.valorPago || p.valor;
      } else {
        // Estava inadimplente na data do fechamento
        const atual = inadimplentesFechamentoMap.get(p.alunoId) || { nome: p.alunoNome, valor: 0 };
        atual.valor += p.valor;
        inadimplentesFechamentoMap.set(p.alunoId, atual);

        if (foiPagaAposFechamento) {
          totalRegularizadoDepois += p.valorPago || p.valor;
          regularizadosDepois.push({
            alunoId: p.alunoId,
            alunoNome: p.alunoNome,
            valorPago: p.valorPago || p.valor,
            dataLiquidacao: p.dataPagamento!,
          });
        } else if (naoFoiPagaAteHoje) {
          totalAindaPendenteHoje += p.valor;
          const atualPendente = aindaInadimplentesHojeMap.get(p.alunoId) || { nome: p.alunoNome, valor: 0 };
          atualPendente.valor += p.valor;
          aindaInadimplentesHojeMap.set(p.alunoId, atualPendente);
        }
      }
    }

    return {
      periodoInicio: inicioPeriodo,
      periodoFim: fimPeriodo,
      totalRecebidoNoPeriodo: Math.round(totalRecebidoDentroPeriodo * 100) / 100,
      totalVencidoNoPeriodo: Math.round(totalVencido * 100) / 100,
      quantidadeAlunosComParcelaNoPeriodo: alunosUnicosSet.size,
      visaoFechamento: {
        totalInadimplenteFechamento: Array.from(inadimplentesFechamentoMap.values()).reduce((acc, curr) => acc + curr.valor, 0),
        alunosInadimplentesFechamento: Array.from(inadimplentesFechamentoMap.entries()).map(([id, info]) => ({
          alunoId: id,
          alunoNome: info.nome,
          valorDevidoNaData: info.valor,
        })),
      },
      visaoAtual: {
        totalAindaPendenteHoje: Math.round(totalAindaPendenteHoje * 100) / 100,
        totalRegularizadoAposFechamento: Math.round(totalRegularizadoDepois * 100) / 100,
        alunosAindaInadimplentesHoje: Array.from(aindaInadimplentesHojeMap.entries()).map(([id, info]) => ({
          alunoId: id,
          alunoNome: info.nome,
          valorPendente: info.valor,
        })),
        alunosRegularizadosPosteriormente: regularizadosDepois,
      },
    };
  }
}
