
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, ArrowRight, FolderKanban, ListTodo, Filter, CalendarIcon as CalendarIconLucide, User as UserIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { Client, Prospect, Project, Task, User } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<(Task & { projectName: string; clientId: string; projectId: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ responsible: '', deadline: null as Date | null });

  useEffect(() => {
    const unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });

    const unsubscribeProspects = onSnapshot(collection(db, 'prospects'), (snapshot) => {
      setProspects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect)));
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });

    // Fetch all projects from all clients
    const unsubscribeProjects = onSnapshot(query(collection(db, 'clients')), (clientsSnapshot) => {
        const projectPromises = clientsSnapshot.docs.map(clientDoc => {
            const projectsColRef = collection(db, 'clients', clientDoc.id, 'projects');
            return new Promise< (Project & { clientId: string })[] >(resolve => {
                onSnapshot(projectsColRef, (projectsSnapshot) => {
                    const clientProjects = projectsSnapshot.docs.map(projectDoc => ({
                        id: projectDoc.id,
                        clientId: clientDoc.id,
                        ...projectDoc.data()
                    } as Project & { clientId: string }));
                    resolve(clientProjects);
                });
            });
        });

        Promise.all(projectPromises).then(results => {
            const allProjects = results.flat();
            setProjects(allProjects);

            const tasks = allProjects.flatMap(p => 
                (p.sections || []).flatMap(s => 
                    (s.tasks || []).map(t => ({
                        ...t,
                        projectName: p.name,
                        clientId: p.clientId,
                        projectId: p.id,
                    }))
                )
            );
            setAllTasks(tasks);
            setIsLoading(false);
        });
    });

    return () => {
        unsubscribeClients();
        unsubscribeProspects();
        unsubscribeUsers();
        unsubscribeProjects();
    };
  }, []);

  const calculateProgress = (project: Project): number => {
    const allTasks = project.sections?.flatMap(s => s.tasks || []) || [];
    if (allTasks.length === 0) return 0;
    const completedTasks = allTasks.filter(t => t.completed).length;
    return Math.round((completedTasks / allTasks.length) * 100);
  };
  
  const filteredTasks = useMemo(() => {
    let tasks = allTasks.filter(t => !t.completed); // Show only pending tasks

    if (filters.responsible) {
      tasks = tasks.filter(t => t.responsible === filters.responsible);
    }
    if (filters.deadline) {
      tasks = tasks.filter(t => t.deadline && format(t.deadline.toDate(), 'yyyy-MM-dd') === format(filters.deadline, 'yyyy-MM-dd'));
    }
    // Sort by deadline, closer deadlines first
    return tasks.sort((a, b) => {
        if (a.deadline && b.deadline) {
            return a.deadline.toMillis() - b.deadline.toMillis();
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
    });
  }, [allTasks, filters]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio na Agência Digital.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{clients.length}</div>}
                <p className="text-xs text-muted-foreground">Clientes com projetos em andamento.</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clientes Ativos</DialogTitle>
              <DialogDescription>Lista de todos os clientes ativos.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
                {clients.map(client => (
                    <Link key={client.id} href={`/clients/${client.id}`} passHref>
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                           <p className="font-medium">{client.name}</p>
                           <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </Link>
                ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Prospects em Andamento</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{prospects.length}</div>}
                <p className="text-xs text-muted-foreground">Leads no funil de vendas.</p>
              </CardContent>
            </Card>
           </DialogTrigger>
           <DialogContent>
            <DialogHeader>
              <DialogTitle>Prospects em Andamento</DialogTitle>
              <DialogDescription>Lista de todos os prospects no funil.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
                {prospects.map(prospect => (
                    <Link key={prospect.id} href="/prospects" passHref>
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                           <p className="font-medium">{prospect.name}</p>
                           <p className="text-sm text-muted-foreground">{prospect.stage}</p>
                        </div>
                    </Link>
                ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Projetos Totais</CardTitle>
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{projects.length}</div>}
                    <p className="text-xs text-muted-foreground">Gerenciando o sucesso dos clientes.</p>
                  </CardContent>
                </Card>
            </DialogTrigger>
             <DialogContent>
                <DialogHeader>
                  <DialogTitle>Projetos em Andamento</DialogTitle>
                  <DialogDescription>Lista de todos os projetos em andamento.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                    {projects.filter(p => p.status !== 'Concluído').map(project => (
                        <Link key={project.id} href={`/clients/${project.clientId}/projects/${project.id}`} passHref>
                             <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                               <div>
                                   <p className="font-medium">{project.name}</p>
                                   <p className="text-sm text-muted-foreground">{clients.find(c => c.id === project.clientId)?.name}</p>
                               </div>
                               <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    ))}
                </ScrollArea>
              </DialogContent>
        </Dialog>
      </div>

       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <ListTodo /> Minhas Tarefas
                      </div>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Filtros</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                              <div className="grid gap-4">
                                  <div className="space-y-2">
                                      <h4 className="font-medium leading-none">Filtros de Tarefas</h4>
                                      <p className="text-sm text-muted-foreground">
                                          Filtre as tarefas por responsável ou prazo.
                                      </p>
                                  </div>
                                  <div className="grid gap-2">
                                       <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="responsible">Responsável</Label>
                                            <Select onValueChange={(value) => setFilters(f => ({...f, responsible: value === 'all' ? '' : value}))} defaultValue={filters.responsible}>
                                                <SelectTrigger id="responsible" className="col-span-2 h-8">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    {users.map(user => (
                                                        <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                       </div>
                                       <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="deadline">Prazo</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("col-span-2 h-8 justify-start text-left font-normal", !filters.deadline && "text-muted-foreground")}>
                                                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                                                        {filters.deadline ? format(filters.deadline, "PPP") : <span>Escolha uma data</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.deadline as Date | undefined} onSelect={(date) => setFilters(f => ({...f, deadline: date || null}))} initialFocus /></PopoverContent>
                                            </Popover>
                                       </div>
                                  </div>
                                   <Button variant="ghost" onClick={() => setFilters({ responsible: '', deadline: null })}>Limpar Filtros</Button>
                              </div>
                          </PopoverContent>
                      </Popover>
                  </CardTitle>
                  <CardDescription>Tarefas pendentes de todos os projetos, ordenadas por urgência.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-96">
                      {isLoading ? Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />) :
                       filteredTasks.length > 0 ? filteredTasks.map(task => (
                           <Link key={task.id} href={`/clients/${task.clientId}/projects/${task.projectId}`} className="block">
                               <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                                   <div>
                                       <p className="font-medium">{task.text}</p>
                                       <p className="text-sm text-muted-foreground">{task.projectName}</p>
                                   </div>
                                   <div className="text-right">
                                       {task.responsible && <p className="text-sm font-semibold flex items-center gap-1"><UserIcon className="h-3 w-3" /> {task.responsible}</p>}
                                       {task.deadline && (
                                           <p className={cn("text-xs text-muted-foreground", new Date(task.deadline.toDate()) < new Date() && !task.completed ? 'text-red-400' : '')}>
                                               Prazo: {format(task.deadline.toDate(), 'dd/MM/yyyy')}
                                           </p>
                                       )}
                                   </div>
                               </div>
                           </Link>
                       )) : (
                          <p className="text-muted-foreground text-center py-8">Nenhuma tarefa pendente encontrada.</p>
                       )}
                  </ScrollArea>
              </CardContent>
          </Card>
           
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
                <CardTitle>Calendário de Compromissos</CardTitle>
                 <CardDescription>Clique em uma data para adicionar um evento.</CardDescription>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    className="p-0"
                />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

    
