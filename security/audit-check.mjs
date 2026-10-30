#!/usr/bin/env node
// Checagem estática defensiva. Não imprime senhas ou chaves de API.
// Uso: node security/audit-check.mjs [--strict]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const findings = [];
const file = (p) => {
  try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return ''; }
};
const test = (id, condition, description) => {
  if (condition) findings.push({ id, description });
};
let tracked = [];
try { tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean); }
catch { console.error('O diretório precisa estar dentro de um repositório Git.'); process.exit(2); }
const trackedSensitive = tracked.filter((p) =>
  !/\.example$/i.test(p) && (/(^|\/)\.env(?:\.|$)|(?:^|\/)dev\.db$|(?:^|\/)whatsapp_qrcode\.png$|^public\/(?:[^/]*_(?:config|db|log|cache)\.json)$/i.test(p))
);
test('S01', trackedSensitive.length > 0, `Arquivos sensíveis ainda rastreados no Git: ${trackedSensitive.join(', ')}`);
const loginApi = file('src/app/api/auth/login/route.ts');
test('S02', !!loginApi && /success\s*:\s*true/.test(loginApi) && !/password_verify|bcrypt\.compare|argon2\.verify|scrypt|timingSafeEqual|verifyPassword/.test(loginApi), 'API de login retorna sucesso sem evidência de verificação criptográfica da senha.');
const userLib = file('src/lib/usuarios.ts');
test('S03', /localStorage\.(?:setItem|getItem)/.test(userLib) && /senha/.test(userLib), 'Módulo de usuários mantém senhas e registros no navegador.');
test('S04', /autenticarUsuario/.test(userLib) && /senhaLimpa\s*!==\s*senhaCadastrada/.test(userLib), 'Comparação de senha em texto puro no frontend.');
const publicEndpoints = [
  'public/usuarios.php', 'public/demandas.php', 'public/vendas.php',
  'public/parceiros.php', 'public/whatsapp_api.php', 'public/sicredi_api.php',
  'public/aws_rekognition.php', 'public/instituicoes.php'
];
for (const p of publicEndpoints) {
  const body = file(p);
  if (!body) continue;
  const hasAuthGate = /require(?:_once)?\s*\(?\s*(?:__DIR__\s*\.\s*)?['"][^'"]*(?:auth|security|bootstrap|guard)[^'"]*['"]|require_auth\s*\(|authorize\s*\(/i.test(body);
  test('S05', !hasAuthGate, `Revisar autenticação e autorização em ${p} (guarda não encontrada; verificação heurística).`);
}
const webhook = file('public/sicredi_webhook.php');
test('S06', !!webhook && !/hash_equals|hash_hmac|verifySignature|validarAssinatura|consultar.*sicredi/i.test(webhook), 'Webhook Sicredi sem mecanismo evidente de verificação de autenticidade.');
const config = file('next.config.mjs');
test('S07', /output\s*:\s*['"]export['"]/.test(config) && !!loginApi, 'Exportação estática Next.js não executa rotas de API Next.js na hospedagem estática.');
const htaccess = file('public/.htaccess');
test('S08', !/<FilesMatch[^>]*_config|_config\|_db/.test(htaccess), 'Revisar se o Apache impede downloads de arquivos privados no webroot.');
const workflow = file('.github/workflows/deploy.yml');
test('S09', /FTP_SERVER/.test(workflow), 'Deploy via FTP: verificar transporte criptografado e preferir FTPS/SFTP com credenciais rotacionadas.');
console.log('ON Agência | Verificação estática defensiva');
console.log(`Total de alertas: ${findings.length}`);
for (const f of findings) console.log(`- ${f.id}: ${f.description}`);
console.log('Não executa chamadas ao servidor, não revela segredos e não altera arquivos.');
process.exit(findings.length && strict ? 1 : 0);
