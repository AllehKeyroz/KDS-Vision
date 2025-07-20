
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Settings } from "lucide-react";
import ConexoesPage from "./conexoes/page";
import InboxPage from "./inbox/page";

export default function AtendimentoPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Atendimento</h1>
        <p className="text-muted-foreground">Gerencie suas conversas e conexões de WhatsApp.</p>
      </div>

       <Tabs defaultValue="inbox" className="w-full flex-1 flex flex-col">
            <TabsList className="self-start">
                <TabsTrigger value="inbox" className="flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Caixa de Entrada</TabsTrigger>
                <TabsTrigger value="connections" className="flex items-center gap-2"><Settings className="h-4 w-4"/> Conexões</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inbox" className="mt-4 flex-1">
               <InboxPage />
            </TabsContent>

            <TabsContent value="connections" className="mt-4">
                <ConexoesPage />
            </TabsContent>
        </Tabs>
    </div>
  );
}
