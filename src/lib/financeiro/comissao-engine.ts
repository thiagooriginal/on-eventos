/**
 * Motor Financeiro de Comissões de Vendedores
 * 
 * Regras Obrigatórias e Imutáveis:
 * 1. Comissão corresponde a 4% do valor total da adesão individual.
 * 2. Assinatura/adesão, sozinha, NÃO libera comissão (status: PREVISTA).
 * 3. Confirmação do pagamento da PRIMEIRA parcela libera a comissão integral de 4% (status: LIBERADA).
 * 4. Após TRÊS parcelas pagas, a comissão é GARANTIDA DEFINITIVA, mesmo se houver cancelamento posterior.
 * 5. Se cancelada antes de três parcelas pagas:
 *    - Se estava apenas LIBERADA (não paga ao vendedor): cancela do saldo a receber com lançamento explícito de estorno (sem descontar duas vezes).
 *    - Se já estava PAGA ao vendedor: gera um débito de compensação para deduzir no próximo acerto.
 * 6. O extrato deve manter o histórico completo (Ledger imutável).
 */

export interface AdesaoCalculo {
  id: string;
  vendedorId: string;
  alunoNome: string;
  turmaCodigo: string;
  valorTotalContratado: number;
  parcelasPagasCount: number;
  status: 'ATIVA' | 'CANCELADA';
}

export interface LancamentoResultado {
  tipo: 'PREVISTA' | 'LIBERADA' | 'PAGA_VENDEDOR' | 'ESTORNO_SALDO' | 'DEBITO_COMPENSACAO';
  valor: number;
  baseCalculo: number;
  percentual: number;
  motivo: string;
}

export class ComissaoEngine {
  public static readonly PERCENTUAL_COMISSAO = 0.04; // 4%

  /**
   * Calcula o valor bruto da comissão de uma adesão individual
   */
  public static calcularValorComissao(valorContrato: number): number {
    return Math.round(valorContrato * this.PERCENTUAL_COMISSAO * 100) / 100;
  }

  /**
   * Avalia a transição de estado da comissão mediante o pagamento de uma parcela
   * @param adesao Dados atuais da adesão
   * @param numeroParcelaPaga Qual parcela acabou de ser liquidada (1, 2, 3...)
   * @param comissaoJaPagaAoVendedor Se o repasse em dinheiro já foi efetuado ao vendedor
   */
  public static processarPagamentoParcela(
    adesao: AdesaoCalculo,
    numeroParcelaPaga: number,
    comissaoJaLiberada: boolean
  ): LancamentoResultado | null {
    const valorComissao = this.calcularValorComissao(adesao.valorTotalContratado);

    // 1ª Parcela Paga -> Libera a comissão integral de 4%
    if (numeroParcelaPaga === 1 && !comissaoJaLiberada) {
      return {
        tipo: 'LIBERADA',
        valor: valorComissao,
        baseCalculo: adesao.valorTotalContratado,
        percentual: 4.0,
        motivo: `Confirmação de pagamento da 1ª parcela do aluno ${adesao.alunoNome}`,
      };
    }

    // Pagamentos posteriores (2ª, 3ª etc.) apenas incrementam o contador de segurança (3 parcelas para garantia definitiva)
    return null;
  }

  /**
   * Processa o cancelamento de uma adesão e determina as obrigações de estorno/retenção
   * @param adesao Dados da adesão no momento do cancelamento
   * @param parcelasPagasTotal Quantas parcelas foram efetivamente pagas antes do cancelamento
   * @param jaFoiPagaAoVendedor Se o financeiro já transferiu o dinheiro ao vendedor
   * @param estavaLiberada Se estava liberada no saldo a receber do vendedor
   */
  public static processarCancelamento(
    adesao: AdesaoCalculo,
    parcelasPagasTotal: number,
    jaFoiPagaAoVendedor: boolean,
    estavaLiberada: boolean
  ): { lancamento: LancamentoResultado | null; comissaoMantida: boolean; mensagem: string } {
    const valorComissao = this.calcularValorComissao(adesao.valorTotalContratado);

    // REGRA 4: 3 ou mais parcelas pagas -> Comissão GARANTIDA DEFINITIVAMENTE
    if (parcelasPagasTotal >= 3) {
      return {
        lancamento: null,
        comissaoMantida: true,
        mensagem: `Cancelamento de ${adesao.alunoNome} não afeta comissão: aluno já havia quitado ${parcelasPagasTotal} parcelas (garantida após 3 pagas).`,
      };
    }

    // REGRA 5: Cancelamento antes de 3 parcelas pagas
    // Caso A: Se já havia sido transferida/paga em dinheiro ao vendedor -> Estorno via débito de compensação futura
    if (jaFoiPagaAoVendedor) {
      return {
        lancamento: {
          tipo: 'DEBITO_COMPENSACAO',
          valor: -valorComissao,
          baseCalculo: adesao.valorTotalContratado,
          percentual: 4.0,
          motivo: `Estorno por cancelamento com ${parcelasPagasTotal} parcelas pagas (<3). Valor já havia sido repassado e será abatido no próximo acerto.`,
        },
        comissaoMantida: false,
        mensagem: `Comissão estornada como débito de compensação futura (-R$ ${valorComissao.toFixed(2)}).`,
      };
    }

    // Caso B: Se estava liberada no saldo mas ainda não foi paga -> Retira do saldo a receber com lançamento explícito
    if (estavaLiberada) {
      return {
        lancamento: {
          tipo: 'ESTORNO_SALDO',
          valor: -valorComissao,
          baseCalculo: adesao.valorTotalContratado,
          percentual: 4.0,
          motivo: `Cancelamento com ${parcelasPagasTotal} parcelas pagas (<3). Comissão liberada retirada do saldo a receber.`,
        },
        comissaoMantida: false,
        mensagem: `Comissão retirada do saldo a receber (-R$ ${valorComissao.toFixed(2)}).`,
      };
    }

    // Caso C: Ainda estava prevista (nem a 1ª parcela foi paga)
    return {
      lancamento: null,
      comissaoMantida: false,
      mensagem: `Adesão cancelada sem nenhuma liberação de comissão prévia.`,
    };
  }

  /**
   * Consolida o extrato de um vendedor com base nos lançamentos imutáveis
   */
  public static calcularSaldoExtrato(lancamentos: Array<{ tipo: string; valor: number }>) {
    let previsto = 0;
    let liberadoDisponivel = 0;
    let totalPago = 0;
    let debitosPendentesCompensacao = 0;

    for (const lanc of lancamentos) {
      if (lanc.tipo === 'PREVISTA') {
        previsto += lanc.valor;
      } else if (lanc.tipo === 'LIBERADA') {
        liberadoDisponivel += lanc.valor;
      } else if (lanc.tipo === 'ESTORNO_SALDO') {
        liberadoDisponivel += lanc.valor; // já é negativo
      } else if (lanc.tipo === 'PAGA_VENDEDOR') {
        totalPago += lanc.valor;
      } else if (lanc.tipo === 'DEBITO_COMPENSACAO') {
        debitosPendentesCompensacao += Math.abs(lanc.valor);
      }
    }

    // Saldo líquido disponível para o próximo acerto
    const saldoLiquidoProximoAcerto = Math.max(0, liberadoDisponivel - debitosPendentesCompensacao);
    const saldoDevedorRemanescente = Math.max(0, debitosPendentesCompensacao - liberadoDisponivel);

    return {
      comissaoPrevista: Math.round(previsto * 100) / 100,
      comissaoLiberadaBruta: Math.round(liberadoDisponivel * 100) / 100,
      totalJaPago: Math.round(totalPago * 100) / 100,
      debitosACompensar: Math.round(debitosPendentesCompensacao * 100) / 100,
      saldoLiquidoParaAcerto: Math.round(saldoLiquidoProximoAcerto * 100) / 100,
      debitoRemanescenteParaFuturo: Math.round(saldoDevedorRemanescente * 100) / 100,
    };
  }
}
