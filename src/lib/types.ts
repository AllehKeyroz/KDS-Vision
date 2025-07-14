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
  whatsapp?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  additionalFields?: Record<string, any>;
};

export type ClientAccess = {
  id: string;
  platform: string;
  link: string;
  login: string;
  password_plain: string; 
  apiKey: string;
};
