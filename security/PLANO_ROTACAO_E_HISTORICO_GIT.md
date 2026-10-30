# ON Agência de Eventos — Plano de Rotação de Segredos & Tratamento do Histórico Git

**Documento Técnico de Segurança Operacional**  
**Branch de Trabalho:** `security/hardening-phase-1`  
**Data:** 30 de Outubro de 2026  

---

## 1. Visão Geral e Princípio de Confiança Zero

Durante a auditoria de segurança inicial, constatou-se que credenciais de produção, chaves de API e arquivos de bancos locais estiveram versionados em commits anteriores na branch `main`.

> [!IMPORTANT]  
> **Regra Fundamental de Segurança em Vazamentos de Credenciais:**  
> A exclusão de um arquivo de configuração ou segredo em um novo commit (`git rm`) **não apaga o valor do histórico do Git** nem de clones, forks ou caches anteriores. Portanto, **toda credencial que já esteve presente em qualquer commit anterior deve ser considerada publicamente comprometida**.  
> A única forma de restabelecer a segurança efetiva é **revogar as credenciais nos provedores externos e emitir novas chaves**.

---

## 2. Matriz de Credenciais Afetadas & Procedimentos de Rotação

A tabela abaixo lista cada serviço, o motivo da rotação necessária e as etapas operacionais sem causar indisponibilidade no sistema:

| Serviço / Recurso | Tipo de Segredo | Onde Rotacionar | Onde Configurar o Novo Valor | Ação Prévia Necessária |
| :--- | :--- | :--- | :--- | :--- |
| **Sicredi Cobrança Online** | `x-api-key`, `password` (Código de Acesso), `username` | Portal do Desenvolvedor / Internet Banking Sicredi Empresas | Variáveis de ambiente Hostinger (`SICREDI_API_KEY`, `SICREDI_PASSWORD`, etc.) ou `public/private_data/sicredi_api_config.json` | Solicitar emissão de novo par de chaves ao gerente da conta ou suporte técnico Sicredi API. |
| **Sicredi Webhook** | `X-Webhook-Secret` / Bearer Token | Painel Sicredi (Configuração de Notificações de Cobrança) | Variável `SICREDI_WEBHOOK_SECRET` no servidor | Cadastrar a mesma chave secreta gerada tanto no portal do Sicredi quanto na configuração do webhook da ON Agência. |
| **WhatsApp / Evolution API** | `apiKey`, Instância, Tokens Z-API / Meta | Painel de controle da VPS Evolution API / Z-API | Variáveis `WHATSAPP_API_KEY`, `WHATSAPP_INSTANCE` ou `public/private_data/whatsapp_config.json` | Gerar nova API Key na instância Evolution, reconectar o QR Code do WhatsApp comercial da agência. |
| **AWS Rekognition** | `aws_access_key_id`, `aws_secret_access_key` | Console AWS IAM -> Usuários -> Credenciais de Segurança | Variáveis `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` ou `public/private_data/aws_rekognition_config.json` | Criar nova Access Key no IAM, testar permissão para `rekognition:*`, e somente após validar, deletar a chave antiga no IAM. |
| **Deploy CI/CD (GitHub Actions)** | `FTP_PASSWORD`, `FTP_USERNAME` | Painel Hostinger (Acessos FTP / Contas de FTP) | GitHub -> Repositório -> Settings -> Secrets and variables -> Actions | Criar nova senha no gerenciador de FTP da Hostinger com suporte FTPS (TLS) obrigatório. |
| **Banco SQLite Local (`dev.db`)** | Banco de desenvolvimento de teste | Gerado localmente por migrations | Ambiente local de desenvolvimento | O banco de produção opera em arquivos protegidos na Hostinger; o arquivo local foi desversionado. |

---

## 3. Passo a Passo para Rotação Sem Interrupção de Operações

Para que os formandos continuem gerando boletos e recebendo lembretes sem interrupções durante a troca de chaves:

### Etapa 3.1: Sicredi Cobrança Online
1. Acesse o portal corporativo do Sicredi e acerte com o analista Luiz Henrique a geração do novo Código de Acesso e `x-api-key`.
2. Mantenha as credenciais antigas ativas por algumas horas enquanto a nova chave é configurada no servidor.
3. Insira as novas credenciais nas variáveis de ambiente da Hostinger (`SICREDI_API_KEY`, `SICREDI_PASSWORD`, `SICREDI_USERNAME`).
4. Execute o teste de conexão na interface administrativa (`Ações -> Testar Conexão OAuth2`).
5. Assim que a nova emissão retornar sucesso via API, desative permanentemente as chaves antigas no portal Sicredi.

### Etapa 3.2: Webhook Sicredi
1. Defina uma string secreta de alta entropia (mínimo 32 caracteres hexadecimais), por exemplo gerada via:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Configure essa chave no painel do Sicredi como Header customizado (`X-Webhook-Secret: <chave_gerada>`) ou Bearer token.
3. Configure a mesma chave na variável de ambiente `SICREDI_WEBHOOK_SECRET` na Hostinger.
4. O arquivo `public/sicredi_webhook.php` passará a validar com `hash_equals()` e rejeitará qualquer notificação que não possua a nova chave.

### Etapa 3.3: WhatsApp e Deploy
1. No painel da VPS Evolution API, altere a variável `AUTHENTICATION_API_KEY` para uma nova chave segura.
2. No GitHub Secrets (`Settings -> Secrets -> Actions`), atualize `FTP_PASSWORD` com a nova senha de FTP gerada na Hostinger.

---

## 4. Plano de Tratamento e Sanitização do Histórico Git

Quando for autorizada a limpeza definitiva dos commits históricos do repositório, utilize a ferramenta oficial recomendada pelo GitHub ([`git-filter-repo`](https://github.com/newren/git-filter-repo)).

> [!WARNING]  
> **Atenção:** A reescrita do histórico altera os hashes SHA-1 de todos os commits subsequentes. Ela deve ser feita **somente após a aprovação de todos os envolvidos** e com backup completo do repositório antes de iniciar.

### Protocolo de Execução com `git-filter-repo`:

```bash
# 1. Realizar clone limpo espelho (mirror) de segurança antes de qualquer ação
git clone --mirror https://github.com/thiagooriginal/on-eventos.git backup-on-eventos-mirror.git

# 2. Em um clone novo de trabalho, executar a remoção histórica dos arquivos confidenciais:
pip install git-filter-repo

git-filter-repo --invert-paths \
  --path .env \
  --path prisma/dev.db \
  --path public/sicredi_api_config.json \
  --path public/whatsapp_config.json \
  --path public/aws_rekognition_config.json \
  --path public/whatsapp_qrcode.png

# 3. Verificar que nenhum commit restante possui os arquivos
git log --all --full-history -- "public/sicredi_api_config.json"

# 4. Atualizar o remote e forçar a atualização (requer autorização explícita)
git remote add origin https://github.com/thiagooriginal/on-eventos.git
# git push origin --force --all
# git push origin --force --tags
```

---

## 5. Garantia de Continuidade dos Dados Existentes

- **Contas de Usuários:** Os registros dos usuários (`Thiago Original`, `Administrador ON`, `Valter Sá`) continuam íntegros com todos os seus dados cadastrais (nome, cargo, e-mail, telefone, avatar, perfil administrativo).
- **Redefinição no Primeiro Acesso:** Cada usuário definirá sua senha pessoal definitiva no próximo login, garantindo que senhas vazadas no passado nunca mais sejam utilizadas.
- **Vendas e Boletos:** A base de vendas `vendas_albuns_db.json` permanece inalterada, protegida em `private_data/` fora do acesso web direto.
