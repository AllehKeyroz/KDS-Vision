import type { Client, Prospect, ClientAccess } from './types';

export const PROSPECTS_DATA: Prospect[] = [
  { id: 'p1', name: 'Café Delícia', stage: 'Contato Inicial', contact: 'Ana Costa' },
  { id: 'p2', name: 'Sapataria Estrela', stage: 'Follow-up', contact: 'Bruno Lima' },
  { id: 'p3', name: 'Eco Limpeza', stage: 'Proposta', contact: 'Carla Dias' },
  { id: 'p4', name: 'Pet Shop Amigo Fiel', stage: 'Negociação', contact: 'Daniel Alves' },
  { id: 'p5', name: 'Consultoria Financeira Futuro', stage: 'Contato Inicial', contact: 'Eduarda Martins' },
];

export const CLIENTS_DATA: Client[] = [
  { id: '1', name: 'Tech Inova Soluções', logo: 'https://placehold.co/64x64/2E9AFE/FFFFFF.png', contactPerson: 'Fernando Pereira', contactEmail: 'fernando@techinova.com', activeProjects: 3 },
  { id: '2', name: 'Gourmet Express', logo: 'https://placehold.co/64x64/FF8C00/FFFFFF.png', contactPerson: 'Gabriela Oliveira', contactEmail: 'gabriela@gourmetexpress.com', activeProjects: 2 },
  { id: '3', name: 'Moda & Estilo Boutique', logo: 'https://placehold.co/64x64/3c4043/FFFFFF.png', contactPerson: 'Heitor Santos', contactEmail: 'heitor@modaestilo.com', activeProjects: 5 },
  { id: '4', name: 'Saúde em Foco Clínica', logo: 'https://placehold.co/64x64/1E88E5/FFFFFF.png', contactPerson: 'Isabela Ferreira', contactEmail: 'isabela@saudefoco.com', activeProjects: 1 },
];

export const CLIENT_ACCESS_DATA: Record<string, ClientAccess[]> = {
  '1': [
    { id: 'ca1', platform: 'WordPress', link: 'https://techinova.com/wp-admin', login: 'admin_ti', password_plain: 'senhaforte123', apiKey: '' },
    { id: 'ca2', platform: 'Google Analytics', link: 'https://analytics.google.com', login: 'analytics@techinova.com', password_plain: 'senhagoggle', apiKey: 'GA-XYZ-123' },
  ],
  '2': [
    { id: 'ca3', platform: 'Shopify', link: 'https://gourmet-express.myshopify.com/admin', login: 'owner@gourmetexpress.com', password_plain: 'shopify_pass', apiKey: 'sh_abcdef123456' },
  ],
  '3': [],
  '4': [],
}

export const CLIENT_CONTEXT_DATA: Record<string, { icp: string; cac: string; faq: string; [key: string]: string }> = {
  '1': {
    icp: 'Empresas de médio porte no setor de tecnologia que buscam otimizar seus processos internos com software customizado.',
    cac: 'R$ 1.500,00 por cliente, com ciclo de venda de 45 dias.',
    faq: 'Qual o tempo médio de desenvolvimento? Como funciona o suporte pós-lançamento?',
  },
  '2': {
    icp: 'Pessoas entre 25-45 anos, residentes em áreas urbanas, interessadas em alimentação saudável e prática.',
    cac: 'R$ 50,00 por cliente, com foco em anúncios de redes sociais e marketing de influência.',
    faq: 'Vocês entregam em toda a cidade? Os ingredientes são orgânicos?',
  },
  '3': {
    icp: 'Mulheres de 20 a 40 anos, com interesse em moda sustentável e peças exclusivas. Ativas no Instagram e Pinterest.',
    cac: 'R$ 80,00 por cliente. Canais principais são tráfego pago no Instagram e parcerias com influenciadoras de moda.',
    faq: 'Qual a política de troca? Vocês possuem loja física?',
  },
  '4': {
    icp: 'Adultos acima de 30 anos preocupados com bem-estar e saúde preventiva, que buscam por especialistas qualificados.',
    cac: 'R$ 200,00 por paciente. Estratégia focada em Google Ads para pesquisas locais e marketing de conteúdo em blog.',
    faq: 'Quais convênios vocês aceitam? É necessário agendamento prévio?',
  },
};
