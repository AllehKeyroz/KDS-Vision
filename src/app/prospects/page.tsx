
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Prospect } from "@/lib/types";
import { PlusCircle, Loader2, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
            const prospectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
            setProspects(prospectsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [prospectsCollectionRef]);

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
        const prospectData: Omit<Prospect, 'id' | 'createdAt'> = {
            name: formData.get('name') as string,
            contact: formData.get('contact') as string,
            stage: formData.get('stage') as Prospect['stage'],
            nextFollowUp: formData.get('nextFollowUp') as string,
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

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Prospecção</h1>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Prospect
                </Button>
            </div>

            <section>
                <Card>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Prospect</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Etapa</TableHead>
                                    <TableHead>Próximo Follow-up</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prospects.length > 0 ? prospects.map((prospect) => (
                                    <TableRow key={prospect.id}>
                                        <TableCell className="font-medium">{prospect.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{prospect.contact}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
                                                {prospect.stage}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{prospect.nextFollowUp ? new Date(prospect.nextFollowUp).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(prospect)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                          </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle></AlertDialogHeader>
                                                            <AlertDialogDescription>Esta ação não pode ser desfeita e removerá o prospect permanentemente.</AlertDialogDescription>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(prospect.id)}>Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Nenhum prospect cadastrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </section>
            
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
                            <Label htmlFor="contact">Nome do Contato</Label>
                            <Input id="contact" name="contact" defaultValue={currentProspect?.contact} required />
                        </div>
                         <div>
                            <Label htmlFor="stage">Etapa do Funil</Label>
                            <Select name="stage" defaultValue={currentProspect?.stage}>
                                <SelectTrigger id="stage">
                                    <SelectValue placeholder="Selecione a etapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Contato Inicial">Contato Inicial</SelectItem>
                                    <SelectItem value="Qualificado">Qualificado</SelectItem>
                                    <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                                    <SelectItem value="Negociação">Negociação</SelectItem>
                                    <SelectItem value="Fechado">Fechado</SelectItem>
                                    <SelectItem value="Perdido">Perdido</SelectItem>
                                </SelectContent>
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
