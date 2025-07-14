'use client'

import { CLIENTS_DATA } from '@/lib/data';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, FileText, KeyRound, Lightbulb, Megaphone, Share2 } from 'lucide-react';

const tabs = [
  { name: 'Contexto', href: '', icon: FileText },
  { name: 'Acessos', href: '/access', icon: KeyRound },
  { name: 'Brainstorming IA', href: '/brainstorming', icon: Lightbulb },
  { name: 'Agentes IA', href: '/agents', icon: Bot },
  { name: 'Social Strategist', href: '/social', icon: Share2 },
  { name: 'Ads Creator', href: '/ads', icon: Megaphone },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.clientId as string;

  const client = CLIENTS_DATA.find(c => c.id === clientId);

  if (!client) {
    return <div className="p-8 text-center">Cliente não encontrado.</div>;
  }

  const basePath = `/clients/${clientId}`;
  const currentPathSegment = pathname.substring(basePath.length);
  const currentTab = tabs.find(tab => tab.href === currentPathSegment) || tabs[0];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <Image src={client.logo} alt={`Logo ${client.name}`} width={64} height={64} className="rounded-xl border shadow-sm" data-ai-hint="logo business" />
        <div className="mt-2 sm:mt-0">
          <h1 className="text-3xl font-bold font-headline">{client.name}</h1>
          <p className="text-muted-foreground">Painel de gerenciamento do cliente.</p>
        </div>
      </div>

      <Tabs value={currentTab.href} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto p-1">
          {tabs.map((tab) => (
            <Link href={`${basePath}${tab.href}`} key={tab.name} passHref>
              <TabsTrigger value={tab.href} className="w-full flex-col sm:flex-row sm:justify-center gap-2 h-12">
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
