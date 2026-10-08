import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Por favor, informe seu e-mail e senha.' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos. Verifique suas credenciais.' },
        { status: 401 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { error: 'Este usuário está inativo no sistema. Contate o suporte.' },
        { status: 403 }
      );
    }

    // Acesso à plataforma interna restrito aos perfis autorizados
    const perfisInternosPermitidos = ['ADMIN', 'EQUIPE_INTERNA', 'VENDEDOR'];

    if (!perfisInternosPermitidos.includes(usuario.perfil)) {
      return NextResponse.json(
        {
          error:
            'Acesso exclusivo para equipe interna e vendedores. Se você é formando, utilize o botão "Acesso Formando".',
        },
        { status: 403 }
      );
    }

    // Simulação de autenticação com sessão
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      redirectTo: '/',
    });
  } catch (error: any) {
    console.error('Erro na autenticação de login:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno no servidor ao realizar login' },
      { status: 500 }
    );
  }
}
