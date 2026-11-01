#!/usr/bin/env node
/**
 * ON Agência de Eventos - Suíte de Testes de Integração Real com Servidor PHP
 * 
 * Executa as APIs PHP reais em um processo de servidor HTTP isolado, verificando
 * respostas HTTP autênticas (códigos de status, cabeçalhos Set-Cookie, Retry-After, CORS),
 * tokens de segurança CSRF, rate limiting, autenticação estrita e mutações de estado em disco.
 * 
 * Zero simulação em JavaScript. 100% executado pelo interpretador PHP real em sandbox isolado.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';

const root = process.cwd();
const sandboxDir = path.join(root, '.test_sandbox_real_php');
const webrootDir = path.join(sandboxDir, 'public');
const privateDir = path.join(sandboxDir, 'private_data');

// Localiza o executável real do PHP
function findPhpBinary() {
  const customWinGetPath = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft/WinGet/Packages/PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe/php.exe'
  );

  const candidates = [
    'php',
    customWinGetPath,
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

// Limpa e prepara sandbox isolado
if (fs.existsSync(sandboxDir)) {
  fs.rmSync(sandboxDir, { recursive: true, force: true });
}
fs.mkdirSync(webrootDir, { recursive: true });
fs.mkdirSync(privateDir, { recursive: true });

// Copia arquivos PHP do backend para o webroot do sandbox
const publicDir = path.join(root, 'public');
const phpFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.php'));
for (const file of phpFiles) {
  fs.copyFileSync(path.join(publicDir, file), path.join(webrootDir, file));
}

// Cria senhas de teste com hashes reais Bcrypt (cost 10 para agilizar execução dos testes)
const hashAdmin = '$2y$10$gh8qsoaS7towV8c3nrHAi.sMgmpfM34Bujo2gnF1pVwLpaEIXMxCO';
const hashOperador = '$2y$10$WA/nIc2zZhNG7gtq.g61cOSHgECDZZqkOxdcmho6HNraG0WNsMmLS';

// Prepara banco de usuários isolado para os testes
const testUsers = [
  {
    id: 'usr-admin-1',
    nome: 'Admin Teste',
    email: 'admin@formatura.com.br',
    senhaHash: hashAdmin,
    precisaRedefinirSenha: false,
    nivel: 'ADMIN',
    cargo: 'Diretor',
    departamento: 'Diretoria',
    telefone: '(11) 99999-0001',
    status: 'ATIVO',
    criadoEm: '2026-01-01T00:00:00Z',
    ultimoAcesso: 'Hoje',
    avatarCor: 'from-amber-400 to-amber-200 text-slate-900'
  },
  {
    id: 'usr-operador-1',
    nome: 'Operador Teste',
    email: 'operador@formatura.com.br',
    senhaHash: hashOperador,
    precisaRedefinirSenha: false,
    nivel: 'BASICO',
    cargo: 'Operador',
    departamento: 'Atendimento',
    telefone: '(11) 99999-0002',
    status: 'ATIVO',
    criadoEm: '2026-01-01T00:00:00Z',
    ultimoAcesso: 'Hoje',
    avatarCor: 'from-blue-600 to-indigo-600 text-white'
  },
  {
    id: 'usr-sem-senha',
    nome: 'Usuario Sem Senha Definida',
    email: 'sem_senha@formatura.com.br',
    senhaHash: '', // Senha vazia - tentativa de login direto deve ser BLOQUEADA
    precisaRedefinirSenha: true,
    nivel: 'ADMIN',
    cargo: 'Consultor',
    departamento: 'Vendas',
    telefone: '(11) 99999-0003',
    status: 'ATIVO',
    criadoEm: '2026-01-01T00:00:00Z',
    ultimoAcesso: 'Nunca',
    avatarCor: 'from-purple-600 to-indigo-600 text-white'
  },
  {
    id: 'usr-inativo',
    nome: 'Usuario Inativado',
    email: 'inativo@formatura.com.br',
    senhaHash: hashOperador,
    precisaRedefinirSenha: false,
    nivel: 'BASICO',
    cargo: 'Ex-Colaborador',
    departamento: 'Vendas',
    telefone: '(11) 99999-0004',
    status: 'INATIVO',
    criadoEm: '2026-01-01T00:00:00Z',
    ultimoAcesso: 'Ontem',
    avatarCor: 'from-slate-600 to-slate-400 text-white'
  }
];

fs.writeFileSync(
  path.join(privateDir, 'usuarios_db.json'),
  JSON.stringify(testUsers, null, 2),
  'utf8'
);

// Prepara banco inicial de vendas para teste de webhook Sicredi
const testVendas = [
  {
    codigoPedido: 'VENDA-TEST-001',
    aluno: 'Aluno Teste Sicredi',
    email: 'aluno@teste.com',
    status: 'PENDENTE',
    valorTotal: 5000,
    parcelasBoletos: [
      {
        numero: 1,
        nossoNumero: 'SICREDI-BOL-1001',
        status: 'PENDENTE',
        valor: 500
      },
      {
        numero: 2,
        nossoNumero: 'SICREDI-BOL-1002',
        txid: 'SICREDI-PIX-2002',
        status: 'PENDENTE',
        valor: 500
      },
      {
        numero: 3,
        nossoNumero: 'SICREDI-BOL-1003',
        status: 'PENDENTE',
        valor: 500
      }
    ]
  }
];

fs.writeFileSync(
  path.join(privateDir, 'vendas_albuns_db.json'),
  JSON.stringify(testVendas, null, 2),
  'utf8'
);

// Configuração do Webhook Sicredi no sandbox
const webhookConfig = {
  webhook_secret: 'sicredi_test_secret_token_1234567890abcdef',
  ambiente: 'homologacao'
};
fs.writeFileSync(
  path.join(privateDir, 'sicredi_api_config.json'),
  JSON.stringify(webhookConfig, null, 2),
  'utf8'
);

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

// Inicia servidor PHP em porta livre apontando para webrootDir
const PORT = 8899;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log('\n============================================================');
console.log('  TESTES DE INTEGRAÇÃO REAL COM SERVIDOR PHP ISOLADO');
console.log('============================================================\n');
console.log(`- Executável PHP: ${phpBinary}`);
console.log(`- Servidor alvo:  ${BASE_URL}`);
console.log(`- Sandbox Root:   ${sandboxDir}`);
console.log(`- Webroot:        ${webrootDir}`);
console.log(`- Private Dir:    ${privateDir}\n`);

const phpServer = spawn(phpBinary, ['-S', `127.0.0.1:${PORT}`, '-t', webrootDir], {
  stdio: 'ignore',
  env: { ...process.env, ON_PRIVATE_DATA_DIR: privateDir }
});

function cleanup() {
  try {
    phpServer.kill();
  } catch {}
  try {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  } catch {}
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/usuarios.php`, { method: 'GET' });
      if (res.status === 401 || res.status === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Servidor PHP embutido não iniciou a tempo na porta ' + PORT);
}

function extractSessionCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(/ON_AUTH_SESSION=([^;]+)/);
  return match ? `ON_AUTH_SESSION=${match[1]}` : '';
}

async function runTests() {
  await waitForServer();

  // -------------------------------------------------------------------------
  // SUÍTE 1: Eliminação de Vulnerabilidade de Login Direto Sem Senha
  // -------------------------------------------------------------------------
  console.log('1. Bloqueio de Login Direto Quando senhaHash está Vazia:');

  const resBypassVazio = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'sem_senha@formatura.com.br',
      senha: ''
    })
  });
  assert(resBypassVazio.status === 400, 'Tentativa com senha vazia rejeitada com HTTP 400');

  const resBypassQualquer = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'sem_senha@formatura.com.br',
      senha: 'QualquerSenhaTentada@123'
    })
  });
  const dataBypass = await resBypassQualquer.json();
  assert(resBypassQualquer.status === 401, 'Tentativa de login sem senha previamente configurada rejeitada com HTTP 401');
  assert(
    dataBypass.codigo === 'PASSWORD_NOT_CONFIGURED',
    'Servidor retorna código explícito PASSWORD_NOT_CONFIGURED exigindo redefinição'
  );
  assert(
    !resBypassQualquer.headers.get('set-cookie')?.includes('ON_AUTH_SESSION'),
    'Nenhum cookie de sessão autenticada é emitido em tentativa de bypass'
  );

  // -------------------------------------------------------------------------
  // SUÍTE 2: Ciclo de Vida de Token Seguro, Zero Tokens em Logs e Rate Limiting
  // -------------------------------------------------------------------------
  console.log('\n2. Ciclo de Vida de Tokens, Rate Limiting Estrito e Purga de Logs:');

  // Teste 2.1: Emissão de token seguro de recuperação via solicitação pública
  const resTokenReq = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'solicitar_recuperacao',
      email: 'sem_senha@formatura.com.br'
    })
  });
  const dataTokenReq = await resTokenReq.json();
  assert(resTokenReq.status === 200, 'Solicitação de recuperação inicial retorna HTTP 200');
  assert(
    !dataTokenReq.token_teste && !dataTokenReq.token && !dataTokenReq.token_recuperacao,
    'Resposta pública HTTP NUNCA expõe o token de segurança no payload'
  );

  // Teste 2.2: Purga estrita de tokens e links em arquivos de log
  const mailSpoolPath = path.join(privateDir, '_outbox_mail.log');
  assert(fs.existsSync(mailSpoolPath), 'Log de auditoria de e-mails gerado no diretório protegido');
  const mailLines = fs.readFileSync(mailSpoolPath, 'utf8').trim().split('\n');
  const lastMail = JSON.parse(mailLines[mailLines.length - 1]);

  assert(
    lastMail.token === undefined,
    'Arquivo de log NUNCA armazena o token em texto puro (chave "token" purgada)'
  );
  assert(
    lastMail.link === undefined,
    'Arquivo de log NUNCA armazena link completo com token (chave "link" purgada)'
  );
  assert(
    typeof lastMail.destinatario_mascarado === 'string' && lastMail.destinatario_mascarado.includes('***'),
    'Destinatário mascarado no log de auditoria para proteção de privacidade LGPD'
  );

  // Varredura de segurança: nenhum arquivo de log pode conter token ou link completo
  let algumLogComToken = false;
  for (const logFile of fs.readdirSync(privateDir).filter(f => f.endsWith('.log'))) {
    const content = fs.readFileSync(path.join(privateDir, logFile), 'utf8');
    if (content.includes('"token":') || content.includes('token=')) {
      algumLogComToken = true;
    }
  }
  assert(!algumLogComToken, 'Varredura completa: NENHUM arquivo .log no servidor contém tokens em texto puro');

  // Teste 2.3: Rate Limiting Estrito em Solicitações de Recuperação (Contabilização Incondicional)
  console.log('\n  2.3 Teste de Rate Limiting na Recuperação de Senha:');
  const resReq2 = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'solicitar_recuperacao', email: 'sem_senha@formatura.com.br' })
  });
  assert(resReq2.status === 200, '2ª solicitação de recuperação aceita dentro do limite (HTTP 200)');

  const resReq3 = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'solicitar_recuperacao', email: 'sem_senha@formatura.com.br' })
  });
  assert(resReq3.status === 200, '3ª solicitação de recuperação aceita dentro do limite (HTTP 200)');

  // 4ª tentativa para o mesmo e-mail/IP deve ser IMEDIATAMENTE bloqueada com HTTP 429
  const resReq4 = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'solicitar_recuperacao', email: 'sem_senha@formatura.com.br' })
  });
  const dataReq4 = await resReq4.json();
  assert(resReq4.status === 429, '4ª solicitação bloqueada por excesso de tentativas com HTTP 429');
  assert(
    dataReq4.codigo === 'RATE_LIMIT_EXCEEDED',
    'Código de erro explícito RATE_LIMIT_EXCEEDED retornado pelo servidor'
  );
  const retryAfterRec = resReq4.headers.get('retry-after');
  assert(
    retryAfterRec !== null && parseInt(retryAfterRec, 10) > 0,
    `Cabeçalho Retry-After retornado com sucesso (${retryAfterRec}s)`
  );

  // Teste 2.4: Geração Segura de Token pelo Administrador e Consumo de Uso Único
  // 1. Login do Administrador
  const resLoginAdmin = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'admin@formatura.com.br',
      senha: 'SenhaAdminForte@123'
    })
  });
  const dataLoginAdmin = await resLoginAdmin.json();
  const sessionAdmin = extractSessionCookie(resLoginAdmin);
  const csrfAdmin = dataLoginAdmin.csrf_token;
  assert(resLoginAdmin.status === 200, 'Login administrativo para emissão segura de token de convite/reset');

  // 2. Administrador gera token de uso único para o usuário sem senha
  const resGenAdmin = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionAdmin,
      'X-CSRF-Token': csrfAdmin
    },
    body: JSON.stringify({
      action: 'gerar_token_admin',
      csrf_token: csrfAdmin,
      email: 'sem_senha@formatura.com.br'
    })
  });
  const dataGenAdmin = await resGenAdmin.json();
  assert(resGenAdmin.status === 200, 'Geração de token administrativo de uso único retorna HTTP 200');
  assert(
    typeof dataGenAdmin.token === 'string' && dataGenAdmin.token.length === 64,
    'Token administrativo possui 256 bits de entropia criptográfica'
  );

  const validToken = dataGenAdmin.token;

  // Teste 2.5: Validação de Estado em Disco (Armazena apenas SHA-256)
  const dbContent = JSON.parse(fs.readFileSync(path.join(privateDir, 'usuarios_db.json'), 'utf8'));
  const usuarioNoDb = dbContent.find(u => u.email === 'sem_senha@formatura.com.br');
  const expectedHash = crypto.createHash('sha256').update(validToken).digest('hex');

  assert(
    usuarioNoDb.resetTokenHash === expectedHash,
    'Banco em disco armazena apenas o hash SHA-256 do token, nunca o token bruto'
  );

  // Teste 2.6: Tentativa com token inválido/adulterado
  const resTokenInvalido = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'redefinir_com_token',
      token: 'token_completamente_falso_0123456789abcdef0123456789abcdef0123456789',
      novaSenha: 'NovaSenhaForte@999'
    })
  });
  assert(resTokenInvalido.status === 401, 'Tentativa com token adulterado é rejeitada com HTTP 401');

  // Teste 2.7: Redefinição bem-sucedida com o token legítimo
  const resRedefinirOk = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'redefinir_com_token',
      token: validToken,
      novaSenha: 'NovaSenhaForte@999'
    })
  });
  const dataRedefinirOk = await resRedefinirOk.json();
  assert(resRedefinirOk.status === 200, 'Redefinição com token autêntico retorna HTTP 200');

  // Teste 2.8: Verificação de Estado em Disco Pós-Redefinição
  const dbPosRedefinicao = JSON.parse(fs.readFileSync(path.join(privateDir, 'usuarios_db.json'), 'utf8'));
  const usuarioPos = dbPosRedefinicao.find(u => u.email === 'sem_senha@formatura.com.br');
  assert(
    usuarioPos.precisaRedefinirSenha === false,
    'Sinalizador precisaRedefinirSenha foi desmarcado em disco'
  );
  assert(
    usuarioPos.senhaHash && usuarioPos.senhaHash.length > 20,
    'Nova senha foi hasheada com algoritmo seguro em disco'
  );
  assert(
    usuarioPos.resetTokenHash === null,
    'Hash do token de redefinição foi purgado do disco após o consumo'
  );

  // Teste 2.9: Prevenção contra Replay Attack
  const resReplay = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'redefinir_com_token',
      token: validToken,
      novaSenha: 'OutraSenhaQualquer@123'
    })
  });
  assert(resReplay.status === 401 || resReplay.status === 410, 'Replay attack bloqueado: reuso do mesmo token falha imediatamente (HTTP 401/410)');

  // Teste 2.10: Login com a nova credencial pessoal
  const resNovoLogin = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'sem_senha@formatura.com.br',
      senha: 'NovaSenhaForte@999'
    })
  });
  const dataNovoLogin = await resNovoLogin.json();
  const sessionCookieNovo = extractSessionCookie(resNovoLogin);
  assert(resNovoLogin.status === 200, 'Login efetuado com sucesso com a nova credencial pessoal');
  assert(sessionCookieNovo.length > 0, 'Cookie seguro ON_AUTH_SESSION gerado pelo servidor PHP');
  const csrfToken = dataNovoLogin.csrf_token;

  // Teste 2.11: Comprovação de Identidade na Sessão Ativa
  const resSemComprovacao = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieNovo,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'redefinir_senha',
      novaSenha: 'NovaSenhaSemComprovar@123'
    })
  });
  const dataSemComprovacao = await resSemComprovacao.json();
  assert(
    resSemComprovacao.status === 401 && dataSemComprovacao.codigo === 'IDENTITY_PROOF_REQUIRED',
    'Tentativa de alteração sem comprovação de identidade rejeitada com HTTP 401 (IDENTITY_PROOF_REQUIRED)'
  );

  // Teste 2.12: Alteração comprovada com a senha atual correta
  const resTrocaOk = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieNovo,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'trocar_senha',
      csrf_token: csrfToken,
      senhaAtual: 'NovaSenhaForte@999',
      novaSenha: 'SenhaDefinitiva@2026'
    })
  });
  assert(resTrocaOk.status === 200, 'Alteração de senha comprovada com senha atual aceita com HTTP 200');

  // Captura cookie atualizado após troca de senha
  let sessionCookieAtualizado = extractSessionCookie(resTrocaOk) || sessionCookieNovo;

  // Login para renovar sessão
  const resRelogin = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'sem_senha@formatura.com.br',
      senha: 'SenhaDefinitiva@2026'
    })
  });
  const dataRelogin = await resRelogin.json();
  sessionCookieAtualizado = extractSessionCookie(resRelogin);
  const csrfTokenAtualizado = dataRelogin.csrf_token;

  // -------------------------------------------------------------------------
  // SUÍTE 3: Proteção Estrita de CSRF Sem Bypass
  // -------------------------------------------------------------------------
  console.log('\n3. Proteção Estrita de CSRF em Todas as Mutações:');

  const resSemCsrf = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieAtualizado
    },
    body: JSON.stringify({
      action: 'add',
      demanda: { titulo: 'Demanda de Teste sem CSRF' }
    })
  });
  assert(resSemCsrf.status === 403, 'Mutação de dados sem token CSRF é rejeitada com HTTP 403');

  const resCsrfFalso = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieAtualizado,
      'X-CSRF-Token': 'token_csrf_forjado_1234567890'
    },
    body: JSON.stringify({
      action: 'add',
      demanda: { titulo: 'Demanda de Teste com CSRF Falso' }
    })
  });
  assert(resCsrfFalso.status === 403, 'Mutação com CSRF forjado é rejeitada com HTTP 403');

  const resCsrfValido = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieAtualizado,
      'X-CSRF-Token': csrfTokenAtualizado
    },
    body: JSON.stringify({
      action: 'add',
      demanda: {
        id: 'DEM-TEST-001',
        titulo: 'Demanda Autorizada com CSRF',
        status: 'PENDENTE'
      }
    })
  });
  assert(resCsrfValido.status === 200, 'Mutação com CSRF genuíno aceita com sucesso (HTTP 200)');

  // -------------------------------------------------------------------------
  // SUÍTE 4: Rate Limiting Real no Servidor no Login
  // -------------------------------------------------------------------------
  console.log('\n4. Rate Limiting no Login (HTTP 429 e Retry-After):');

  const emailAlvo = 'teste_ratelimit_login@formatura.com.br';
  let bloqueadoCom429 = false;
  let retryAfterHeader = null;

  for (let i = 1; i <= 6; i++) {
    const resTentativa = await fetch(`${BASE_URL}/usuarios.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: emailAlvo,
        senha: 'senha_errada_tentativa_' + i
      })
    });

    if (resTentativa.status === 429) {
      bloqueadoCom429 = true;
      retryAfterHeader = resTentativa.headers.get('retry-after');
      break;
    }
  }

  assert(bloqueadoCom429 === true, 'Tentativas excessivas de login disparam HTTP 429 Too Many Requests');
  assert(retryAfterHeader !== null && parseInt(retryAfterHeader, 10) > 0, 'Cabeçalho Retry-After retornado com tempo positivo de espera');

  // -------------------------------------------------------------------------
  // SUÍTE 5: Revalidação em Tempo Real de Sessões (Revogação Imediata)
  // -------------------------------------------------------------------------
  console.log('\n5. Revalidação em Tempo Real de Sessões no Servidor:');

  const resInativoLogin = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'inativo@formatura.com.br',
      senha: 'OperadorForte@123'
    })
  });
  assert(resInativoLogin.status === 403, 'Usuário inativo é impedido de realizar login (HTTP 403)');

  const resMeAtivo = await fetch(`${BASE_URL}/usuarios.php?action=me`, {
    headers: { 'Cookie': sessionCookieAtualizado }
  });
  assert(resMeAtivo.status === 200, 'Sessão ativa consulta dados do usuário atual (HTTP 200)');

  // Inativa em disco
  const dbAtual = JSON.parse(fs.readFileSync(path.join(privateDir, 'usuarios_db.json'), 'utf8'));
  const idx = dbAtual.findIndex(u => u.email === 'sem_senha@formatura.com.br');
  dbAtual[idx].status = 'INATIVO';
  fs.writeFileSync(path.join(privateDir, 'usuarios_db.json'), JSON.stringify(dbAtual, null, 2), 'utf8');

  // Próxima requisição com a mesma sessão deve ser IMEDIATAMENTE invalidada
  const resMeInativado = await fetch(`${BASE_URL}/usuarios.php?action=me`, {
    headers: { 'Cookie': sessionCookieAtualizado }
  });
  assert(resMeInativado.status === 401, 'Sessão é imediatamente revogada após alteração de status em disco (HTTP 401)');

  // -------------------------------------------------------------------------
  // SUÍTE 6: Validação Rigorosa de Webhook Sicredi (Boleto e Pix BACEN)
  // -------------------------------------------------------------------------
  console.log('\n6. Validação Rigorosa do Webhook Sicredi (Formatos Oficiais Bancários):');

  // Teste 6.1: Webhook sem autenticação
  const resWhSemAuth = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evento: 'LIQUIDACAO_BOLETO' })
  });
  assert(resWhSemAuth.status === 401, 'Webhook sem cabeçalhos de autenticação retorna HTTP 401');

  // Teste 6.2: Webhook com token incorreto
  const resWhTokenFalso = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token_sicredi_forjado'
    },
    body: JSON.stringify({ evento: 'LIQUIDACAO_BOLETO' })
  });
  assert(resWhTokenFalso.status === 401, 'Webhook com token incorreto retorna HTTP 401');

  // Teste 6.3: Webhook com status AUSENTE não assume LIQUIDADO (Teste Negativo)
  const resWhStatusAusente = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      nossoNumero: 'SICREDI-BOL-1002',
      valorPago: 500
      // Campo status ausente e sem evento de liquidação
    })
  });
  const dataWhStatusAusente = await resWhStatusAusente.json();
  assert(resWhStatusAusente.status === 200, 'Webhook com status ausente recebido com HTTP 200 para o banco');
  assert(
    dataWhStatusAusente.pagamentoLiquidado === false && dataWhStatusAusente.baixado === false,
    'Status ausente NUNCA é assumido como LIQUIDADO; pagamento mantido como PENDENTE'
  );

  // Teste 6.4: Webhook com evento de alteração/emissão não realiza baixa (Teste Negativo)
  const resWhAlteracao = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      evento: 'ALTERACAO_VENCIMENTO',
      nossoNumero: 'SICREDI-BOL-1002',
      novoVencimento: '2026-12-20'
    })
  });
  const dataWhAlteracao = await resWhAlteracao.json();
  assert(
    dataWhAlteracao.pagamentoLiquidado === false && dataWhAlteracao.baixado === false,
    'Evento ALTERACAO_VENCIMENTO não é tratado como liquidação; baixa ignorada'
  );

  // Teste 6.5: Webhook com status PENDENTE ou CANCELADO não realiza baixa (Teste Negativo)
  const resWhCancelado = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      status: 'CANCELADO',
      nossoNumero: 'SICREDI-BOL-1002'
    })
  });
  const dataWhCancelado = await resWhCancelado.json();
  assert(
    dataWhCancelado.pagamentoLiquidado === false && dataWhCancelado.baixado === false,
    'Notificação com status CANCELADO não altera pagamento para PAGO'
  );

  // Teste 6.6: Webhook Pix BACEN com Devolução/Estorno não liquida (Teste Negativo)
  const resWhPixDevolvido = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      pix: [
        {
          txid: 'SICREDI-PIX-2002',
          valor: '500.00',
          devolucoes: [{ id: 'DEV-1', valor: '500.00', status: 'DEVOLVIDO' }]
        }
      ]
    })
  });
  const dataWhPixDevolvido = await resWhPixDevolvido.json();
  assert(
    dataWhPixDevolvido.pagamentoLiquidado === false && dataWhPixDevolvido.baixado === false,
    'Pix com devoluções/estornos registrados não liquida a parcela'
  );

  // Teste 6.7: Liquidação Legítima de Boleto Sicredi com status LIQUIDADO (Teste Positivo)
  const resWhBoletoOk = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      evento: 'LIQUIDACAO_BOLETO',
      status: 'LIQUIDADO',
      nossoNumero: 'SICREDI-BOL-1001',
      valorPago: 500,
      dataLiquidacao: '2026-10-31'
    })
  });
  const dataWhBoletoOk = await resWhBoletoOk.json();
  assert(resWhBoletoOk.status === 200, 'Webhook com evento oficial de liquidação retorna HTTP 200');
  assert(dataWhBoletoOk.baixado === true, 'Parcela 1 de boleto devidamente baixada após liquidação confirmada');

  // Teste 6.8: Liquidação Legítima Pix Padrão BACEN / Sicredi (Teste Positivo)
  const resWhPixOk = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': 'sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      evento: 'PIX',
      pix: [
        {
          endToEndId: 'E01181521202611011400abc',
          txid: 'SICREDI-PIX-2002',
          valor: '500.00',
          horario: '2026-11-01T14:00:00Z',
          status: 'CONCLUIDO'
        }
      ]
    })
  });
  const dataWhPixOk = await resWhPixOk.json();
  assert(resWhPixOk.status === 200, 'Notificação Pix BACEN oficial aceita com HTTP 200');
  assert(dataWhPixOk.baixado === true, 'Parcela 2 via Pix BACEN baixada com sucesso após validação estrita');

  // Valida estado das parcelas em disco
  const vendasPosWh = JSON.parse(fs.readFileSync(path.join(privateDir, 'vendas_albuns_db.json'), 'utf8'));
  const vendaPos = vendasPosWh.find(v => v.codigoPedido === 'VENDA-TEST-001');
  assert(vendaPos.parcelasBoletos[0].status === 'PAGO', 'Parcela 1 confirmada como PAGO em disco');
  assert(vendaPos.parcelasBoletos[1].status === 'PAGO', 'Parcela 2 confirmada como PAGO em disco');
  assert(vendaPos.parcelasBoletos[2].status === 'PENDENTE', 'Parcela 3 (não notificada) permanece íntegra como PENDENTE');

  // -------------------------------------------------------------------------
  // SUÍTE 7: Armazenamento Seguro Fora do Webroot, Sem Fallback e Backup/Restauração
  // -------------------------------------------------------------------------
  console.log('\n7. Armazenamento Seguro Fora da Raiz Pública e Backup Não Destrutivo:');

  // Teste 7.1: Acesso direto HTTP aos dados privados é bloqueado pelo servidor (404)
  const resWebAccess = await fetch(`${BASE_URL}/private_data/usuarios_db.json`);
  assert(
    resWebAccess.status === 404,
    `Acesso direto HTTP a dados privados resulta em HTTP 404 Not Found (arquivos fora da raiz web pública)`
  );

  // Teste 7.2: Criação de Backup / Snapshot Não Destrutivo
  const phpScriptBackup = `
    require_once '${path.join(webrootDir, 'auth_guard.php').replace(/\\/g, '/')}';
    $res = create_private_data_backup('teste_integridade');
    echo json_encode($res);
  `;
  const backupOut = execFileSync(phpBinary, ['-r', phpScriptBackup], {
    cwd: webrootDir,
    env: { ...process.env, ON_PRIVATE_DATA_DIR: privateDir },
    encoding: 'utf8'
  });
  const backupData = JSON.parse(backupOut.trim());
  assert(backupData.sucesso === true, 'Função create_private_data_backup executa com sucesso');
  assert(backupData.total_arquivos >= 3, `Backup gerado com sucesso contendo ${backupData.total_arquivos} arquivos`);

  const manifestPath = path.join(privateDir, 'backups', 'snapshot_teste_integridade', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'Arquivo manifest.json gerado no diretório de backup');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.files['usuarios_db.json'] && manifest.files['usuarios_db.json'].sha256, 'Manifest registra checksum SHA-256 de usuarios_db.json');

  // Teste 7.3: Restauração com Integridade Criptográfica
  // 1. Modifica o banco de vendas propositalmente
  const vendasAntes = fs.readFileSync(path.join(privateDir, 'vendas_albuns_db.json'), 'utf8');
  fs.writeFileSync(path.join(privateDir, 'vendas_albuns_db.json'), JSON.stringify({ corrompido: true }), 'utf8');

  // 2. Executa restauração do snapshot
  const phpScriptRestore = `
    require_once '${path.join(webrootDir, 'auth_guard.php').replace(/\\/g, '/')}';
    $res = restore_private_data_backup('teste_integridade');
    echo json_encode($res);
  `;
  const restoreOut = execFileSync(phpBinary, ['-r', phpScriptRestore], {
    cwd: webrootDir,
    env: { ...process.env, ON_PRIVATE_DATA_DIR: privateDir },
    encoding: 'utf8'
  });
  const restoreData = JSON.parse(restoreOut.trim());
  assert(restoreData.sucesso === true, 'Função restore_private_data_backup restaura dados do snapshot com sucesso');

  const vendasRestauradas = fs.readFileSync(path.join(privateDir, 'vendas_albuns_db.json'), 'utf8');
  assert(vendasRestauradas === vendasAntes, 'Arquivo restaurado é 100% idêntico byte a byte ao conteúdo prévio do backup');

  // Teste 7.4: Migração Não Destrutiva de Arquivos Legados no Webroot
  const arquivoLegadoPath = path.join(webrootDir, 'legado_migracao_teste.json');
  fs.writeFileSync(arquivoLegadoPath, JSON.stringify({ dado_legado: 'preservado_com_sucesso' }), 'utf8');

  const phpScriptMigrate = `
    require_once '${path.join(webrootDir, 'auth_guard.php').replace(/\\/g, '/')}';
    $path = get_secure_storage_path('legado_migracao_teste.json');
    echo json_encode(['path' => $path]);
  `;
  const migrateOut = execFileSync(phpBinary, ['-r', phpScriptMigrate], {
    cwd: webrootDir,
    env: { ...process.env, ON_PRIVATE_DATA_DIR: privateDir },
    encoding: 'utf8'
  });
  const migrateData = JSON.parse(migrateOut.trim());
  const arquivoMigradoPath = path.join(privateDir, 'legado_migracao_teste.json');

  assert(
    fs.existsSync(arquivoMigradoPath),
    'Arquivo legado foi migrado com sucesso para o diretório privado seguro'
  );
  assert(
    !fs.existsSync(arquivoLegadoPath),
    'Arquivo legado foi removido do webroot público após migração verificada'
  );

  // -------------------------------------------------------------------------
  // SUÍTE 8: Validação Estrita de CORS (Correspondência Exata)
  // -------------------------------------------------------------------------
  console.log('\n8. Validação Estrita de CORS em Tempo de Execução:');

  const resCorsValido = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://onagenciadeeventos.com.br',
      'Access-Control-Request-Method': 'POST'
    }
  });
  assert(
    resCorsValido.headers.get('access-control-allow-origin') === 'https://onagenciadeeventos.com.br',
    'Origem exata autorizada emite header Access-Control-Allow-Origin'
  );

  const resCorsInvalido = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://attacker-onagenciadeeventos.com.br',
      'Access-Control-Request-Method': 'POST'
    }
  });
  assert(
    resCorsInvalido.headers.get('access-control-allow-origin') === null,
    'Origem não autorizada NÃO recebe cabeçalho Access-Control-Allow-Origin'
  );

  // -------------------------------------------------------------------------
  // FINALIZAÇÃO
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------');
  console.log(`TOTAL DE TESTES REAIS PHP: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
  console.log('------------------------------------------------------------\n');

  cleanup();

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✓ Todos os testes de integração real PHP passaram com 100% de sucesso!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('\n[ERRO CRÍTICO NA EXECUÇÃO DOS TESTES]:', err);
  cleanup();
  process.exit(1);
});
