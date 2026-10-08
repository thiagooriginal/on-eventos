import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, contato, curso, faculdade, cidade, qtdAlunos, semestre, mensagem } = body;

    if (!nome || !contato) {
      return NextResponse.json({ error: 'Nome e contato são obrigatórios.' }, { status: 400 });
    }

    // Busca um vendedor ativo para atribuir o lead ou o primeiro vendedor
    const vendedor = await prisma.usuario.findFirst({
      where: { perfil: 'VENDEDOR' },
    });

    if (!vendedor) {
      return NextResponse.json({ error: 'Nenhum consultor disponível para receber o lead.' }, { status: 500 });
    }

    const semestreFormatado = semestre?.trim() || '2026.2';
    const codigoTurmaSugerido = `ON-${curso ? curso.substring(0, 3).toUpperCase() : 'TURMA'}-${semestreFormatado.replace('.', '')}-${Math.floor(100 + Math.random() * 900)}`;

    // Cria como Oportunidade no CRM automaticamente na etapa PRIMEIRO_CONTATO
    const oportunidade = await prisma.oportunidade.create({
      data: {
        tituloTurma: `${curso || 'Turma'} ${faculdade || ''} ${semestreFormatado} (${cidade || ''})`,
        semestre: semestreFormatado,
        tipoProjeto: 'BAILE',
        etapa: 'PRIMEIRO_CONTATO',
        vendedorId: vendedor.id,
        quantidadePrevista: Number(qtdAlunos) || 50,
        valorPrevistoAluno: 4500.0,
        codigoAdesao: codigoTurmaSugerido,
        observacoes: `Lead recebido pelo Site Institucional:\nNome: ${nome}\nEmail: ${email}\nTelefone/Whatsapp: ${contato}\nCidade: ${cidade}\nCurso: ${curso}\nFaculdade: ${faculdade}\nMensagem: ${mensagem || 'Nenhuma mensagem adicional'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Orçamento solicitado com sucesso! Nossa equipe entrará em contato.',
      oportunidadeId: oportunidade.id,
    });
  } catch (error: any) {
    console.error('Erro ao processar formulário do site:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar o pedido de orçamento.' },
      { status: 500 }
    );
  }
}
