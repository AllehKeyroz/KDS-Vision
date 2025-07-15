
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Loader2, Trash2, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { Playbook, PlaybookTemplate } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';

export default function ClientPlaybooksPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [templates, setTemplates] = useState<PlaybookTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const playbooksCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'playbooks'), [clientId]);
    const templatesCollectionRef = useMemo(() => collection(db, 'agency', 'internal', 'playbook_templates'), []);

    useEffect(() => {
        const unsubscribePlaybooks = onSnapshot(playbooksCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playbook));
            setPlaybooks(data);
            setIsLoading(false);
        });

        const unsubscribeTemplates = onSnapshot(templatesCollectionRef, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaybookTemplate)));
        });

        return () => {
            unsubscribePlaybooks();
            unsubscribeTemplates();
        };
    }, [playbooksCollectionRef, templatesCollectionRef]);
    
    const handleAddPlaybook = async () => {
        if (!selectedTemplate) {
            toast({ title: "Nenhum template selecionado", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const newPlaybook: Omit<Playbook, 'id'> = {
                templateId: selectedTemplate.id,
                title: selectedTemplate.title,
                items: selectedTemplate.items.map(item => ({ ...item, completed: false })),
                createdAt: serverTimestamp(),
            };
            await addDoc(playbooksCollectionRef, newPlaybook);
            toast({ title: "Playbook Adicionado!", description: `O playbook "${selectedTemplate.title}" foi adicionado ao cliente.` });
            setSelectedTemplate(null);
            setIsPopoverOpen(false);
        } catch (error) {
            console.error("Error adding playbook:", error);
            toast({ title: "Erro ao adicionar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleToggleItem = async (playbookId: string, itemIndex: number, completed: boolean) => {
        const playbook = playbooks.find(p => p.id === playbookId);
        if (!playbook) return;

        const updatedItems = [...playbook.items];
        updatedItems[itemIndex].completed = completed;
        
        const docRef = doc(db, 'clients', clientId, 'playbooks', playbookId);
        await updateDoc(docRef, { items: updatedItems });
    };

    const handleDeletePlaybook = async (playbookId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'playbooks', playbookId));
            toast({ title: "Playbook Removido!", variant: "destructive" });
        } catch (error) {
            console.error("Error deleting playbook:", error);
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    const calculateProgress = useCallback((playbook: Playbook) => {
        if (!playbook.items || playbook.items.length === 0) return 0;
        const completedCount = playbook.items.filter(item => item.completed).length;
        return Math.round((completedCount / playbook.items.length) * 100);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Playbooks do Cliente</h1>
                 <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Playbook
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Adicionar Playbook</h4>
                                <p className="text-sm text-muted-foreground">
                                    Selecione um template para adicionar ao cliente.
                                </p>
                            </div>
                            <div className="grid gap-2">
                               {templates.length > 0 ? templates.map(template => (
                                    <button 
                                        key={template.id} 
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`text-left p-2 rounded-md border ${selectedTemplate?.id === template.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}
                                    >
                                        {template.title}
                                    </button>
                               )) : <p className="text-sm text-muted-foreground">Nenhum template encontrado. Crie um no Painel da Agência.</p>}
                            </div>
                            <Button onClick={handleAddPlaybook} disabled={!selectedTemplate || isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Adicionar ao Cliente
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {isLoading ? <Loader2 className="animate-spin" /> :
             playbooks.length === 0 ? (
                <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Nenhum playbook adicionado</CardTitle>
                        <CardDescription>Adicione o primeiro playbook de processo para este cliente.</CardDescription>
                    </CardHeader>
                </Card>
             ) : (
                <div className="space-y-4">
                    {playbooks.map(playbook => (
                        <Card key={playbook.id}>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle>{playbook.title}</CardTitle>
                                    <CardDescription>
                                        Saúde do Playbook: {calculateProgress(playbook)}%
                                    </CardDescription>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Excluir Playbook?</AlertDialogTitle></AlertDialogHeader>
                                        <AlertDialogDescription>O progresso deste playbook para o cliente será perdido.</AlertDialogDescription>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeletePlaybook(playbook.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent>
                                <Progress value={calculateProgress(playbook)} className="mb-4" />
                                <div className="space-y-2">
                                    {playbook.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`${playbook.id}-${index}`} 
                                                checked={item.completed}
                                                onCheckedChange={(checked) => handleToggleItem(playbook.id, index, !!checked)}
                                            />
                                            <Label htmlFor={`${playbook.id}-${index}`} className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                {item.text}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
