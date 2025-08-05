

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

export type Proposal = {
    id: string;
    clientId: string;
    clientName: string;
    title: string;
    scope: string;
    value: number;
    status: 'Rascunho' | 'Enviada' | 'Aceita' | 'Recusada' | 'Expirada';
    createdAt: Date;
    validUntil: Date | null;
    validityBenefit?: string;
};

export type FaqItem = {
    id: string;
    question: string;
    answer: string;
};

export type ClientContext = {
    company: { history: string; mission: string; vision: string; values: string; team: string };
    branding: { toneOfVoice: string; visualIdentity: string; differentials: string };
    products: { mainProducts: string; productDetails: string; pricing: string };
    marketing: { targetAudience: string; pastCampaigns: string; plannedInvestment: string; promotions: string };
    faq: FaqItem[];
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
  context?: ClientContext;
};

export type AccessDetail = {
  id: string;
  type: string;
  value: string;
  isSecret?: boolean;
}

export type ClientAccess = {
  id: string;
  platform: string;
  details: AccessDetail[];
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

export interface LoggedTime {
  userId: string;
  hours: number;
  date: Timestamp;
}

export interface Task {
  id: string;
  text: string;
  parentId?: string; // ID of the parent task, if this is a sub-task
  description?: string;
  responsibleIds: string[];
  completed: boolean;
  priority: 'Baixa' | 'Média' | 'Alta';
  deadline?: any; // Firestore Timestamp
  timeLogs?: LoggedTime[]; // Detailed time tracking
}

export interface ProjectSection {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  scope: string;
  value: number;
  cost?: number; // Custo Estimado
  status: 'Planejamento' | 'Em Andamento' | 'Pausado' | 'Concluído';
  deadline?: Timestamp;
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
  role: 'agencyAdmin' | 'clientAdmin' | 'user';
  avatar: string;
  costPerHour?: number;
  assignedClientIds?: string[];
}

export interface Invitation {
  id: string;
  email: string;
  clientId: string;
  role: 'clientAdmin' | 'user';
  status: 'pending' | 'accepted';
  createdAt: Timestamp;
  invitedBy: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: any; // Firestore Timestamp
  category?: string;
  recurring: boolean;
  // Fields for automated invoices from contracts
  invoiceId?: string; // Unique ID for the invoice, e.g., `contractId_YYYY_MM`
  contractId?: string;
  recurringExpenseId?: string;
  clientId?: string;
}

export interface Contract {
    id: string;
    clientId: string;
    clientName: string;
    title: string;
    amount: number;
    startDate: Timestamp;
    status: 'active' | 'paused' | 'cancelled';
    createdAt: Timestamp;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  startDate: Timestamp;
  status: 'active' | 'paused' | 'cancelled';
}

export interface Appointment {
  id: string;
  title: string;
  date: Date; // Stored as Timestamp in Firestore, converted to Date on client
  duration: number; // in minutes
  userIds: string[];
  clientId?: string;
  notes?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
}

export interface PlaybookItem {
  text: string;
  completed: boolean;
}

export interface PlaybookTemplate {
  id: string;
  title: string;
  items: Omit<PlaybookItem, 'completed'>[];
}

export interface Processo {
  id: string;
  templateId: string;
  title: string;
  items: PlaybookItem[];
  createdAt: Timestamp;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  status: 'Aberto' | 'Em Andamento' | 'Resolvido';
  responsibleId?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface WhatsappTemplate {
  id: string;
  title: string;
  message: string;
  isDefault: boolean;
  createdAt?: Timestamp;
}

// Re-exporting AI types to be used in the UI
export type { AdsIACreatorInput };
