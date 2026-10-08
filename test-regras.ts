import { ComissaoEngine, AdesaoCalculo } from './src/lib/financeiro/comissao-engine';
import { RelatorioFinanceiroEngine, ParcelaRegistro } from './src/lib/financeiro/relatorios-engine';
import { CampanhaQueueEngine, ItemFilaNotificacao } from './src/lib/campanhas/queue-engine';

console.log('===============================================================');
console.log('   BATERIA DE TESTES DE INTEGRIDADE DAS REGRAS DE NEGÓCIO');
console.log('===============================================================\n');

let falhas = 0;
function assert(condicao: boolean, mensagem: string) {
  if (condicao) {
    console.log(`[PASS] ${mensagem}`);
  } else {
    console.error(`[FAIL] ${mensagem}`);
    falhas++;
  }
}

// -------------------------------------------------------------
// CENÁRIO 1: Comissão 4% - Adesão sem pagamento
// -------------------------------------------------------------
const adesaoAluno1: AdesaoCalculo = {
  id: 'adesao-1',
  vendedorId: 'vend-1',
  alunoNome: 'Carlos Silva',
  turmaCodigo: 'TURMA-MED-2026',
  valorTotalContratado: 5000.0,
  parcelasPagasCount: 0,
  status: 'ATIVA',
};

assert(
  ComissaoEngine.calcularValorComissao(adesaoAluno1.valorTotalContratado) === 200.0,
  'Comissão de R$ 5.000 deve ser exatamente R$ 200,00 (4%)'
);

// -------------------------------------------------------------
// CENÁRIO 2: Confirmação do pagamento da 1ª Parcela libera comissão
// -------------------------------------------------------------
const resultadoPgto1 = ComissaoEngine.processarPagamentoParcela(adesaoAluno1, 1, false);
assert(
  resultadoPgto1 !== null && resultadoPgto1.tipo === 'LIBERADA' && resultadoPgto1.valor === 200.0,
  'Pagamento da 1ª parcela deve liberar a comissão integral de R$ 200,00'
);

// Pagamento da 2ª parcela não deve gerar novo crédito de comissão
const resultadoPgto2 = ComissaoEngine.processarPagamentoParcela(adesaoAluno1, 2, true);
assert(
  resultadoPgto2 === null,
  'Pagamento da 2ª parcela NÃO deve duplicar a comissão'
);

// -------------------------------------------------------------
// CENÁRIO 3: Cancelamento com < 3 parcelas pagas (Comissão já PAGA em dinheiro)
// -------------------------------------------------------------
const cancelamentoJaPago = ComissaoEngine.processarCancelamento(adesaoAluno1, 1, true, false);
assert(
  cancelamentoJaPago.lancamento !== null &&
  cancelamentoJaPago.lancamento.tipo === 'DEBITO_COMPENSACAO' &&
  cancelamentoJaPago.lancamento.valor === -200.0,
  'Cancelamento com 1 parcela paga (já paga ao vendedor) deve gerar débito de compensação de -R$ 200,00'
);

// -------------------------------------------------------------
// CENÁRIO 4: Cancelamento APÓS 3 parcelas pagas (Garantida)
// -------------------------------------------------------------
const cancelamentoGarantido = ComissaoEngine.processarCancelamento(adesaoAluno1, 3, true, false);
assert(
  cancelamentoGarantido.comissaoMantida === true && cancelamentoGarantido.lancamento === null,
  'Cancelamento após 3 parcelas pagas deve MANTER a comissão sem estorno'
);

// -------------------------------------------------------------
// CENÁRIO 5: Cálculo do Extrato do Vendedor (Saldo Líquido com Estornos)
// -------------------------------------------------------------
const extratoVendedor = ComissaoEngine.calcularSaldoExtrato([
  { tipo: 'LIBERADA', valor: 5000.0 }, // R$ 5.000 liberados de comissões novas
  { tipo: 'DEBITO_COMPENSACAO', valor: -600.0 }, // 3 estornos de R$ 200
]);

assert(
  extratoVendedor.saldoLiquidoParaAcerto === 4400.0,
  'Vendedor com R$ 5.000 a receber e R$ 600 de estornos pendentes deve ter saldo líquido de R$ 4.400,00'
);

// -------------------------------------------------------------
// CENÁRIO 6: Relatório Financeiro - Visão Dupla de Inadimplência
// -------------------------------------------------------------
const dInicio = new Date('2026-08-01');
const dFim = new Date('2026-08-31');

const parcelasTeste: ParcelaRegistro[] = [
  // Parcela 1: Venceu em 10/08 e foi paga em 10/08
  {
    id: 'p1',
    alunoId: 'aluno-1',
    alunoNome: 'Mariana Lima',
    projetoId: 'proj-1',
    projetoNome: 'Baile 2026.2',
    numeroParcela: 1,
    valor: 400.0,
    dataVencimento: new Date('2026-08-10'),
    statusAtual: 'PAGA',
    dataPagamento: new Date('2026-08-10'),
    valorPago: 400.0,
  },
  // Parcela 2: Venceu em 15/08, no fechamento estava em aberto, mas pagou em 05/09 (regularizado depois)
  {
    id: 'p2',
    alunoId: 'aluno-2',
    alunoNome: 'Lucas Mendes',
    projetoId: 'proj-1',
    projetoNome: 'Baile 2026.2',
    numeroParcela: 1,
    valor: 500.0,
    dataVencimento: new Date('2026-08-15'),
    statusAtual: 'PAGA',
    dataPagamento: new Date('2026-09-05'),
    valorPago: 500.0,
  },
  // Parcela 3: Venceu em 20/08 e continua devendo até hoje
  {
    id: 'p3',
    alunoId: 'aluno-3',
    alunoNome: 'Beatriz Costa',
    projetoId: 'proj-1',
    projetoNome: 'Baile 2026.2',
    numeroParcela: 1,
    valor: 350.0,
    dataVencimento: new Date('2026-08-20'),
    statusAtual: 'PENDENTE',
    dataPagamento: null,
  },
];

const relatorio = RelatorioFinanceiroEngine.gerarRelatorioPeriodo(parcelasTeste, dInicio, dFim);

assert(
  relatorio.totalRecebidoNoPeriodo === 400.0,
  'Recebimento dentro do período deve ser de R$ 400,00'
);
assert(
  relatorio.visaoFechamento.totalInadimplenteFechamento === 850.0,
  'No fechamento do mês (31/08), a inadimplência total era R$ 850,00 (Lucas R$ 500 + Beatriz R$ 350)'
);
assert(
  relatorio.visaoAtual.totalRegularizadoAposFechamento === 500.0,
  'Na visão atual, R$ 500,00 foram regularizados posteriormente por Lucas Mendes'
);
assert(
  relatorio.visaoAtual.totalAindaPendenteHoje === 350.0,
  'Na visão atual, apenas Beatriz Costa continua devendo R$ 350,00'
);

// -------------------------------------------------------------
// CENÁRIO 7: Fila de Notificações - JIT Payment Check
// -------------------------------------------------------------
async function testarFila() {
  const itemFila: ItemFilaNotificacao = {
    id: 'notif-1',
    destinatarioNome: 'Lucas Mendes',
    canal: 'WHATSAPP',
    parcelaIdParaConferir: 'p2',
    mensagem: 'Lembrete de cobrança de formatura',
    status: 'PENDENTE',
  };

  // Simula que a parcela 'p2' já consta como paga no banco
  const resultado = await CampanhaQueueEngine.verificarEEnviar(itemFila, async (pId) => pId === 'p2');
  assert(
    resultado.statusFinal === 'SUPRIMIDO_PAGAMENTO_CONFIRMADO',
    'Mensagem na fila de cobrança deve ser suprimida se a parcela foi paga antes do disparo'
  );
}

testarFila().then(() => {
  console.log('\n===============================================================');
  if (falhas === 0) {
    console.log('   TODOS OS TESTES PASSARAM COM SUCESSO ABSOLUTO (0 FALHAS)!');
  } else {
    console.error(`   ATENÇÃO: ${falhas} TESTES FALHARAM!`);
  }
  console.log('===============================================================\n');
});
