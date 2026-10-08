import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oportunidadeId, novaEtapa, responsavelNome } = body;

    if (!oportunidadeId || !novaEtapa) {
      return NextResponse.json(
        { error: 'Dados incompletos. Informe oportunidadeId e novaEtapa.' },
        { status: 400 }
      );
    }

    const opAtual = await prisma.oportunidade.findUnique({
      where: { id: oportunidadeId },
    });

    if (!opAtual) {
      return NextResponse.json({ error: 'Oportunidade não encontrada.' }, { status: 404 });
    }

    // Atualiza a etapa e registra no histórico comercial
    const [atualizada] = await prisma.$transaction([
      prisma.oportunidade.update({
        where: { id: oportunidadeId },
        data: { etapa: novaEtapa },
      }),
      prisma.historicoCrm.create({
        data: {
          oportunidadeId,
          etapaAnterior: opAtual.etapa,
          etapaNova: novaEtapa,
          responsavelNome: responsavelNome || 'Equipe Comercial',
          motivo: 'Movimentação manual no CRM',
        },
      }),
    ]);

    return NextResponse.json({ success: true, oportunidade: atualizada });
  } catch (error: any) {
    console.error('Erro ao atualizar etapa do CRM:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
