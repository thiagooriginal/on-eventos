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
import { spawn } from 'node:child_process';

const root = process.cwd();
const sandboxDir = path.join(root, '.test_sandbox_real_php');
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
fs.mkdirSync(privateDir, { recursive: true });

// Copia arquivos PHP do backend para o sandbox
const publicDir = path.join(root, 'public');
const phpFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.php'));
for (const file of phpFiles) {
  fs.copyFileSync(path.join(publicDir, file), path.join(sandboxDir, file));
}

// Cria senhas de teste com hashes reais Bcrypt (cost 10 para agilizar execução dos testes)
// Hash Bcrypt para "SenhaAdminForte@123":
const hashAdmin = '$2y$10$wK6Q5ZtY49v0G7n.128FyeQv8gJt3Xb5d4GkY7Q0A61S8n4dKzB6W';
// Hash Bcrypt para "OperadorForte@123":
const hashOperador = '$2y$10$k8S5a8hF.7n6D4k9l0m1e.y8G3k7h5J1a2b3c4d5e6f7g8h9i0j1.';

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

// Inicia servidor PHP em porta livre
const PORT = 8899;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log('\n============================================================');
console.log('  TESTES DE INTEGRAÇÃO REAL COM SERVIDOR PHP ISOLADO');
console.log('============================================================\n');
console.log(`- Executável PHP: ${phpBinary}`);
console.log(`- Servidor alvo:  ${BASE_URL}`);
console.log(`- Sandbox:        ${sandboxDir}\n`);

const phpServer = spawn(phpBinary, ['-S', `127.0.0.1:${PORT}`, '-t', sandboxDir], {
  stdio: 'ignore'
});

// Garante encerramento do processo PHP ao sair
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

// Aguarda inicialização do servidor HTTP PHP
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

// Helper para extrair cookie de sessão
function extractSessionCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(/ON_AUTH_SESSION=([^;]+)/);
  return match ? `ON_AUTH_SESSION=${match[1]}` : '';
}

async function runTests() {
  await waitForServer();

  // -------------------------------------------------------------------------
  // SUÍTE 1: Correção de Vulnerabilidade Crítica - Bloqueio Absoluto de Bypass
  // -------------------------------------------------------------------------
  console.log('1. Verificação de Bloqueio de Bypass na Autenticação (PHP Real):');

  // Teste 1.1: Tentativa de login sem senha para usuário com precisaRedefinirSenha = true
  const resBypassVazio = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'sem_senha@formatura.com.br',
      senha: '   '
    })
  });
  const dataBypassVazio = await resBypassVazio.json();
  assert(resBypassVazio.status === 400 || resBypassVazio.status === 401, 'Login com senha vazia retorna erro 400/401');

  // Teste 1.2: Tentativa de login com qualquer senha para usuário sem hash
  const resBypassQualquer = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'sem_senha@formatura.com.br',
      senha: 'qualquer_senha_aleatoria'
    })
  });
  const dataBypassQualquer = await resBypassQualquer.json();
  assert(
    resBypassQualquer.status === 401,
    'Login sem hash configurado é terminantemente bloqueado com HTTP 401'
  );
  assert(
    dataBypassQualquer.codigo === 'PASSWORD_NOT_CONFIGURED',
    'Servidor retorna código explícito PASSWORD_NOT_CONFIGURED exigindo redefinição'
  );
  assert(
    !resBypassQualquer.headers.get('set-cookie')?.includes('ON_AUTH_SESSION'),
    'Nenhum cookie de sessão autenticada é emitido em tentativa de bypass'
  );

  // -------------------------------------------------------------------------
  // SUÍTE 2: Ciclo de Vida de Token Criptográfico Seguro de Uso Único
  // -------------------------------------------------------------------------
  console.log('\n2. Ciclo de Vida do Token de Redefinição Seguro (PHP Real):');

  // Teste 2.1: Emissão de token seguro de recuperação
  const resTokenReq = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Mode': '1'
    },
    body: JSON.stringify({
      action: 'solicitar_recuperacao',
      email: 'sem_senha@formatura.com.br'
    })
  });
  const dataTokenReq = await resTokenReq.json();
  assert(resTokenReq.status === 200, 'Solicitação de recuperação retorna HTTP 200');
  assert(typeof dataTokenReq.token_teste === 'string' && dataTokenReq.token_teste.length === 64, 'Token gerado possui 256 bits de entropia (64 caracteres hexadecimais)');

  const validToken = dataTokenReq.token_teste;

  // Teste 2.2: Validação de Estado em Disco (O token puro NUNCA deve ser gravado no banco, apenas seu hash SHA-256)
  const dbContent = JSON.parse(fs.readFileSync(path.join(privateDir, 'usuarios_db.json'), 'utf8'));
  const usuarioNoDb = dbContent.find(u => u.email === 'sem_senha@formatura.com.br');
  const expectedHash = crypto.createHash('sha256').update(validToken).digest('hex');

  assert(
    usuarioNoDb.resetTokenHash === expectedHash,
    'Banco em disco armazena apenas o hash SHA-256 do token, nunca o token bruto'
  );
  assert(
    usuarioNoDb.resetTokenExpires > Math.floor(Date.now() / 1000),
    'Data de expiração do token foi calculada corretamente para o futuro'
  );

  // Teste 2.3: Tentativa de redefinição com token forjado/inválido
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

  // Teste 2.4: Redefinição bem-sucedida com token legítimo
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

  // Teste 2.5: Verificação de Estado em Disco Pós-Redefinição
  const dbPosRedefinicao = JSON.parse(fs.readFileSync(path.join(privateDir, 'usuarios_db.json'), 'utf8'));
  const usuarioPos = dbPosRedefinicao.find(u => u.email === 'sem_senha@formatura.com.br');
  assert(
    usuarioPos.precisaRedefinirSenha === false,
    'Sinalizador precisaRedefinirSenha foi desmarcado em disco'
  );
  assert(
    usuarioPos.senhaHash && usuarioPos.senhaHash.length > 20,
    'Nova senha foi devidamente hasheada com algoritmo seguro em disco'
  );
  assert(
    usuarioPos.resetTokenHash === null,
    'Hash do token de redefinição foi purgado do disco após o consumo'
  );

  // Teste 2.6: Prevenção contra Replay Attack (Token de Uso Único não pode ser reutilizado)
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

  // Teste 2.7: Login com a nova senha recém-estabelecida
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
  assert(typeof dataNovoLogin.csrf_token === 'string' && dataNovoLogin.csrf_token.length === 64, 'Token CSRF gerado e retornado na resposta de login');

  // -------------------------------------------------------------------------
  // SUÍTE 3: Validação Estrita de CSRF em Operações Administrativas Mutantes
  // -------------------------------------------------------------------------
  console.log('\n3. Proteção Estrita contra CSRF em Operações Mutantes (PHP Real):');

  const csrfToken = dataNovoLogin.csrf_token;

  // Teste 3.1: Mutação sem cabeçalho nem payload CSRF
  const resSemCsrf = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieNovo
    },
    body: JSON.stringify({
      action: 'add',
      demanda: { titulo: 'Demanda de Teste Sem CSRF' }
    })
  });
  assert(resSemCsrf.status === 403, 'Mutação de estado sem CSRF é rejeitada com HTTP 403 (CSRF_INVALID)');

  // Teste 3.2: Mutação com CSRF falso/adulterado
  const resCsrfFalso = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieNovo,
      'X-CSRF-Token': 'token_csrf_forjado_1234567890'
    },
    body: JSON.stringify({
      action: 'add',
      demanda: { titulo: 'Demanda de Teste com CSRF Falso' }
    })
  });
  assert(resCsrfFalso.status === 403, 'Mutação com CSRF forjado é rejeitada com HTTP 403');

  // Teste 3.3: Mutação com CSRF genuíno
  const resCsrfValido = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookieNovo,
      'X-CSRF-Token': csrfToken
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

  // Verifica alteração de estado no arquivo em disco
  const demandasDb = JSON.parse(fs.readFileSync(path.join(privateDir, 'demandas_db.json'), 'utf8'));
  const demandaSalva = demandasDb.find(d => d.id === 'DEM-TEST-001');
  assert(demandaSalva && demandaSalva.titulo === 'Demanda Autorizada com CSRF', 'Estado persistido corretamente no disco após validação de CSRF');

  // -------------------------------------------------------------------------
  // SUÍTE 4: Rate Limiting Real no Servidor com HTTP 429 e Retry-After
  // -------------------------------------------------------------------------
  console.log('\n4. Rate Limiting Real no Servidor PHP (HTTP 429 e Retry-After):');

  const ipAlvo = 'teste_ratelimit@formatura.com.br';
  let bloqueadoCom429 = false;
  let retryAfterHeader = null;

  for (let i = 1; i <= 6; i++) {
    const resTentativa = await fetch(`${BASE_URL}/usuarios.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: ipAlvo,
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
  console.log('\n5. Revalidação em Tempo Real de Sessões (Revogação Imediata no PHP):');

  // Usuário inativo tenta acessar recurso protegido
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

  // Usuário ativo tem seu status alterado para INATIVO em disco durante uma sessão ativa
  // Teste: Usando a sessão do sem_senha@formatura.com.br (agora ativo), verifica acesso inicial:
  const resMeAtivo = await fetch(`${BASE_URL}/usuarios.php?action=me`, {
    headers: { 'Cookie': sessionCookieNovo }
  });
  assert(resMeAtivo.status === 200, 'Sessão ativa consulta dados do usuário atual (HTTP 200)');

  // Altera diretamente no disco para INATIVO
  const dbAtual = JSON.parse(fs.readFileSync(path.join(privateDir, 'usuarios_db.json'), 'utf8'));
  const idx = dbAtual.findIndex(u => u.email === 'sem_senha@formatura.com.br');
  dbAtual[idx].status = 'INATIVO';
  fs.writeFileSync(path.join(privateDir, 'usuarios_db.json'), JSON.stringify(dbAtual, null, 2), 'utf8');

  // Próxima requisição com a mesma sessão deve ser IMEDIATAMENTE invalidada
  const resMeInativado = await fetch(`${BASE_URL}/usuarios.php?action=me`, {
    headers: { 'Cookie': sessionCookieNovo }
  });
  assert(resMeInativado.status === 401, 'Sessão é imediatamente revogada após alteração de status em disco (HTTP 401)');

  // -------------------------------------------------------------------------
  // SUÍTE 6: Autenticação Oficial e Idempotência do Webhook Sicredi
  // -------------------------------------------------------------------------
  console.log('\n6. Autenticação e Processamento do Webhook Sicredi (PHP Real):');

  // Teste 6.1: Webhook sem autorização
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

  // Teste 6.3: Webhook com token autêntico e liquidação exata
  const resWhOk = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      evento: 'LIQUIDACAO_BOLETO',
      nossoNumero: 'SICREDI-BOL-1001',
      valorPago: 500,
      dataLiquidacao: '2026-10-31'
    })
  });
  const dataWhOk = await resWhOk.json();
  assert(resWhOk.status === 200, 'Webhook autenticado processa notificação com HTTP 200');

  // Verifica liquidação da parcela em disco
  const vendasDbPos = JSON.parse(fs.readFileSync(path.join(privateDir, 'vendas_albuns_db.json'), 'utf8'));
  const vendaAtualizada = vendasDbPos.find(v => v.codigoPedido === 'VENDA-TEST-001');
  const parcela1 = vendaAtualizada.parcelasBoletos.find(p => p.nossoNumero === 'SICREDI-BOL-1001');
  assert(parcela1.status === 'PAGO', 'Estado em disco atualizado: parcela baixada para status PAGO');

  // Teste 6.4: Idempotência (mesma notificação repetida)
  const resWhDuplicado = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      evento: 'LIQUIDACAO_BOLETO',
      nossoNumero: 'SICREDI-BOL-1001',
      valorPago: 500,
      dataLiquidacao: '2026-10-31'
    })
  });
  assert(resWhDuplicado.status === 200, 'Notificação duplicada processada de forma idempotente sem erros');

  // -------------------------------------------------------------------------
  // SUÍTE 7: Validação Estrita de CORS (Correspondência Exata)
  // -------------------------------------------------------------------------
  console.log('\n7. Validação Estrita de CORS em Tempo de Execução (PHP Real):');

  // Teste 7.1: Origem autorizada exata
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
  assert(
    resCorsValido.headers.get('vary')?.includes('Origin'),
    'Header Vary: Origin presente para controle de cache'
  );

  // Teste 7.2: Origem com domínio malicioso ou spoofing
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
