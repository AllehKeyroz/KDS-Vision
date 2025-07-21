'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Loader2, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Proposal, Client } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, isPast } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProposalsList() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProposal, setCurrentProposal] = useState<Partial<Proposal> | null>(null);
    const { toast } = useToast();

    const proposalsCollectionRef = useMemo(() => collection(db, 'proposals'), []);
    const clientsCollectionRef = useMemo(() => collection(db, 'clients'), []);

    useEffect(() => {
        const unsubscribeProposals = onSnapshot(proposalsCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return { 
                    id: doc.id, 
                    ...docData,
                    createdAt: docData.createdAt?.toDate(),
                    validUntil: docData.validUntil?.toDate()
                } as Proposal;
            });
            setProposals(data.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));
            setIsLoading(false);
        });
        
        const unsubscribeClients = onSnapshot(clientsCollectionRef, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        });

        return () => {
            unsubscribeProposals();
            unsubscribeClients();
        };
    }, [proposalsCollectionRef, clientsCollectionRef]);

    const handleOpenDialog = (proposal: Partial<Proposal> | null) => {
        setCurrentProposal(proposal);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setCurrentProposal(null);
        setIsDialogOpen(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        
        const clientInfo = (formData.get('clientId') as string).split('|');
        const proposalData: Partial<Proposal> = {
            title: formData.get('title') as string,
            clientId: clientInfo[0],
            clientName: clientInfo[1],
            scope: formData.get('scope') as string,
            value: Number(formData.get('value')),
            status: formData.get('status') as Proposal['status'],
            validityBenefit: formData.get('validityBenefit') as string,
            validUntil: formData.get('validUntil') ? new Date(formData.get('validUntil') as string) : null,
        };

        if (!proposalData.title || !proposalData.clientId || !proposalData.scope || isNaN(proposalData.value as number)) {
            toast({ title: "Campos obrigatórios", description: "Título, cliente, escopo e valor são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentProposal && currentProposal.id) {
                const docRef = doc(db, 'proposals', currentProposal.id);
                await updateDoc(docRef, proposalData);
                toast({ title: "Proposta Atualizada!", description: "A proposta foi atualizada com sucesso." });
            } else {
                await addDoc(proposalsCollectionRef, { ...proposalData, createdAt: serverTimestamp() });
                toast({ title: "Proposta Adicionada!", description: "A nova proposta foi criada." });
            }
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving proposal:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (proposalId: string) => {
        try {
            await deleteDoc(doc(db, 'proposals', proposalId));
            toast({ title: "Proposta Removida!", description: "A proposta foi removida com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao remover", description: "Não foi possível remover a proposta.", variant: "destructive" });
        }
    };
    
    const getStatusInfo = (proposal: Proposal): { status: string; className: string } => {
        const isExpired = proposal.validUntil && isPast(proposal.validUntil);
        
        if (isExpired && (proposal.status === 'Rascunho' || proposal.status === 'Enviada')) {
            return { status: 'Expirada', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
        }
        
        const statusBadgeVariant: { [key in Proposal['status']]: string } = {
            'Rascunho': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            'Enviada': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Aceita': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Recusada': 'bg-red-500/20 text-red-400 border-red-500/30',
            'Expirada': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        };

        return { status: proposal.status, className: statusBadgeVariant[proposal.status] };
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Lista de Propostas</CardTitle>
                        <CardDescription>Crie e gerencie as propostas para seus clientes.</CardDescription>
                    </div>
                     <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Proposta
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposals.length > 0 ? proposals.map((proposal) => {
                                    const { status, className } = getStatusInfo(proposal);
                                    return (
                                    <TableRow key={proposal.id}>
                                        <TableCell className="font-medium">
                                            <div>{proposal.title}</div>
                                            {proposal.validityBenefit && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Benefício: {proposal.validityBenefit}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{proposal.clientName}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatCurrency(proposal.value)}</TableCell>
                                        <TableCell><Badge className={className}>{status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(proposal)}>
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
                                                            <AlertDialogDescription>Esta ação não pode ser desfeita e removerá a proposta permanentemente.</AlertDialogDescription>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(proposal.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )}) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Nenhuma proposta cadastrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{currentProposal?.id ? 'Editar Proposta' : 'Criar Nova Proposta'}</DialogTitle>
                        <DialogDescription>
                            Preencha as informações abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Título da Proposta</Label>
                            <Input id="title" name="title" placeholder="Ex: Proposta de Gestão de Mídias Sociais" defaultValue={currentProposal?.title} required />
                        </div>
                        <div>
                            <Label htmlFor="clientId">Cliente</Label>
                            <Select name="clientId" defaultValue={currentProposal?.clientId ? `${currentProposal.clientId}|${currentProposal.clientName}` : ''} required>
                                <SelectTrigger id="clientId"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                                <SelectContent>{clients.map(c => (<SelectItem key={c.id} value={`${c.id}|${c.name}`}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="scope">Escopo Detalhado</Label>
                            <Textarea id="scope" name="scope" rows={5} placeholder="Descreva os entregáveis da proposta..." defaultValue={currentProposal?.scope} required />
                        </div>
                        <div>
                            <Label htmlFor="validityBenefit">Benefício por Fechamento Rápido (Opcional)</Label>
                            <Input id="validityBenefit" name="validityBenefit" placeholder="Ex: Garante o bônus de 10% OFF." defaultValue={currentProposal?.validityBenefit} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="value">Valor (R$)</Label>
                                <Input id="value" name="value" type="number" step="0.01" defaultValue={currentProposal?.value} required />
                            </div>
                             <div>
                                <Label htmlFor="validUntil">Válida Até</Label>
                                <Input id="validUntil" name="validUntil" type="date" defaultValue={currentProposal?.validUntil ? format(new Date(currentProposal.validUntil), 'yyyy-MM-dd') : ''} />
                            </div>
                             <div>
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={currentProposal?.status || 'Rascunho'}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Rascunho">Rascunho</SelectItem>
                                        <SelectItem value="Enviada">Enviada</SelectItem>
                                        <SelectItem value="Aceita">Aceita</SelectItem>
                                        <SelectItem value="Recusada">Recusada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Proposta
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
