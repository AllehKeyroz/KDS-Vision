
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { WhatsappTemplate } from "@/lib/types";
import { PlusCircle, Loader2, MoreVertical, Edit, Trash2, Save, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

export default function WhatsAppTemplates() {
    const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Partial<WhatsappTemplate> | null>(null);
    const { toast } = useToast();

    const templatesCollectionRef = useMemo(() => collection(db, 'agency', 'internal', 'whatsapp_templates'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(templatesCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as WhatsappTemplate));
            setTemplates(data.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [templatesCollectionRef]);

    const handleOpenDialog = (template: Partial<WhatsappTemplate> | null) => {
        setCurrentTemplate(template);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setCurrentTemplate(null);
        setIsDialogOpen(false);
    };
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const templateData = {
            title: formData.get('title') as string,
            message: formData.get('message') as string,
        };

        if (!templateData.title || !templateData.message) {
            toast({ title: "Campos obrigatórios", description: "Título e mensagem são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentTemplate && currentTemplate.id) {
                const docRef = doc(db, 'agency', 'internal', 'whatsapp_templates', currentTemplate.id);
                await updateDoc(docRef, templateData);
                toast({ title: "Template Atualizado!" });
            } else {
                await addDoc(templatesCollectionRef, { 
                    ...templateData, 
                    isDefault: templates.length === 0, // Set first template as default
                    createdAt: serverTimestamp() 
                });
                toast({ title: "Template Adicionado!" });
            }
            handleCloseDialog();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (templateId: string) => {
        try {
            await deleteDoc(doc(db, 'agency', 'internal', 'whatsapp_templates', templateId));
            toast({ title: "Template Removido!", variant: "destructive" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };
    
    const handleSetDefault = async (templateId: string) => {
        const batch = writeBatch(db);
        
        // Set all other templates to isDefault: false
        templates.forEach(template => {
            if (template.id !== templateId) {
                const docRef = doc(db, 'agency', 'internal', 'whatsapp_templates', template.id);
                batch.update(docRef, { isDefault: false });
            }
        });
        
        // Set the selected template to isDefault: true
        const selectedDocRef = doc(db, 'agency', 'internal', 'whatsapp_templates', templateId);
        batch.update(selectedDocRef, { isDefault: true });

        try {
            await batch.commit();
            toast({ title: "Template Padrão Definido!", description: "Este será o template usado nos atalhos." });
        } catch (error) {
            toast({ title: "Erro ao definir padrão", variant: "destructive" });
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                     <div>
                        <CardTitle className="font-headline">Templates para WhatsApp</CardTitle>
                        <CardDescription>Crie, edite e gerencie suas mensagens de primeiro contato.</CardDescription>
                    </div>
                     <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Novo Template
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.length > 0 ? templates.map(template => (
                                <Card key={template.id} className={template.isDefault ? "border-primary" : ""}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle>{template.title}</CardTitle>
                                            {template.isDefault && <CheckCircle2 className="h-5 w-5 text-primary"/>}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{template.message}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button variant="outline" size="sm" onClick={() => handleSetDefault(template.id)} disabled={template.isDefault}>
                                            Definir Padrão
                                        </Button>
                                        <div>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}><Edit className="h-4 w-4"/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Excluir Template?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(template.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardFooter>
                                </Card>
                            )) : (
                                <p className="text-muted-foreground col-span-full text-center py-8">Nenhum template encontrado. Crie o primeiro!</p>
                            )}
                         </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentTemplate?.id ? 'Editar Template' : 'Criar Novo Template'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label htmlFor="title">Título do Template</Label><Input id="title" name="title" placeholder="Ex: Contato Frio - SEO" defaultValue={currentTemplate?.title} required /></div>
                        <div><Label htmlFor="message">Mensagem</Label>
                            <Textarea id="message" name="message" rows={6} placeholder="Olá {prospectName}, ..." defaultValue={currentTemplate?.message} required />
                             <p className="text-xs text-muted-foreground pt-1">Use a variável <code className="bg-muted px-1 rounded-sm">{'{prospectName}'}</code> para inserir o nome do prospect automaticamente.</p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

