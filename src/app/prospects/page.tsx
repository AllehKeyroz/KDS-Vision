
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Briefcase, MessageSquare } from "lucide-react";
import ProposalsList from '@/components/prospects/proposals';
import ProspectsFunnel from '@/components/prospects/funnel';
import WhatsAppTemplates from "@/components/prospects/whatsapp-templates";


export default function ProspectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Prospecção e Vendas</h1>
        <p className="text-muted-foreground">Gerencie seus leads, funil de vendas e propostas comerciais.</p>
      </div>

       <Tabs defaultValue="funnel" className="w-full">
            <TabsList className="self-start">
                <TabsTrigger value="funnel" className="flex items-center gap-2"><Briefcase className="h-4 w-4"/> Funil de Vendas</TabsTrigger>
                <TabsTrigger value="proposals" className="flex items-center gap-2"><FileText className="h-4 w-4"/> Propostas</TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Templates WhatsApp</TabsTrigger>
            </TabsList>
            
            <TabsContent value="funnel" className="mt-4">
               <ProspectsFunnel />
            </TabsContent>

            <TabsContent value="proposals" className="mt-4">
                <ProposalsList />
            </TabsContent>
            
            <TabsContent value="templates" className="mt-4">
                <WhatsAppTemplates />
            </TabsContent>
        </Tabs>
    </div>
  );
}
