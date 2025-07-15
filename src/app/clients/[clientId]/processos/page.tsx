
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
import type { Processo, ProcessoTemplate } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';

export default function ClientProcessosPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    const [processos, setProcessos] = useState<Processo[]>([]);
    const [templates, setTemplates] = useState<ProcessoTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedTemplate, setSelectedTemplate] = useState<ProcessoTemplate | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const processosCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'processos'), [clientId]);
    const templatesCollectionRef = useMemo(() => collection(db, 'agency', 'internal', 'processo_templates'), []);

    useEffect(() => {
        const unsubscribeProcessos = onSnapshot(processosCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Processo));
            setProcessos(data);
            setIsLoading(false);
        });

        const unsubscribeTemplates = onSnapshot(templatesCollectionRef, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcessoTemplate)));
        });

        return () => {
            unsubscribeProcessos();
            unsubscribeTemplates();
        };
    }, [processosCollectionRef, templatesCollectionRef]);
    
    const handleAddProcesso = async () => {
        if (!selectedTemplate) {
            toast({ title: "Nenhum template selecionado", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const newProcesso: Omit<Processo, 'id'> = {
                templateId: selectedTemplate.id,
                title: selectedTemplate.title,
                items: selectedTemplate.items.map(item => ({ ...item, completed: false })),
                createdAt: serverTimestamp(),
            };
            await addDoc(processosCollectionRef, newProcesso);
            toast({ title: "Processo Adicionado!", description: `O processo "${selectedTemplate.title}" foi adicionado ao cliente.` });
            setSelectedTemplate(null);
            setIsPopoverOpen(false);
        } catch (error) {
            console.error("Error adding processo:", error);
            toast({ title: "Erro ao adicionar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleToggleItem = async (processoId: string, itemIndex: number, completed: boolean) => {
        const processo = processos.find(p => p.id === processoId);
        if (!processo) return;

        const updatedItems = [...processo.items];
        updatedItems[itemIndex].completed = completed;
        
        const docRef = doc(db, 'clients', clientId, 'processos', processoId);
        await updateDoc(docRef, { items: updatedItems });
    };

    const handleDeleteProcesso = async (processoId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'processos', processoId));
            toast({ title: "Processo Removido!", variant: "destructive" });
        } catch (error) {
            console.error("Error deleting processo:", error);
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    const calculateProgress = useCallback((processo: Processo) => {
        if (!processo.items || processo.items.length === 0) return 0;
        const completedCount = processo.items.filter(item => item.completed).length;
        return Math.round((completedCount / processo.items.length) * 100);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Processos do Cliente</h1>
                 <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Processo
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Adicionar Processo</h4>
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
                            <Button onClick={handleAddProcesso} disabled={!selectedTemplate || isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Adicionar ao Cliente
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {isLoading ? <Loader2 className="animate-spin" /> :
             processos.length === 0 ? (
                <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Nenhum processo adicionado</CardTitle>
                        <CardDescription>Adicione o primeiro processo para este cliente.</CardDescription>
                    </CardHeader>
                </Card>
             ) : (
                <div className="space-y-4">
                    {processos.map(processo => (
                        <Card key={processo.id}>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle>{processo.title}</CardTitle>
                                    <CardDescription>
                                        Saúde do Processo: {calculateProgress(processo)}%
                                    </CardDescription>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Excluir Processo?</AlertDialogTitle></AlertDialogHeader>
                                        <AlertDialogDescription>O progresso deste processo para o cliente será perdido.</AlertDialogDescription>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteProcesso(processo.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent>
                                <Progress value={calculateProgress(processo)} className="mb-4" />
                                <div className="space-y-2">
                                    {processo.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`${processo.id}-${index}`} 
                                                checked={item.completed}
                                                onCheckedChange={(checked) => handleToggleItem(processo.id, index, !!checked)}
                                            />
                                            <Label htmlFor={`${processo.id}-${index}`} className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
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
