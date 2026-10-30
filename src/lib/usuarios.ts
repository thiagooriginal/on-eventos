// Gerenciador Central de Usuários e Autenticação Segura - ON Agência de Eventos

export type NivelUsuario = 'ADMIN' | 'BASICO';

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  nivel: NivelUsuario; // 'ADMIN' = Acesso Total | 'BASICO' = Operacional / Vendas
  cargo: string;
  departamento: string;
  telefone: string;
  status: 'ATIVO' | 'INATIVO';
  criadoEm: string;
  ultimoAcesso: string;
  avatarCor: string;
  precisaRedefinirAcesso?: boolean;
}

const STORAGE_KEY_USUARIOS = 'on_usuarios_sistema_v2';

export function getCsrfToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const sessaoStr = localStorage.getItem('on_usuario_logado');
    if (sessaoStr) {
      const sessao = JSON.parse(sessaoStr);
      return sessao.csrf_token || '';
    }
  } catch (e) {}
  return '';
}

export const USUARIOS_INICIAIS: UsuarioSistema[] = [
  {
    id: 'usr-1',
    nome: 'Thiago Original',
    email: 'thiago@onagenciadeeventos.com.br',
    nivel: 'ADMIN',
    cargo: 'Diretor Geral & Executivo',
    departamento: 'Diretoria',
    telefone: '(11) 99876-5432',
    status: 'ATIVO',
    criadoEm: '2026-01-15T09:00:00.000Z',
    ultimoAcesso: 'Hoje às 13:10',
    avatarCor: 'from-amber-400 to-amber-200 text-slate-900',
  },
  {
    id: 'usr-2',
    nome: 'Administrador ON',
    email: 'admin@formatura.com.br',
    nivel: 'ADMIN',
    cargo: 'Administrador da Plataforma',
    departamento: 'Tecnologia & Operações',
    telefone: '(11) 98765-4321',
    status: 'ATIVO',
    criadoEm: '2026-01-15T10:00:00.000Z',
    ultimoAcesso: 'Hoje às 13:15',
    avatarCor: 'from-purple-600 to-indigo-600 text-white',
  },
  {
    id: 'usr-valter',
    nome: 'Valter Sá',
    email: 'valter.sa@hotmail.com',
    nivel: 'ADMIN',
    cargo: 'Consultor Comercial',
    departamento: 'Comercial & Vendas',
    telefone: '(11) 91219-8389',
    status: 'ATIVO',
    criadoEm: '2026-10-14T20:00:00.000Z',
    ultimoAcesso: 'Nunca acessou',
    avatarCor: 'from-blue-600 to-indigo-600 text-white',
  },
];

const CORES_AVATAR = [
  'from-purple-600 to-indigo-600 text-white',
  'from-blue-500 to-cyan-500 text-white',
  'from-emerald-500 to-teal-500 text-white',
  'from-fuchsia-500 to-pink-500 text-white',
  'from-amber-400 to-orange-400 text-slate-900',
  'from-rose-500 to-red-500 text-white',
  'from-indigo-600 to-blue-700 text-white',
];

export function getUsuarios(): UsuarioSistema[] {
  if (typeof window === 'undefined') {
    return USUARIOS_INICIAIS;
  }

  try {
    const salvo = localStorage.getItem(STORAGE_KEY_USUARIOS);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(USUARIOS_INICIAIS));
    return USUARIOS_INICIAIS;
  } catch (e) {
    return USUARIOS_INICIAIS;
  }
}

export async function salvarUsuarios(usuarios: UsuarioSistema[]): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
    const csrf = getCsrfToken();
    const res = await fetch('/usuarios.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'save',
        csrf_token: csrf,
        usuarios,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.usuarios)) {
        localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(data.usuarios));
      }
      return true;
    }
  } catch (e) {
    console.error('Erro ao salvar usuários:', e);
  }
  return false;
}

export async function sincronizarUsuariosServidor(): Promise<UsuarioSistema[]> {
  if (typeof window === 'undefined') return USUARIOS_INICIAIS;

  try {
    const res = await fetch('/usuarios.php?t=' + Date.now(), {
      cache: 'no-store',
      credentials: 'include',
    });
    if (res.ok) {
      const serverUsers = await res.json();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(serverUsers));
        return serverUsers;
      }
    }
  } catch (e) {
    console.warn('Servidor indisponível, usando dados locais seguros:', e);
  }

  return getUsuarios();
}

export async function adicionarUsuario(
  dados: Omit<UsuarioSistema, 'id' | 'criadoEm' | 'ultimoAcesso' | 'avatarCor'> & { credencialAcesso?: string }
): Promise<UsuarioSistema> {
  const usuarios = getUsuarios();
  const avatarCor = CORES_AVATAR[Math.floor(Math.random() * CORES_AVATAR.length)];

  const novoUsuario: UsuarioSistema = {
    id: 'usr-' + Date.now(),
    nome: dados.nome,
    email: dados.email,
    nivel: dados.nivel,
    cargo: dados.cargo,
    departamento: dados.departamento,
    telefone: dados.telefone,
    status: dados.status,
    criadoEm: new Date().toISOString(),
    ultimoAcesso: 'Nunca acessou',
    avatarCor,
    precisaRedefinirAcesso: true,
  };

  const emailLimpo = novoUsuario.email.toLowerCase().trim();
  const novaLista = [novoUsuario, ...usuarios.filter((u) => u.email.toLowerCase().trim() !== emailLimpo)];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(novaLista));

    try {
      const csrf = getCsrfToken();
      const res = await fetch('/usuarios.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add',
          csrf_token: csrf,
          usuario: {
            ...novoUsuario,
            credencial: dados.credencialAcesso || '',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.usuarios) && data.usuarios.length > 0) {
          localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(data.usuarios));
        }
      }
    } catch (e) {
      console.warn('Persistido localmente, sincronizando com servidor:', e);
    }
  }

  return novoUsuario;
}

export async function atualizarUsuario(
  id: string,
  atualizacoes: Partial<UsuarioSistema>
): Promise<UsuarioSistema | null> {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;

  usuarios[index] = {
    ...usuarios[index],
    ...atualizacoes,
  };

  await salvarUsuarios(usuarios);
  return usuarios[index];
}

export async function alternarNivelUsuario(id: string): Promise<UsuarioSistema | null> {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const nivelAtual = usuarios[index].nivel;
  const novoNivel: NivelUsuario = nivelAtual === 'ADMIN' ? 'BASICO' : 'ADMIN';

  usuarios[index].nivel = novoNivel;
  await salvarUsuarios(usuarios);
  return usuarios[index];
}

export async function alternarStatusUsuario(id: string): Promise<UsuarioSistema | null> {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const statusAtual = usuarios[index].status;
  usuarios[index].status = statusAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO';

  await salvarUsuarios(usuarios);
  return usuarios[index];
}

export async function removerUsuario(id: string): Promise<boolean> {
  const usuarios = getUsuarios();
  const usuario = usuarios.find((u) => u.id === id);
  if (usuario && (usuario.email.toLowerCase() === 'thiago@onagenciadeeventos.com.br' || usuario.email.toLowerCase() === 'admin@formatura.com.br')) {
    return false;
  }

  const novaLista = usuarios.filter((u) => u.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(novaLista));
  }

  try {
    if (typeof window !== 'undefined') {
      const csrf = getCsrfToken();
      const res = await fetch('/usuarios.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete',
          csrf_token: csrf,
          id,
          email: usuario?.email || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.usuarios)) {
          localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(data.usuarios));
        }
      }
    }
  } catch (e) {}

  return true;
}

// Redefinição Segura de Credencial Obrigatória
export async function redefinirCredencial(novaCredencial: string): Promise<{
  sucesso: boolean;
  erro?: string;
}> {
  try {
    const csrf = getCsrfToken();
    const res = await fetch('/usuarios.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'redefinir_credencial',
        csrf_token: csrf,
        novaCredencial: novaCredencial,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.sucesso) {
      return {
        sucesso: false,
        erro: data?.erro || 'Não foi possível registrar a nova chave de acesso.',
      };
    }

    return { sucesso: true };
  } catch (e) {
    return {
      sucesso: false,
      erro: 'Erro de conexão com o servidor.',
    };
  }
}

// Autenticação Segura 100% no Servidor (PHP com Sessões HttpOnly e Rate Limit)
export async function autenticarUsuario(
  email: string,
  codigoAcesso: string
): Promise<{
  sucesso: boolean;
  usuario?: UsuarioSistema;
  erro?: string;
  csrf_token?: string;
  precisaRedefinirAcesso?: boolean;
}> {
  const emailLimpo = email.trim().toLowerCase();
  const codigoLimpo = codigoAcesso.trim();

  if (!emailLimpo || !codigoLimpo) {
    return { sucesso: false, erro: 'Por favor, informe seu e-mail e chave de acesso.' };
  }

  try {
    const res = await fetch('/usuarios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'login',
        email: emailLimpo,
        credencial: codigoLimpo,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.status === 429) {
      return {
        sucesso: false,
        erro: data?.erro || 'Muitas tentativas incorretas. Acesso temporariamente bloqueado por segurança.',
      };
    }

    if (!res.ok || !data?.sucesso) {
      return {
        sucesso: false,
        erro: data?.erro || 'E-mail ou chave de acesso incorretos. Acesso restrito a usuários autorizados.',
      };
    }

    return {
      sucesso: true,
      usuario: data.usuario,
      csrf_token: data.csrf_token,
      precisaRedefinirAcesso: data.precisaRedefinirSenha,
    };
  } catch (e) {
    console.warn('Falha na comunicação direta com o servidor de autenticação:', e);
    return {
      sucesso: false,
      erro: 'Servidor de autenticação indisponível no momento. Verifique sua conexão.',
    };
  }
}
