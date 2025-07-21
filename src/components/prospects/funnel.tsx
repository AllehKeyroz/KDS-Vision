
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { Prospect, WhatsappTemplate } from "@/lib/types";
import { PlusCircle, Loader2, MoreVertical, Edit, Trash2, Wand2, Save, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { runProspectScraper } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const STAGES: Prospect['stage'][] = ['Contato Inicial', 'Qualificado', 'Proposta Enviada', 'Follow-up', 'Negociação', 'Fechado', 'Perdido'];

type ScrapedProspect = {
    name: string;
    address: string;
    rating?: number;
    contact: string;
};

export default function ProspectsFunnel() {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProspect, setCurrentProspect] = useState<Partial<Prospect> | null>(null);
    const { toast } = useToast();

    const [isScraping, setIsScraping] = useState(false);
    const [scrapeQuery, setScrapeQuery] = useState({ niche: '', location: '', limit: 20 });
    const [scrapedResults, setScrapedResults] = useState<ScrapedProspect[]>([]);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [isScrapeResultsDialogOpen, setIsScrapeResultsDialogOpen] = useState(false);
    
    const [defaultTemplate, setDefaultTemplate] = useState<string>('Olá {prospectName}, tudo bem?');

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
        
        const templatesQuery = query(collection(db, 'agency', 'internal', 'whatsapp_templates'), where('isDefault', '==', true));
        const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
            if (!snapshot.empty) {
                const templateDoc = snapshot.docs[0].data() as WhatsappTemplate;
                setDefaultTemplate(templateDoc.message);
            }
        });
        
        return () => {
            unsubscribe();
            unsubscribeTemplates();
        };
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
        if (!scrapeQuery.niche || !scrapeQuery.location) {
            toast({ title: 'Campos obrigatórios', description: 'O nicho e a localização são necessários.', variant: 'destructive' });
            return;
        }
        setIsScraping(true);
        setScrapedResults([]);
        try {
            const combinedQuery = `${scrapeQuery.niche} em ${scrapeQuery.location}`;
            const results = await runProspectScraper({
                query: combinedQuery,
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

    const handleWhatsappClick = (prospect: Prospect) => {
        const phone = prospect.contact.replace(/\D/g, ''); // Remove non-numeric characters
        const message = defaultTemplate.replace('{prospectName}', encodeURIComponent(prospect.name));
        const url = `https://wa.me/${phone}?text=${message}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Prospecção Automática</CardTitle>
                    <CardDescription>Busque novos leads no Google Maps para iniciar o contato.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Scraper Section */}
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Buscar Prospects no Google Maps</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="niche">Nicho ou Termo de Busca</Label>
                                <Input id="niche" value={scrapeQuery.niche} onChange={e => setScrapeQuery({...scrapeQuery, niche: e.target.value})} placeholder="Ex: Restaurantes" />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="location">Localização</Label>
                                <Input id="location" value={scrapeQuery.location} onChange={e => setScrapeQuery({...scrapeQuery, location: e.target.value})} placeholder="Ex: São Paulo" />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <Label htmlFor="limit">Quantidade</Label>
                                <Input 
                                    id="limit" 
                                    type="number" 
                                    value={scrapeQuery.limit} 
                                    onChange={e => setScrapeQuery({...scrapeQuery, limit: parseInt(e.target.value) || 0})} 
                                />
                            </div>
                        </div>
                         <Button onClick={handleScrape} disabled={isScraping}>
                            {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isScraping ? 'Buscando Prospects...' : 'Buscar Prospects'}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Prospect Manualmente
                    </Button>
                </CardFooter>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => handleWhatsappClick(prospect)}>
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
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
                    <DialogHeader>
                        <DialogTitle>Resultados da Busca ({scrapedResults.length} encontrados)</DialogTitle>
                        <DialogDescription>Revise os prospects encontrados e salve na sua lista de prospecção.</DialogDescription>
                    </DialogHeader>
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
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveAllScraped} disabled={isSavingAll}>
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Salvar Todos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
