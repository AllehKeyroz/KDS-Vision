
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
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authUser, loading, signOut } = useAuth();

  if (loading) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If the user is not authenticated, the useAuth hook will redirect them.
  // We can render the children directly (which will be the login/signup page).
  if (!authUser) {
    return <>{children}</>;
  }


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
                        <AvatarImage src={authUser.photoURL ?? ''} alt={authUser.displayName || ''} data-ai-hint="avatar person" />
                        <AvatarFallback>{authUser.displayName?.[0] || authUser.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                        <p className="font-semibold text-sm truncate">{authUser.displayName || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate">{authUser.email}</p>
                    </div>
                </div>
                 <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
      </main>
    </SidebarProvider>
  );
}
