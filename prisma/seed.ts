import { prisma } from './src/lib/prisma';

async function seed() {
  console.log('Populando dados iniciais no banco SQLite...');

  // 1. Usuários principais
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@formatura.com.br' },
    update: {},
    create: {
      nome: 'Administrador Geral',
      email: 'admin@formatura.com.br',
      senhaHash: 'hash_seguro_admin',
      perfil: 'ADMIN',
      cpf: '000.000.000-00',
      telefone: '(11) 98888-0000',
    },
  });

  const vendedor = await prisma.usuario.upsert({
    where: { email: 'vendedor.rodrigo@formatura.com.br' },
    update: {},
    create: {
      nome: 'Rodrigo Vendas',
      email: 'vendedor.rodrigo@formatura.com.br',
      senhaHash: 'hash_seguro_vendedor',
      perfil: 'VENDEDOR',
      cpf: '111.222.333-44',
      telefone: '(11) 97777-1111',
    },
  });

  const alunoCarlos = await prisma.usuario.upsert({
    where: { email: 'carlos.aluno@gmail.com' },
    update: {},
    create: {
      nome: 'Carlos Eduardo Silva',
      email: 'carlos.aluno@gmail.com',
      senhaHash: 'hash_aluno_123',
      perfil: 'ALUNO',
      cpf: '222.333.444-55',
      telefone: '(11) 96666-2222',
    },
  });

  // 2. Instituição, Campus e Curso
  const cruzeiroSul = await prisma.instituicao.create({
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

  // 3. Oportunidade Comercial (CRM)
  const oportunidade = await prisma.oportunidade.create({
    data: {
      tituloTurma: 'Saúde Cruzeiro do Sul 2026.2 (Enfermagem e Biomedicina)',
      semestre: '2026.2',
      tipoProjeto: 'BAILE',
      etapa: 'ADESAO',
      vendedorId: vendedor.id,
      quantidadePrevista: 80,
      valorPrevistoAluno: 4800.0,
      codigoAdesao: 'CSUL-SAUDE-2026-2',
      observacoes: 'Negociação com a comissão de formatura concluída. Plantão agendado para o dia 20.',
      dataContratoTurma: new Date('2026-05-15'),
    },
  });

  // 4. Criação do Projeto a partir da 1ª Adesão
  const projeto = await prisma.projeto.create({
    data: {
      oportunidadeId: oportunidade.id,
      codigoAdesao: oportunidade.codigoAdesao,
      tipo: 'BAILE',
      semestre: '2026.2',
      status: 'ATIVO',
      quantidadePrevista: 80,
    },
  });

  // 5. Planos do Projeto
  const planoCompleto = await prisma.plano.create({
    data: {
      projetoId: projeto.id,
      nome: 'Plano Ouro Completo',
      descricao: 'Baile de Gala + 10 Convites + Buffet Premium + Open Bar + Espaço Kids',
      valorTotal: 5000.0,
      maxParcelas: 10,
    },
  });

  // 6. Adesão do Carlos
  const adesao = await prisma.adesao.create({
    data: {
      codigoIndividualAluno: 'ALU-2026-001',
      alunoId: alunoCarlos.id,
      projetoId: projeto.id,
      planoId: planoCompleto.id,
      vendedorId: vendedor.id,
      instituicaoNome: 'Universidade Cruzeiro do Sul',
      campusNome: 'Anália Franco',
      cursoNome: 'Enfermagem',
      turno: 'NOITE',
      valorTotalContratado: 5000.0,
      status: 'ATIVA',
      parcelasPagasCount: 1, // 1ª paga!
      comissaoGarantida: false,
    },
  });

  // 7. Parcelas do Aluno
  const p1 = await prisma.parcela.create({
    data: {
      adesaoId: adesao.id,
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

  const p2 = await prisma.parcela.create({
    data: {
      adesaoId: adesao.id,
      numero: 2,
      valor: 500.0,
      vencimento: new Date('2026-07-10'),
      status: 'PENDENTE',
      nossoNumero: '100234919',
      linhaDigitavel: '74891.12345 67890.123456 78901.234567 1 80000000050000',
    },
  });

  // 8. Lançamento da Comissão (1ª Parcela Liberada -> 4% = R$ 200,00)
  await prisma.lancamentoComissao.create({
    data: {
      vendedorId: vendedor.id,
      adesaoId: adesao.id,
      tipo: 'LIBERADA',
      valor: 200.0,
      baseCalculo: 5000.0,
      percentual: 4.0,
      descricao: 'Comissão liberada pela confirmação de pagamento da 1ª parcela de Carlos Eduardo Silva',
    },
  });

  // 9. Custos Anteriores do Projeto (Cervejada / Ações de turma)
  await prisma.custoProjeto.create({
    data: {
      projetoId: projeto.id,
      descricao: 'Cervejada de Integração da Turma de Saúde',
      valor: 3500.0,
      dataCompetencia: new Date('2026-04-20'),
    },
  });

  // 10. Despesas Gerais da Empresa (Contas Fixas)
  await prisma.contaPagar.create({
    data: {
      descricao: 'Aluguel do Escritório Central',
      favorecido: 'Imobiliária Jardins Ltda',
      categoria: 'ALUGUEL',
      tipoDespesa: 'GERAL_EMPRESA',
      valor: 4200.0,
      vencimento: new Date('2026-07-05'),
      status: 'PAGA',
      dataPagamento: new Date('2026-07-05'),
      isRecorrente: true,
      regraRecorrencia: 'MENSAL',
    },
  });

  console.log('Seed executado com sucesso! Usuários, Projetos, Parcelas e Comissões criados.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
