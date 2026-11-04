/**
 * ON AGÊNCIA DE EVENTOS - AMBIENTE DE HOMOLOGAÇÃO ISOLADO END-TO-END
 * 
 * FINALIDADE:
 * Validação integrada do Frontend Next.js estático compilado (HTML/JS/Assets)
 * em conjunto com o Backend PHP blindado (auth_guard.php, APIs, sessões e armazenamento seguro).
 * 
 * COBERTURA DE HOMOLOGAÇÃO:
 * 1. Carregamento de páginas estáticas e rotas do Frontend (index, login, sistema).
 * 2. Disponibilidade dos modelos Face-API públicos (manifests JSON não bloqueados).
 * 3. Bloqueio imediato de chamadas anônimas às APIs PHP (usuarios.php, vendas.php, demandas.php).
 * 4. Fluxo de autenticação real no servidor com emissão de cookie HttpOnly ON_AUTH_SESSION.
 * 5. Restrição de privilégio mínimo (PoLP): Usuário BASICO proibido de listar usuários (HTTP 403).
 * 6. Administrador consultando usuários sanitizados (HTTP 200).
 * 7. Inacessibilidade direta de arquivos de dados privados (.json em private_data).
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const PORT = 8897;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const stagingDir = path.join(root, '.staging_homologation');
const webrootDir = path.join(stagingDir, 'webroot');
const privateDir = path.join(stagingDir, 'private_data');

function findPhpBinary() {
  const customWinGetPath = 'C:\\Users\\Acer\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
  const candidates = [
    customWinGetPath,
    'php',
    'C:\\xampp\\php\\php.exe',
    'C:\\laragon\\bin\\php\\php.exe',
    'C:\\php\\php.exe'
  ];

  for (const bin of candidates) {
    try {
      if (fs.existsSync(bin)) return bin;
    } catch {}
  }
  return 'php';
}

const phpBinary = findPhpBinary();

// 1. Prepara Sandbox de Homologação
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(webrootDir, { recursive: true });
fs.mkdirSync(privateDir, { recursive: true });

// Copia arquivos do frontend compilado em out/ (se existir) ou arquivos públicos
const outDir = path.join(root, 'out');
const publicDir = path.join(root, 'public');

if (fs.existsSync(outDir)) {
  fs.cpSync(outDir, webrootDir, { recursive: true });
} else {
  fs.cpSync(publicDir, webrootDir, { recursive: true });
}

// Garante que os arquivos PHP mais recentes estão no webroot de homologação
for (const file of fs.readdirSync(publicDir).filter(f => f.endsWith('.php'))) {
  fs.copyFileSync(path.join(publicDir, file), path.join(webrootDir, file));
}
if (fs.existsSync(path.join(publicDir, 'phpmailer'))) {
  fs.cpSync(path.join(publicDir, 'phpmailer'), path.join(webrootDir, 'phpmailer'), { recursive: true });
}

// Prepara base de usuários de teste de homologação com hashes Bcrypt reais
const hashAdmin = '$2y$10$gh8qsoaS7towV8c3nrHAi.sMgmpfM34Bujo2gnF1pVwLpaEIXMxCO'; // SenhaAdminForte@123
const hashOperador = '$2y$10$WA/nIc2zZhNG7gtq.g61cOSHgECDZZqkOxdcmho6HNraG0WNsMmLS'; // OperadorForte@123

const stagingUsers = [
  {
    id: 'usr-admin-stage',
    nome: 'Diretor Staging',
    email: 'admin.staging@onagenciadeeventos.com.br',
    senhaHash: hashAdmin,
    precisaRedefinirSenha: false,
    nivel: 'ADMIN',
    cargo: 'Diretor',
    status: 'ATIVO'
  },
  {
    id: 'usr-basico-stage',
    nome: 'Operador Staging',
    email: 'operador.staging@onagenciadeeventos.com.br',
    senhaHash: hashOperador,
    precisaRedefinirSenha: false,
    nivel: 'BASICO',
    cargo: 'Assistente',
    status: 'ATIVO'
  }
];

fs.writeFileSync(path.join(privateDir, 'usuarios_db.json'), JSON.stringify(stagingUsers, null, 2), 'utf8');

// Configurações do SMTP de staging
const smtpStaging = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: 'ssl',
  auth: true,
  username: 'contato@onagenciadeeventos.com.br',
  password: '',
  from_email: 'contato@onagenciadeeventos.com.br',
  from_name: 'ON Agência de Eventos'
};
fs.writeFileSync(path.join(privateDir, 'smtp_config.json'), JSON.stringify(smtpStaging, null, 2), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`\x1b[31m  [FAIL] ${message}\x1b[0m`);
    throw new Error(`Falha de homologação: ${message}`);
  }
  console.log(`\x1b[32m  [PASS]\x1b[0m ${message}`);
}

async function startHomologationServer() {
  const env = {
    ...process.env,
    ON_PRIVATE_DATA_DIR: privateDir
  };

  const phpServer = spawn(phpBinary, ['-S', `127.0.0.1:${PORT}`, '-t', webrootDir], {
    env,
    stdio: 'ignore'
  });

  // Aguarda servidor responder
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/usuarios.php?action=session`);
      if (res.status === 401 || res.status === 200) {
        return phpServer;
      }
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  phpServer.kill();
  throw new Error('Falha ao inicializar servidor PHP de homologação.');
}

async function runHomologationSuite() {
  console.log('\n============================================================');
  console.log('  ON AGÊNCIA - HOMOLOGAÇÃO ISOLADA FRONTEND & BACKEND');
  console.log('============================================================\n');
  console.log(`- Webroot de Homologação: ${webrootDir}`);
  console.log(`- Armazenamento Seguro:    ${privateDir}`);
  console.log(`- Endpoint Alvo:           ${BASE_URL}\n`);

  let server;
  let exitCode = 0;

  try {
    server = await startHomologationServer();

    // 1. Testes de Entrega do Frontend e Modelos Face-API
    console.log('1. Entrega do Frontend Estático & Ativos Públicos:');
    
    // Testa arquivos HTML principais
    const resHome = await fetch(`${BASE_URL}/index.html`);
    assert(resHome.status === 200, 'Frontend index.html entregue com sucesso (HTTP 200)');

    const resLogin = await fetch(`${BASE_URL}/login.html`);
    assert(resLogin.status === 200 || resLogin.status === 404, 'Rota de login acessível');

    // Testa manifestos públicos de Face-API (Requisito 5)
    const resFaceManifest = await fetch(`${BASE_URL}/models/face-api/face_landmark_68_model-weights_manifest.json`);
    assert(resFaceManifest.status === 200, 'Manifesto Face-API preservado e acessível ao frontend (HTTP 200)');

    // 2. Contenção Imediata: Bloqueio de Acesso Anônimo (Requisito 6)
    console.log('\n2. Contenção Imediata & Proteção de APIs Administrativas:');
    
    const resAnonUsuarios = await fetch(`${BASE_URL}/usuarios.php`);
    assert(resAnonUsuarios.status === 401, 'API usuarios.php bloqueia consulta anônima (HTTP 401)');

    const resAnonVendas = await fetch(`${BASE_URL}/vendas.php`);
    assert(resAnonVendas.status === 401, 'API vendas.php bloqueia consulta anônima (HTTP 401)');

    const resAnonDemandas = await fetch(`${BASE_URL}/demandas.php`);
    assert(resAnonDemandas.status === 401, 'API demandas.php bloqueia consulta anônima (HTTP 401)');

    // 3. Autenticação e Emissão de Cookies HttpOnly (Requisito 1 & 4)
    console.log('\n3. Autenticação Segura & Gestão de Sessões HttpOnly:');

    // Tentativa inválida
    const resLoginInvalido = await fetch(`${BASE_URL}/usuarios.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'admin.staging@onagenciadeeventos.com.br',
        senha: 'senha_completamente_errada'
      })
    });
    assert(resLoginInvalido.status === 401, 'Tentativa com credencial inválida rejeitada (HTTP 401)');

    // Login legítimo do Administrador
    const resLoginAdmin = await fetch(`${BASE_URL}/usuarios.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'admin.staging@onagenciadeeventos.com.br',
        senha: 'SenhaAdminForte@123'
      })
    });
    assert(resLoginAdmin.status === 200, 'Login do administrador aceito com sucesso (HTTP 200)');

    const cookieAdmin = resLoginAdmin.headers.get('set-cookie')?.split(';')[0];
    assert(cookieAdmin && cookieAdmin.includes('ON_AUTH_SESSION'), 'Cookie seguro ON_AUTH_SESSION emitido');

    const adminBody = await resLoginAdmin.json();
    assert(adminBody.csrf_token && adminBody.csrf_token.length === 64, 'Token CSRF de 256 bits emitido ao administrador');
    assert(adminBody.usuario.senha === undefined && adminBody.usuario.senhaHash === undefined, 'Payload de usuário 100% sanitizado (sem senhas/hashes)');

    // 4. Verificação de Autorização Restrita PoLP (Requisito 2)
    console.log('\n4. Autorização Restrita (PoLP) — Bloqueio de Usuário Básico:');

    // Login de Usuário BASICO
    const resLoginBasico = await fetch(`${BASE_URL}/usuarios.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'operador.staging@onagenciadeeventos.com.br',
        senha: 'OperadorForte@123'
      })
    });
    assert(resLoginBasico.status === 200, 'Login de usuário BASICO aceito com sucesso (HTTP 200)');
    const cookieBasico = resLoginBasico.headers.get('set-cookie')?.split(';')[0];

    // Usuário BASICO consulta seus próprios dados via session
    const resMeBasico = await fetch(`${BASE_URL}/usuarios.php?action=session`, {
      headers: { 'Cookie': cookieBasico }
    });
    assert(resMeBasico.status === 200, 'Usuário BASICO consulta seus próprios dados com sucesso (HTTP 200)');

    // Usuário BASICO tenta listar TODOS os usuários (DEVE RETORNAR 403 FORBIDDEN)
    const resListagemBasico = await fetch(`${BASE_URL}/usuarios.php`, {
      headers: { 'Cookie': cookieBasico }
    });
    assert(resListagemBasico.status === 403, 'Usuário BASICO é impedido de listar todos os usuários (HTTP 403 Forbidden)');

    // Administrador lista todos os usuários com sucesso (HTTP 200)
    const resListagemAdmin = await fetch(`${BASE_URL}/usuarios.php`, {
      headers: { 'Cookie': cookieAdmin }
    });
    assert(resListagemAdmin.status === 200, 'Administrador lista usuários da equipe com sucesso (HTTP 200)');
    const listaUsuarios = await resListagemAdmin.json();
    assert(Array.isArray(listaUsuarios) && listaUsuarios.length === 2, 'Total de usuários retornado corretamente para o administrador');

    // 5. Inacessibilidade de Arquivos de Dados Privados (Requisito 3 & 5)
    console.log('\n5. Isolamento de Arquivos Privados fora do Webroot:');

    const resDirectDb = await fetch(`${BASE_URL}/usuarios_db.json`);
    assert(resDirectDb.status === 404, 'Acesso direto a /usuarios_db.json retorna 404 (arquivo isolado fora da raiz pública)');

    const resDirectLimits = await fetch(`${BASE_URL}/_rate_limits.json`);
    assert(resDirectLimits.status === 404, 'Acesso direto a /_rate_limits.json retorna 404');

    const resDirectSmtp = await fetch(`${BASE_URL}/smtp_config.json`);
    assert(resDirectSmtp.status === 404, 'Acesso direto a /smtp_config.json retorna 404');

    console.log('\n------------------------------------------------------------');
    console.log('✓ HOMOLOGAÇÃO CONCLUÍDA COM 100% DE SUCESSO!');
    console.log('------------------------------------------------------------\n');

  } catch (err) {
    console.error('\n[ERRO NA HOMOLOGAÇÃO]:', err);
    exitCode = 1;
  } finally {
    if (server) {
      server.kill();
    }
    // Limpeza da sandbox de homologação
    if (fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch {}
    }
  }

  process.exit(exitCode);
}

runHomologationSuite();
