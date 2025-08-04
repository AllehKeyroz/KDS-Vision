
'use client';

import { usePathname } from 'next/navigation';
import { Puzzle, Shield } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Integrações', href: '/settings/integrations', icon: Puzzle },
  // { name: 'Segurança', href: '/settings/security', icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações e integrações da sua agência.</p>
            </div>
            
            <div className="border-b border-white/10">
                <div className="flex gap-2 sm:gap-4 px-0 sm:px-2 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                    <Link href={tab.href} key={tab.name} passHref>
                        <div 
                        className={cn(
                            "flex items-center gap-2 pb-3 pt-4 text-sm font-bold tracking-wide border-b-[3px] transition-all duration-300 ease-in-out whitespace-nowrap px-3",
                            isActive ? "border-primary text-primary glow-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
                        )}
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
