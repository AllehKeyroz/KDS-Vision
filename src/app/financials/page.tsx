
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { FinancialTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function FinancialsPage() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState<Partial<FinancialTransaction> | null>(null);

    const financialsCollectionRef = useMemo(() => collection(db, 'financials'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(financialsCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                 const docData = doc.data();
                 return { 
                    id: doc.id, 
                    ...docData,
                    date: docData.date.toDate()
                 } as FinancialTransaction
            });
            setTransactions(data.sort((a, b) => b.date.getTime() - a.date.getTime()));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [financialsCollectionRef]);

    const handleOpenDialog = (transaction: Partial<FinancialTransaction> | null) => {
        setCurrentTransaction(transaction);
        setIsDialogOpen(true);
    };
    
    const handleCloseDialog = () => {
        setCurrentTransaction(null);
        setIsDialogOpen(false);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        
        const transactionData = {
            description: formData.get('description') as string,
            amount: Number(formData.get('amount')),
            type: formData.get('type') as 'income' | 'expense',
            date: formData.get('date') ? Timestamp.fromDate(new Date(formData.get('date') as string)) : serverTimestamp(),
            recurring: formData.get('recurring') === 'on',
        };

        if (!transactionData.description || isNaN(transactionData.amount) || !transactionData.type) {
            toast({ title: "Campos obrigatórios", description: "Descrição, valor e tipo são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentTransaction && currentTransaction.id) {
                const docRef = doc(db, 'financials', currentTransaction.id);
                await updateDoc(docRef, transactionData);
                toast({ title: "Transação Atualizada!", description: "A transação foi atualizada." });
            } else {
                await addDoc(financialsCollectionRef, transactionData);
                toast({ title: "Transação Adicionada!", description: "A nova transação foi criada." });
            }
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving transaction:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (transactionId: string) => {
        try {
            await deleteDoc(doc(db, 'financials', transactionId));
            toast({ title: "Transação Removida!", variant: "destructive" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };
    
    const totalBalance = useMemo(() => {
        return transactions.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
    }, [transactions]);
    
    const mrr = useMemo(() => {
        return transactions.reduce((acc, t) => {
            return t.type === 'income' && t.recurring ? acc + t.amount : acc;
        }, 0);
    }, [transactions]);


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento Financeiro</h1>
                    <p className="text-muted-foreground">Controle as entradas, saídas e a saúde financeira da sua agência.</p>
                </div>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Transação
                </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Balanço Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", totalBalance >= 0 ? "text-green-500" : "text-red-500")}>R$ {totalBalance.toFixed(2)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Recorrente Mensal (MRR)</CardTitle>
                        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {mrr.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Histórico de Transações</CardTitle>
                 </CardHeader>
                 <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Recorrente</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.description}</TableCell>
                                        <TableCell className={cn(t.type === 'income' ? 'text-green-500' : 'text-red-500')}>R$ {t.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={cn("flex items-center gap-2 text-xs font-semibold rounded-full px-2 py-1 w-fit", t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                                                {t.type === 'income' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                                                {t.type === 'income' ? 'Entrada' : 'Saída'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{t.recurring ? "Sim" : "Não"}</TableCell>
                                        <TableCell>{format(t.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(t)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                          </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Excluir Transação?</AlertDialogTitle></AlertDialogHeader>
                                                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                             </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                     <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                 </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentTransaction?.id ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input id="description" name="description" defaultValue={currentTransaction?.description} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor (R$)</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={currentTransaction?.amount} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Select name="type" defaultValue={currentTransaction?.type}>
                                    <SelectTrigger id="type"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Entrada</SelectItem>
                                        <SelectItem value="expense">Saída</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="date">Data</Label>
                           <Input id="date" name="date" type="date" defaultValue={currentTransaction?.date ? format(currentTransaction.date, 'yyyy-MM-dd') : ''} required />
                        </div>
                        <div className="flex items-center space-x-2">
                           <Checkbox id="recurring" name="recurring" defaultChecked={currentTransaction?.recurring} />
                           <Label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                               Esta é uma transação recorrente? (MRR)
                           </Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Add imports to the top of the file as needed
import { RefreshCcw, DollarSign } from 'lucide-react';
