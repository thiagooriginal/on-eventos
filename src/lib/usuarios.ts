// Gerenciador de Usuários, Permissões e Autenticação Segura ON Eventos

export type NivelUsuario = 'ADMIN' | 'BASICO';

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  nivel: NivelUsuario; // 'ADMIN' = Acesso Total | 'BASICO' = Operacional / Vendas
  cargo: string;
  departamento: string;
  telefone: string;
  status: 'ATIVO' | 'INATIVO';
  criadoEm: string;
  ultimoAcesso: string;
  avatarCor: string;
}

const STORAGE_KEY_USUARIOS = 'on_usuarios_sistema_v2';

export const USUARIOS_INICIAIS: UsuarioSistema[] = [
  {
    id: 'usr-1',
    nome: 'Thiago Original',
    email: 'thiago@onagenciadeeventos.com.br',
    senha: 'On@2026',
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
    senha: 'On@2026',
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
    senha: '1gabriella5',
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
    // Inicializa com os usuários padrão se não houver nada salvo
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
    // Sincroniza diretamente com o servidor Hostinger
    const res = await fetch('/usuarios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
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
    const res = await fetch('/usuarios.php?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const serverUsers = await res.json();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        // O servidor é a autoridade central: reflete exclusões e cadastros com exatidão
        localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(serverUsers));
        return serverUsers;
      }
    }
  } catch (e) {
    console.warn('Servidor inacessível, mantendo dados locais:', e);
  }

  return getUsuarios();
}

export async function adicionarUsuario(
  dados: Omit<UsuarioSistema, 'id' | 'criadoEm' | 'ultimoAcesso' | 'avatarCor'>
): Promise<UsuarioSistema> {
  const usuarios = getUsuarios();
  const avatarCor = CORES_AVATAR[Math.floor(Math.random() * CORES_AVATAR.length)];

  const novoUsuario: UsuarioSistema = {
    ...dados,
    id: 'usr-' + Date.now(),
    senha: dados.senha || 'On@2026',
    criadoEm: new Date().toISOString(),
    ultimoAcesso: 'Nunca acessou',
    avatarCor,
  };

  const emailLimpo = novoUsuario.email.toLowerCase().trim();
  const novaLista = [novoUsuario, ...usuarios.filter((u) => u.email.toLowerCase().trim() !== emailLimpo)];

  if (typeof window !== 'undefined') {
    // 1. Salva imediatamente no localStorage
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(novaLista));

    // 2. Persiste atomicamente no servidor Hostinger e aguarda confirmação
    try {
      const res = await fetch('/usuarios.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          usuario: novoUsuario,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.usuarios) && data.usuarios.length > 0) {
          localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(data.usuarios));
        }
      }
    } catch (e) {
      console.warn('Salvo localmente, servidor offline:', e);
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

  // Dispara exclusão direta no servidor central Hostinger
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/usuarios.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
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

// Autenticação rigorosa e segura
export function autenticarUsuario(email: string, senhaDigitada: string): {
  sucesso: boolean;
  usuario?: UsuarioSistema;
  erro?: string;
} {
  const emailLimpo = email.trim().toLowerCase();
  const senhaLimpa = senhaDigitada.trim();

  if (!emailLimpo || !senhaLimpa) {
    return { sucesso: false, erro: 'Por favor, informe seu e-mail e senha de acesso.' };
  }

  const usuarios = getUsuarios();
  const usuario = usuarios.find((u) => u.email.toLowerCase() === emailLimpo);

  if (!usuario) {
    return { sucesso: false, erro: 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.' };
  }

  if (usuario.status !== 'ATIVO') {
    return { sucesso: false, erro: 'Acesso bloqueado: este usuário foi inativado pelo administrador.' };
  }

  const senhaCadastrada = usuario.senha || 'On@2026';
  if (senhaLimpa !== senhaCadastrada) {
    return { sucesso: false, erro: 'E-mail ou senha incorretos. Acesso restrito a usuários autorizados.' };
  }

  // Registra horário do login (sem bloquear o retorno)
  atualizarUsuario(usuario.id, {
    ultimoAcesso: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }).catch(() => {});

  return { sucesso: true, usuario };
}
