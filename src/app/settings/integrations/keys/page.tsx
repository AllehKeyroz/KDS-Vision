
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
                        </div>
                     ) : (
                        <>
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
