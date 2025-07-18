
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, Users, Search, Folder, Megaphone, Presentation, Settings, Users2, Building, DollarSign } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';

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
      </Sidebar>
      <SidebarInset className="bg-background min-h-svh">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
