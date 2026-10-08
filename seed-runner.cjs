const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Populando dados no banco SQLite...');

  // Limpeza prévia para evitar duplicatas em reexecuções
  await prisma.notificacaoFila.deleteMany({});
  await prisma.campanha.deleteMany({});
  await prisma.pedidoExtra.deleteMany({});
  await prisma.produtoAdicional.deleteMany({});
  await prisma.custoProjeto.deleteMany({});
  await prisma.contaPagar.deleteMany({});
  await prisma.lancamentoComissao.deleteMany({});
  await prisma.parcela.deleteMany({});
  await prisma.adesao.deleteMany({});
  await prisma.plano.deleteMany({});
  await prisma.projeto.deleteMany({});
  await prisma.historicoCrm.deleteMany({});
  await prisma.oportunidadeCurso.deleteMany({});
  await prisma.oportunidade.deleteMany({});
  await prisma.curso.deleteMany({});
  await prisma.campus.deleteMany({});
  await prisma.instituicao.deleteMany({});
  await prisma.usuario.deleteMany({});

  // 1. Usuários
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador Geral',
      email: 'admin@formatura.com.br',
      senhaHash: 'hash_admin',
      perfil: 'ADMIN',
      cpf: '000.000.000-00',
      telefone: '(11) 98888-0000',
    },
  });

  const vendedor = await prisma.usuario.create({
    data: {
      nome: 'Rodrigo Vendas',
      email: 'vendedor.rodrigo@formatura.com.br',
      senhaHash: 'hash_vendedor',
      perfil: 'VENDEDOR',
      cpf: '111.222.333-44',
      telefone: '(11) 97777-1111',
    },
  });

  const alunoCarlos = await prisma.usuario.create({
    data: {
      nome: 'Carlos Eduardo Silva',
      email: 'carlos.aluno@gmail.com',
      senhaHash: 'hash_aluno',
      perfil: 'ALUNO',
      cpf: '222.333.444-55',
      telefone: '(11) 96666-2222',
    },
  });

  const alunaMariana = await prisma.usuario.create({
    data: {
      nome: 'Mariana Lima Santos',
      email: 'mariana.lima@gmail.com',
      senhaHash: 'hash_aluno_mariana',
      perfil: 'ALUNO',
      cpf: '333.444.555-66',
      telefone: '(11) 95555-3333',
    },
  });

  // 2. Instituição, Campus e Cursos
  const inst = await prisma.instituicao.create({
    data: {
      nome: 'Universidade Cruzeiro do Sul',
      sigla: 'UNICSUL',
      campi: {
        create: [
          {
            nome: 'Campus Anália Franco',
            cursos: {
              create: [
                { nome: 'Enfermagem' },
                { nome: 'Biomedicina' },
                { nome: 'Fisioterapia' },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. CRM - Turmas em negociação (Quadro Funil)
  const op1 = await prisma.oportunidade.create({
    data: {
      tituloTurma: 'Saúde Cruzeiro do Sul 2026.2 (Enfermagem e Biomedicina)',
      semestre: '2026.2',
      tipoProjeto: 'BAILE',
      etapa: 'ADESAO',
      vendedorId: vendedor.id,
      quantidadePrevista: 80,
      valorPrevistoAluno: 5000.0,
      codigoAdesao: 'CSUL-SAUDE-2026-2',
      observacoes: 'Contrato fechado com comissão. Adesões abertas.',
      dataContratoTurma: new Date('2026-05-10'),
    },
  });

  const op2 = await prisma.oportunidade.create({
    data: {
      tituloTurma: 'Direito Mackenzie 2027.1 - Turma Manhã',
      semestre: '2027.1',
      tipoProjeto: 'COLACAO',
      etapa: 'REUNIAO_REPRESENTANTE',
      vendedorId: vendedor.id,
      quantidadePrevista: 120,
      valorPrevistoAluno: 1800.0,
      codigoAdesao: 'MACK-DIR-2027-1',
      observacoes: 'Apresentação de proposta agendada para próxima terça-feira.',
    },
  });

  // 4. Projeto criado pela primeira adesão
  const proj = await prisma.projeto.create({
    data: {
      oportunidadeId: op1.id,
      codigoAdesao: op1.codigoAdesao,
      nomeProjeto: 'Baile de Gala da Saúde 2026.2',
      tipo: 'BAILE',
      semestre: '2026.2',
      faculdadeNome: 'Universidade Cruzeiro do Sul',
      campusNome: 'Campus Anália Franco',
      cursoNome: 'Enfermagem, Biomedicina e Fisioterapia',
      status: 'ATIVO',
      quantidadePrevista: 80,
      valorPrevistoAluno: 5000.0,
      dataContratoTurma: new Date('2026-05-10'),
    },
  });

  // 5. Planos do Projeto
  const planoOuro = await prisma.plano.create({
    data: {
      projetoId: proj.id,
      nome: 'Plano Ouro Completo',
      descricao: 'Baile de Gala + 10 Convites + Buffet Premium + Open Bar Completo',
      valorTotal: 5000.0,
      maxParcelas: 10,
    },
  });

  const planoPrata = await prisma.plano.create({
    data: {
      projetoId: proj.id,
      nome: 'Plano Prata Essencial',
      descricao: 'Baile de Gala + 5 Convites + Buffet Especial',
      valorTotal: 3800.0,
      maxParcelas: 10,
    },
  });

  // 6. Adesões
  // Carlos (1ª parcela paga -> comissão de 4% liberada)
  const adCarlos = await prisma.adesao.create({
    data: {
      codigoIndividualAluno: 'ALU-2026-001',
      alunoId: alunoCarlos.id,
      projetoId: proj.id,
      planoId: planoOuro.id,
      vendedorId: vendedor.id,
      instituicaoNome: 'Universidade Cruzeiro do Sul',
      campusNome: 'Campus Anália Franco',
      cursoNome: 'Enfermagem',
      turno: 'NOITE',
      valorTotalContratado: 5000.0,
      status: 'ATIVA',
      parcelasPagasCount: 1,
      comissaoGarantida: false,
    },
  });

  // Mariana (Aderiu, mas ainda não pagou a 1ª parcela -> comissão prevista, não liberada)
  const adMariana = await prisma.adesao.create({
    data: {
      codigoIndividualAluno: 'ALU-2026-002',
      alunoId: alunaMariana.id,
      projetoId: proj.id,
      planoId: planoOuro.id,
      vendedorId: vendedor.id,
      instituicaoNome: 'Universidade Cruzeiro do Sul',
      campusNome: 'Campus Anália Franco',
      cursoNome: 'Biomedicina',
      turno: 'MANHA',
      valorTotalContratado: 5000.0,
      status: 'ATIVA',
      parcelasPagasCount: 0,
      comissaoGarantida: false,
    },
  });

  // 7. Parcelas
  // Carlos: Parcela 1 Paga, Parcela 2 Pendente
  await prisma.parcela.create({
    data: {
      adesaoId: adCarlos.id,
      numero: 1,
      valor: 500.0,
      vencimento: new Date('2026-06-10'),
      status: 'PAGA',
      dataPagamento: new Date('2026-06-08'),
      valorPago: 500.0,
      formaPagamento: 'BOLETO_SICREDI',
      nossoNumero: '100234918',
      linhaDigitavel: '74891.12345 67890.123456 78901.234567 1 80000000050000',
    },
  });

  await prisma.parcela.create({
    data: {
      adesaoId: adCarlos.id,
      numero: 2,
      valor: 500.0,
      vencimento: new Date('2026-07-10'),
      status: 'PENDENTE',
      nossoNumero: '100234919',
      linhaDigitavel: '74891.12345 67890.123456 78901.234567 1 80000000050000',
    },
  });

  // Mariana: Parcela 1 Pendente (Aguardando Pagamento)
  await prisma.parcela.create({
    data: {
      adesaoId: adMariana.id,
      numero: 1,
      valor: 500.0,
      vencimento: new Date('2026-07-15'),
      status: 'PENDENTE',
      nossoNumero: '100234920',
      linhaDigitavel: '74891.12345 67890.123456 78901.234567 1 80000000050000',
    },
  });

  // 8. Lançamentos de Comissão (Extrato do Vendedor)
  // Carlos: 4% sobre 5.000 = R$ 200,00 LIBERADOS
  await prisma.lancamentoComissao.create({
    data: {
      vendedorId: vendedor.id,
      adesaoId: adCarlos.id,
      tipo: 'LIBERADA',
      valor: 200.0,
      baseCalculo: 5000.0,
      percentual: 4.0,
      descricao: 'Comissão de 4% liberada pela 1ª parcela de Carlos Eduardo Silva',
    },
  });

  // Mariana: 4% sobre 5.000 = R$ 200,00 PREVISTOS (Aguardando 1ª parcela)
  await prisma.lancamentoComissao.create({
    data: {
      vendedorId: vendedor.id,
      adesaoId: adMariana.id,
      tipo: 'PREVISTA',
      valor: 200.0,
      baseCalculo: 5000.0,
      percentual: 4.0,
      descricao: 'Comissão prevista aguardando quitação da 1ª parcela de Mariana Lima Santos',
    },
  });

  // 9. Custos Anteriores do Projeto (Cervejada / Ações de turma)
  await prisma.custoProjeto.create({
    data: {
      projetoId: proj.id,
      descricao: 'Cervejada de Integração da Turma de Saúde',
      valor: 3500.0,
      dataCompetencia: new Date('2026-04-20'),
    },
  });

  // 10. Despesas Fixas Gerais da Empresa (Contas a Pagar sem misturar com projeto)
  await prisma.contaPagar.create({
    data: {
      descricao: 'Aluguel Escritório Comercial',
      favorecido: 'Jardins Empreendimentos',
      categoria: 'ALUGUEL',
      tipoDespesa: 'GERAL_EMPRESA',
      valor: 4500.0,
      vencimento: new Date('2026-07-05'),
      status: 'PAGA',
      dataPagamento: new Date('2026-07-05'),
      isRecorrente: true,
      regraRecorrencia: 'MENSAL',
    },
  });

  console.log('Seed concluído com sucesso!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
