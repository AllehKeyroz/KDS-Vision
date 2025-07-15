
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Issue, User } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function IssuesPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    const [issues, setIssues] = useState<Issue[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentIssue, setCurrentIssue] = useState<Partial<Issue> | null>(null);

    const issuesCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'issues'), [clientId]);
    const usersCollectionRef = useMemo(() => collection(db, 'users'), []);

    useEffect(() => {
        const unsubscribeIssues = onSnapshot(issuesCollectionRef, (snapshot) => {
            const issuesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
            setIssues(issuesData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
            setIsLoading(false);
        });

        const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });

        return () => {
            unsubscribeIssues();
            unsubscribeUsers();
        };
    }, [issuesCollectionRef, usersCollectionRef]);

    const handleOpenDialog = (issue: Partial<Issue> | null) => {
        setCurrentIssue(issue);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setCurrentIssue(null);
        setIsDialogOpen(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        
        let issueData: Omit<Issue, 'id' | 'createdAt'> & { createdAt?: Timestamp } = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            priority: formData.get('priority') as Issue['priority'],
            status: formData.get('status') as Issue['status'],
            responsibleId: formData.get('responsibleId') as string | undefined,
        };

        if (!issueData.title || !issueData.priority || !issueData.status) {
            toast({ title: "Campos obrigatórios", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        
        if (issueData.status === 'Resolvido' && (!currentIssue || currentIssue.status !== 'Resolvido')) {
            issueData.resolvedAt = serverTimestamp() as Timestamp;
        }

        try {
            if (currentIssue && currentIssue.id) {
                const docRef = doc(db, 'clients', clientId, 'issues', currentIssue.id);
                await updateDoc(docRef, issueData);
                toast({ title: "Issue Atualizada!", description: "A pendência foi atualizada com sucesso." });
            } else {
                issueData.createdAt = serverTimestamp() as Timestamp;
                await addDoc(issuesCollectionRef, issueData);
                toast({ title: "Issue Adicionada!", description: "A nova pendência foi criada." });
            }
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving issue:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (issueId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'issues', issueId));
            toast({ title: "Issue Removida!", variant: "destructive" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    const priorityBadgeVariant = {
        'Alta': 'destructive',
        'Média': 'secondary',
        'Baixa': 'outline',
    } as const;
    
    const statusBadgeColor = {
        'Aberto': 'bg-red-500/20 text-red-400 border-red-500/30',
        'Em Andamento': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Resolvido': 'bg-green-500/20 text-green-400 border-green-500/30',
    } as const;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2"><AlertTriangle/> Central de Issues</h1>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Issue
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pendências Registradas</CardTitle>
                    <CardDescription>Gerencie problemas, bugs e outras pendências deste cliente.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Prioridade</TableHead>
                                    <TableHead>Responsável</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {issues.length > 0 ? issues.map((issue) => {
                                    const responsible = users.find(u => u.id === issue.responsibleId);
                                    return (
                                        <TableRow key={issue.id}>
                                            <TableCell className="font-medium">{issue.title}</TableCell>
                                            <TableCell><Badge className={cn(statusBadgeColor[issue.status])}>{issue.status}</Badge></TableCell>
                                            <TableCell><Badge variant={priorityBadgeVariant[issue.priority]}>{issue.priority}</Badge></TableCell>
                                            <TableCell>{responsible?.name || 'N/A'}</TableCell>
                                            <TableCell>{issue.createdAt ? format(issue.createdAt.toDate(), 'dd/MM/yyyy') : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(issue)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle></AlertDialogHeader>
                                                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(issue.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma issue registrada.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentIssue?.id ? 'Editar Issue' : 'Adicionar Nova Issue'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="title">Título</Label><Input id="title" name="title" defaultValue={currentIssue?.title} required /></div>
                        <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" name="description" defaultValue={currentIssue?.description} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="priority">Prioridade</Label>
                                <Select name="priority" defaultValue={currentIssue?.priority || 'Média'}>
                                    <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Baixa">Baixa</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Alta">Alta</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={currentIssue?.status || 'Aberto'}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Aberto">Aberto</SelectItem><SelectItem value="Em Andamento">Em Andamento</SelectItem><SelectItem value="Resolvido">Resolvido</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="responsibleId">Responsável</Label>
                            <Select name="responsibleId" defaultValue={currentIssue?.responsibleId}>
                                <SelectTrigger id="responsibleId"><SelectValue placeholder="Ninguém atribuído" /></SelectTrigger>
                                <SelectContent><SelectItem value="none">Ninguém</SelectItem>{users.map(user => (<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
