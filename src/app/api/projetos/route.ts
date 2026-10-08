import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nomeProjeto,
      tipo,
      semestre,
      faculdadeNome,
      campusNome,
      cursoNome,
      quantidadePrevista,
      valorPrevistoAluno,
      codigoAdesao,
      dataContratoTurma,
      planoInicialNome,
      planoInicialValor,
    } = body;

    if (!tipo || !semestre || !codigoAdesao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: tipo, semestre e código de adesão.' },
        { status: 400 }
      );
    }

    // Validar unicidade do código exclusivo de adesão
    const codigoExiste = await prisma.projeto.findUnique({
      where: { codigoAdesao: codigoAdesao.trim() },
    });

    if (codigoExiste) {
      return NextResponse.json(
        { error: 'Este código de adesão já está sendo utilizado por outro projeto/turma.' },
        { status: 409 }
      );
    }

    const qtd = Number(quantidadePrevista) || 0;
    const vlr = Number(valorPrevistoAluno) || 0;

    // Criar Projeto e Plano Inicial em Transação
    const novoProjeto = await prisma.$transaction(async (tx) => {
      const proj = await tx.projeto.create({
        data: {
          nomeProjeto: nomeProjeto || `${tipo === 'BAILE' ? 'Baile' : 'Colação'} ${faculdadeNome || ''} ${semestre}`,
          tipo,
          semestre: semestre.trim(),
          faculdadeNome: faculdadeNome?.trim() || null,
          campusNome: campusNome?.trim() || null,
          cursoNome: cursoNome?.trim() || null,
          quantidadePrevista: qtd,
          valorPrevistoAluno: vlr,
          codigoAdesao: codigoAdesao.trim().toUpperCase(),
          status: 'ATIVO',
          dataContratoTurma: dataContratoTurma ? new Date(dataContratoTurma) : null,
        },
      });

      // Cadastrar Plano Inicial vinculado
      if (planoInicialNome && Number(planoInicialValor) > 0) {
        await tx.plano.create({
          data: {
            projetoId: proj.id,
            nome: planoInicialNome.trim(),
            valorTotal: Number(planoInicialValor),
            maxParcelas: 10,
            descricao: `Plano inicial cadastrado na abertura do projeto`,
          },
        });
      }

      return proj;
    });

    return NextResponse.json({ success: true, projeto: novoProjeto }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar projeto:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar projeto no banco de dados' },
      { status: 500 }
    );
  }
}
