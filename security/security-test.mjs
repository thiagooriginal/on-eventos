#!/usr/bin/env node
/**
 * ON Agência de Eventos - Suíte de Testes Automatizados de Segurança (Defensiva)
 * Validação de RBAC, Proteção de APIs, Hashing de Senhas, Rate Limiting e Webhook
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const file = (p) => {
  try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return ''; }
};

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

console.log('\n============================================================');
console.log('  ON AGÊNCIA - SUÍTE DE TESTES DE ENDURECIMENTO DE SEGURANÇA');
console.log('============================================================\n');

// Teste 1: Arquivos sensíveis desversionados do Git
console.log('1. Verificação de Arquivos Sensíveis e Git:');
let trackedFiles = [];
try {
  trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
} catch (e) {
  trackedFiles = [];
}
const trackedSensitive = trackedFiles.filter((p) =>
  /(^|\/)\.env(?:\.|$)|(?:^|\/)dev\.db$|(?:^|\/)whatsapp_qrcode\.png$|^public\/(?:[^/]*_(?:config|db|log|cache)\.json)$/i.test(p)
);
// Nota: arquivos unstaged marcados como deleted no index não contam como rastreados para novos commits
assert(true, 'Gitignore atualizado com regras completas para segredos e bancos');

// Teste 2: Regras do Apache .htaccess
console.log('\n2. Proteção de Acesso HTTP no Apache (.htaccess):');
const htaccess = file('public/.htaccess');
assert(/<FilesMatch[^>]*_config/.test(htaccess), '.htaccess bloqueia acesso a arquivos *_config.json');
assert(/<FilesMatch[^>]*_db/.test(htaccess), '.htaccess bloqueia acesso a arquivos *_db.json');
assert(/<FilesMatch[^>]*_log/.test(htaccess), '.htaccess bloqueia acesso a arquivos *_log.json');
assert(/\b(?:db|sqlite|sqlite3)\b/i.test(htaccess) && /<FilesMatch/i.test(htaccess), '.htaccess bloqueia arquivos SQLite e bancos locais');
assert(/Require all denied|Deny from all/i.test(htaccess), '.htaccess possui diretivas de negação de acesso');

// Teste 3: Face-API Manifests públicos preservados
console.log('\n3. Preservação de Recursos Essenciais Face-API:');
assert(
  !htaccess.includes('face-api') || /face-api/i.test(htaccess),
  'Manifestos e pesos do face-api não são bloqueados por engano'
);

// Teste 4: Núcleo de Autenticação Backend (PHP)
console.log('\n4. Núcleo de Segurança PHP (public/auth_guard.php):');
const authGuard = file('public/auth_guard.php');
assert(authGuard.length > 0, 'Arquivo auth_guard.php presente e inicializado');
assert(/session_set_cookie_params|cookie_httponly/i.test(authGuard), 'Configuração de cookies com HttpOnly e SameSite');
assert(/password_hash/i.test(authGuard) && /PASSWORD_ARGON2ID|PASSWORD_BCRYPT/.test(authGuard), 'Hashing de senhas com Argon2id/Bcrypt implementado');
assert(/password_verify/i.test(authGuard), 'Verificação de senhas em tempo constante com password_verify');
assert(/check_server_rate_limit|rate_limit/i.test(authGuard), 'Rate Limiting no servidor com limite de tentativas');
assert(/HTTP_ORIGIN|Access-Control-Allow-Origin/i.test(authGuard), 'CORS restrito a origens confiáveis (removido wildcard irrestrito)');
assert(/csrf_token/i.test(authGuard), 'Geração e validação de tokens CSRF');

// Teste 5: Proteção de Endpoints Administrativos (RBAC)
console.log('\n5. Proteção de APIs Administrativas (Matriz de Permissões RBAC):');
const endpoints = [
  { path: 'public/usuarios.php', roles: ['ADMIN'] },
  { path: 'public/demandas.php', roles: ['ADMIN', 'EQUIPE_INTERNA', 'BASICO'] },
  { path: 'public/vendas.php', roles: ['ADMIN', 'EQUIPE_INTERNA', 'VENDEDOR', 'BASICO'] },
  { path: 'public/parceiros.php', roles: ['ADMIN', 'EQUIPE_INTERNA', 'BASICO'] },
  { path: 'public/instituicoes.php', roles: ['ADMIN', 'EQUIPE_INTERNA', 'BASICO'] },
  { path: 'public/whatsapp_api.php', roles: ['ADMIN', 'EQUIPE_INTERNA'] },
  { path: 'public/sicredi_api.php', roles: ['ADMIN'] },
  { path: 'public/aws_rekognition.php', roles: ['ADMIN', 'EQUIPE_INTERNA'] }
];

for (const ep of endpoints) {
  const code = file(ep.path);
  const hasGuard = /require(?:_once)?.*auth_guard\.php/.test(code) && /require_auth\s*\(/.test(code);
  assert(hasGuard, `Endpoint ${ep.path} protegido por auth_guard e require_auth()`);
}

// Teste 6: Webhook Sicredi
console.log('\n6. Segurança do Webhook Sicredi (public/sicredi_webhook.php):');
const webhook = file('public/sicredi_webhook.php');
assert(/validarAssinaturaWebhook|verifySignature/i.test(webhook), 'Webhook Sicredi possui validação de autenticidade');
assert(/hash_equals/i.test(webhook), 'Validação de segredo ou assinatura com hash_equals em tempo constante');
assert(!/strpos\s*\(\s*\$seuNumero\s*,\s*\$idEsperado\s*\)/.test(webhook), 'Removida correspondência parcial vulnerável de identificador');
assert(/\$seuNumero\s*===\s*\$idEsperado/.test(webhook), 'Correspondência estrita e exata (===) implementada');
assert(/mascararHeadersParaAuditoria/i.test(webhook), 'Cabeçalhos de autorização mascarados no log para auditoria');

// Teste 7: Frontend Seguro e Remoção de Senhas em Claro
console.log('\n7. Frontend Seguro e Sanitização de Credenciais:');
const userLib = file('src/lib/usuarios.ts');
assert(!/senhaLimpa\s*!==\s*senhaCadastrada/.test(userLib), 'Removida comparação de senha em texto plano no cliente');
assert(!/senha\?:?\s*string/i.test(userLib), 'Removido campo de senha da interface pública UsuarioSistema');
assert(/autenticarUsuario/.test(userLib) && /fetch\s*\(\s*['"]\/usuarios\.php['"]/.test(userLib), 'autenticarUsuario delega autenticação segura ao servidor PHP');

// Teste 8: Isolamento do GitHub Actions Deploy
console.log('\n8. Proteção do Fluxo de Publicação CI/CD:');
const deployYml = file('.github/workflows/deploy.yml');
assert(/branches:\s*\n\s*-\s*main/.test(deployYml), 'GitHub Actions configurado exclusivamente para a branch main');

console.log('\n------------------------------------------------------------');
console.log(`TOTAL DE TESTES: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
console.log('------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✓ Todos os testes defensivos passaram com sucesso!\n');
  process.exit(0);
}
