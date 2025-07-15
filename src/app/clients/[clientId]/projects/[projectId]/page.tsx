
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Loader2, Trash2, GripVertical, Check, X, Pencil, CheckCircle2, ArrowLeft, CalendarIcon, Filter, User, Clock, DollarSign, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp } from 'firebase/firestore';
import type { Project, ProjectSection, Task, User as AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { clientId, projectId } = params;
    const { toast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newTask, setNewTask] = useState<{ [key: string]: { text: string; responsible: string, deadline?: Date } }>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    
    const [users, setUsers] = useState<AppUser[]>([]);
    const [filters, setFilters] = useState({ responsible: '', deadline: null as Date | null });
    
    // Time tracking state
    const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
    const [timeLogData, setTimeLogData] = useState<{ taskId: string; currentHours: number }>({ taskId: '', currentHours: 0 });


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
        if (!project) return { totalLoggedHours: 0, profitMargin: 0 };
        const totalLoggedHours = project.sections?.reduce((acc, section) => {
            return acc + (section.tasks || []).reduce((taskAcc, task) => taskAcc + (task.loggedHours || 0), 0);
        }, 0) || 0;
        
        const profitMargin = project.value - (project.cost || 0);

        return { totalLoggedHours, profitMargin };
    }, [project]);


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
    
    const handleDeleteSection = async (section: ProjectSection) => {
        const updatedSections = project?.sections?.filter(s => s.id !== section.id);
        await updateDoc(projectDocRef, { sections: updatedSections });
        toast({ title: "Seção Removida!", variant: "destructive"});
    };

    const handleAddTask = async (sectionId: string) => {
        const taskInput = newTask[sectionId];
        if (!taskInput || !taskInput.text.trim()) return;
        const task: Task = {
            id: `task_${Date.now()}`,
            text: taskInput.text.trim(),
            responsible: taskInput.responsible.trim(),
            completed: false,
            loggedHours: 0,
            ...(taskInput.deadline && { deadline: Timestamp.fromDate(taskInput.deadline) })
        };
        
        const updatedSections = project?.sections?.map(s => {
            if (s.id === sectionId) {
                return { ...s, tasks: [...(s.tasks || []), task] };
            }
            return s;
        });

        await updateDoc(projectDocRef, { sections: updatedSections });
        setNewTask(prev => ({ ...prev, [sectionId]: { text: "", responsible: "" }}));
    };
    
    const handleToggleTask = async (taskId: string, completed: boolean) => {
        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.map(t => t.id === taskId ? { ...t, completed } : t)
        }));
         await updateDoc(projectDocRef, { sections: updatedSections });
    };

    const handleUpdateTaskText = async (taskId: string) => {
        if (!editingText) return;
        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.map(t => t.id === taskId ? { ...t, text: editingText } : t)
        }));
        await updateDoc(projectDocRef, { sections: updatedSections });
        setEditingItemId(null);
        setEditingText("");
    };

    const handleDeleteTask = async (taskId: string) => {
        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.filter(t => t.id !== taskId)
        }));
        await updateDoc(projectDocRef, { sections: updatedSections });
    };
    
    const handleOpenTimeLogDialog = (taskId: string, currentHours: number) => {
        setTimeLogData({ taskId, currentHours });
        setIsTimeLogDialogOpen(true);
    };

    const handleLogTime = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const hoursToAdd = Number(formData.get('hours'));

        if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
            toast({ title: "Valor inválido", description: "Por favor, insira um número de horas válido.", variant: "destructive" });
            return;
        }

        const updatedSections = project?.sections?.map(s => ({
            ...s,
            tasks: s.tasks.map(t => t.id === timeLogData.taskId ? { ...t, loggedHours: (t.loggedHours || 0) + hoursToAdd } : t)
        }));

        await updateDoc(projectDocRef, { sections: updatedSections });
        toast({ title: "Horas Registradas!", description: `${hoursToAdd}h adicionadas à tarefa.` });
        setIsTimeLogDialogOpen(false);
    };


    const filteredSections = useMemo(() => {
        if (!project || !project.sections) return [];
        if (!filters.responsible && !filters.deadline) {
            return project.sections;
        }
        return project.sections?.map(section => {
            const filteredTasks = (section.tasks || []).filter(task => {
                const responsibleMatch = !filters.responsible || task.responsible === filters.responsible;
                const deadlineMatch = !filters.deadline || (task.deadline && format(task.deadline.toDate(), 'yyyy-MM-dd') === format(filters.deadline, 'yyyy-MM-dd'));
                return responsibleMatch && deadlineMatch;
            });
            return { ...section, tasks: filteredTasks };
        }).filter(section => section.tasks.length > 0);
    }, [project, filters]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
                                   <p className="text-lg font-bold">R$ {project.value.toFixed(2)}</p>
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
                                <Select onValueChange={(value) => setFilters(f => ({...f, responsible: value === 'all' ? '' : value}))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por responsável..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
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
                                <Button variant="ghost" onClick={() => setFilters({ responsible: '', deadline: null })}>Limpar Filtros</Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart2 />Análise Financeira</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">Valor do Projeto</span>
                                <span className="font-bold text-green-400">R$ {project.value.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">Custo Estimado</span>
                                <span className="font-bold text-red-400">R$ {(project.cost || 0).toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                <span className="font-medium text-sm">Horas Registradas</span>
                                <span className="font-bold">{projectAnalysis.totalLoggedHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md border border-primary/20">
                                <span className="font-medium text-sm">Margem de Lucro</span>
                                <span className={cn("font-bold text-lg", projectAnalysis.profitMargin >= 0 ? "text-primary" : "text-destructive")}>
                                    R$ {projectAnalysis.profitMargin.toFixed(2)}
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

            <div className="space-y-6">
                {filteredSections.map(section => (
                    <Card key={section.id}>
                        <CardHeader className="flex flex-row justify-between items-center bg-secondary/30 p-4">
                            <h3 className="font-headline text-lg flex items-center gap-2"><GripVertical className="cursor-grab"/>{section.title}</h3>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Excluir Seção?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogDescription>Isso removerá a seção e todas as suas tarefas. Essa ação não pode ser desfeita.</AlertDialogDescription>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteSection(section)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {(section.tasks || []).map(task => (
                                <div key={task.id} className="flex items-center gap-2 group p-2 rounded-md hover:bg-secondary/20">
                                    <Checkbox 
                                        id={task.id} 
                                        checked={task.completed} 
                                        onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)} 
                                    />
                                    {editingItemId === task.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-8"/>
                                            <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateTaskText(task.id)}><Check className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingItemId(null)}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <label htmlFor={task.id} className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.text}
                                        </label>
                                    )}
                                    <div className="flex items-center gap-2 ml-auto">
                                        {task.responsible && <Badge variant="outline" className="hidden sm:flex items-center gap-1"><User size={12}/>{task.responsible}</Badge>}
                                        {task.deadline && (
                                            <Badge variant="outline" className={cn("hidden sm:flex items-center gap-1", new Date(task.deadline.toDate()) < new Date() && !task.completed ? 'text-red-400 border-red-400/50' : '')}>
                                                <CalendarIcon size={12}/>{format(task.deadline.toDate(), 'dd/MM/yy')}
                                            </Badge>
                                        )}
                                        {(task.loggedHours || 0) > 0 && <Badge variant="secondary" className="flex items-center gap-1"><Clock size={12}/>{task.loggedHours}h</Badge>}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenTimeLogDialog(task.id, task.loggedHours || 0)}><Clock className="h-3 w-3"/></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {setEditingItemId(task.id); setEditingText(task.text)}}><Pencil className="h-3 w-3"/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-3 w-3"/></Button>
                                                </AlertDialogTrigger>
                                                 <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 pt-4 flex-wrap">
                                <Input 
                                    placeholder="Adicionar nova tarefa..." 
                                    className="h-9 flex-1 min-w-[200px]"
                                    value={newTask[section.id]?.text || ""}
                                    onChange={(e) => setNewTask(prev => ({...prev, [section.id]: {...(prev[section.id] || {responsible: ''}), text: e.target.value}}))}
                                />
                                <Select onValueChange={(value) => setNewTask(prev => ({...prev, [section.id]: {...(prev[section.id] || {text: ''}), responsible: value}}))} value={newTask[section.id]?.responsible || ''}>
                                    <SelectTrigger className="h-9 w-[180px]">
                                        <SelectValue placeholder="Responsável..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "h-9 w-[180px] justify-start text-left font-normal",
                                            !newTask[section.id]?.deadline && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newTask[section.id]?.deadline ? format(newTask[section.id].deadline, "PPP") : <span>Prazo</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={newTask[section.id]?.deadline}
                                        onSelect={(date) => setNewTask(prev => ({...prev, [section.id]: {...(prev[section.id] || {text: '', responsible: ''}), deadline: date as Date}}))}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button size="sm" onClick={() => handleAddTask(section.id)}>Adicionar</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
                        <DialogFooter>
                             <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit">Registrar Horas</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
