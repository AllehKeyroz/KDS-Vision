
'use client'

import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Folder, Wand2, CheckSquare, AlertTriangle, KeyRound, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const tabs = [
  { name: 'Projetos', href: '/projects', icon: Folder },
  { name: 'Ferramentas IA', href: '/tools', icon: Wand2 },
  { name: 'Processos', href: '/processos', icon: CheckSquare },
  { name: 'Issues', href: '/issues', icon: AlertTriangle },
  { name: 'Acessos', href: '/access', icon: KeyRound },
  { name: 'Contexto', href: '', icon: FileText },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const fetchClient = async () => {
      setLoading(true);
      const docRef = doc(db, "clients", clientId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setClient({ id: docSnap.id, ...docSnap.data() } as Client);
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchClient();
  }, [clientId]);


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2" />
        <div className="border-b border-white/10">
          <div className="flex gap-2 sm:gap-8 px-0 sm:px-4 overflow-x-auto">
            {tabs.map((tab) => (
              <Skeleton key={tab.name} className="h-12 w-24" />
            ))}
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!client) {
    return <div className="p-8 text-center">Cliente não encontrado.</div>;
  }

  const basePath = `/clients/${clientId}`;
  // Determine the active path segment. The root path for a client corresponds to the empty href.
  const currentPathSegment = pathname.substring(basePath.length);

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
            const isActive = tab.href === '' ? pathname === basePath : pathname.startsWith(basePath + tab.href);
            return (
              <Link href={`${basePath}${tab.href}`} key={tab.name} passHref>
                <div 
                  className={cn(
                    "flex items-center gap-2 pb-3 pt-4 text-sm font-bold tracking-wide border-b-[3px] transition-all duration-300 ease-in-out whitespace-nowrap px-4",
                    isActive ? "border-primary text-primary glow-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <tab.icon className="h-4 w-4" />
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
