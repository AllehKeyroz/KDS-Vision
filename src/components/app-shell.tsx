
'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, Users, Folder, Megaphone, Presentation, Settings, Users2, Building, DollarSign, FileText, LogOut, Loader2, ChevronsUpDown, Check, User, Wand2, CheckSquare, AlertTriangle, KeyRound, Link as LinkIcon, Puzzle, MessageSquare, FolderKanban, Notebook } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import type { Client } from '@/lib/types';
import { ThemeToggle } from './theme-toggle';


const agencyNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Atendimento', href: '/atendimento', icon: MessageSquare },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Projetos', href: '/projects', icon: FolderKanban },
    { name: 'Prospecção', href: '/prospects', icon: Briefcase },
    { name: 'Financeiro', href: '/financials', icon: DollarSign },
    { name: 'Equipe', href: '/users', icon: Users2 },
    { name: 'Acessos Internos', href: '/agency/access', icon: KeyRound },
    { name: 'Links Úteis', href: '/agency/links', icon: LinkIcon },
    { name: 'Processos', href: '/agency/processos', icon: CheckSquare },
    { name: 'Chaves de API', href: '/agency/keys', icon: Puzzle },
    { name: 'Relatórios', href: '/reports', icon: Presentation },
    { name: 'Configurações', href: '/settings', icon: Settings, disabled: true },
]

const clientNav = (clientId: string) => [
  { name: 'Projetos', href: `/clients/${clientId}/projects`, icon: Folder },
  { name: 'Ferramentas IA', href: `/clients/${clientId}/tools`, icon: Wand2 },
  { name: 'Playbooks', href: `/clients/${clientId}/playbooks`, icon: CheckSquare },
  { name: 'Anotações', href: `/clients/${clientId}/notes`, icon: Notebook },
  { name: 'Issues', href: `/clients/${clientId}/issues`, icon: AlertTriangle },
  { name: 'Acessos', href: `/clients/${clientId}/access`, icon: KeyRound },
  { name: 'Contexto', href: `/clients/${clientId}`, icon: FileText },
]

function AccountSwitcher() {
    const { user, clients, viewContext, setViewContext, isLoading } = useAuth();
    const [open, setOpen] = React.useState(false);

    if (isLoading || !user) {
        return <Skeleton className="h-10 w-full" />;
    }
    
    const assignedClients = clients.filter(c => user.role === 'agencyAdmin' || (user.assignedClientIds || []).includes(c.id));
    
    const getContextName = () => {
      if (viewContext.type === 'client') {
        const client = clients.find(c => c.id === viewContext.clientId);
        return client?.name || 'Cliente';
      }
      return 'Painel da Agência';
    }

    const selectContext = (context: {type: 'agency'} | {type: 'client', client: Client}) => {
        setViewContext(context);
        setOpen(false);
    }
    
    if (user.role !== 'agencyAdmin' && assignedClients.length <= 1) {
      return (
         <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
            disabled
        >
            <div className="flex items-center gap-2 truncate">
              {assignedClients.length === 1 ? (
                <>
                  <Avatar className="w-6 h-6"><AvatarImage src={assignedClients[0].logo} alt={assignedClients[0].name} data-ai-hint="logo company" /><AvatarFallback>{assignedClients[0].name[0]}</AvatarFallback></Avatar>
                  <span className="truncate">{assignedClients[0].name}</span>
                </>
              ) : (
                <span className="truncate">Nenhum cliente atribuído</span>
              )}
            </div>
        </Button>
      )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    <div className="flex items-center gap-2 truncate">
                        {viewContext.type === 'client' ? (
                          <>
                           <Avatar className="w-6 h-6"><AvatarImage src={clients.find(c=>c.id === viewContext.clientId)?.logo} data-ai-hint="logo company" /><AvatarFallback>{getContextName()[0]}</AvatarFallback></Avatar>
                           <span className="truncate">{getContextName()}</span>
                          </>
                        ) : (
                          <>
                           <Building className="w-5 h-5"/>
                           <span className="truncate">{getContextName()}</span>
                          </>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--sidebar-width)] p-0">
                <Command>
                    <CommandInput placeholder="Buscar conta..." />
                    <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                    <CommandGroup>
                        <CommandList>
                            {user.role === 'agencyAdmin' && (
                                <CommandItem onSelect={() => selectContext({type: 'agency'})}>
                                    <Building className={cn("mr-2 h-5 w-5", viewContext.type === 'agency' ? "opacity-100" : "opacity-40")} />
                                    Painel da Agência
                                    <Check className={cn("ml-auto h-4 w-4", viewContext.type === 'agency' ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                            )}
                            {assignedClients.map(client => (
                                <CommandItem key={client.id} onSelect={() => selectContext({ type: 'client', client })}>
                                    <Avatar className={cn("mr-2 w-6 h-6", viewContext.type === 'client' && viewContext.clientId === client.id ? "opacity-100" : "opacity-70")}><AvatarImage src={client.logo} alt={client.name} data-ai-hint="logo company" /><AvatarFallback>{client.name[0]}</AvatarFallback></Avatar>
                                    <span className="truncate">{client.name}</span>
                                    <Check className={cn("ml-auto h-4 w-4", viewContext.type === 'client' && viewContext.clientId === client.id ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                            ))}
                        </CommandList>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, isLoading, viewContext } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-16 h-16 animate-spin text-primary"/>
        </div>
    );
  }
  
  const navigationLinks = viewContext.type === 'client' ? clientNav(viewContext.clientId) : agencyNav;


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <AccountSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigationLinks.map(item => {
                 const isActive = item.href === '/' ? pathname === '/' : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
                 if (viewContext.type === 'client' && item.href === `/clients/${viewContext.clientId}`) {
                    const isActiveClientRoot = pathname === item.href;
                    return (
                        <SidebarMenuItem key={item.name}>
                           <Link href={item.href}>
                               <SidebarMenuButton
                               isActive={isActiveClientRoot}
                               tooltip={item.name}
                               disabled={item.disabled}
                               >
                               <item.icon />
                               <span>{item.name}</span>
                               </SidebarMenuButton>
                           </Link>
                       </SidebarMenuItem>
                    )
                 }
                return (
                 <SidebarMenuItem key={item.name}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.name}
                        disabled={item.disabled}
                        >
                        <item.icon />
                        <span>{item.name}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )})}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                 <ThemeToggle />
                 <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50 flex flex-col gap-2">
                {user ? (
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar ?? ''} alt={user.name || ''} data-ai-hint="avatar person" />
                                <AvatarFallback>{user.name?.[0] || user.email?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col truncate">
                                <p className="font-semibold text-sm truncate">{user.name || 'Usuário'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                )}
            </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 px-4 md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Keyroz Vision</h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
