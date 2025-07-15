# KDS-Vision - Plataforma de Gestão para Agências Digitais

KDS-Vision é uma plataforma de gerenciamento completa, projetada para agências digitais modernas. Ela centraliza clientes, projetos, prospecção e equipes em um único lugar, potencializada por ferramentas de Inteligência Artificial para otimizar a estratégia de marketing e a produtividade.

## ✨ Funcionalidades Principais

- **Dashboard Centralizado**: Uma visão geral do seu negócio com métricas de clientes, projetos em andamento, calendário de compromissos e um painel de tarefas pendentes organizadas por urgência.
- **Gestão de Clientes (CRM)**: Adicione, edite e gerencie todos os seus clientes, com informações de contato, contexto de negócios e acesso rápido aos seus projetos.
- **Gestão de Projetos Avançada**:
    - Crie projetos com escopo, valor e status.
    - Organize o trabalho em seções e tarefas.
    - Atribua responsáveis e prazos para cada tarefa.
    - Acompanhe o progresso com uma barra de progresso automática baseada na conclusão de tarefas.
- **Funil de Prospecção**: Gerencie seus leads e prospects, acompanhando cada um através das diferentes etapas do funil de vendas.
- **Gestão de Equipe**: Adicione e gerencie os membros da sua equipe, que podem ser atribuídos como responsáveis pelas tarefas dos projetos.
- **Ferramentas com Inteligência Artificial (IA)**:
    - **Ads IA Creator**: Gere estruturas completas de campanhas de anúncios (Google, Meta) com base em um objetivo simples do cliente.
    - **Social Strategist IA**: Crie ideias de posts e estratégias de conteúdo para redes sociais.
    - **Brainstorming com IA**: Gere ideias e tarefas acionáveis para os desafios de seus clientes.
    - **Gerenciamento de Agentes de IA**: Crie agentes de IA com prompts personalizados para cada cliente.
    - **Prospecção Automática**: Encontre novos leads usando a API da Outscraper para buscar empresas no Google Maps.

---

## 🚀 Roadmap de Novas Funcionalidades

Abaixo estão as próximas grandes funcionalidades planejadas para o KDS-Vision.

### 1. Módulo Financeiro e de Projetos (Foco em Lucratividade) - *Em Desenvolvimento*

- [x] **Time Tracking por Tarefa (Base)**: Permite registrar o total de horas gastas em cada tarefa.
- [x] **Relatório de Rentabilidade (Base)**: Usa um "Custo Estimado" para calcular uma margem de lucro inicial do projeto.
- [ ] **Próximo Passo: Time Tracking por Usuário e Custo por Hora**: Adicionar um custo/hora para cada membro da equipe e associar as horas registradas a um usuário para calcular o custo real e a rentabilidade precisa do projeto.
- [ ] **Contratos e Retainers (Recorrência)**: Módulo para gerenciar contratos de fee mensal e automatizar o lançamento de receitas recorrentes.

### 2. Comunicação e Relacionamento com o Cliente (Foco em Retenção) - *Planejado*

- [ ] **Portal do Cliente (Client-Facing)**: Uma área para o cliente fazer login, acompanhar o progresso de seus projetos e acessar arquivos.
- [ ] **Relatórios Automatizados de Desempenho**: Integração com APIs (Google, Meta) para gerar relatórios automáticos de desempenho para os clientes.

---


## Stack de Tecnologia

- **Framework**: [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [ShadCN/UI](https://ui.shadcn.com/)
- **Banco de Dados**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Inteligência Artificial**: [Genkit](https://firebase.google.com/docs/genkit)
- **Deployment**: [Docker](https://www.docker.com/)

## 🏁 Como Começar

Siga os passos abaixo para configurar e rodar o projeto localmente.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (v18 ou superior)
- [Docker](https://www.docker.com/get-started) (Opcional, para deployment)

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/AllehKeyroz/KDS-Vision.git
   cd KDS-Vision
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

### Configuração do Firebase

1.  Vá para o [console do Firebase](https://console.firebase.google.com/).
2.  Crie um novo projeto ou use um existente.
3.  Vá para as configurações do projeto e adicione um novo aplicativo da Web.
4.  Copie as credenciais de configuração do Firebase e cole-as no arquivo `src/lib/firebase.ts`.
5.  No console do Firebase, vá para Firestore Database, crie um banco de dados e comece no modo de teste para permitir leituras/escritas.

### Executando a Aplicação

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Abra o navegador:**
   Acesse [http://localhost:9002](http://localhost:9002) para ver a aplicação em funcionamento.
