
'use client';

import { usePathname } from 'next/navigation';
import { Puzzle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Chaves de API', href: '/settings/integrations/keys' },
];

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-headline">Integrações</h2>
            {/* You can add more integration tabs here in the future if needed */}
             <div className="mt-6">
                {children}
            </div>
        </div>
    );
}
