'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PROSPECTS_DATA } from '@/lib/data';
import type { Prospect } from '@/lib/types';
import { UserCircle } from 'lucide-react';

const stages: Prospect['stage'][] = ['Contato Inicial', 'Follow-up', 'Proposta', 'Negociação'];

const ProspectCard = ({ prospect }: { prospect: Prospect }) => (
  <Card className="mb-4 bg-card/80 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <h4 className="font-semibold font-headline">{prospect.name}</h4>
      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
        <UserCircle className="w-4 h-4" />
        <span>{prospect.contact}</span>
      </div>
    </CardContent>
  </Card>
);

export default function ProspectsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Funil de Prospecção</h1>
        <p className="text-muted-foreground">Gerencie seus leads e oportunidades de negócio.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => (
          <div key={stage} className="p-4 rounded-lg bg-primary/5">
            <h3 className="mb-4 text-lg font-semibold text-center font-headline text-primary">{stage}</h3>
            <div className="flex flex-col">
              {PROSPECTS_DATA
                .filter((p) => p.stage === stage)
                .map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} />
                ))}
              {PROSPECTS_DATA.filter((p) => p.stage === stage).length === 0 && (
                <div className="text-sm text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                  Nenhum prospect nesta etapa.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
