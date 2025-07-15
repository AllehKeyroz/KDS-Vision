
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, Trash2, CheckSquare, List, Pencil, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { PlaybookTemplate, PlaybookItem } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function PlaybooksPage() {
    const { toast } = useToast();

    const [templates, setTemplates] = useState<PlaybookTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // States for creating a new template
    const [newTemplateTitle, setNewTemplateTitle] = useState('');
    const [newTemplateItems, setNewTemplateItems] = useState<Omit<PlaybookItem, 'completed'>[]>([]);
    const [newItemText, setNewItemText] = useState('');

    const templatesCollectionRef = useMemo(() => collection(db, 'agency', 'internal', 'playbook_templates'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(templatesCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaybookTemplate));
            setTemplates(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [templatesCollectionRef]);

    const handleAddNewItem = () => {
        if (newItemText.trim()) {
            setNewTemplateItems([...newTemplateItems, { text: newItemText.trim() }]);
            setNewItemText('');
        }
    };

    const handleRemoveNewItem = (index: number) => {
        setNewTemplateItems(newTemplateItems.filter((_, i) => i !== index));
    };

    const handleSaveTemplate = async () => {
        if (!newTemplateTitle.trim() || newTemplateItems.length === 0) {
            toast({ title: "Campos obrigatórios", description: "O título do template e pelo menos um item são necessários.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(templatesCollectionRef, {
                title: newTemplateTitle,
                items: newTemplateItems,
            });
            toast({ title: "Template Salvo!", description: "O novo playbook foi salvo com sucesso." });
            setNewTemplateTitle('');
            setNewTemplateItems([]);
        } catch (error) {
            console.error("Error saving template:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await deleteDoc(doc(db, 'agency', 'internal', 'playbook_templates', templateId));
            toast({ title: "Template Excluído", variant: "destructive" });
        } catch (error) {
            console.error("Error deleting template:", error);
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckSquare /> Criar Novo Template de Playbook</CardTitle>
                    <CardDescription>Crie modelos de checklists para processos padronizados da sua agência (ex: Onboarding, SEO Básico, etc).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="templateTitle">Título do Playbook</Label>
                        <Input 
                            id="templateTitle" 
                            value={newTemplateTitle} 
                            onChange={(e) => setNewTemplateTitle(e.target.value)} 
                            placeholder="Ex: Checklist de Google Meu Negócio"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Itens do Checklist</Label>
                        <div className="flex gap-2">
                             <Input 
                                value={newItemText} 
                                onChange={(e) => setNewItemText(e.target.value)}
                                placeholder="Ex: Otimizar descrição com SEO"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewItem()}
                            />
                            <Button variant="secondary" onClick={handleAddNewItem}>Adicionar Item</Button>
                        </div>
                    </div>

                    {newTemplateItems.length > 0 && (
                        <div className="p-4 border rounded-md space-y-2">
                            <h4 className="font-semibold">Itens a serem adicionados:</h4>
                            <ul className="space-y-1 list-disc list-inside">
                                {newTemplateItems.map((item, index) => (
                                    <li key={index} className="flex items-center justify-between">
                                        <span>{item.text}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveNewItem(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Salvar Template
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Templates Salvos</CardTitle>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Loader2 className="animate-spin" /> : templates.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum template de playbook criado ainda.</p>
                     ) : (
                        <Accordion type="multiple" className="w-full">
                            {templates.map(template => (
                                <AccordionItem value={template.id} key={template.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <span className="font-semibold text-lg">{template.title}</span>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Excluir Template?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>Esta ação não pode ser desfeita e removerá o template para sempre.</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                                            {template.items.map((item, index) => (
                                                <li key={index}>{item.text}</li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
