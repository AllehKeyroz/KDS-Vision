'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApiKeysPage() {
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for Outscraper
    const [outscraperKey, setOutscraperKey] = useState('');
    
    // State for Evolution API
    const [evolutionApiKey, setEvolutionApiKey] = useState('');
    const [evolutionApiUrl, setEvolutionApiUrl] = useState('');

    useEffect(() => {
        async function fetchKeys() {
            setIsLoading(true);
            try {
                // Fetch Outscraper Key
                const outscraperDocRef = doc(db, 'agency', 'internal', 'api_keys', 'outscraper');
                const outscraperDocSnap = await getDoc(outscraperDocRef);
                if (outscraperDocSnap.exists()) {
                    setOutscraperKey(outscraperDocSnap.data().key || '');
                }

                // Fetch Evolution API Credentials
                const evolutionDocRef = doc(db, 'agency', 'internal', 'api_keys', 'evolution');
                const evolutionDocSnap = await getDoc(evolutionDocRef);
                 if (evolutionDocSnap.exists()) {
                    setEvolutionApiKey(evolutionDocSnap.data().apiKey || '');
                    setEvolutionApiUrl(evolutionDocSnap.data().apiUrl || '');
                }

            } catch (error) {
                console.error("Error fetching API keys:", error);
                toast({ title: "Erro ao carregar chaves", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        fetchKeys();
    }, [toast]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save Outscraper Key
            const outscraperDocRef = doc(db, 'agency', 'internal', 'api_keys', 'outscraper');
            await setDoc(outscraperDocRef, { key: outscraperKey }, { merge: true });

            // Save Evolution API Credentials
            const evolutionDocRef = doc(db, 'agency', 'internal', 'api_keys', 'evolution');
            await setDoc(evolutionDocRef, { apiKey: evolutionApiKey, apiUrl: evolutionApiUrl }, { merge: true });

            toast({ title: "Chaves de API Salvas!", description: "Suas chaves de API foram atualizadas com sucesso." });
        } catch (error) {
            console.error("Error saving API keys:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound/> Gerenciamento de Chaves de API</CardTitle>
                    <CardDescription>Gerencie aqui as chaves de API para integrações com serviços de terceiros.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                     ) : (
                        <>
                            {/* Evolution API Card */}
                            <div className="p-4 border rounded-lg">
                                <h3 className="font-semibold text-lg">Evolution API</h3>
                                <p className="text-sm text-muted-foreground mb-4">Credenciais para integração com o WhatsApp.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="evolutionApiUrl">URL da Instância</Label>
                                        <Input id="evolutionApiUrl" placeholder="http://localhost:8080" value={evolutionApiUrl} onChange={(e) => setEvolutionApiUrl(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="evolutionApiKey">Chave de API Global (apikey)</Label>
                                        <Input id="evolutionApiKey" type="password" placeholder="Sua chave de API global" value={evolutionApiKey} onChange={(e) => setEvolutionApiKey(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Outscraper API Card */}
                            <div className="p-4 border rounded-lg">
                                 <h3 className="font-semibold text-lg">Outscraper</h3>
                                <p className="text-sm text-muted-foreground mb-4">Chave de API para prospecção de leads no Google Maps.</p>
                                <div className="max-w-md space-y-1">
                                    <Label htmlFor="outscraperKey">Chave de API da Outscraper</Label>
                                    <Input id="outscraperKey" type="password" value={outscraperKey} onChange={(e) => setOutscraperKey(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Todas as Chaves
                </Button>
            </div>
        </div>
    );
}
