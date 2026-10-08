/**
 * Motor Financeiro de Comissões de Vendedores (CommonJS para testes diretos e compatibilidade)
 */
class ComissaoEngine {
  static PERCENTUAL_COMISSAO = 0.04; // 4%

  static calcularValorComissao(valorContrato) {
    return Math.round(valorContrato * this.PERCENTUAL_COMISSAO * 100) / 100;
  }

  static processarPagamentoParcela(adesao, numeroParcelaPaga, comissaoJaLiberada) {
    const valorComissao = this.calcularValorComissao(adesao.valorTotalContratado);
    if (numeroParcelaPaga === 1 && !comissaoJaLiberada) {
      return {
        tipo: 'LIBERADA',
        valor: valorComissao,
        baseCalculo: adesao.valorTotalContratado,
        percentual: 4.0,
        motivo: `Confirmação de pagamento da 1ª parcela do aluno ${adesao.alunoNome}`,
      };
    }
    return null;
  }

  static processarCancelamento(adesao, parcelasPagasTotal, jaFoiPagaAoVendedor, estavaLiberada) {
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

    return {
      lancamento: null,
      comissaoMantida: false,
      mensagem: `Adesão cancelada sem nenhuma liberação de comissão prévia.`,
    };
  }

  static calcularSaldoExtrato(lancamentos) {
    let previsto = 0;
    let liberadoDisponivel = 0;
    let totalPago = 0;
    let debitosPendentesCompensacao = 0;

    for (const lanc of lancamentos) {
      if (lanc.tipo === 'PREVISTA') previsto += lanc.valor;
      else if (lanc.tipo === 'LIBERADA') liberadoDisponivel += lanc.valor;
      else if (lanc.tipo === 'ESTORNO_SALDO') liberadoDisponivel += lanc.valor;
      else if (lanc.tipo === 'PAGA_VENDEDOR') totalPago += lanc.valor;
      else if (lanc.tipo === 'DEBITO_COMPENSACAO') debitosPendentesCompensacao += Math.abs(lanc.valor);
    }

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

class RelatorioFinanceiroEngine {
  static gerarRelatorioPeriodo(todasParcelas, inicioPeriodo, fimPeriodo) {
    const parcelasDoPeriodo = todasParcelas.filter(
      (p) => p.dataVencimento >= inicioPeriodo && p.dataVencimento <= fimPeriodo
    );

    const alunosUnicosSet = new Set(parcelasDoPeriodo.map((p) => p.alunoId));
    let totalVencido = 0;
    let totalRecebidoDentroPeriodo = 0;
    let totalAindaPendenteHoje = 0;
    let totalRegularizadoDepois = 0;

    const inadimplentesFechamentoMap = new Map();
    const aindaInadimplentesHojeMap = new Map();
    const regularizadosDepois = [];

    for (const p of parcelasDoPeriodo) {
      totalVencido += p.valor;
      const foiPagaAteFechamento = p.dataPagamento && p.dataPagamento <= fimPeriodo;
      const foiPagaAposFechamento = p.dataPagamento && p.dataPagamento > fimPeriodo;
      const naoFoiPagaAteHoje = !p.dataPagamento;

      if (foiPagaAteFechamento) {
        totalRecebidoDentroPeriodo += p.valorPago || p.valor;
      } else {
        const atual = inadimplentesFechamentoMap.get(p.alunoId) || { nome: p.alunoNome, valor: 0 };
        atual.valor += p.valor;
        inadimplentesFechamentoMap.set(p.alunoId, atual);

        if (foiPagaAposFechamento) {
          totalRegularizadoDepois += p.valorPago || p.valor;
          regularizadosDepois.push({
            alunoId: p.alunoId,
            alunoNome: p.alunoNome,
            valorPago: p.valorPago || p.valor,
            dataLiquidacao: p.dataPagamento,
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
      totalRecebidoNoPeriodo: Math.round(totalRecebidoDentroPeriodo * 100) / 100,
      totalVencidoNoPeriodo: Math.round(totalVencido * 100) / 100,
      quantidadeAlunosComParcelaNoPeriodo: alunosUnicosSet.size,
      visaoFechamento: {
        totalInadimplenteFechamento: Array.from(inadimplentesFechamentoMap.values()).reduce((acc, curr) => acc + curr.valor, 0),
      },
      visaoAtual: {
        totalAindaPendenteHoje: Math.round(totalAindaPendenteHoje * 100) / 100,
        totalRegularizadoAposFechamento: Math.round(totalRegularizadoDepois * 100) / 100,
        alunosAindaInadimplentesHoje: Array.from(aindaInadimplentesHojeMap.entries()),
        alunosRegularizadosPosteriormente: regularizadosDepois,
      },
    };
  }
}

class CampanhaQueueEngine {
  static async verificarEEnviar(item, consultarParcelaQuitadaFn) {
    if (item.parcelaIdParaConferir) {
      const jaEstaPaga = await consultarParcelaQuitadaFn(item.parcelaIdParaConferir);
      if (jaEstaPaga) {
        return {
          statusFinal: 'SUPRIMIDO_PAGAMENTO_CONFIRMADO',
          motivo: 'Envio cancelado preventivamente: parcela foi liquidada pelo aluno antes do disparo.',
        };
      }
    }
    return {
      statusFinal: 'ENVIADO',
      motivo: `Mensagem enviada com sucesso para ${item.destinatarioNome}.`,
    };
  }
}

// BATERIA DE TESTES
console.log('===============================================================');
console.log('   BATERIA DE TESTES: REGRAS CRÍTICAS DE COMISSÃO E FINANÇAS   ');
console.log('===============================================================\n');

let falhas = 0;
function assert(condicao, msg) {
  if (condicao) console.log(`[PASS] ${msg}`);
  else { console.error(`[FAIL] ${msg}`); falhas++; }
}

// 1. 4%
assert(ComissaoEngine.calcularValorComissao(5000) === 200, '4% de 5000 = 200');

// 2. 1ª Parcela libera
const res1 = ComissaoEngine.processarPagamentoParcela({ valorTotalContratado: 5000, alunoNome: 'Carlos' }, 1, false);
assert(res1 && res1.tipo === 'LIBERADA' && res1.valor === 200, '1ª Parcela liquidada libera 4% (R$ 200)');

// 3. 2ª Parcela não duplica
const res2 = ComissaoEngine.processarPagamentoParcela({ valorTotalContratado: 5000, alunoNome: 'Carlos' }, 2, true);
assert(res2 === null, '2ª Parcela NÃO duplica comissão');

// 4. Cancelamento < 3 parcelas pagas (já recebida pelo vendedor)
const canc1 = ComissaoEngine.processarCancelamento({ valorTotalContratado: 5000, alunoNome: 'Carlos' }, 1, true, false);
assert(canc1.lancamento && canc1.lancamento.tipo === 'DEBITO_COMPENSACAO' && canc1.lancamento.valor === -200, 'Cancelamento com 1 paga gera estorno para compensação futura (-200)');

// 5. Cancelamento >= 3 parcelas pagas
const canc2 = ComissaoEngine.processarCancelamento({ valorTotalContratado: 5000, alunoNome: 'Carlos' }, 3, true, false);
assert(canc2.comissaoMantida === true && canc2.lancamento === null, 'Cancelamento com 3 pagas mantém comissão sem estorno');

// 6. Extrato líquido com compensação
const ext = ComissaoEngine.calcularSaldoExtrato([
  { tipo: 'LIBERADA', valor: 5000 },
  { tipo: 'DEBITO_COMPENSACAO', valor: -600 }
]);
assert(ext.saldoLiquidoParaAcerto === 4400, 'Saldo de 5000 com 600 de estornos pendentes = 4400 líquido');

// 7. Relatório Financeiro: Visão Histórica vs Visão Atual
const dIni = new Date('2026-08-01');
const dFim = new Date('2026-08-31');
const parcelas = [
  { id: '1', alunoId: 'a1', alunoNome: 'Mariana', valor: 400, dataVencimento: new Date('2026-08-10'), dataPagamento: new Date('2026-08-10'), valorPago: 400 },
  { id: '2', alunoId: 'a2', alunoNome: 'Lucas', valor: 500, dataVencimento: new Date('2026-08-15'), dataPagamento: new Date('2026-09-05'), valorPago: 500 },
  { id: '3', alunoId: 'a3', alunoNome: 'Beatriz', valor: 350, dataVencimento: new Date('2026-08-20'), dataPagamento: null }
];
const rel = RelatorioFinanceiroEngine.gerarRelatorioPeriodo(parcelas, dIni, dFim);
assert(rel.totalRecebidoNoPeriodo === 400, 'Recebimento dentro do mês = 400');
assert(rel.visaoFechamento.totalInadimplenteFechamento === 850, 'Inadimplência no fechamento = 850 (Lucas 500 + Beatriz 350)');
assert(rel.visaoAtual.totalRegularizadoAposFechamento === 500, 'Regularizado após fechamento = 500 (Lucas)');
assert(rel.visaoAtual.totalAindaPendenteHoje === 350, 'Ainda pendente hoje = 350 (Beatriz)');

// 8. Fila JIT
CampanhaQueueEngine.verificarEEnviar(
  { id: 'n1', destinatarioNome: 'Lucas', canal: 'WHATSAPP', parcelaIdParaConferir: 'p2' },
  async () => true // já paga
).then((resQueue) => {
  assert(resQueue.statusFinal === 'SUPRIMIDO_PAGAMENTO_CONFIRMADO', 'Notificação de cobrança é suprimida se a parcela foi paga');

  console.log('\n===============================================================');
  if (falhas === 0) {
    console.log('   RESULTADO: 100% DOS TESTES DAS REGRAS PASSARAM COM SUCESSO!   ');
  } else {
    console.error(`   RESULTADO: ${falhas} TESTES FALHARAM!   `);
  }
  console.log('===============================================================\n');
});
