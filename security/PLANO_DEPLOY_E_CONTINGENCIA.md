# Plano de Deploy, Janela de Implantação e Plano de Contingência

> **Sistema**: Portal Administrativo & Operacional — ON Agência de Eventos  
> **Versão / Branch**: `security/hardening-phase-1` (Commit: `56e8645`)  
> **Alvo de Publicação**: Hostinger Shared Hosting (`onagenciadeeventos.com.br`)  
> **Classificação**: Crítica / Segurança / Zero Downtime

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

## 3. Roteiro de Execução do Deploy (Passo a Passo)

### Fase 1: Liberação do Código (T-0)
1. Revisar o Pull Request em modo rascunho no GitHub:
   `https://github.com/thiagooriginal/on-eventos/compare/main...security/hardening-phase-1`
2. Após aprovação expressa do usuário, efetuar o merge da branch `security/hardening-phase-1` na `main`.
3. O workflow do GitHub Actions (`.github/workflows/deploy.yml`) iniciará automaticamente:
   - `npm ci`
   - `npm run build` (compila frontend e exporta as 11 APIs PHP para `out/`)
   - `python3 deploy.py` (conecta via FTPS com TLS forçado e envia os arquivos para `public_html/`)
4. Acompanhar a execução no menu **Actions** do GitHub até a conclusão com sucesso.

### Fase 2: Verificação Pós-Deploy em Produção (T+10 min)
Executar os seguintes testes de integridade diretamente no domínio de produção:

1. **Isolamento de Dados Privados**:
   - Tentar acessar no navegador: `https://onagenciadeeventos.com.br/private_data/usuarios_db.json`
   - **Resultado esperado**: `HTTP 404 Not Found` (comprovando que os dados não estão acessíveis via web).
2. **Sessão e Autenticação Server-side**:
   - Acessar `https://onagenciadeeventos.com.br/usuarios.php?action=me`
   - **Resultado esperado**: `HTTP 401 Unauthorized` com JSON `{"sucesso": false, "autenticado": false}`.
3. **Envio Real de E-mail de Recuperação**:
   - Acessar `https://onagenciadeeventos.com.br/login`, clicar em "Esqueci minha senha" e enviar para um e-mail corporativo cadastrado.
   - Conferir se o e-mail chegou na caixa de entrada/spam em menos de 2 minutos.
   - Abrir o link, definir a nova senha pessoal e confirmar o login.
4. **Proteção contra CSRF**:
   - Tentar uma requisição POST manual sem `X-CSRF-Token` para `https://onagenciadeeventos.com.br/demandas.php`.
   - **Resultado esperado**: `HTTP 403 Forbidden` (`CSRF_INVALID`).
5. **Webhook Sicredi**:
   - Acessar via GET autenticado: `https://onagenciadeeventos.com.br/sicredi_webhook.php`.
   - Conferir status online e registro correto de eventos.

---

## 4. Plano de Contingência e Rollback Imediato

Se durante a janela de implantação for detectado qualquer comportamento anômalo (ex: falha de build, erro 500 generalizado ou rejeição de autenticação), o plano de rollback deve ser acionado imediatamente:

### Procedimento de Rollback em 3 Minutos:
1. **Restaurar os Arquivos via Gerenciador da Hostinger**:
   - No hPanel -> Gerenciador de Arquivos -> Entrar em `public_html/`.
   - Extrair o arquivo `backup_full_pre_deploy.zip` gerado antes da publicação, substituindo os arquivos atuais.
2. **Reversão no Git**:
   - No repositório local, reverter o commit de merge:
     ```bash
     git checkout main
     git pull origin main
     git revert -m 1 HEAD -m "revert(deploy): retorno ao estado anterior estavel para diagnostico"
     git push origin main
     ```
3. **Verificação pós-rollback**:
   - Acessar `https://onagenciadeeventos.com.br` e garantir que o portal voltou a responder normalmente no estado estável anterior.
   - Tempo total estimado de recuperação: **menos de 3 minutos**.

---

## 5. Matriz de Responsabilidades

| Atividade | Responsável | Status |
| :--- | :---: | :---: |
| Desenvolvimento & Testes Automatizados (120 testes) | Antigravity AI | Concluído (100% aprovado) |
| Criação de Ferramentas de Teste FTPS e E-mail | Antigravity AI | Concluído |
| Revisão de Código no GitHub | ChatGPT / Thiago | Aguardando liberação do PR |
| Criação da Caixa `seguranca@` na Hostinger | Administrador (Thiago) | Pendente de execução no hPanel |
| Troca de Senha FTP no hPanel | Administrador (Thiago) | Pendente de execução no hPanel |
| Atualização do Segredo `FTP_PASSWORD` no GitHub | Administrador (Thiago) | Pendente (após teste FTPS) |
| Autorização Expressa para Merge e Deploy | Administrador (Thiago) | Pendente |
