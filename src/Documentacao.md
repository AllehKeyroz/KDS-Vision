
# Documentação do Projeto KDS-Vision

Este documento serve como um raio-x do estado atual do projeto, detalhando as funcionalidades que já foram implementadas e as que ainda estão pendentes, com base no nosso roadmap estratégico.

## Roadmap Estratégico

| ID    | Módulo                       | Status      | Funcionalidade                                                                                                         |
| :---- | :--------------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------------- |
| **1.1** | Estratégia e Planejamento      |  **Concluído** | Diagnóstico de Marketing 360° - Base (Playbooks)                                                                       |
| **1.2** | Estratégia e Planejamento      | **Concluído** | Construtor de Persona e ICP - Base (Contexto do Cliente)                                                              |
| **1.3** | Estratégia e Planejamento      | পেন্ডিং | Mapa de Jornada do Cliente                                                                                             |
| **1.4** | Estratégia e Planejamento      | পেন্ডিং | Planejador Estratégico Anual/Trimestral                                                                                |
| **2.1** | Operações e Execução           | **Em Andamento** | Gestão de Funis de Vendas e Marketing - Base (Funil Kanban)                                                            |
| **2.2** | Operações e Execução           | **Concluído** | Calendário de Conteúdo Centralizado                                                                                    |
| **2.3** | Operações e Execução           | **Concluído** | Banco de Ativos Digitais (DAM) - Base (Links e Acessos)                                                                  |
| **2.4** | Operações e Execução           | **Concluído** | Gestão de Campanhas de Mídia Paga - Base (Salvar Campanhas)                                                              |
| **3.1** | Relacionamento e Colaboração | পেন্ডিং | Portal do Cliente                                                                                                      |
| **3.2** | Relacionamento e Colaboração | **Concluído** | Relatórios Automatizados de Desempenho - Base (Métricas Financeiras)                                                      |
| **3.3** | Relacionamento e Colaboração | পেন্ডিং | Sistema de Aprovação Integrado                                                                                         |
| **4.1** | Análise e Inteligência         | পেন্ডিং | Dashboard de ROI por Cliente                                                                                           |
| **4.2** | Análise e Inteligência         | পেন্ডিং | Análise de Rentabilidade da Agência                                                                                    |
| **4.3** | Análise e Inteligência         | পেন্ডিং | Benchmarking de Performance                                                                                            |
| **5.1** | Gestão Interna               | **Concluído** | Gestão de Propostas e Contratos - Base                                                                                 |
| **5.2** | Gestão Interna               | **Concluído** | Alocação de Recursos e Capacity Planning - Base (Time Tracking)                                                        |
| **5.3** | Gestão Interna               | **Concluído** | Base de Conhecimento Interna (Wiki) - Base (Templates de Processos)                                                     |

---

## Detalhamento das Funcionalidades

### ✅ Funcionalidades Implementadas

#### Gestão Central
- **Dashboard Principal (`/src/app/page.tsx`):**
  - **Descrição:** Visão geral da agência. Exibe cartões com contadores de clientes, prospects e projetos. Apresenta uma lista de tarefas pendentes de todos os projetos e um calendário de compromissos.
  - **Componentes:** `Card`, `Table`, `Dialog`, `Calendar`.

- **Gestão de Clientes (`/src/app/clients/page.tsx`):**
  - **Descrição:** Permite adicionar, editar e excluir clientes. A lista de clientes é exibida em uma tabela com informações de contato e um atalho para a página de detalhes.
  - **Componentes:** `Table`, `Dialog` para CRUD.

- **Gestão de Equipe (`/src/app/users/page.tsx`):**
  - **Descrição:** Permite adicionar, editar e excluir membros da equipe. Cada membro pode ter um nome, e-mail, função (Admin, Gestor, Analista) e um custo por hora.
  - **Componentes:** `Table`, `Dialog`, `Avatar`.

#### Módulos do Cliente (`/src/app/clients/[clientId]/...`)
- **(ID 1.2) Contexto do Cliente (`/src/app/clients/[clientId]/page.tsx`):**
  - **Descrição:** Área para centralizar informações sobre a empresa, branding, produtos e marketing (incluindo o público-alvo/ICP). Serve como base para as ferramentas de IA.
  - **Componentes:** `Tabs`, `Textarea`, `Input`, `Button`.

- **Gestão de Projetos (`.../projects/page.tsx` e `.../projects/[projectId]/page.tsx`):**
  - **Descrição:** Permite criar projetos com escopo, valor e status. Dentro de um projeto, é possível criar seções e tarefas. Cada tarefa pode ser marcada como concluída e ter responsáveis e prazo. A página de detalhes do projeto calcula o progresso com base nas tarefas concluídas.
  - **(ID 5.2) Time Tracking e Análise Financeira:** Cada tarefa permite o registro de horas por membros da equipe. A página de detalhes do projeto exibe um card de "Análise Financeira" que calcula o custo real (baseado no custo/hora do membro) e a margem de lucro do projeto.
  - **Componentes:** `Card`, `Progress`, `Checkbox`, `Dialog`, `Calendar`.

- **Central de Ferramentas de IA (`.../tools/page.tsx`):**
  - **Descrição:** Agrupa as ferramentas de IA em uma única interface com abas, facilitando a navegação.
  - **(ID 2.4) Ads IA Creator (`.../ads/page.tsx`):** Gera campanhas de anúncios detalhadas com base em um briefing. As campanhas geradas podem ser salvas em uma "Galeria de Campanhas" para consulta futura.
  - **Social Strategist IA (`.../social/page.tsx`):** Gera ideias de posts e estratégias de conteúdo para redes sociais.
  - **Brainstorming com IA (`.../brainstorming/page.tsx`):** Gera ideias e tarefas acionáveis com base em um objetivo.
  - **Agentes de IA (`.../agents/page.tsx`):** Permite a criação de agentes com prompts personalizados para o cliente.

- **(ID 1.1) Playbooks do Cliente (`.../playbooks/page.tsx`):**
  - **Descrição:** Permite aplicar "Templates de Processo" (checklists/playbooks) a um cliente. Cada item do checklist pode ser marcado como concluído, e o progresso geral é exibido. Serve como base para o Diagnóstico de Marketing 360.
  - **Componentes:** `Accordion` para uma visualização compacta, `Checkbox`, `Progress`.

- **Central de Issues (`.../issues/page.tsx`):**
  - **Descrição:** Um sistema para registrar e gerenciar pendências ou problemas específicos do cliente. Cada "issue" tem título, descrição, prioridade, status e pode ser atribuída a um responsável. A tabela de issues possui filtros por status, prioridade e responsável.
  - **Componentes:** `Table`, `Badge`, `DropdownMenu`, `Dialog` para CRUD, `Select` para filtros.

#### Módulos da Agência (`/src/app/agency/...`)
- **(ID 2.3) Acessos Internos e Links Úteis (`.../access/page.tsx`, `.../links/page.tsx`):**
  - **Descrição:** Páginas para a agência armazenar acessos internos (logins de ferramentas da agência) e links úteis, servindo como uma base para o Banco de Ativos Digitais.
- **(ID 5.3) Templates de Processo (`.../processos/page.tsx`):**
  - **Descrição:** Área para criar e gerenciar os templates de checklists (processos) que podem ser aplicados aos clientes. Inclui a funcionalidade de adicionar templates sugeridos com um clique.

#### Módulos de Negócios
- **(ID 5.1) Gestão de Propostas (`/src/app/proposals/page.tsx`):**
  - **Descrição:** Permite criar propostas comerciais com escopo, valor e data de validade. As propostas têm um ciclo de vida com status (Rascunho, Enviada, Aceita, Recusada, Expirada). Inclui um campo para "Benefício por Fechamento Rápido".
- **(ID 3.2) Gestão Financeira (`/src/app/financials/page.tsx`):**
  - **Descrição:** Página para gerenciamento financeiro. Inclui um dashboard com balanço total, MRR (Receita Recorrente Mensal) e CRR (Custo Recorrente Mensal). Permite o cadastro manual de transações e a gestão de contratos recorrentes e despesas recorrentes. Lança faturas automaticamente com base nos contratos ativos.
- **(ID 2.1) Funil de Prospecção (`/src/app/prospects/page.tsx`):**
  - **Descrição:** Permite gerenciar leads e prospects em diferentes etapas do funil de vendas em um painel Kanban. Inclui uma ferramenta de prospecção automática via API da Outscraper (localizada em Agency > Chaves de API).

---

### 🔲 Funcionalidades Pendentes (Próximos Passos)

1.  **Módulo 1: Estratégia e Planejamento (O Cérebro da Agência)**
    - `1.3. Mapa de Jornada do Cliente:` Desenvolver uma ferramenta visual (possivelmente usando uma biblioteca de diagramas) para mapear os pontos de contato do cliente.
    - `1.4. Planejador Estratégico:` Criar uma nova seção para definir OKRs (Objetivos e Resultados-Chave) e alocar orçamentos para períodos específicos (trimestre/ano).

2.  **Módulo 3: Relacionamento e Colaboração (O Coração da Agência)** - **NÃO INICIADO**
    - `3.1. Portal do Cliente:` Desenvolver uma área segura de login para clientes, onde eles possam ver o progresso dos projetos e relatórios. Requer implementação de autenticação para clientes.
    - `3.3. Sistema de Aprovação Integrado:` Adicionar um status de "Aguardando Aprovação" nas tarefas e criativos. Notificar o cliente (via Portal do Cliente) para que ele possa aprovar ou solicitar revisão.

3.  **Módulo 4: Análise e Inteligência (A Prova de Valor)** - **NÃO INICIADO**
    - `4.1. Dashboard de ROI por Cliente:` Criar um novo dashboard no perfil do cliente que cruze os dados do módulo financeiro (investimento) com métricas de resultado (a serem definidas, como leads ou vendas) para calcular o ROI.
    - `4.2. Análise de Rentabilidade da Agência:` Desenvolver um dashboard de alto nível (possivelmente em `/financials`) que consolide a margem de lucro de todos os projetos para identificar os clientes mais e menos rentáveis.
    - `4.3. Benchmarking de Performance:` Funcionalidade complexa que dependeria de uma base de dados anônima para comparar o desempenho de campanhas entre clientes do mesmo nicho.

