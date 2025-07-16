
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prospect } from "@/lib/types";
import { PlusCircle, Loader2, MoreVertical, Edit, Trash2, Wand2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { runProspectScraper } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STAGES: Prospect['stage'][] = ['Contato Inicial', 'Qualificado', 'Proposta Enviada', 'Follow-up', 'Negociação', 'Fechado', 'Perdido'];

type ScrapedProspect = {
    name: string;
    address: string;
    rating?: number;
    contact: string;
};

export default function ProspectsPage() {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProspect, setCurrentProspect] = useState<Partial<Prospect> | null>(null);
    const { toast } = useToast();

    const [isScraping, setIsScraping] = useState(false);
    const [scrapeQuery, setScrapeQuery] = useState({ query: '', location: '', limit: 20 });
    const [scrapedResults, setScrapedResults] = useState<ScrapedProspect[]>([]);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [isScrapeResultsDialogOpen, setIsScrapeResultsDialogOpen] = useState(false);

    const prospectsCollectionRef = useMemo(() => collection(db, 'prospects'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(prospectsCollectionRef, (snapshot) => {
            const prospectsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt?.toDate ? format(data.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A',
                    nextFollowUp: data.nextFollowUp && data.nextFollowUp.toDate ? format(data.nextFollowUp.toDate(), 'yyyy-MM-dd') : undefined
                } as Prospect;
            });
            setProspects(prospectsData.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
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
        const prospectData = {
            name: formData.get('name') as string,
            contact: formData.get('contact') as string,
            stage: formData.get('stage') as Prospect['stage'],
            nextFollowUp: formData.get('nextFollowUp') ? new Date(formData.get('nextFollowUp') as string) : null,
        };

        if (!prospectData.name || !prospectData.contact || !prospectData.stage) {
            toast({ title: "Campos obrigatórios", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            if (currentProspect && currentProspect.id) {
                const docRef = doc(db, 'prospects', currentProspect.id);
                await updateDoc(docRef, prospectData);
                toast({ title: "Prospect Atualizado!", description: "O prospect foi atualizado." });
            } else {
                await addDoc(prospectsCollectionRef, { ...prospectData, createdAt: serverTimestamp() });
                toast({ title: "Prospect Adicionado!", description: "O novo prospect foi criado." });
            }
            handleCloseDialog();
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (prospectId: string) => {
        try {
            await deleteDoc(doc(db, 'prospects', prospectId));
            toast({ title: "Prospect Removido!", variant: "destructive" });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };
    
    const handleScrape = async () => {
        if (!scrapeQuery.query || !scrapeQuery.location) {
            toast({ title: 'Campos obrigatórios', description: 'Nicho e Localização são necessários para a busca.', variant: 'destructive' });
            return;
        }
        setIsScraping(true);
        setScrapedResults([]);
        try {
            const results = await runProspectScraper({
                query: `${scrapeQuery.query} em ${scrapeQuery.location}`,
                limit: scrapeQuery.limit,
            });
            setScrapedResults(results);
            if (results.length > 0) {
                 setIsScrapeResultsDialogOpen(true);
            } else {
                toast({ title: 'Nenhum resultado', description: 'A busca não retornou prospects. Tente outros termos.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: "Erro na Busca", description: (error as Error).message || "Não foi possível buscar os prospects. Verifique sua chave de API e tente novamente.", variant: "destructive" });
        } finally {
            setIsScraping(false);
        }
    };

    const handleSaveAllScraped = async () => {
        if (scrapedResults.length === 0) return;
        setIsSavingAll(true);
        const batch = writeBatch(db);
        scrapedResults.forEach(prospect => {
            const newProspect: Omit<Prospect, 'id'> = {
                name: prospect.name,
                contact: prospect.contact,
                stage: 'Contato Inicial',
                createdAt: serverTimestamp(),
            };
            const prospectRef = doc(prospectsCollectionRef);
            batch.set(prospectRef, newProspect);
        });

        try {
            await batch.commit();
            toast({ title: 'Prospects Salvos!', description: `${scrapedResults.length} novos prospects foram adicionados à sua lista.` });
            setScrapedResults([]);
            setIsScrapeResultsDialogOpen(false);
        } catch (error) {
            toast({ title: "Erro ao Salvar", variant: "destructive" });
        } finally {
            setIsSavingAll(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Funil de Prospecção</h1>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Prospect
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Prospecção Automática</CardTitle>
                    <CardDescription>Encontre novos leads no Google Maps. A chave de API pode ser configurada no Painel da Agência.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="query">Nicho / Termo de Busca</Label>
                            <Input id="query" value={scrapeQuery.query} onChange={e => setScrapeQuery({...scrapeQuery, query: e.target.value})} placeholder="Ex: Restaurantes, Advogados" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Localização</Label>
                            <Input id="location" value={scrapeQuery.location} onChange={e => setScrapeQuery({...scrapeQuery, location: e.target.value})} placeholder="Ex: São Paulo, Brasil" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit">Quantidade</Label>
                            <Input id="limit" type="number" value={scrapeQuery.limit} onChange={e => setScrapeQuery({...scrapeQuery, limit: parseInt(e.target.value, 10)})} />
                        </div>
                    </div>
                    <Button onClick={handleScrape} disabled={isScraping}>
                        {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isScraping ? 'Buscando Prospects...' : 'Buscar Prospects'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Prospects</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Etapa</TableHead>
                                <TableHead>Próximo Contato</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prospects.length > 0 ? prospects.map((prospect) => (
                                <TableRow key={prospect.id}>
                                    <TableCell className="font-medium">{prospect.name}</TableCell>
                                    <TableCell>{prospect.contact}</TableCell>
                                    <TableCell>{prospect.stage}</TableCell>
                                    <TableCell>{prospect.nextFollowUp ? new Date(prospect.nextFollowUp).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(prospect)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle></AlertDialogHeader>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(prospect.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum prospect encontrado.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentProspect?.id ? 'Editar Prospect' : 'Adicionar Novo Prospect'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label htmlFor="name">Nome do Prospect</Label><Input id="name" name="name" defaultValue={currentProspect?.name} required /></div>
                        <div><Label htmlFor="contact">Contato (Telefone/Email/Site)</Label><Input id="contact" name="contact" defaultValue={currentProspect?.contact} required /></div>
                        <div><Label htmlFor="stage">Etapa do Funil</Label>
                            <Select name="stage" defaultValue={currentProspect?.stage || 'Contato Inicial'}>
                                <SelectTrigger id="stage"><SelectValue /></SelectTrigger>
                                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor="nextFollowUp">Próximo Follow-up</Label><Input id="nextFollowUp" name="nextFollowUp" type="date" defaultValue={currentProspect?.nextFollowUp} /></div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isScrapeResultsDialogOpen} onOpenChange={setIsScrapeResultsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resultados da Busca ({scrapedResults.length} encontrados)</AlertDialogTitle>
                        <AlertDialogDescription>Revise os prospects encontrados e salve na sua lista de prospecção.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Endereço</TableHead>
                                    <TableHead>Contato</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {scrapedResults.map((prospect, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{prospect.name}</TableCell>
                                    <TableCell>{prospect.address}</TableCell>
                                    <TableCell>{prospect.contact}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Fechar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveAllScraped} disabled={isSavingAll}>
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Salvar Todos
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
