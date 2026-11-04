import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'dist_deploy');
const stagingDir = path.join(outputDir, 'staging');
const zipFilePath = path.join(outputDir, 'on_seguranca_deploy_atomico.zip');
const manifestFilePath = path.join(outputDir, 'deploy_manifest.json');

// Limpa staging anterior
if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(stagingDir, 'public_html'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'private_data'), { recursive: true });

console.log('============================================================');
console.log('  GERAÇÃO DO PACOTE DE IMPLANTAÇÃO ATÔMICO — ON AGÊNCIA');
console.log('============================================================\n');

const phpBackendFiles = [
    'auth_guard.php',
    'usuarios.php',
    'vendas.php',
    'demandas.php',
    'parceiros.php',
    'instituicoes.php',
    'whatsapp_api.php',
    'sicredi_api.php',
    'sicredi_webhook.php',
    'aws_rekognition.php',
    'telemetria.php',
    '.htaccess'
];

const manifest = {
    generated_at: new Date().toISOString(),
    branch: 'security/hardening-phase-1',
    package_file: 'on_seguranca_deploy_atomico.zip',
    files: []
};

// 1. Copia arquivos do backend para public_html
for (const file of phpBackendFiles) {
    const srcPath = path.join(rootDir, 'public', file);
    if (!fs.existsSync(srcPath)) {
        throw new Error(`Arquivo obrigatório ausente: ${srcPath}`);
    }
    const destPath = path.join(stagingDir, 'public_html', file);
    fs.copyFileSync(srcPath, destPath);
    const content = fs.readFileSync(destPath);
    const sha = crypto.createHash('sha256').update(content).digest('hex');
    manifest.files.push({
        destination: `public_html/${file}`,
        size: content.length,
        sha256: sha
    });
}

// 2. Copia PHPMailer
const phpMailerDir = path.join(rootDir, 'public', 'phpmailer');
if (fs.existsSync(phpMailerDir)) {
    const destMailer = path.join(stagingDir, 'public_html', 'phpmailer');
    fs.mkdirSync(destMailer, { recursive: true });
    const mailerFiles = fs.readdirSync(phpMailerDir);
    for (const mf of mailerFiles) {
        const fullP = path.join(phpMailerDir, mf);
        if (fs.statSync(fullP).isFile()) {
            const destF = path.join(destMailer, mf);
            fs.copyFileSync(fullP, destF);
            const content = fs.readFileSync(destF);
            const sha = crypto.createHash('sha256').update(content).digest('hex');
            manifest.files.push({
                destination: `public_html/phpmailer/${mf}`,
                size: content.length,
                sha256: sha
            });
        }
    }
}

// 3. Copia ferramenta CLI para private_data
const cliSrc = path.join(rootDir, 'security', 'setup-admin-password.php');
if (fs.existsSync(cliSrc)) {
    const destCli = path.join(stagingDir, 'private_data', 'setup-admin-password.php');
    fs.copyFileSync(cliSrc, destCli);
    const content = fs.readFileSync(destCli);
    const sha = crypto.createHash('sha256').update(content).digest('hex');
    manifest.files.push({
        destination: `private_data/setup-admin-password.php`,
        size: content.length,
        sha256: sha
    });
}

// 4. Cria .htaccess em private_data
const privateHtaccessContent = "# Bloqueio absoluto de acesso HTTP direto a este diretorio privado\nRequire all denied\n";
const destPrivateHtaccess = path.join(stagingDir, 'private_data', '.htaccess');
fs.writeFileSync(destPrivateHtaccess, privateHtaccessContent, 'utf8');
const htaccessSha = crypto.createHash('sha256').update(privateHtaccessContent).digest('hex');
manifest.files.push({
    destination: `private_data/.htaccess`,
    size: privateHtaccessContent.length,
    sha256: htaccessSha
});

// 5. Gera arquivo ZIP usando PowerShell Compress-Archive
if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
}

console.log('Compactando diretórios de implantação com integridade...');
execSync(`powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFilePath}' -Force"`);

const zipBuffer = fs.readFileSync(zipFilePath);
manifest.package_sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');
manifest.package_size_bytes = zipBuffer.length;

fs.writeFileSync(manifestFilePath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`[PASS] Pacote atômico gerado com sucesso:`);
console.log(`  Arquivo: ${zipFilePath}`);
console.log(`  Tamanho: ${(zipBuffer.length / 1024).toFixed(2)} KB`);
console.log(`  SHA-256: ${manifest.package_sha256}\n`);
console.log(`[PASS] Manifesto de integridade gerado:`);
console.log(`  Arquivo: ${manifestFilePath}`);
console.log(`  Total de arquivos verificados: ${manifest.files.length}`);
console.log('============================================================\n');
