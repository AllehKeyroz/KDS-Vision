'use client'

import { CLIENTS_DATA } from '@/lib/data';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, FileText, KeyRound, Lightbulb, Megaphone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Acessos', href: '', icon: KeyRound },
  { name: 'Brainstorm IA', href: '/brainstorming', icon: Lightbulb },
  { name: 'Contexto', href: '/context', icon: FileText },
  { name: 'Agentes IA', href: '/agents', icon: Bot },
  { name: 'Social', href: '/social', icon: Share2 },
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
  // Handle /clients/[clientId] as the first tab
  const currentPathSegment = pathname === basePath ? '' : pathname.substring(basePath.length);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="mt-2 sm:mt-0">
          <h1 className="text-3xl font-bold tracking-tight font-headline animate-in fade-in-25 slide-in-from-bottom-4 duration-500">{client.name}</h1>
        </div>
      </div>
      
      <div className="border-b border-white/10 animate-in fade-in-25 slide-in-from-bottom-4 duration-500 delay-100">
        <div className="flex gap-2 sm:gap-8 px-0 sm:px-4 overflow-x-auto">
          {tabs.map((tab, index) => {
            const isActive = tab.href === currentPathSegment || (tab.href === '/context' && currentPathSegment === '');
            return (
              <Link href={`${basePath}${tab.href === '/context' ? '' : tab.href}`} key={tab.name} passHref>
                <div 
                  className={cn(
                    "flex flex-col items-center justify-center pb-3 pt-4 text-sm font-bold tracking-wide border-b-[3px] transition-all duration-300 ease-in-out whitespace-nowrap px-4",
                    isActive ? "border-primary text-primary glow-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  {tab.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-6 px-0 sm:px-4">
        {children}
      </div>
    </div>
  );
}
