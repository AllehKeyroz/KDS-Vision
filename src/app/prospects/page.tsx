
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prospect } from "@/lib/types";
import { PlusCircle, Loader2, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

const STAGES: Prospect['stage'][] = ['Contato Inicial', 'Qualificado', 'Proposta Enviada', 'Follow-up', 'Negociação', 'Fechado', 'Perdido'];

export default function ProspectsPage() {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProspect, setCurrentProspect] = useState<Partial<Prospect> | null>(null);
    const { toast } = useToast();

    const prospectsCollectionRef = useMemo(() => collection(db, 'prospects'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(prospectsCollectionRef, (snapshot) => {
            const prospectsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    nextFollowUp: data.nextFollowUp && data.nextFollowUp.toDate ? format(data.nextFollowUp.toDate(), 'yyyy-MM-dd') : undefined
                } as Prospect;
            });
            setProspects(prospectsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [prospectsCollectionRef]);

    const prospectsByStage = useMemo(() => {
        const grouped: { [key in Prospect['stage']]?: Prospect[] } = {};
        prospects.forEach(p => {
            if (!grouped[p.stage]) {
                grouped[p.stage] = [];
            }
            grouped[p.stage]!.push(p);
        });
        return grouped;
    }, [prospects]);

    const handleOpenDialog = (prospect: Partial<Prospect> | null) => {
        setCurrentProspect(prospect);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setCurrentProspect(null);
        setIsDialogOpen(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const prospectData = {
            name: formData.get('name') as string,
            contact: formData.get('contact') as string,
            stage: formData.get('stage') as Prospect['stage'],
            nextFollowUp: formData.get('nextFollowUp') ? new Date(formData.get('nextFollowUp') as string) : null,
        };

        if (!prospectData.name || !prospectData.contact || !prospectData.stage) {
            toast({ title: "Campos obrigatórios", description: "Nome, contato e etapa são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentProspect && currentProspect.id) {
                const docRef = doc(db, 'prospects', currentProspect.id);
                await updateDoc(docRef, prospectData);
                toast({ title: "Prospect Atualizado!", description: "O prospect foi atualizado com sucesso." });
            } else {
                await addDoc(prospectsCollectionRef, { ...prospectData, createdAt: serverTimestamp() });
                toast({ title: "Prospect Adicionado!", description: "O novo prospect foi criado." });
            }
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving prospect:", error);
            toast({ title: "Erro ao salvar", description: "Não foi possível salvar o prospect.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (prospectId: string) => {
        try {
            await deleteDoc(doc(db, 'prospects', prospectId));
            toast({ title: "Prospect Removido!", description: "O prospect foi removido com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao remover", description: "Não foi possível remover o prospect.", variant: "destructive" });
        }
    };
    
    const handleStageChange = async (prospectId: string, newStage: Prospect['stage']) => {
        const prospectRef = doc(db, 'prospects', prospectId);
        try {
            await updateDoc(prospectRef, { stage: newStage });
        } catch (error) {
            console.error("Error updating prospect stage:", error);
            toast({ title: "Erro ao mover prospect", variant: "destructive" });
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Funil de Prospecção</h1>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Prospect
                </Button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map(stage => (
                    <div key={stage} className="w-72 flex-shrink-0">
                        <Card className="h-full bg-card/50">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-base">
                                    <span>{stage}</span>
                                    <span className="text-sm font-normal text-muted-foreground">{prospectsByStage[stage]?.length || 0}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {(prospectsByStage[stage] || []).map(prospect => (
                                    <Card key={prospect.id} className="p-3 bg-secondary/50">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm">{prospect.name}</p>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(prospect)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle></AlertDialogHeader><AlertDialogDescription>Esta ação não pode ser desfeita e removerá o prospect permanentemente.</AlertDialogDescription>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(prospect.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{prospect.contact}</p>
                                        {prospect.nextFollowUp && <p className="text-xs text-muted-foreground mt-1">Follow-up: {new Date(prospect.nextFollowUp).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>}
                                        <Select value={prospect.stage} onValueChange={(newStage) => handleStageChange(prospect.id, newStage as Prospect['stage'])}>
                                            <SelectTrigger className="h-7 text-xs mt-2"><SelectValue /></SelectTrigger>
                                            <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentProspect?.id ? 'Editar Prospect' : 'Adicionar Novo Prospect'}</DialogTitle>
                        <DialogDescription>
                            Preencha as informações abaixo para gerenciar o prospect.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Prospect</Label>
                            <Input id="name" name="name" defaultValue={currentProspect?.name} required />
                        </div>
                        <div>
                            <Label htmlFor="contact">Contato (Telefone/Email/Site)</Label>
                            <Input id="contact" name="contact" defaultValue={currentProspect?.contact} required />
                        </div>
                         <div>
                            <Label htmlFor="stage">Etapa do Funil</Label>
                            <Select name="stage" defaultValue={currentProspect?.stage || 'Contato Inicial'}>
                                <SelectTrigger id="stage"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="nextFollowUp">Próximo Follow-up</Label>
                            <Input id="nextFollowUp" name="nextFollowUp" type="date" defaultValue={currentProspect?.nextFollowUp} />
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

