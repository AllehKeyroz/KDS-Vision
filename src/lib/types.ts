import type { AdsIACreatorInput, AdsIACreatorOutput as AdsOutput } from "@/ai/flows/ads-ia-creator";
import type { Timestamp } from "firebase/firestore";

// Custom type for the UI to be less verbose
export interface AdsIACreatorOutput extends AdsOutput {}

export type Prospect = {
  id: string;
  name: string;
  stage: 'Contato Inicial' | 'Qualificado' | 'Proposta Enviada' | 'Follow-up' | 'Negociação' | 'Fechado' | 'Perdido';
  contact: string;
  nextFollowUp?: string;
  createdAt?: Timestamp;
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

export interface Task {
  id: string;
  text: string;
  responsible: string;
  completed: boolean;
  deadline?: any; // Firestore Timestamp
}

export interface ProjectSection {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  scope: string;
  value: number;
  status: 'Planejamento' | 'Em Andamento' | 'Pausado' | 'Concluído';
  sections?: ProjectSection[];
  createdAt?: any;
}


export interface AdsCampaign {
  id: string;
  title: string;
  request: Omit<AdsIACreatorInput, 'clientContext'>;
  response: AdsIACreatorOutput;
  createdAt: any; // Firestore Timestamp
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Gestor' | 'Analista';
  avatar: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: any; // Firestore Timestamp
  category?: string;
  recurring: boolean;
}


// Re-exporting AI types to be used in the UI
export type { AdsIACreatorInput };
