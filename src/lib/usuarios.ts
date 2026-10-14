// Gerenciador de Usuários e Níveis de Acesso do Sistema ON Eventos

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

const STORAGE_KEY_USUARIOS = 'on_usuarios_sistema';

export const USUARIOS_INICIAIS: UsuarioSistema[] = [
  {
    id: 'usr-1',
    nome: 'Thiago Original',
    email: 'thiago@onagenciadeeventos.com.br',
    senha: 'admin',
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
    senha: 'admin',
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
    id: 'usr-3',
    nome: 'Rodrigo Consultor',
    email: 'vendedor.rodrigo@formatura.com.br',
    senha: '123',
    nivel: 'BASICO',
    cargo: 'Consultor Comercial de Formaturas',
    departamento: 'Comercial',
    telefone: '(11) 97654-3210',
    status: 'ATIVO',
    criadoEm: '2026-02-01T14:30:00.000Z',
    ultimoAcesso: 'Hoje às 11:42',
    avatarCor: 'from-blue-500 to-cyan-500 text-white',
  },
  {
    id: 'usr-4',
    nome: 'Camila Fotografia',
    email: 'camila.fotos@formatura.com.br',
    senha: '123',
    nivel: 'BASICO',
    cargo: 'Especialista em Vendas de Álbuns & Kits',
    departamento: 'Fotografia & Produção',
    telefone: '(11) 96543-2109',
    status: 'ATIVO',
    criadoEm: '2026-02-10T11:00:00.000Z',
    ultimoAcesso: 'Hoje às 10:25',
    avatarCor: 'from-fuchsia-500 to-pink-500 text-white',
  },
  {
    id: 'usr-5',
    nome: 'Larissa Atendimento',
    email: 'larissa.comissao@formatura.com.br',
    senha: '123',
    nivel: 'BASICO',
    cargo: 'Coordenadora de Atendimento às Comissões',
    departamento: 'Atendimento & Suporte',
    telefone: '(11) 95432-1098',
    status: 'ATIVO',
    criadoEm: '2026-03-05T08:15:00.000Z',
    ultimoAcesso: 'Ontem às 17:50',
    avatarCor: 'from-emerald-500 to-teal-500 text-white',
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
    // Inicializa com os usuários padrão se não houver dados
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(USUARIOS_INICIAIS));
    return USUARIOS_INICIAIS;
  } catch (e) {
    return USUARIOS_INICIAIS;
  }
}

export function salvarUsuarios(usuarios: UsuarioSistema[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  } catch (e) {
    console.error('Erro ao salvar usuários:', e);
  }
}

export function adicionarUsuario(
  dados: Omit<UsuarioSistema, 'id' | 'criadoEm' | 'ultimoAcesso' | 'avatarCor'>
): UsuarioSistema {
  const usuarios = getUsuarios();
  const avatarCor = CORES_AVATAR[Math.floor(Math.random() * CORES_AVATAR.length)];

  const novoUsuario: UsuarioSistema = {
    ...dados,
    id: 'usr-' + Date.now(),
    criadoEm: new Date().toISOString(),
    ultimoAcesso: 'Nunca acessou',
    avatarCor,
  };

  const novaLista = [novoUsuario, ...usuarios];
  salvarUsuarios(novaLista);
  return novoUsuario;
}

export function atualizarUsuario(
  id: string,
  atualizacoes: Partial<UsuarioSistema>
): UsuarioSistema | null {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;

  usuarios[index] = {
    ...usuarios[index],
    ...atualizacoes,
  };

  salvarUsuarios(usuarios);
  return usuarios[index];
}

export function alternarNivelUsuario(id: string): UsuarioSistema | null {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const nivelAtual = usuarios[index].nivel;
  const novoNivel: NivelUsuario = nivelAtual === 'ADMIN' ? 'BASICO' : 'ADMIN';

  usuarios[index].nivel = novoNivel;
  salvarUsuarios(usuarios);
  return usuarios[index];
}

export function alternarStatusUsuario(id: string): UsuarioSistema | null {
  const usuarios = getUsuarios();
  const index = usuarios.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const statusAtual = usuarios[index].status;
  usuarios[index].status = statusAtual === 'ATIVO' ? 'INATIVO' : 'ATIVO';

  salvarUsuarios(usuarios);
  return usuarios[index];
}

export function removerUsuario(id: string): boolean {
  const usuarios = getUsuarios();
  // Protege para nunca remover o usuário Thiago Original ou Administrador principal
  const usuario = usuarios.find((u) => u.id === id);
  if (usuario && (usuario.email === 'thiago@onagenciadeeventos.com.br' || usuario.email === 'admin@formatura.com.br')) {
    return false;
  }

  const novaLista = usuarios.filter((u) => u.id !== id);
  salvarUsuarios(novaLista);
  return true;
}
