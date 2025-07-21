
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Loader2, Trash2, GripVertical, Check, X, Pencil, CheckCircle2, ArrowLeft, CalendarIcon, Filter, User, Clock, DollarSign, BarChart2, ChevronsUpDown, Flame, MessageSquare, Eye, EyeOff, CornerDownRight, Plus, Timer, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Project, ProjectSection, Task, User as AppUser, LoggedTime } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const priorityOrder: { [key in Task['priority']]: number } = {
    'Alta': 1,
    'Média': 2,
    'Baixa': 3,
};

type NewTaskState = { text: string; responsibleIds: string[]; deadline?: Date; priority: Task['priority']; parentId?: string };

const AddNewTaskInput = ({ 
    sectionId, 
    parentId,
    newTask,
    setNewTask,
    users,
    handleAddTask,
    onCancel,
}: {
    sectionId: string,
    parentId?: string,
    newTask: { [key: string]: NewTaskState },
    setNewTask: React.Dispatch<React.SetStateAction<{ [key: string]: NewTaskState }>>,
    users: AppUser[],
    handleAddTask: (sectionId: string, parentId?: string) => void,
    onCancel?: () => void,
}) => (
    <div className={cn("flex items-start md:items-center gap-2 pt-4 flex-col md:flex-row", parentId && "ml-8 pl-6 border-l-2")}>
        <Input 
            placeholder="Adicionar nova tarefa..." 
            className="h-9 flex-1 min-w-[200px]"
            value={newTask[sectionId]?.text || ""}
            onChange={(e) => setNewTask(prev => ({...prev, [sectionId]: {...(prev[sectionId] || {responsibleIds: [], priority: 'Média'}), text: e.target.value}}))}
        />
        <Select 
            defaultValue="Média" 
            onValueChange={(value: Task['priority']) => setNewTask(prev => ({...prev, [sectionId]: {...(prev[sectionId] || {text: '', responsibleIds: []}), priority: value}}))}
        >
            <SelectTrigger className="h-9 w-full md:w-[120px]"><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Baixa">Baixa</SelectItem></SelectContent>
        </Select>

        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="h-9 w-full md:w-[200px] justify-between">
                    {(newTask[sectionId]?.responsibleIds || []).length > 0
                        ? `${(newTask[sectionId]?.responsibleIds || []).length} selecionado(s)`
                        : "Responsáveis..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Procurar membro..." />
                    <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                    <CommandGroup><CommandList>
                            {users.map((user) => (
                                <CommandItem key={user.id} onSelect={() => {
                                    setNewTask(prev => {
                                        const currentIds = prev[sectionId]?.responsibleIds || [];
                                        const newIds = currentIds.includes(user.id) ? currentIds.filter(id => id !== user.id) : [...currentIds, user.id];
                                        return {...prev, [sectionId]: {...(prev[sectionId] || {text:'', priority: 'Média'}), responsibleIds: newIds}};
                                    })
                                }}>
                                    <Check className={cn("mr-2 h-4 w-4", (newTask[sectionId]?.responsibleIds || []).includes(user.id) ? "opacity-100" : "opacity-0")}/>
                                    {user.name}
                                </CommandItem>
                            ))}
                    </CommandList></CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn("h-9 w-full md:w-[180px] justify-start text-left font-normal", !newTask[sectionId]?.deadline && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask[sectionId]?.deadline ? format(newTask[sectionId].deadline as Date, "PPP") : <span>Prazo</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                mode="single"
                selected={newTask[sectionId]?.deadline}
                onSelect={(date) => setNewTask(prev => ({...prev, [sectionId]: {...(prev[sectionId] || {text: '', responsibleIds: [], priority: 'Média'}), deadline: date as Date}}))}
                initialFocus/>
            </PopoverContent>
        </Popover>
        <Button size="sm" onClick={() => handleAddTask(sectionId, parentId)}>Adicionar</Button>
        {onCancel && <Button size="icon" variant="ghost" onClick={onCancel}><X className="h-4 w-4"/></Button>}
    </div>
);


// Recursive Task Component
const TaskItem: React.FC<{ 
    task: Task; 
    sectionId: string;
    allTasks: Task[];
    level: number;
    users: AppUser[];
    isAddingSubTask: string | null;
    newTask: { [key: string]: NewTaskState };
    onToggle: (taskId: string, completed: boolean) => void;
    onDelete: (taskId: string) => void;
    onEdit: (task: Task) => void;
    onLogTime: (taskId: string, currentLogs: LoggedTime[] | undefined) => void;
    onAddSubTask: (parentId: string) => void;
    setNewTask: React.Dispatch<React.SetStateAction<{ [key: string]: NewTaskState }>>;
    handleAddTask: (sectionId: string, parentId?: string) => void;
    cancelAddSubTask: () => void;
}> = ({ task, sectionId, allTasks, level, users, isAddingSubTask, newTask, onToggle, onDelete, onEdit, onLogTime, onAddSubTask, setNewTask, handleAddTask, cancelAddSubTask }) => {
    const subTasks = allTasks.filter(sub => sub.parentId === task.id).sort((a,b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    const totalHoursForTask = (t: Task) => (t.timeLogs || []).reduce((acc, log) => acc + log.hours, 0);
    const priorityBadgeVariant = { 'Alta': 'destructive', 'Média': 'secondary', 'Baixa': 'outline' } as const;
    const hasSubtasks = subTasks.length > 0;
    const [isOpen, setIsOpen] = useState(true);

    const handleAddClick = (parentId: string) => {
        setIsOpen(true);
        onAddSubTask(parentId);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className={cn("flex items-start gap-2 group p-2 rounded-md hover:bg-secondary/20", level > 0 && "ml-4 border-l-2 pl-4 border-dashed")}>
                <div className="flex items-center gap-2 flex-1">
                    {hasSubtasks || isAddingSubTask === task.id ? (
                        <CollapsibleTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-6 w-6 [&[data-state=open]>svg]:rotate-90">
                                <ChevronRight className="h-4 w-4 transition-transform" />
                            </Button>
                        </CollapsibleTrigger>
                    ) : <div className="w-6 h-6"/> /* Spacer */}
                    
                    <Checkbox id={task.id} checked={task.completed} onCheckedChange={(checked) => onToggle(task.id, !!checked)} />
                    <label htmlFor={task.id} className={cn('flex-1 text-sm cursor-pointer', task.completed && 'line-through text-muted-foreground')}>
                        {task.text}
                    </label>
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                    {task.description && <Badge variant="outline" className="hidden sm:flex items-center gap-1"><MessageSquare size={12}/>Nota</Badge>}
                    <Badge variant={priorityBadgeVariant[task.priority]} className="flex items-center gap-1"><Flame size={12}/>{task.priority}</Badge>
                    <div className="hidden sm:flex items-center gap-1">
                        {(task.responsibleIds || []).map(userId => {
                            const user = users.find(u => u.id === userId);
                            return user ? <Badge key={userId} variant="outline" className="flex items-center gap-1"><User size={12}/>{user.name.split(' ')[0]}</Badge> : null;
                        })}
                    </div>
                    {task.deadline && (
                        <Badge variant="outline" className={cn("hidden sm:flex items-center gap-1", new Date(task.deadline.toDate()) < new Date() && !task.completed ? 'text-red-400 border-red-400/50' : '')}>
                            <CalendarIcon size={12}/>{format(task.deadline.toDate(), 'dd/MM/yy')}
                        </Badge>
                    )}
                    {totalHoursForTask(task) > 0 && <Badge variant="secondary" className="flex items-center gap-1"><Clock size={12}/>{totalHoursForTask(task)}h</Badge>}
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAddClick(task.id)}><Plus className="h-3 w-3"/></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onLogTime(task.id, task.timeLogs)}><Clock className="h-3 w-3"/></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}><Pencil className="h-3 w-3"/></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogDescription>Esta ação não pode ser desfeita e excluirá também todas as sub-tarefas associadas.</AlertDialogDescription>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(task.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
             <CollapsibleContent className="pl-4">
                {task.description && (
                     <div className="ml-14 pl-2 py-2 border-l-2 border-dashed border-border text-sm text-muted-foreground whitespace-pre-wrap">
                        {task.description}
                    </div>
                )}
                {subTasks.map(subTask => (
                    <TaskItem key={subTask.id} task={subTask} sectionId={sectionId} allTasks={allTasks} level={level + 1} users={users} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onLogTime={onLogTime} onAddSubTask={onAddSubTask} isAddingSubTask={isAddingSubTask} newTask={newTask} setNewTask={setNewTask} handleAddTask={handleAddTask} cancelAddSubTask={cancelAddSubTask}/>
                ))}
                 {isAddingSubTask === task.id && (
                    <AddNewTaskInput 
                        sectionId={sectionId} 
                        parentId={isAddingSubTask} 
                        newTask={newTask}
                        setNewTask={setNewTask}
                        users={users}
                        handleAddTask={handleAddTask}
                        onCancel={cancelAddSubTask}
                    />
                )}
            </CollapsibleContent>
        </Collapsible>
    )
}

const Countdown: React.FC<{ deadline: Date }> = ({ deadline }) => {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const distance = deadline.getTime() - now.getTime();

            if (distance < 0) {
                setCountdown('Prazo Expirado');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    return <span className="font-mono font-bold text-lg">{countdown}</span>;
};


export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { clientId, projectId } = params;
    const { toast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newTask, setNewTask] = useState<{ [key: string]: NewTaskState }>({});
    
    // Editing states
    const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isAddingSubTask, setIsAddingSubTask] = useState<string | null>(null);

    const [users, setUsers] = useState<AppUser[]>([]);
    const [filters, setFilters] = useState({ responsibleId: '', deadline: null as Date | null });
    
    const [isValuesVisible, setIsValuesVisible] = useState(false);
    
    // Time tracking state
    const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
    const [timeLogData, setTimeLogData] = useState<{ taskId: string; currentLogs: LoggedTime[] }>({ taskId: '', currentLogs: [] });


    const projectDocRef = useMemo(() => doc(db, 'clients', clientId as string, 'projects', projectId as string), [clientId, projectId]);
    const usersCollectionRef = useMemo(() => collection(db, 'users'), []);

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
        });

        const unsubscribeProject = onSnapshot(projectDocRef, (doc) => {
            if (doc.exists()) {
                const data = { id: doc.id, ...doc.data() } as Project;
                setProject(data);

                // Auto-update status to 'Concluído'
                const totalTasks = data.sections?.flatMap(s => s.tasks || []).length || 0;
                const completedTasks = data.sections?.flatMap(s => s.tasks || []).filter(t => t.completed).length || 0;
                if (totalTasks > 0 && completedTasks === totalTasks && data.status !== 'Concluído') {
                    updateDoc(projectDocRef, { status: 'Concluído' });
                }

            } else {
                toast({ title: "Erro", description: "Projeto não encontrado.", variant: "destructive" });
                router.push(`/clients/${clientId}/projects`);
            }
            setIsLoading(false);
        });
        return () => {
            unsubscribeProject();
            unsubscribeUsers();
        };
    }, [projectDocRef, router, toast, clientId, usersCollectionRef]);
    
    const projectAnalysis = useMemo(() => {
        if (!project || !users.length) return { totalLoggedHours: 0, profitMargin: 0, realCost: 0 };
        
        const taskTime = project.sections?.reduce((acc, section) => {
             (section.tasks || []).forEach(task => {
                (task.timeLogs || []).forEach(log => {
                    acc.totalLoggedHours += log.hours;
                    const user = users.find(u => u.id === log.userId);
                    if (user && user.costPerHour) {
                        acc.realCost += log.hours * user.costPerHour;
                    }
                });
            });
            return acc;
        }, { totalLoggedHours: 0, realCost: 0 });

        const profitMargin = project.value - (taskTime?.realCost || 0);

        return { totalLoggedHours: taskTime?.totalLoggedHours || 0, realCost: taskTime?.realCost || 0, profitMargin };
    }, [project, users]);


    const calculateProgress = () => {
        if (!project || !project.sections) return 0;
        const allTasks = project.sections.flatMap(s => s.tasks || []);
        if (allTasks.length === 0) return 0;
        const completedTasks = allTasks.filter(t => t.completed).length;
        return Math.round((completedTasks / allTasks.length) * 100);
    };

    const handleAddSection = async () => {
        if (!newSectionTitle.trim()) return;
        const newSection: ProjectSection = {
            id: `sec_${Date.now()}`,
            title: newSectionTitle.trim(),
            tasks: []
        };
        await updateDoc(projectDocRef, { sections: arrayUnion(newSection) });
        setNewSectionTitle("");
        toast({ title: "Seção Adicionada!" });
    };

    const handleUpdateSectionTitle = async () => {
        if (!editingSection || !editingSection.title.trim()) return;
        
        const updatedSections = project?.sections?.map(s => 
            s.id === editingSection.id ? { ...s, title: editingSection.title.trim() } : s
        );

        await updateDoc(projectDocRef, { sections: updatedSections });
        toast({ title: "Seção Atualizada!" });
        setEditingSection(null);
    };
    
    const handleDeleteSection = async (sectionId: string) => {
        const updatedSections = project?.sections?.filter(s => s.id !== sectionId);
        await updateDoc(projectDocRef, { sections: updatedSections });
        toast({ title: "Seção Removida!", variant: "destructive"});
    };

    const handleAddTask = async (sectionId: string, parentId?: string) => {
        const taskInput = newTask[sectionId];
        if (!taskInput || !taskInput.text.trim()) return;
        const task: Task = {
            id: `task_${Date.now()}`,
            text: taskInput.text.trim(),
            description: "",
            responsibleIds: taskInput.responsibleIds,
            priority: taskInput.priority || 'Média',
            completed: false,
            timeLogs: [],
            ...(parentId && { parentId }),
            ...(taskInput.deadline && { deadline: Timestamp.fromDate(taskInput.deadline) })
        };
        
        const updatedSections = project?.sections?.map(s => {
            if (s.id === sectionId) {
                return { ...s, tasks: [...(s.tasks || []), task] };
            }
            return s;
        });

        await updateDoc(projectDocRef, { sections: updatedSections });
        setNewTask(prev => ({ ...prev, [sectionId]: { text: "", responsibleIds: [], priority: 'Média' }}));
        if(parentId) setIsAddingSubTask(null);
    };
    
    const handleToggleTask = async (taskId: string, completed: boolean) => {
        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed } : t)
        }));
         await updateDoc(projectDocRef, { sections: updatedSections });
    };

    const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingTask) return;

        const formData = new FormData(event.currentTarget);
        const updatedTaskData = {
            text: formData.get('text') as string,
            description: formData.get('description') as string,
            deadline: formData.get('deadline') ? Timestamp.fromDate(new Date(formData.get('deadline') as string)) : null,
            priority: formData.get('priority') as Task['priority'],
            responsibleIds: formData.getAll('responsibleIds') as string[],
        };

        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.map(t => t.id === editingTask.id ? { ...t, ...updatedTaskData } : t)
        }));

        await updateDoc(projectDocRef, { sections: updatedSections });
        toast({ title: "Tarefa Atualizada" });
        setEditingTask(null);
    };


    const handleDeleteTask = async (taskIdToDelete: string) => {
        let allTasksToDelete = [taskIdToDelete];
        let queue = [taskIdToDelete];
    
        while (queue.length > 0) {
            const currentParentId = queue.shift();
            const childTasks = project?.sections?.flatMap(s => s.tasks).filter(t => t.parentId === currentParentId) || [];
            for (const child of childTasks) {
                allTasksToDelete.push(child.id);
                queue.push(child.id);
            }
        }
        
        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.filter(t => !allTasksToDelete.includes(t.id))
        }));
        await updateDoc(projectDocRef, { sections: updatedSections });
    };
    
    const handleOpenTimeLogDialog = (taskId: string, currentLogs: LoggedTime[] | undefined) => {
        setTimeLogData({ taskId, currentLogs: currentLogs || [] });
        setIsTimeLogDialogOpen(true);
    };
    
    const handleAddNewSubTask = (parentId: string) => {
        setIsAddingSubTask(parentId);
    }
    
    const cancelAddSubTask = () => {
        setIsAddingSubTask(null);
    }


    const handleLogTime = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const hoursToAdd = Number(formData.get('hours'));
        const userId = formData.get('userId') as string;

        if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
            toast({ title: "Valor inválido", description: "Por favor, insira um número de horas válido.", variant: "destructive" });
            return;
        }
        if (!userId) {
            toast({ title: "Responsável necessário", description: "Selecione quem está registrando as horas.", variant: "destructive" });
            return;
        }

        const newLog: LoggedTime = { userId, hours: hoursToAdd, date: Timestamp.now() };

        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.map(t => {
                if (t.id === timeLogData.taskId) {
                    const newTimeLogs = [...(t.timeLogs || []), newLog];
                    return { ...t, timeLogs: newTimeLogs };
                }
                return t;
            })
        }));

        await updateDoc(projectDocRef, { sections: updatedSections });
        toast({ title: "Horas Registradas!", description: `${hoursToAdd}h adicionadas à tarefa.` });
        setIsTimeLogDialogOpen(false);
    };


    const filteredSections = useMemo(() => {
        if (!project || !project.sections) return [];
        let sections = project.sections;

        if (filters.responsibleId || filters.deadline) {
             sections = sections?.map(section => {
                const filteredTasks = (section.tasks || []).filter(task => {
                    const responsibleMatch = !filters.responsibleId || (task.responsibleIds || []).includes(filters.responsibleId);
                    const deadlineMatch = !filters.deadline || (task.deadline && format(task.deadline.toDate(), 'yyyy-MM-dd') === format(filters.deadline, 'yyyy-MM-dd'));
                    return responsibleMatch && deadlineMatch;
                });
                return { ...section, tasks: filteredTasks };
            }).filter(section => section.tasks.length > 0);
        }

        return sections.map(section => ({
            ...section,
            tasks: (section.tasks || []).filter(t => !t.parentId).sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)),
        }));

    }, [project, filters]);

    if (isLoading) {
        return (
             <div className="space-y-6">
                 <Skeleton className="h-10 w-40" />
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-56 w-full" />
                    </div>
                </div>
                 <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!project) {
        return <div className="text-center">Projeto não encontrado.</div>;
    }
    
    const progress = calculateProgress();
    const isCompleted = progress === 100;
    
    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push(`/clients/${clientId}/projects`)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Projetos
            </Button>

            {project.deadline && (
                 <Card className="w-full bg-primary/10 border-primary/20 text-foreground">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-lg"><Timer/> TEMPO RESTANTE</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Countdown deadline={project.deadline.toDate()} />
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-3xl flex items-center gap-2">
                                        {isCompleted && <CheckCircle2 className="h-8 w-8 text-green-500" />}
                                        {project.name}
                                    </CardTitle>
                                    <CardDescription>Escopo: {project.scope}</CardDescription>
                                </div>
                                <div className="text-right">
                                   <p className="text-lg font-bold">{isValuesVisible ? formatCurrency(project.value) : 'R$ ******'}</p>
                                   <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>{project.status}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Label className="text-xs">Progresso</Label>
                            <div className="flex items-center gap-2">
                                <Progress value={progress} />
                                <span className="text-sm font-medium">{progress}%</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filtros</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Responsável</Label>
                                <Select onValueChange={(value) => setFilters(f => ({...f, responsibleId: value === 'all' ? '' : value}))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por responsável..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="flex-1 space-y-2">
                                <Label>Data de Entrega</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.deadline && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.deadline ? format(filters.deadline, "PPP") : <span>Escolha uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={filters.deadline as Date | undefined}
                                        onSelect={(date) => setFilters(f => ({...f, deadline: date || null}))}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex items-end">
                                <Button variant="ghost" onClick={() => setFilters({ responsibleId: '', deadline: null })}>Limpar Filtros</Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><BarChart2 /> Análise Financeira</div>
                                <Button variant="ghost" size="icon" onClick={() => setIsValuesVisible(!isValuesVisible)}>
                                    {isValuesVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">Valor do Projeto</span>
                                <span className="font-bold text-green-400">{isValuesVisible ? formatCurrency(project.value) : 'R$ ******'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">Custo Real</span>
                                <span className="font-bold text-red-400">{isValuesVisible ? formatCurrency(projectAnalysis.realCost) : 'R$ ******'}</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">Horas Registradas</span>
                                <span className="font-bold">{projectAnalysis.totalLoggedHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md border border-primary/20">
                                <span className="font-medium text-sm">Margem de Lucro</span>
                                <span className={cn("font-bold text-lg", projectAnalysis.profitMargin >= 0 ? "text-primary" : "text-destructive")}>
                                    {isValuesVisible ? formatCurrency(projectAnalysis.profitMargin) : 'R$ ******'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Adicionar nova seção..." 
                        value={newSectionTitle} 
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <Button onClick={handleAddSection}><PlusCircle/> Adicionar Seção</Button>
                </div>
            </div>
            
            <Accordion type="multiple" className="w-full space-y-4" defaultValue={project.sections?.map(s => s.id)}>
                {(project.sections || []).map(section => (
                     <AccordionItem value={section.id} key={section.id} className="border-b-0">
                        <Card>
                            <div className="flex items-center w-full p-4 hover:bg-secondary/5 rounded-t-lg">
                                <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                                    {editingSection?.id === section.id ? (
                                        <div className="flex-1 flex gap-2 items-center">
                                            <Input value={editingSection.title} onChange={(e) => setEditingSection({...editingSection, title: e.target.value})} className="h-9" onKeyDown={(e) => e.key === 'Enter' && handleUpdateSectionTitle()}/>
                                            <Button size="icon" className="h-9 w-9" onClick={handleUpdateSectionTitle}><Check/></Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingSection(null)}><X/></Button>
                                        </div>
                                    ) : (
                                        <h3 className="font-headline text-lg flex items-center gap-2"><GripVertical className="cursor-grab"/>{section.title}</h3>
                                    )}
                                </AccordionTrigger>
                                <div className="flex items-center pl-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditingSection({id: section.id, title: section.title})}}><Pencil className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Excluir Seção?</AlertDialogTitle></AlertDialogHeader>
                                            <AlertDialogDescription>Isso removerá a seção e todas as suas tarefas. Essa ação não pode ser desfeita.</AlertDialogDescription>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSection(section.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <AccordionContent className="p-4 pt-0 space-y-2">
                                {(section.tasks || []).filter(t => !t.parentId).sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)).map(task => (
                                    <TaskItem 
                                        key={task.id} 
                                        task={task} 
                                        sectionId={section.id}
                                        allTasks={section.tasks}
                                        level={0}
                                        users={users}
                                        onToggle={handleToggleTask}
                                        onDelete={handleDeleteTask}
                                        onEdit={setEditingTask}
                                        onLogTime={handleOpenTimeLogDialog}
                                        onAddSubTask={handleAddNewSubTask}
                                        isAddingSubTask={isAddingSubTask}
                                        newTask={newTask}
                                        setNewTask={setNewTask}
                                        handleAddTask={handleAddTask}
                                        cancelAddSubTask={cancelAddSubTask}
                                    />
                                ))}

                                {isAddingSubTask === null && (
                                    <AddNewTaskInput 
                                        sectionId={section.id}
                                        newTask={newTask}
                                        setNewTask={setNewTask}
                                        users={users}
                                        handleAddTask={handleAddTask}
                                    />
                                )}
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
            </Accordion>


            <Dialog open={isTimeLogDialogOpen} onOpenChange={setIsTimeLogDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Horas na Tarefa</DialogTitle>
                        <DialogDescription>Adicione as horas trabalhadas nesta tarefa. O valor será somado às horas existentes.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogTime} className="space-y-4">
                        <div>
                            <Label htmlFor="hours">Horas a adicionar</Label>
                            <Input id="hours" name="hours" type="number" step="0.5" placeholder="Ex: 1.5" required />
                        </div>
                        <div>
                            <Label htmlFor="userId">Membro da Equipe</Label>
                            <Select name="userId" required>
                                <SelectTrigger><SelectValue placeholder="Selecione o membro da equipe..." /></SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit">Registrar Horas</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <Dialog open={!!editingTask} onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Tarefa</DialogTitle>
                    </DialogHeader>
                     <form onSubmit={handleUpdateTask} className="space-y-4">
                        <div>
                            <Label htmlFor="task-text">Texto da Tarefa</Label>
                            <Input id="task-text" name="text" defaultValue={editingTask?.text} required />
                        </div>
                        <div>
                            <Label htmlFor="task-description">Descrição/Comentário (Opcional)</Label>
                            <Textarea id="task-description" name="description" defaultValue={editingTask?.description} rows={4} placeholder="Adicione detalhes, links ou qualquer informação extra sobre a tarefa aqui." />
                        </div>
                        <div>
                            <Label>Responsáveis</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {(editingTask?.responsibleIds || []).length > 0
                                            ? `${(editingTask?.responsibleIds || []).length} selecionado(s)`
                                            : "Selecione..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Procurar membro..." />
                                        <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                                        <CommandGroup><CommandList>
                                                {users.map((user) => (
                                                    <CommandItem key={user.id} onSelect={() => {
                                                        setEditingTask(prev => {
                                                            if (!prev) return null;
                                                            const currentIds = prev.responsibleIds || [];
                                                            const newIds = currentIds.includes(user.id) ? currentIds.filter(id => id !== user.id) : [...currentIds, user.id];
                                                            return {...prev, responsibleIds: newIds};
                                                        })
                                                    }}>
                                                        <Check className={cn("mr-2 h-4 w-4", (editingTask?.responsibleIds || []).includes(user.id) ? "opacity-100" : "opacity-0")}/>
                                                        {user.name}
                                                    </CommandItem>
                                                ))}
                                        </CommandList></CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                             {/* Hidden inputs to submit responsibleIds array */}
                            {(editingTask?.responsibleIds || []).map(id => <input key={id} type="hidden" name="responsibleIds" value={id} />)}
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor="task-deadline">Prazo</Label>
                                <Input id="task-deadline" name="deadline" type="date" defaultValue={editingTask?.deadline ? format(editingTask.deadline.toDate(), 'yyyy-MM-dd') : ''} />
                            </div>
                             <div>
                                <Label htmlFor="task-priority">Prioridade</Label>
                                <Select name="priority" defaultValue={editingTask?.priority || 'Média'}>
                                    <SelectTrigger id="task-priority"><SelectValue/></SelectTrigger>
                                    <SelectContent><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Baixa">Baixa</SelectItem></SelectContent>
                                </Select>
                            </div>
                         </div>
                         <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit">Salvar Alterações</Button>
                         </DialogFooter>
                     </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
