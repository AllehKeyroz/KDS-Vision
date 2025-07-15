
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2, KeyRound, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { runProspectScraper } from '@/app/actions';
import type { Prospect } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ScrapedProspect = {
    name: string;
    address: string;
    rating?: number;
    contact: string;
};


export default function ApiKeysPage() {
    const { toast } = useToast();

    const [outscraperApiKey, setOutscraperApiKey] = useState('');
    const [isSavingOutscraper, setIsSavingOutscraper] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isScraping, setIsScraping] = useState(false);
    const [scrapeQuery, setScrapeQuery] = useState({ query: '', location: '', limit: 20 });
    const [scrapedResults, setScrapedResults] = useState<ScrapedProspect[]>([]);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [isScrapeResultsDialogOpen, setIsScrapeResultsDialogOpen] = useState(false);

    const outscraperDocRef = doc(db, 'agency', 'internal', 'api_keys', 'outscraper');
    const prospectsCollectionRef = collection(db, 'prospects');

    useEffect(() => {
        const fetchApiKeys = async () => {
            setIsLoading(true);
            try {
                const outscraperSnap = await getDoc(outscraperDocRef);
                if (outscraperSnap.exists()) {
                    setOutscraperApiKey(outscraperSnap.data().key || '');
                }
            } catch (error) {
                console.error("Error fetching API keys:", error);
                toast({ title: "Erro ao carregar chaves", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchApiKeys();
    }, [toast]);

    const handleApiKeySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingOutscraper(true);
        try {
            await setDoc(outscraperDocRef, { key: outscraperApiKey });
            toast({ title: "Chave de API Salva!", description: "Sua chave da Outscraper foi salva com sucesso." });
        } catch (error) {
            console.error("Error saving API key:", error);
            toast({ title: "Erro ao salvar chave", variant: "destructive" });
        } finally {
            setIsSavingOutscraper(false);
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
            }
            toast({ title: 'Busca Concluída!', description: `${results.length} prospects encontrados.` });
        } catch (error) {
            console.error("Error scraping prospects:", error);
            toast({ title: "Erro na Busca", description: (error as Error).message || "Não foi possível buscar os prospects. Verifique sua chave de API e tente novamente.", variant: "destructive" });
        } finally {
            setIsScraping(false);
        }
    };

     const handleSaveAllScraped = async () => {
        if (scrapedResults.length === 0) return;
        setIsSavingAll(true);
        const promises = scrapedResults.map(prospect => {
            const newProspect: Omit<Prospect, 'id'> = {
                name: prospect.name,
                contact: prospect.contact,
                stage: 'Contato Inicial',
                createdAt: serverTimestamp(),
            };
            return addDoc(prospectsCollectionRef, newProspect);
        });

        try {
            await Promise.all(promises);
            toast({ title: 'Prospects Salvos!', description: `${scrapedResults.length} novos prospects foram adicionados à sua lista.` });
            setScrapedResults([]);
            setIsScrapeResultsDialogOpen(false);
        } catch (error) {
            console.error("Error bulk saving prospects:", error);
            toast({ title: "Erro ao Salvar", description: "Ocorreu um erro ao salvar os prospects.", variant: "destructive" });
        } finally {
            setIsSavingAll(false);
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound />Chaves de API</CardTitle>
                    <CardDescription>Gerencie as chaves de API para integrações de terceiros.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <form onSubmit={handleApiKeySubmit} className="space-y-4 max-w-lg">
                            <div className="space-y-1">
                                <Label htmlFor="outscraperApiKey">Outscraper API Key</Label>
                                <div className="flex gap-2">
                                    <Input id="outscraperApiKey" type="password" placeholder="Cole sua chave de API da Outscraper aqui" value={outscraperApiKey} onChange={(e) => setOutscraperApiKey(e.target.value)} />
                                    <Button type="submit" variant="secondary" disabled={isSavingOutscraper}>
                                        {isSavingOutscraper ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar Chave
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Prospecção Automática</CardTitle>
                    <CardDescription>Use a Outscraper API para encontrar novos leads no Google Maps.</CardDescription>
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
                        {isScraping ? 'Buscando Prospects...' : 'Buscar Prospects com Outscraper'}
                    </Button>
                </CardContent>
            </Card>

             <AlertDialog open={isScrapeResultsDialogOpen} onOpenChange={setIsScrapeResultsDialogOpen}>
                <AlertDialogContent className="max-w-4xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Resultados da Busca ({scrapedResults.length} encontrados)</AlertDialogTitle>
                        <AlertDialogDescription>
                            Revise os prospects encontrados e salve na sua lista de prospecção.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <pre className="text-xs p-4 bg-muted rounded-md">{JSON.stringify(scrapedResults, null, 2)}</pre>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Fechar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveAllScraped} disabled={isSavingAll}>
                            {isSavingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Todos
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

