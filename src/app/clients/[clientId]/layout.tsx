
'use client'

import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
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
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!client) {
    return <div className="p-8 text-center">Cliente não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline animate-in fade-in-25 slide-in-from-bottom-4 duration-500">{client.name}</h1>
      </div>
      
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
