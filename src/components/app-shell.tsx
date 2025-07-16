
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, Users, Folder, Megaphone, Presentation, Settings, Users2, Building, DollarSign, FileText, LogOut, Loader2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

// Mock user for UI display purposes since auth is removed.
const mockUser = {
    displayName: 'Admin da Agência',
    email: 'admin@agency.com',
    photoURL: ''
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-col">
             <h1 className="text-base font-medium">Agência Digital</h1>
             <p className="text-sm text-muted-foreground">Gerenciamento de Clientes</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/clients">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/clients')}
                  tooltip="Clientes"
                >
                  <Users />
                  <span>Clientes</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/proposals">
                    <SidebarMenuButton
                    isActive={pathname.startsWith('/proposals')}
                    tooltip="Propostas"
                    >
                    <FileText />
                    <span>Propostas</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/prospects">
                    <SidebarMenuButton
                    isActive={pathname.startsWith('/prospects')}
                    tooltip="Prospecção"
                    >
                    <Briefcase />
                    <span>Prospecção</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/financials">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/financials')}
                  tooltip="Financeiro"
                >
                  <DollarSign />
                  <span>Financeiro</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/users">
                <SidebarMenuButton
                  isActive={pathname.startsWith('/users')}
                  tooltip="Equipe"
                >
                  <Users2 />
                  <span>Equipe</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/agency">
                    <SidebarMenuButton
                    isActive={pathname.startsWith('/agency')}
                    tooltip="Agência"
                    >
                    <Building />
                    <span>Agência</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Relatórios"
                disabled
              >
                <Presentation />
                <span>Relatórios</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Configurações"
                disabled
              >
                <Settings />
                <span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
            <div className="p-2 rounded-lg bg-secondary/50 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                     <Avatar className="h-9 w-9">
                        <AvatarImage src={mockUser.photoURL ?? ''} alt={mockUser.displayName || ''} data-ai-hint="avatar person" />
                        <AvatarFallback>{mockUser.displayName?.[0] || mockUser.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                        <p className="font-semibold text-sm truncate">{mockUser.displayName || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate">{mockUser.email}</p>
                    </div>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
      </main>
    </SidebarProvider>
  );
}
