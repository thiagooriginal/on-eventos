import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'node:crypto';

// Verificação criptográfica de senha com tempo constante
function verifyPassword(passwordAttempt: string, storedHashOrSalt: string): boolean {
  if (!passwordAttempt || !storedHashOrSalt) return false;

  // Se o hash armazenado for um formato hash:salt
  if (storedHashOrSalt.includes(':')) {
    const [salt, key] = storedHashOrSalt.split(':');
    const hashedBuffer = crypto.scryptSync(passwordAttempt, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    if (hashedBuffer.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(hashedBuffer, keyBuffer);
  }

  // Fallback seguro em tempo constante para hashes sha256 pré-existentes
  const attemptHash = crypto.createHash('sha256').update(passwordAttempt).digest();
  const targetHash = crypto.createHash('sha256').update(storedHashOrSalt).digest();
  return crypto.timingSafeEqual(attemptHash, targetHash);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Por favor, informe seu e-mail e senha de acesso.' },
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
        { error: 'Este usuário está inativo no sistema. Contate a administração.' },
        { status: 403 }
      );
    }

    // Acesso à plataforma interna restrito aos perfis autorizados
    const perfisInternosPermitidos = ['ADMIN', 'EQUIPE_INTERNA', 'VENDEDOR'];

    if (!perfisInternosPermitidos.includes(usuario.perfil)) {
      return NextResponse.json(
        {
          error:
            'Acesso exclusivo para equipe interna e vendedores. Se você é formando, utilize o portal do aluno.',
        },
        { status: 403 }
      );
    }

    // Verificação criptográfica da senha
    const senhaValida = verifyPassword(senha, usuario.senhaHash || '');
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'E-mail ou senha incorretos. Verifique suas credenciais.' },
        { status: 401 }
      );
    }

    // Retorno seguro sem expor senha ou hash
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      redirectTo: '/admin',
    });
  } catch (error: any) {
    console.error('Erro na autenticação de login:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno no servidor ao realizar login' },
      { status: 500 }
    );
  }
}
