export type Prospect = {
  id: string;
  name: string;
  stage: 'Contato Inicial' | 'Follow-up' | 'Proposta' | 'Negociação';
  contact: string;
};

export type Client = {
  id: string;
  name: string;
  logo: string;
  contactPerson: string;
  contactEmail: string;
  activeProjects: number;
};

export type ClientAccess = {
  id: string;
  platform: string;
  link: string;
  login: string;
  // In a real app, this should be handled securely and not stored in plaintext
  password_plain: string; 
  apiKey: string;
};
