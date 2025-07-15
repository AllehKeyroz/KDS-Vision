
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ApiKeysPage() {
    const { toast } = useToast();

    const [outscraperApiKey, setOutscraperApiKey] = useState('');
    const [isSavingOutscraper, setIsSavingOutscraper] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const outscraperDocRef = doc(db, 'agency', 'internal', 'api_keys', 'outscraper');

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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound />Chaves de API</CardTitle>
                    <CardDescription>Gerencie as chaves de API para integrações de terceiros, como a Prospecção Automática.</CardDescription>
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
                            {/* Add other API key forms here in the future */}
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
