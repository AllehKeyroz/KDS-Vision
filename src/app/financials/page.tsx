
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, ArrowUpCircle, ArrowDownCircle, RefreshCcw, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import type { FinancialTransaction, Contract, Client } from '@/lib/types';
import { format, startOfMonth, subMonths, getMonth, getYear, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const financialsCollectionRef = collection(db, 'financials');
const contractsCollectionRef = collection(db, 'contracts');

export default function FinancialsPage() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog states
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState<Partial<FinancialTransaction> | null>(null);
    const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
    const [currentContract, setCurrentContract] = useState<Partial<Contract> | null>(null);

    const generateInvoices = useCallback(async (contractsToProcess: Contract[], existingTransactions: FinancialTransaction[]) => {
        const batch = writeBatch(db);
        let invoicesGenerated = 0;

        for (const contract of contractsToProcess) {
            if (contract.status !== 'active') continue;

            let monthCursor = contract.startDate.toDate();
            const now = new Date();

            while (isBefore(monthCursor, now)) {
                const year = getYear(monthCursor);
                const month = getMonth(monthCursor);
                const invoiceId = `contract_${contract.id}_${year}_${month}`;

                const invoiceExists = existingTransactions.some(t => t.invoiceId === invoiceId);

                if (!invoiceExists) {
                    const newInvoice: Omit<FinancialTransaction, 'id'> = {
                        description: `Retainer: ${contract.title} (${format(monthCursor, 'MMMM/yyyy', { locale: ptBR })})`,
                        amount: contract.amount,
                        type: 'income',
                        date: Timestamp.fromDate(startOfMonth(monthCursor)),
                        recurring: true,
                        category: 'Retainer',
                        invoiceId: invoiceId,
                        contractId: contract.id,
                        clientId: contract.clientId,
                    };
                    const newDocRef = doc(collection(db, 'financials'));
                    batch.set(newDocRef, newInvoice);
                    invoicesGenerated++;
                }

                monthCursor = startOfMonth(subMonths(monthCursor, -1)); // Go to next month
            }
        }
        
        if (invoicesGenerated > 0) {
            await batch.commit();
            toast({
              title: "Faturas Geradas",
              description: `${invoicesGenerated} faturas recorrentes foram lançadas automaticamente.`,
            });
        }
    }, [toast]);

    useEffect(() => {
        const clientsQuery = query(collection(db, 'clients'));
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        });

        const contractsQuery = query(collection(db, 'contracts'));
        const unsubscribeContracts = onSnapshot(contractsQuery, snapshot => {
             const contractsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startDate: (doc.data().startDate as Timestamp),
            } as Contract));
            setContracts(contractsData);
        });

        const financialsQuery = query(collection(db, 'financials'));
        const unsubscribeFinancials = onSnapshot(financialsQuery, (snapshot) => {
            const transactionData = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                date: doc.data().date.toDate()
             } as FinancialTransaction));
            setTransactions(transactionData.sort((a, b) => b.date.getTime() - a.date.getTime()));
            
            // Check if contracts and transactions are loaded before generating invoices
            if (contracts.length > 0) {
              generateInvoices(contracts, transactionData);
            }
            
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            setIsLoading(false);
        });
        
        return () => {
            unsubscribeClients();
            unsubscribeContracts();
            unsubscribeFinancials();
        };
    }, [contracts, generateInvoices]); // Rerun when contracts change

    const { totalBalance, mrr, chartData } = useMemo(() => {
        const balance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
        
        const recurring = contracts.reduce((acc, c) => c.status === 'active' ? acc + c.amount : acc, 0);
        
        const monthlyData: { [key: string]: { income: number, expense: number } } = {};
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

        transactions.forEach(t => {
          if (t.date >= sixMonthsAgo) {
            const monthKey = format(t.date, 'yyyy-MM');
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
              monthlyData[monthKey].income += t.amount;
            } else {
              monthlyData[monthKey].expense += t.amount;
            }
          }
        });

        const finalChartData = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            const monthKey = format(date, 'yyyy-MM');
            return {
                name: format(date, 'MMM/yy', { locale: ptBR }),
                Receita: monthlyData[monthKey]?.income || 0,
                Despesa: monthlyData[monthKey]?.expense || 0,
            };
        });

        return { totalBalance: balance, mrr: recurring, chartData: finalChartData };
    }, [transactions, contracts]);
    
    // --- Transaction Handlers ---
    const handleOpenTransactionDialog = (transaction: Partial<FinancialTransaction> | null) => {
        setCurrentTransaction(transaction);
        setIsTransactionDialogOpen(true);
    };
    const handleCloseTransactionDialog = () => setIsTransactionDialogOpen(false);
    
    const handleTransactionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
            toast({ title: "Campos obrigatórios", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentTransaction && currentTransaction.id) {
                await updateDoc(doc(db, 'financials', currentTransaction.id), transactionData);
                toast({ title: "Transação Atualizada!" });
            } else {
                await addDoc(financialsCollectionRef, transactionData);
                toast({ title: "Transação Adicionada!" });
            }
            handleCloseTransactionDialog();
        } catch (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); }
        finally { setIsSaving(false); }
    };

    const handleTransactionDelete = async (transactionId: string) => {
        try {
            await deleteDoc(doc(db, 'financials', transactionId));
            toast({ title: "Transação Removida!", variant: "destructive" });
        } catch (error) { toast({ title: "Erro ao remover", variant: "destructive" }); }
    };
    
    // --- Contract Handlers ---
    const handleOpenContractDialog = (contract: Partial<Contract> | null) => {
        setCurrentContract(contract);
        setIsContractDialogOpen(true);
    };
    const handleCloseContractDialog = () => setIsContractDialogOpen(false);
    
    const handleContractSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const clientInfo = (formData.get('clientId') as string).split('|');
        
        const contractData = {
            clientId: clientInfo[0],
            clientName: clientInfo[1],
            title: formData.get('title') as string,
            amount: Number(formData.get('amount')),
            status: formData.get('status') as Contract['status'],
            startDate: Timestamp.fromDate(new Date(formData.get('date') as string)),
        };

        if (!contractData.clientId || !contractData.title || isNaN(contractData.amount)) {
            toast({ title: "Campos obrigatórios", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentContract && currentContract.id) {
                await updateDoc(doc(db, 'contracts', currentContract.id), contractData);
                toast({ title: "Contrato Atualizado!" });
            } else {
                await addDoc(contractsCollectionRef, { ...contractData, createdAt: serverTimestamp() });
                toast({ title: "Contrato Adicionado!" });
            }
            handleCloseContractDialog();
        } catch (error) { toast({ title: "Erro ao salvar", variant: "destructive" });}
        finally { setIsSaving(false); }
    };

    const handleContractDelete = async (contractId: string) => {
        try {
            await deleteDoc(doc(db, 'contracts', contractId));
            toast({ title: "Contrato Removido!", variant: "destructive" });
        } catch (error) { toast({ title: "Erro ao remover", variant: "destructive" }); }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gerenciamento Financeiro</h1>
                    <p className="text-muted-foreground">Controle as entradas, saídas e a saúde financeira da sua agência.</p>
                </div>
                <Button onClick={() => handleOpenTransactionDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Transação Manual
                </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Balanço Total</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className={cn("text-2xl font-bold", totalBalance >= 0 ? "text-green-500" : "text-red-500")}>R$ {totalBalance.toFixed(2)}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receita Recorrente Mensal (MRR)</CardTitle><RefreshCcw className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-primary">R$ {mrr.toFixed(2)}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receita vs. Despesas (Últimos 6 Meses)</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} /><Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}/><Legend /><Bar dataKey="Receita" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} /><Bar dataKey="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><FileText /> Contratos Recorrentes (Retainers)</CardTitle>
                        <CardDescription>Gerencie seus contratos de valor mensal.</CardDescription>
                    </div>
                    <Button variant="secondary" onClick={() => handleOpenContractDialog(null)}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Contrato</Button>
                 </CardHeader>
                 <CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                        <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Título</TableHead><TableHead>Valor Mensal</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {contracts.length > 0 ? contracts.map((c) => (
                                    <TableRow key={c.id}><TableCell className="font-medium">{c.clientName}</TableCell><TableCell>{c.title}</TableCell><TableCell className="font-bold text-primary">R$ {c.amount.toFixed(2)}</TableCell><TableCell><span className={cn("px-2 py-1 text-xs font-semibold rounded-full", c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400')}>{c.status}</span></TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent><DropdownMenuItem onClick={() => handleOpenContractDialog(c)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                    <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir Contrato?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleContractDelete(c.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                                </DropdownMenuContent></DropdownMenu>
                                        </TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum contrato encontrado.</TableCell></TableRow>}
                            </TableBody></Table>
                    )}
                 </CardContent>
            </Card>


            <Card>
                 <CardHeader><CardTitle>Histórico de Transações</CardTitle></CardHeader>
                 <CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                        <Table><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map((t) => (
                                    <TableRow key={t.id}><TableCell className="font-medium">{t.description}</TableCell><TableCell className={cn(t.type === 'income' ? 'text-green-500' : 'text-red-500')}>R$ {t.amount.toFixed(2)}</TableCell>
                                        <TableCell><span className={cn("flex items-center gap-2 text-xs font-semibold rounded-full px-2 py-1 w-fit", t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>{t.type === 'income' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}{t.type === 'income' ? 'Entrada' : 'Saída'}</span></TableCell>
                                        <TableCell>{t.date ? format(t.date, 'dd/MM/yyyy') : ''}</TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent><DropdownMenuItem onClick={() => handleOpenTransactionDialog(t)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                    <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></AlertDialogTrigger>
                                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir Transação?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleTransactionDelete(t.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                                </DropdownMenuContent></DropdownMenu>
                                        </TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma transação encontrada.</TableCell></TableRow>}
                            </TableBody></Table>
                    )}
                 </CardContent>
            </Card>

            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{currentTransaction?.id ? 'Editar Transação' : 'Adicionar Nova Transação'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleTransactionSubmit} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Input id="description" name="description" defaultValue={currentTransaction?.description} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="amount">Valor (R$)</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={currentTransaction?.amount} required /></div>
                            <div className="space-y-2"><Label htmlFor="type">Tipo</Label><Select name="type" defaultValue={currentTransaction?.type}><SelectTrigger id="type"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="income">Entrada</SelectItem><SelectItem value="expense">Saída</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="date">Data</Label><Input id="date" name="date" type="date" defaultValue={currentTransaction?.date ? format(currentTransaction.date, 'yyyy-MM-dd') : ''} required /></div>
                        <div className="flex items-center space-x-2"><Checkbox id="recurring" name="recurring" defaultChecked={currentTransaction?.recurring} disabled /><Label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Transação Recorrente (automático por contrato)</Label></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={handleCloseTransactionDialog}>Cancelar</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{currentContract?.id ? 'Editar Contrato' : 'Adicionar Novo Contrato'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleContractSubmit} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="clientId">Cliente</Label>
                            <Select name="clientId" defaultValue={currentContract?.clientId ? `${currentContract.clientId}|${currentContract.clientName}` : ''} required>
                                <SelectTrigger id="clientId"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                                <SelectContent>{clients.map(c => (<SelectItem key={c.id} value={`${c.id}|${c.name}`}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="title">Título do Contrato</Label><Input id="title" name="title" placeholder="Ex: Gestão de Mídias Sociais" defaultValue={currentContract?.title} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="amount">Valor Mensal (R$)</Label><Input id="amount" name="amount" type="number" step="0.01" defaultValue={currentContract?.amount} required /></div>
                            <div className="space-y-2"><Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={currentContract?.status || 'active'}><SelectTrigger id="status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="paused">Pausado</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="date">Data de Início</Label><Input id="date" name="date" type="date" defaultValue={currentContract?.startDate ? format(currentContract.startDate.toDate(), 'yyyy-MM-dd') : ''} required /></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={handleCloseContractDialog}>Cancelar</Button><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
