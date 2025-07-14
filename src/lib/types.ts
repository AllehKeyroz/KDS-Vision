import type { AdsIACreatorInput, AdsIACreatorOutput } from "./ai/flows/ads-ia-creator";

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

export interface BrainstormSession {
  id: string;
  title: string;
  ideas: { text: string; completed: boolean }[];
  tasks: { text: string; completed: boolean }[];
  createdAt: any; // Firestore Timestamp
}

export interface SocialSession {
  id: string;
  title: string;
  postIdeas: { text: string; completed: boolean }[];
  contentStrategy: string;
  createdAt: any; // Firestore Timestamp
}

export interface Project {
  id: string;
  name: string;
  scope: string;
  value: number;
  progress: number;
  status: 'Planejamento' | 'Em Andamento' | 'Pausado' | 'Concluído';
}

export interface AdsCampaign {
  id: string;
  title: string;
  request: AdsIACreatorInput;
  response: AdsIACreatorOutput;
  createdAt: any; // Firestore Timestamp
}

// Re-exporting AI types to be used in the UI
export type { AdsIACreatorInput, AdsIACreatorOutput };
