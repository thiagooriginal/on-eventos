# Plano de Deploy Emergencial, Contenção Imediata e Plano de Contingência

> **Sistema**: Portal Administrativo & Operacional — ON Agência de Eventos  
> **Versão / Branch**: `security/hardening-phase-1` (Commit atualizado)  
> **Alvo de Publicação**: Hostinger Shared Hosting (`onagenciadeeventos.com.br`)  
> **Classificação**: Crítica / Segurança / Zero Downtime

---

## 0. Contenção Imediata em Produção (Sem Deploy Completo)

### Situação Atual
A versão legada de `public_html/usuarios.php` na Hostinger responde a requisições `GET` anônimas entregando os registros de usuários. Embora os arquivos `*.json` já tenham sido bloqueados via `.htaccess`, a API legada em PHP ainda faz a leitura interna do arquivo e entrega o conteúdo.

### Procedimento de Bloqueio Imediato via `.htaccess`
Adicionar no topo do arquivo `public_html/.htaccess` existente na Hostinger a seguinte diretiva de contenção cirúrgica:

```apache
# ============================================================
# CONTENÇÃO EMERGENCIAL DE SEGURANÇA — ON AGÊNCIA DE EVENTOS
# Bloqueia consultas GET anônimas à API de usuários
# ============================================================
RewriteEngine On
RewriteCond %{REQUEST_METHOD} GET
RewriteCond %{REQUEST_URI} ^/usuarios\.php [NC]
RewriteCond %{HTTP:Cookie} !ON_AUTH_SESSION
RewriteRule .* - [F,L]
```

### Avaliação de Impacto Funcional
1. **Impacto Positivo Imediato**:
   - Bloqueia instantaneamente qualquer raspagem ou vazamento de dados de usuários por invasores ou ferramentas automatizadas (HTTP 403 Forbidden).
2. **Preservação do Fluxo de Login**:
   - A requisição de login (`POST /usuarios.php?action=login`) **NÃO é afetada**, pois utiliza o verbo `POST` e continua operando normalmente.
3. **Preservação dos Demais Módulos**:
   - Vendas, CRM, Webhook Sicredi, Alunos, Face-API e o site público continuam 100% operacionais.
   - Nenhuma dependência externa é quebrada.

---

## 1. Janela de Implantação Recomendada

- **Horário Ideal**: Domingo ou madrugada entre **02:00 e 05:00 (Horário de Brasília)**.
- **Justificativa Operacional**:
  1. Menor volume de acessos de formandos na Área do Aluno.
  2. Inexistência de atendimentos comerciais simultâneos no CRM e WhatsApp.
  3. Mínima ou nula emissão/liquidação de boletos Sicredi no intervalo da compensação bancária noturna.
  4. Janela confortável de 3 horas para validação técnica, testes funcionais pós-deploy e execução de rollback se necessário.

---

## 2. Pré-Requisitos Mandatórios Antes da Publicação

Nenhum comando de deploy deve ser disparado antes de checar os itens abaixo:

1. **Backup Geral Pré-Deploy no hPanel**:
   - Acessar o Gerenciador de Arquivos da Hostinger.
   - Compactar toda a pasta `public_html/` em `backup_full_pre_deploy.zip`.
   - Baixar uma cópia desse arquivo compactado para a máquina local.
2. **Criação da Conta de E-mail de Segurança**:
   - No hPanel -> E-mails -> Criar conta: `seguranca@onagenciadeeventos.com.br`.
   - Confirmar no painel DNS as entradas TXT de SPF (`v=spf1 include:_spf.mail.hostinger.com ~all`) e DMARC.
3. **Criação do Diretório Seguro Externo**:
   - No Gerenciador de Arquivos da Hostinger, criar a pasta `private_data` um nível acima de `public_html/`:
     `/home/uXXXXXXX/domains/onagenciadeeventos.com.br/private_data`
   - Definir permissões de acesso da pasta como `0750` (ou `0700`).
4. **Validação da Senha FTPS**:
   - Executar o validador com a nova senha gerada no hPanel:
     ```bash
     python security/test-ftps-connection.py --server=ftp.onagenciadeeventos.com.br --user=uXXXXX --pass=SuaNovaSenha
     ```
   - Somente após confirmação positiva de handshake TLS e autenticação, atualizar o secret `FTP_PASSWORD` no GitHub Actions.

---

## 3. Procedimento de Implantação Atômica (Anti-Race Condition)

### Por que a implantação deve ser estritamente atômica?
Se arquivos PHP forem enviados individualmente via FTP tradicional (arquivo por arquivo), existirá uma janela de vários minutos em que `usuarios.php` novo pode tentar chamar funções de `auth_guard.php` antes que este tenha sido transferido, ou requisições de clientes podem encontrar arquivos em estado inconsistente, gerando erros HTTP 500 ou quebras temporárias de segurança.

### Pacote de Implantação Atômico
O pacote `on_seguranca_deploy_atomico.zip` (gerado por `security/build-deploy-package.mjs`) contém a estrutura completa de produção:
- `public_html/`: `auth_guard.php`, `usuarios.php`, `vendas.php`, `demandas.php`, `parceiros.php`, `instituicoes.php`, `whatsapp_api.php`, `sicredi_api.php`, `sicredi_webhook.php`, `aws_rekognition.php`, `telemetria.php`, `phpmailer/`, `.htaccess`.
- `private_data/`: `setup-admin-password.php`, `.htaccess`.

### Roteiro de Aplicação Atômica no Servidor:
1. Fazer upload de `on_seguranca_deploy_atomico.zip` diretamente para o diretório raiz do domínio:
   `/home/uXXXXXXX/domains/onagenciadeeventos.com.br/`
2. No Gerenciador de Arquivos da Hostinger (ou via SSH):
   - Clicar com o botão direito no arquivo `on_seguranca_deploy_atomico.zip` e selecionar **Extrair Aqui** (ou executar `unzip -o on_seguranca_deploy_atomico.zip`).
   - Todos os arquivos de `public_html/` e `private_data/` são atualizados simultaneamente no mesmo segundo.
3. Excluir o arquivo `on_seguranca_deploy_atomico.zip` do servidor após a extração.

---

## 4. Bootstrap do Primeiro Administrador (Sem Dependência de SMTP)

Como as credenciais de SMTP da Hostinger ainda não estão configuradas no servidor, a ferramenta administrativa CLI `private_data/setup-admin-password.php` permite inicializar o acesso de dois modos seguros:

### Modo A: Definição Interativa com Entrada Oculta (Recomendado via SSH)
Conecte-se ao terminal SSH da Hostinger e acesse a pasta `private_data`:
```bash
cd /home/uXXXXXXX/domains/onagenciadeeventos.com.br/private_data
php setup-admin-password.php --email="admin@onagenciadeeventos.com.br"
```
O script solicitará a senha de forma silenciosa/oculta (sem eco no terminal, sem parâmetro `--pass` e sem registrar nada no histórico do shell `~/.bash_history`):
- `Digite a nova senha (mínimo 8 caracteres):` [oculto]
- `Confirme a nova senha digitada:` [oculto]
A senha é criptografada com Argon2id/Bcrypt e o acesso é liberado imediatamente.

### Modo B: Emissão de Link com Token Criptográfico (Alternativa Sem SMTP)
Caso prefira redefinir a senha através da interface web do navegador:
```bash
php setup-admin-password.php --email="admin@onagenciadeeventos.com.br" --generate-token
```
O script emitirá na tela um link seguro de 24 horas:
`https://onagenciadeeventos.com.br/redefinir-senha?token=...`
Basta copiar e colar o link no navegador para criar a nova senha pessoal.

---

## 5. Verificação Pós-Deploy em Produção (T+5 min)

Executar os seguintes testes de integridade diretamente no domínio de produção:

1. **Tentativa de Raspagem Anônima**:
   - `curl -i -X GET https://onagenciadeeventos.com.br/usuarios.php`
   - **Resultado esperado**: `HTTP 401 Unauthorized` (ou `HTTP 403 Forbidden`). Senhas ou dados de usuários NUNCA são retornados.
2. **Isolamento de Dados Privados**:
   - `curl -i https://onagenciadeeventos.com.br/private_data/usuarios_db.json`
   - **Resultado esperado**: `HTTP 404 Not Found` ou `HTTP 403 Forbidden`.
3. **Login Administrativo**:
   - Acessar `https://onagenciadeeventos.com.br/login` e logar com a credencial recém-definida.
   - Confirmar recebimento do cookie HttpOnly `ON_AUTH_SESSION`.
4. **Proteção contra CSRF**:
   - Tentar requisição POST manual sem `X-CSRF-Token` para `https://onagenciadeeventos.com.br/demandas.php`.
   - **Resultado esperado**: `HTTP 403 Forbidden`.
5. **Preservação de Ativos Face-API e Modelos**:
   - `curl -i https://onagenciadeeventos.com.br/models/tiny_face_detector_model-weights_manifest.json`
   - **Resultado esperado**: `HTTP 200 OK`.

---

## 6. Plano de Contingência e Rollback Seguro (Anti-Reexposição)

> [!CAUTION]
> **Aviso Crítico de Segurança sobre Rollback Tradicional**:
> Se o operador simplesmente descompactar o backup legado antigo (`backup_full_pre_deploy.zip`) sobre `public_html/`, a versão vulnerável de `usuarios.php` seria restaurada, **reabrindo imediatamente a falha crítica de vazamento de senhas em texto puro!**

### Procedimento de Rollback Compensatório Obrigatório:
Se for necessário reverter arquivos de aplicação por qualquer instabilidade:
1. **Restaurar os Arquivos Legados no hPanel**:
   - Extrair o backup `backup_full_pre_deploy.zip` em `public_html/`.
2. **REAPLICAR IMEDIATAMENTE A REGRA DE CONTENÇÃO NO `.htaccess`**:
   - Garantir que a regra do item 0 permaneça no topo do `.htaccess` de produção:
     ```apache
     RewriteEngine On
     RewriteCond %{REQUEST_METHOD} GET
     RewriteCond %{REQUEST_URI} ^/usuarios\.php [NC]
     RewriteCond %{HTTP:Cookie} !ON_AUTH_SESSION
     RewriteRule .* - [F,L]
     ```
   - Isso garante que, mesmo no caso de rollback do código PHP, a vulnerabilidade de extração de usuários não volte a ficar exposta na internet.
3. **Preservar a Integridade dos Dados em `private_data/`**:
   - Os arquivos de banco de dados (`usuarios_db.json`, `vendas_db.json`, etc.) que foram migrados de forma não destrutiva para `private_data/` e os backups com checksum SHA-256 em `private_data/backups/` **NUNCA devem ser apagados**.
   - O rollback deve afetar exclusivamente os scripts de execução, mantendo os dados e os backups intactos.
