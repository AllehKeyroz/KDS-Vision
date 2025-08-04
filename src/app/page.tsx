
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, ArrowRight, FolderKanban, ListTodo, Filter, CalendarIcon as CalendarIconLucide, User as UserIcon, PlusCircle, CheckCircle2, Loader2, Check, ChevronsUpDown, Trash2, DollarSign, RefreshCcw, ShoppingCart, ArrowUpCircle, ArrowDownCircle, FolderOpen, UserRound, Clock, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, addDoc, doc, updateDoc, deleteDoc, getDocs, writeBatch, collectionGroup } from 'firebase/firestore';
import type { Client, Prospect, Project, Task, User, Appointment, FinancialTransaction, Contract, RecurringExpense } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addMinutes, setHours, setMinutes, startOfDay, subMonths, endOfMonth, isFuture, addDays, isPast } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ptBR } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';


type AppointmentFormData = Omit<Appointment, 'id' | 'date'> & {
  id?: string;
  date: Date | undefined;
}

type UnifiedEvent = {
    date: Date;
    type: 'appointment' | 'project' | 'task';
    title: string;
    details: string;
    id: string;
    link?: string;
    isOverdue?: boolean;
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { user: loggedInUser } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<(Task & { projectName: string; clientId: string; projectId: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financials, setFinancials] = useState<FinancialTransaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [filters, setFilters] = useState({ 
    responsibleId: '', 
    deadline: null as { from?: Date; to?: Date } | null,
    clientId: '',
    projectId: ''
  });
  
  // States for the main calendar and its dialogs
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false);
  const [eventsForSelectedDay, setEventsForSelectedDay] = useState<UnifiedEvent[]>([]);

  
  const emptyAppointment: AppointmentFormData = { title: '', notes: '', userIds: [], duration: 30, date: undefined, clientId: undefined };
  const [appointmentFormData, setAppointmentFormData] = useState<AppointmentFormData>(emptyAppointment);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    setIsLoading(true);

    const clientsQuery = query(collection(db, 'clients'));
    const projectsQuery = query(collectionGroup(db, 'projects'));
    
    // Set up listeners
    unsubscribes.push(onSnapshot(clientsQuery, (snapshot) => setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)))));
    unsubscribes.push(onSnapshot(query(collection(db, 'prospects')), (snapshot) => setProspects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect)))));
    unsubscribes.push(onSnapshot(query(collection(db, 'users')), (snapshot) => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)))));
    unsubscribes.push(onSnapshot(projectsQuery, (snapshot) => {
        const projectsData = snapshot.docs
          .map(doc => {
            if (!doc.ref.parent.parent) {
              console.warn(`Projeto órfão encontrado com ID: ${doc.id}. Este projeto será ignorado.`);
              return null;
            }
            return { id: doc.id, ...doc.data(), clientId: doc.ref.parent.parent.id } as Project;
          })
          .filter((p): p is Project => p !== null);

        const tasksData = projectsData.flatMap(p => (p.sections || []).flatMap(s => (s.tasks || []).map(t => ({ ...t, projectName: p.name, clientId: p.clientId, projectId: p.id }))));
        setProjects(projectsData);
        setAllTasks(tasksData);
        setIsLoading(false); // Set loading to false after projects and tasks are processed
    }));

    unsubscribes.push(onSnapshot(query(collection(db, 'appointments')), (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as Appointment)));
    }));
    unsubscribes.push(onSnapshot(query(collection(db, 'financials')), (snapshot) => {
      setFinancials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: (doc.data().date as Timestamp).toDate() } as FinancialTransaction)));
    }));
    unsubscribes.push(onSnapshot(query(collection(db, 'contracts')), (snapshot) => {
      setContracts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract)));
    }));
    unsubscribes.push(onSnapshot(query(collection(db, 'recurring_expenses')), (snapshot) => {
      setRecurringExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringExpense)));
    }));
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);
  
  useEffect(() => {
    if (loggedInUser) {
        setFilters(f => ({ ...f, responsibleId: loggedInUser.id }));
    }
  }, [loggedInUser]);

  const allEvents = useMemo(() => {
    const projectEvents: UnifiedEvent[] = projects
        .filter(p => p.deadline)
        .map(p => ({
            date: p.deadline!.toDate(),
            type: 'project',
            title: p.name,
            details: `Prazo final do projeto.`,
            id: p.id,
            link: `/clients/${p.clientId}/projects/${p.id}`,
            isOverdue: p.status !== 'Concluído' && isPast(p.deadline!.toDate())
        }));

    const taskEvents: UnifiedEvent[] = allTasks
        .filter(t => t.deadline)
        .map(t => ({
            date: t.deadline.toDate(),
            type: 'task',
            title: t.text,
            details: `Prazo da tarefa no projeto ${t.projectName}.`,
            id: t.id,
            link: `/clients/${t.clientId}/projects/${t.projectId}`,
            isOverdue: !t.completed && isPast(t.deadline.toDate())
        }));

    const appointmentEvents: UnifiedEvent[] = appointments
        .map(a => ({
            date: a.date,
            type: 'appointment',
            title: a.title,
            details: `Reunião às ${format(a.date, 'HH:mm')}.`,
            id: a.id,
            isOverdue: false, // Appointments don't have an overdue state in this context
        }));

    return [...projectEvents, ...taskEvents, ...appointmentEvents];
  }, [projects, allTasks, appointments]);

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    setSelectedDate(day);
    const dayStr = format(day, 'yyyy-MM-dd');
    const events = allEvents.filter(e => format(e.date, 'yyyy-MM-dd') === dayStr);
    
    if (events.length > 0) {
      setEventsForSelectedDay(events);
      setIsDayEventsDialogOpen(true);
    }
  };

  const handleOpenAppointmentDialog = (appointment?: Appointment | null, timeSlot?: Date) => {
    if (appointment) {
        setAppointmentFormData({ ...appointment, date: appointment.date, userIds: appointment.userIds || [] });
    } else {
        const date = timeSlot || selectedDate;
        setAppointmentFormData({ ...emptyAppointment, date, userIds: [] });
    }
    setIsAppointmentDialogOpen(true);
  };
  
  const dailyAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return appointments.filter(app => format(app.date, 'yyyy-MM-dd') === dateStr).sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [appointments, selectedDate]);
  
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const start = setMinutes(setHours(selectedDate, 8), 0);
    const end = setMinutes(setHours(selectedDate, 18), 0);
    const slots = [];
    let currentTime = start;

    while (currentTime < end) {
      const isBooked = dailyAppointments.some(app => {
        const appStart = app.date.getTime();
        const appEnd = addMinutes(app.date, app.duration || 30).getTime();
        return currentTime.getTime() >= appStart && currentTime.getTime() < appEnd;
      });
      slots.push({ time: currentTime, booked: isBooked });
      currentTime = addMinutes(currentTime, 30);
    }
    return slots;
  }, [selectedDate, dailyAppointments]);
  
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentFormData.title || (appointmentFormData.userIds || []).length === 0 || !appointmentFormData.date) {
        toast({ title: 'Campos obrigatórios', description: 'Título, horário e ao menos um responsável são necessários.', variant: 'destructive' });
        return;
    }

    const slotsNeeded = appointmentFormData.duration / 30;
    const startIndex = timeSlots.findIndex(slot => slot.time.getTime() === appointmentFormData.date?.getTime());
    
    if (startIndex === -1 && !appointmentFormData.id) { // Don't check for slot if we are just editing text
        toast({ title: 'Horário inválido', variant: 'destructive' });
        return;
    }

    // Skip time validation if editing an existing event
    if (!appointmentFormData.id) {
      for (let i = 0; i < slotsNeeded; i++) {
          if (startIndex + i >= timeSlots.length || timeSlots[startIndex + i].booked) {
              toast({ title: 'Horário indisponível', description: 'O horário selecionado não tem tempo livre suficiente para a duração do compromisso.', variant: 'destructive' });
              return;
          }
      }
    }

    setIsSaving(true);

    const dataToSave = {
        title: appointmentFormData.title,
        notes: appointmentFormData.notes,
        userIds: appointmentFormData.userIds,
        clientId: appointmentFormData.clientId || null,
        date: Timestamp.fromDate(appointmentFormData.date),
        duration: appointmentFormData.duration,
    };

    try {
        if (appointmentFormData.id) {
            const docRef = doc(db, 'appointments', appointmentFormData.id);
            await updateDoc(docRef, dataToSave);
            toast({ title: 'Compromisso Atualizado!', description: 'O compromisso foi salvo.' });
        } else {
            await addDoc(collection(db, 'appointments'), dataToSave);
            toast({ title: 'Compromisso Adicionado!', description: 'O novo compromisso foi salvo.' });
        }
        setIsAppointmentDialogOpen(false);
        setAppointmentFormData(emptyAppointment);
    } catch (error) {
        toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId?: string) => {
      if (!appointmentId) return;
      setIsSaving(true);
      try {
          await deleteDoc(doc(db, 'appointments', appointmentId));
          toast({ title: "Compromisso Removido", description: "O compromisso foi removido com sucesso." });
          setIsAppointmentDialogOpen(false);
          setAppointmentFormData(emptyAppointment);
      } catch (error) {
          toast({ title: "Erro ao remover", variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  }
  
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 7);

    return allEvents
        .filter(e => e.date >= today && e.date <= sevenDaysFromNow)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEvents]);

  const { scheduledDates, overdueDates } = useMemo(() => {
      const dates = new Set<string>();
      const overdue = new Set<string>();
      allEvents.forEach(e => {
        const dateStr = format(e.date, 'yyyy-MM-dd');
        dates.add(dateStr);
        if (e.isOverdue) {
            overdue.add(dateStr);
        }
      });
      return {
        scheduledDates: Array.from(dates).map(d => new Date(d)),
        overdueDates: Array.from(overdue).map(d => new Date(d)),
      }
  }, [allEvents]);

  const filteredTasks = useMemo(() => {
    let tasks = allTasks.filter(t => !t.completed);

    if (filters.responsibleId) {
        tasks = tasks.filter(t => (t.responsibleIds || []).includes(filters.responsibleId));
    }
    if (filters.clientId) {
        tasks = tasks.filter(t => t.clientId === filters.clientId);
    }
    if (filters.projectId) {
        tasks = tasks.filter(t => t.projectId === filters.projectId);
    }
    if (filters.deadline?.from) {
      const fromDate = startOfDay(filters.deadline.from);
      tasks = tasks.filter(t => t.deadline && t.deadline.toDate() >= fromDate);
    }
    if (filters.deadline?.to) {
        const toDate = startOfDay(filters.deadline.to);
        tasks = tasks.filter(t => t.deadline && t.deadline.toDate() <= toDate);
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
  
  const projectsForSelectedClient = useMemo(() => {
      if (!filters.clientId) return [];
      return projects.filter(p => p.clientId === filters.clientId);
  }, [projects, filters.clientId]);

  const { totalBalance, mrr, crr } = useMemo(() => {
    const balance = financials.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const monthlyRecurringRevenue = contracts.reduce((acc, c) => c.status === 'active' ? acc + c.amount : acc, 0);
    const costRecurringRevenue = recurringExpenses.reduce((acc, e) => e.status === 'active' ? acc + e.amount : acc, 0);
    return { totalBalance: balance, mrr: monthlyRecurringRevenue, crr: costRecurringRevenue };
  }, [financials, contracts, recurringExpenses]);
  
  const activeContracts = useMemo(() => contracts.filter(c => c.status === 'active'), [contracts]);
  const activeRecurringExpenses = useMemo(() => recurringExpenses.filter(e => e.status === 'active'), [recurringExpenses]);

  const EventIcon = ({ type, isOverdue }: { type: UnifiedEvent['type'], isOverdue?: boolean }) => {
    const color = isOverdue ? 'text-red-400' : 'text-primary';
    switch (type) {
        case 'appointment': return <CalendarIcon className="h-4 w-4 text-purple-400" />;
        case 'project': return <Briefcase className={cn("h-4 w-4", color)} />;
        case 'task': return <FileText className={cn("h-4 w-4", color)} />;
        default: return <Clock className="h-4 w-4" />;
    }
  };


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
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Clientes Ativos</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-96">
                {clients.map(client => (
                    <Link key={client.id} href={`/clients/${client.id}`} passHref><div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary"><p className="font-medium">{client.name}</p><ArrowRight className="h-4 w-4 text-muted-foreground" /></div></Link>
                ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Prospects</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{prospects.length}</div>}
              </CardContent>
            </Card>
           </DialogTrigger>
           <DialogContent><DialogHeader><DialogTitle>Prospects em Andamento</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-96">
                {prospects.map(prospect => (
                    <Link key={prospect.id} href="/prospects" passHref><div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary"><p className="font-medium">{prospect.name}</p><p className="text-sm text-muted-foreground">{prospect.stage}</p></div></Link>
                ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Projetos</CardTitle><FolderKanban className="w-4 h-4 text-muted-foreground" /></CardHeader>
                  <CardContent>{isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{projects.length}</div>}</CardContent>
                </Card>
            </DialogTrigger>
             <DialogContent><DialogHeader><DialogTitle>Projetos em Andamento</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-96">
                    {isLoading ? <Loader2 className="animate-spin" /> : projects.filter(p => p.status !== 'Concluído').map(project => (
                        <Link key={project.id} href={`/clients/${project.clientId}/projects/${project.id}`} passHref>
                             <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                               <div><p className="font-medium">{project.name}</p><p className="text-sm text-muted-foreground">{clients.find(c => c.id === project.clientId)?.name}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    ))}
                </ScrollArea>
              </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Balanço Total</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className={cn("text-2xl font-bold", totalBalance >= 0 ? "text-green-500" : "text-red-500")}>{formatCurrency(totalBalance)}</div>}
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>Extrato de Transações</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-96">
                    <Table>
                        <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {financials.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{t.description}</TableCell>
                                <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                                <TableCell className={cn("text-right font-semibold", t.type === 'income' ? 'text-green-400' : 'text-red-400')}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">MRR</CardTitle><RefreshCcw className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-primary">{formatCurrency(mrr)}</div>}
                    </CardContent>
                </Card>
            </DialogTrigger>
             <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Contratos Ativos (MRR)</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-96">
                     <Table>
                        <TableHeader><TableRow><TableHead>Contrato</TableHead><TableHead className="text-right">Valor Mensal</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {activeContracts.map(c => (
                            <TableRow key={c.id}>
                                <TableCell><div><p className="font-medium">{c.title}</p><p className="text-xs text-muted-foreground">{c.clientName}</p></div></TableCell>
                                <TableCell className="text-right font-semibold text-primary">{formatCurrency(c.amount)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">CRR</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-destructive">{formatCurrency(crr)}</div>}
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Custos Recorrentes Ativos (CRR)</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-96">
                     <Table>
                        <TableHeader><TableRow><TableHead>Despesa</TableHead><TableHead className="text-right">Custo Mensal</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {activeRecurringExpenses.map(e => (
                            <TableRow key={e.id}>
                                <TableCell><div><p className="font-medium">{e.description}</p><p className="text-xs text-muted-foreground">{e.category}</p></div></TableCell>
                                <TableCell className="text-right font-semibold text-destructive">{formatCurrency(e.amount)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
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
                                  <div className="space-y-2"><h4 className="font-medium leading-none">Filtros de Tarefas</h4><p className="text-sm text-muted-foreground">Filtre as tarefas por responsável ou prazo.</p></div>
                                  <div className="grid gap-2">
                                       <div className="space-y-1"><Label htmlFor="responsible">Responsável</Label>
                                            <Select onValueChange={(value) => setFilters(f => ({...f, responsibleId: value === 'all' ? '' : value}))} value={filters.responsibleId}>
                                                <SelectTrigger id="responsible" className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent><SelectItem value="all">Todos</SelectItem>{users.map(user => (<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                       </div>
                                       <div className="space-y-1"><Label htmlFor="client">Cliente</Label>
                                            <Select onValueChange={(value) => setFilters(f => ({...f, clientId: value === 'all' ? '' : value, projectId: ''}))} value={filters.clientId}>
                                                <SelectTrigger id="client" className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent><SelectItem value="all">Todos</SelectItem>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                       </div>
                                       {filters.clientId && projectsForSelectedClient.length > 0 && (
                                        <div className="space-y-1"><Label htmlFor="project">Projeto</Label>
                                            <Select onValueChange={(value) => setFilters(f => ({...f, projectId: value === 'all' ? '' : value}))} value={filters.projectId}>
                                                <SelectTrigger id="project" className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent><SelectItem value="all">Todos</SelectItem>{projectsForSelectedClient.map(project => (<SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                       </div>
                                       )}
                                       <div className="space-y-1"><Label htmlFor="deadline">Prazo</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button id="deadline" variant={"outline"} className={cn("h-8 w-full justify-start text-left font-normal", !filters.deadline && "text-muted-foreground")}>
                                                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                                                         {filters.deadline?.from ? (filters.deadline.to ? <>{format(filters.deadline.from, "LLL dd, y")} - {format(filters.deadline.to, "LLL dd, y")}</> : format(filters.deadline.from, "LLL dd, y")) : <span>Escolha um período</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={filters.deadline as any} onSelect={(range) => setFilters(f => ({...f, deadline: range || null}))} numberOfMonths={2} /></PopoverContent>
                                            </Popover>
                                       </div>
                                  </div>
                                   <Button variant="ghost" onClick={() => setFilters({ responsibleId: '', deadline: null, clientId: '', projectId: '' })}>Limpar Filtros</Button>
                              </div>
                          </PopoverContent>
                      </Popover>
                  </CardTitle>
                  <CardDescription>Tarefas pendentes de todos os projetos, ordenadas por urgência.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ScrollArea className="h-96">
                      {isLoading ? Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />) :
                       filteredTasks.length > 0 ? filteredTasks.map(task => {
                           const client = clients.find(c => c.id === task.clientId);
                           return (
                               <Link key={task.id} href={`/clients/${task.clientId}/projects/${task.projectId}`} className="block">
                                   <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                                       <div>
                                           <p className="font-medium">{task.text}</p>
                                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <UserRound className="h-3 w-3" /><span>{client?.name || 'Cliente'}</span>
                                                <FolderOpen className="h-3 w-3" /><span>{task.projectName}</span>
                                           </div>
                                       </div>
                                       <div className="text-right">
                                           <div className="flex items-center justify-end gap-1">
                                                {(task.responsibleIds || []).map(userId => {
                                                    const user = users.find(u => u.id === userId);
                                                    return user ? <Badge key={userId} variant="outline" className="flex items-center gap-1"><UserIcon size={12}/>{user.name.split(' ')[0]}</Badge> : null;
                                                })}
                                           </div>
                                           {task.deadline && (<p className={cn("text-xs text-muted-foreground", new Date(task.deadline.toDate()) < new Date() && !task.completed ? 'text-red-400' : '')}>Prazo: {format(task.deadline.toDate(), 'dd/MM/yyyy')}</p>)}
                                       </div>
                                   </div>
                               </Link>
                           )
                       }) : (
                          <p className="text-muted-foreground text-center py-8">Nenhuma tarefa pendente encontrada.</p>
                       )}
                  </ScrollArea>
              </CardContent>
          </Card>
           
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Calendário</CardTitle>
                        <CardDescription>Agenda de compromissos.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenAppointmentDialog(null, selectedDate)}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDayClick}
                    className="p-0 rounded-md border"
                    locale={ptBR}
                    modifiers={{ 
                        scheduled: scheduledDates,
                        overdue: overdueDates
                    }}
                    modifiersClassNames={{
                        scheduled: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary',
                        overdue: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-red-500',
                    }}
                />
                <div className="mt-4 space-y-2">
                     <h4 className="font-semibold">Próximos Compromissos (7 dias)</h4>
                    {upcomingEvents.length > 0 ? (
                        <ScrollArea className="h-40">
                        {upcomingEvents.map(event => (
                             <div key={event.id} className="text-sm p-2 rounded-md bg-secondary/50 mb-1">
                                <div className="flex items-start gap-2">
                                    <EventIcon type={event.type} isOverdue={event.isOverdue} />
                                    <div>
                                        <p className="font-bold">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">{format(event.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                                        <p className="text-xs mt-1">{event.details}</p>
                                    </div>
                                    {event.link && <Link href={event.link} className="ml-auto"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4" /></Button></Link>}
                                </div>
                            </div>
                        ))}
                        </ScrollArea>
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhum compromisso para os próximos 7 dias.</p>
                    )}
                </div>
            </CardContent>
          </Card>
      </div>

       <Dialog open={isDayEventsDialogOpen} onOpenChange={setIsDayEventsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Eventos de {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : ''}</DialogTitle>
                <DialogDescription>Todos os compromissos e prazos para este dia.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-80">
                <div className="space-y-2 pr-4">
                    {eventsForSelectedDay.map(event => (
                        <div key={`${event.type}-${event.id}`} className="text-sm p-3 rounded-md bg-secondary/50">
                           <div className="flex items-start gap-3">
                                <EventIcon type={event.type} isOverdue={event.isOverdue} />
                                <div className="flex-1">
                                    <p className="font-bold">{event.title}</p>
                                    <p className="text-xs mt-1 text-muted-foreground">{event.details}</p>
                                </div>
                                {event.link && (
                                    <Link href={event.link} passHref>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </DialogContent>
       </Dialog>

       <Dialog open={isAppointmentDialogOpen} onOpenChange={(isOpen) => {
            setIsAppointmentDialogOpen(isOpen);
            if (!isOpen) {
                setAppointmentFormData(emptyAppointment);
            }
       }}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>{appointmentFormData.id ? 'Editar Compromisso' : 'Adicionar Compromisso'}</DialogTitle>
                <DialogDescription>
                   {appointmentFormData.id ? 'Edite os detalhes do compromisso abaixo.' : `Agende um novo compromisso para ${selectedDate ? format(selectedDate, 'PPP', {locale: ptBR}) : ''}.`}
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleSaveAppointment} className="space-y-4">
                    <div><Label htmlFor="title">Título do Compromisso</Label><Input id="title" value={appointmentFormData.title} onChange={e => setAppointmentFormData(p => ({...p, title: e.target.value}))} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Horário de Início</Label><Input type="text" readOnly value={appointmentFormData.date ? format(appointmentFormData.date, 'HH:mm') : "Selecione um horário"} className="bg-muted"/></div>
                        <div><Label htmlFor="duration">Duração (min)</Label>
                            <Select value={String(appointmentFormData.duration)} onValueChange={value => setAppointmentFormData(p => ({...p, duration: Number(value)}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="30">30 min</SelectItem><SelectItem value="60">60 min</SelectItem><SelectItem value="90">90 min</SelectItem><SelectItem value="120">120 min</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div><Label>Atribuir a</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {(appointmentFormData.userIds || []).length > 0 ? `${(appointmentFormData.userIds || []).length} selecionado(s)` : "Selecione os membros..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0"><Command><CommandInput placeholder="Procurar membro..." /><CommandEmpty>Nenhum membro encontrado.</CommandEmpty><CommandGroup><CommandList>
                                    {users.map((user) => (
                                    <CommandItem key={user.id} onSelect={() => {
                                        setAppointmentFormData(p => {
                                            const currentIds = p.userIds || [];
                                            const newIds = currentIds.includes(user.id) ? currentIds.filter(id => id !== user.id) : [...currentIds, user.id];
                                            return {...p, userIds: newIds};
                                        })
                                    }}>
                                        <Check className={cn("mr-2 h-4 w-4", (appointmentFormData.userIds || []).includes(user.id) ? "opacity-100" : "opacity-0")}/>
                                        {user.name}
                                    </CommandItem>))}
                            </CommandList></CommandGroup></Command></PopoverContent>
                        </Popover>
                        <div className="pt-2 flex flex-wrap gap-1">
                            {(appointmentFormData.userIds || []).map(id => {
                                const user = users.find(u => u.id === id);
                                return user ? <Badge key={id} variant="secondary">{user.name}</Badge> : null;
                            })}
                        </div>
                    </div>
                     <div><Label htmlFor="clientId">Cliente (Opcional)</Label>
                        <Select value={appointmentFormData.clientId} onValueChange={value => setAppointmentFormData(p => ({...p, clientId: value === 'none' ? undefined : value}))}>
                            <SelectTrigger id="clientId"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                            <SelectContent><SelectItem value="none">Nenhum</SelectItem>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                     <div><Label htmlFor="notes">Notas (Opcional)</Label><Textarea id="notes" value={appointmentFormData.notes || ''} onChange={e => setAppointmentFormData(p => ({...p, notes: e.target.value}))} /></div>
                    <DialogFooter className="justify-between pt-4">
                         {appointmentFormData.id ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button type="button" variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Excluir</Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir compromisso?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAppointment(appointmentFormData.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         ) : <div></div>}
                        <div className="flex gap-2">
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Disponibilidade do Dia</h3>
                    <ScrollArea className="h-80 border rounded-md p-2">
                        <div className="space-y-1">
                            {timeSlots.map(slot => (
                                <button key={slot.time.toISOString()} 
                                    onClick={() => !slot.booked && setAppointmentFormData(p => ({...p, date: slot.time}))}
                                    disabled={slot.booked}
                                    className={cn(
                                        "w-full p-2 rounded-md text-xs flex justify-between items-center transition-colors",
                                        slot.booked ? "bg-red-900/50 text-muted-foreground cursor-not-allowed" : "bg-secondary hover:bg-accent",
                                        appointmentFormData.date?.getTime() === slot.time.getTime() && !slot.booked && "ring-2 ring-primary bg-primary/20"
                                )}>
                                    <span>{format(slot.time, 'HH:mm')} - {format(addMinutes(slot.time, 30), 'HH:mm')}</span>
                                    <Badge variant={slot.booked ? "destructive" : "default"}>{slot.booked ? "Ocupado" : "Livre"}</Badge>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </DialogContent>
       </Dialog>
    </div>
  );
}

