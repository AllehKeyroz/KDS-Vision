
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Project, ProjectSection, Task } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from '@/lib/utils';

export default function ProjectsPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);

    const projectsCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'projects'), [clientId]);

    useEffect(() => {
        const unsubscribe = onSnapshot(projectsCollectionRef, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(projectsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [projectsCollectionRef]);

    const handleOpenDialog = (project: Partial<Project> | null) => {
        setCurrentProject(project);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setCurrentProject(null);
        setIsDialogOpen(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const projectData = {
            name: formData.get('name') as string,
            scope: formData.get('scope') as string,
            value: Number(formData.get('value')),
            cost: Number(formData.get('cost') || 0),
            status: formData.get('status') as Project['status'],
        };

        if (!projectData.name || !projectData.scope || isNaN(projectData.value)) {
            toast({ title: "Campos obrigatórios", description: "Nome, escopo e valor são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentProject && currentProject.id) {
                const docRef = doc(db, 'clients', clientId, 'projects', currentProject.id);
                await updateDoc(docRef, projectData);
                toast({ title: "Projeto Atualizado!", description: "O projeto foi atualizado com sucesso." });
            } else {
                await addDoc(projectsCollectionRef, { ...projectData, createdAt: serverTimestamp(), sections: [] });
                toast({ title: "Projeto Adicionado!", description: "O novo projeto foi criado." });
            }
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving project:", error);
            toast({ title: "Erro ao salvar", description: "Não foi possível salvar o projeto.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (projectId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'projects', projectId));
            toast({ title: "Projeto Removido!", description: "O projeto foi removido com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao remover", description: "Não foi possível remover o projeto.", variant: "destructive" });
        }
    };

    const calculateProgress = useCallback((project: Project): number => {
        const sections = project.sections || [];
        const allTasks = sections.flatMap(s => s.tasks || []);
        if (allTasks.length === 0) return 0;

        const completedTasks = allTasks.filter(t => t.completed).length;
        return Math.round((completedTasks / allTasks.length) * 100);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Gestão de Projetos</h1>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Projeto
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : projects.length === 0 ? (
                <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Nenhum projeto encontrado</CardTitle>
                        <CardDescription>Adicione o primeiro projeto para este cliente.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map(project => {
                       const progress = calculateProgress(project);
                       const isCompleted = progress === 100;
                        return (
                        <Card key={project.id} className={`cursor-pointer hover:border-primary transition-all ${isCompleted ? 'border-green-500/50' : ''}`} onClick={() => router.push(`/clients/${clientId}/projects/${project.id}`)}>
                             <CardHeader>
                                <div className="flex justify-between items-start">
                                     <CardTitle className="max-w-[90%] flex items-center gap-2">{isCompleted && <CheckCircle2 className="text-green-500"/>}{project.name}</CardTitle>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={() => handleOpenDialog(project)}>
                                          <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription>Valor: {formatCurrency(project.value)}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs">Escopo</Label>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{project.scope}</p>
                                </div>
                                <div>
                                    <Label className="text-xs">Status</Label>
                                    <p className="text-sm font-semibold">{isCompleted ? 'Concluído' : project.status}</p>
                                </div>
                                <div>
                                    <Label className="text-xs">Progresso</Label>
                                    <div className="flex items-center gap-2">
                                        <Progress value={progress} className="w-full" />
                                        <span className="text-sm font-medium">{progress}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )})}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentProject?.id ? 'Editar Projeto' : 'Adicionar Novo Projeto'}</DialogTitle>
                        <DialogDescription>
                            Preencha as informações abaixo para gerenciar o projeto.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Projeto</Label>
                            <Input id="name" name="name" defaultValue={currentProject?.name} required />
                        </div>
                        <div>
                            <Label htmlFor="scope">Escopo</Label>
                            <Textarea id="scope" name="scope" defaultValue={currentProject?.scope} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="value">Valor (R$)</Label>
                                <Input id="value" name="value" type="number" step="0.01" defaultValue={currentProject?.value} required />
                            </div>
                            <div>
                                <Label htmlFor="cost">Custo Estimado (R$)</Label>
                                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={currentProject?.cost || ''} placeholder="Opcional" />
                            </div>
                        </div>
                         <div className="grid grid-cols-1">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={currentProject?.status || 'Planejamento'}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Planejamento">Planejamento</SelectItem>
                                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                        <SelectItem value="Pausado">Pausado</SelectItem>
                                        <SelectItem value="Concluído">Concluído</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
