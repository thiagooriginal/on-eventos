---
name: on-teamwork
description: >-
  Metodologia e rotina de colaboração multiagente permanente da ON Agência de Eventos.
  Permite orquestrar tarefas entre Coordenador Geral, Arquiteto, Desenvolvedor, Segurança,
  Banco de Dados, Testes e Revisor Técnico Independente, integrando auditorias com ChatGPT e Claude.
---

# Habilidade Permanente de Equipe Multiagente — ON Agência

Esta habilidade estabelece a rotina de trabalho colaborativo permanente entre os 7 agentes especialistas da ON Agência de Eventos.

## 1. Fluxo de Execução de um Comando (ON-XXX)

Sempre que o usuário emitir um novo comando no formato `# COMANDO ON-XXX`, a seguinte rotina é disparada:

1. **Recepção e Interpretação (Agente 01 — Coordenador Geral)**:
   - Identifica o escopo, requisitos obrigatórios e restrições de segurança.
   - Seleciona quais especialistas serão acionados.
2. **Avaliação Técnica e de Segurança**:
   - Agente 02 (Arquiteto) analisa impactos estruturais no Next.js/PHP.
   - Agente 04 (Segurança) faz a análise de riscos (OWASP/ASVS).
   - Agente 05 (Dados) analisa persistência, atomicidade e integridade no `private_data`.
3. **Implementação (Agente 03 — Desenvolvedor)**:
   - Aplica as alterações estritamente autorizadas dentro da branch de feature/hardening.
4. **Validação de Qualidade (Agente 06 — Testes)**:
   - Executa as 4 suítes automatizadas (`functional-test`, `security-test`, `homologation-test`, `integration-test`).
   - Verifica compilação Next.js de produção (`npm run build`).
5. **Revisão Independente (Agente 07 — Revisor)**:
   - Audita o diff linha a linha e emite parecer técnico.
   - Prepara pacote de auditoria externa para submissão ao ChatGPT e ao Claude.
6. **Consolidação Final (Agente 01 — Coordenador Geral)**:
   - Entrega relatório consolidado com evidências objetivas e recomenda o próximo passo ao usuário.

## 2. Protocolo de Delegação no Antigravity

Os agentes especializados são acionados via subagentes com modelos dedicados:
- Análises e Auditorias de Segurança / Revisão: `Model: 'inherit'` ou `'pro'` para raciocínio analítico profundo.
- Testes rápidos e rotinas automatizadas: `Model: 'flash'` ou `'inherit'`.
- Sempre com isolamento de contexto e retorno de pareceres fundamentados.

## 3. Diretrizes Inegociáveis
- Não modificar produção sem autorização expressa.
- Não efetuar merge na branch `main` sem aprovação.
- Não executar truncamento ou limpeza destrutiva de dados reais.
- Nenhuma vulnerabilidade P0/P1 pode ser aceita.
