'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Loader2, Trash2, GripVertical, Check, X, Pencil, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import type { Project, ProjectSection, Task } from '@/lib/types';
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

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { clientId, projectId } = params;
    const { toast } = useToast();

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newTask, setNewTask] = useState<{ [key: string]: { text: string; responsible: string } }>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");

    const projectDocRef = useMemo(() => doc(db, 'clients', clientId as string, 'projects', projectId as string), [clientId, projectId]);

    useEffect(() => {
        const unsubscribe = onSnapshot(projectDocRef, (doc) => {
            if (doc.exists()) {
                const data = { id: doc.id, ...doc.data() } as Project;
                const totalTasks = data.sections?.flatMap(s => s.tasks || []).length || 0;
                const completedTasks = data.sections?.flatMap(s => s.tasks || []).filter(t => t.completed).length || 0;
                if (totalTasks > 0 && completedTasks === totalTasks && data.status !== 'Concluído') {
                    updateDoc(projectDocRef, { status: 'Concluído' });
                }
                setProject(data);
            } else {
                toast({ title: "Erro", description: "Projeto não encontrado.", variant: "destructive" });
                router.back();
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [projectDocRef, router, toast]);

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
        await updateDoc(projectDocRef, { sections: arrayRemove(section) });
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
                           <p className="text-sm text-muted-foreground">{project.status}</p>
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
                {project.sections?.map(section => (
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
                            {section.tasks?.map(task => (
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
                                            <span className="text-xs text-muted-foreground ml-2">({task.responsible})</span>
                                        </label>
                                    )}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {setEditingItemId(task.id); setEditingText(task.text)}}><Pencil className="h-3 w-3"/></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 pt-4">
                                <Input 
                                    placeholder="Adicionar nova tarefa..." 
                                    className="h-9"
                                    value={newTask[section.id]?.text || ""}
                                    onChange={(e) => setNewTask(prev => ({...prev, [section.id]: {...(prev[section.id] || {responsible: ''}), text: e.target.value}}))}
                                />
                                <Input 
                                    placeholder="Responsável"
                                     className="h-9 w-48"
                                    value={newTask[section.id]?.responsible || ""}
                                    onChange={(e) => setNewTask(prev => ({...prev, [section.id]: {...(prev[section.id] || {text: ''}), responsible: e.target.value}}))}
                                />
                                <Button size="sm" onClick={() => handleAddTask(section.id)}>Adicionar</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}