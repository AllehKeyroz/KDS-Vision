
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGenerateReport = () => {
        if (selectedClientId) {
            router.push(`/clients/${selectedClientId}`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Central de Relatórios</h1>
                <p className="text-muted-foreground">
                    Gere relatórios de desempenho, analise a rentabilidade e extraia insights valiosos.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Relatório Geral do Cliente (360°)</CardTitle>
                    <CardDescription>
                        Selecione um cliente para visualizar seu dashboard completo, incluindo análise financeira, progresso de projetos e contexto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="w-full sm:w-80 space-y-2">
                        <Label htmlFor="client-select">Selecione o Cliente</Label>
                         <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder="Escolha um cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                ) : (
                                    clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={!selectedClientId}>
                        Ver Dashboard do Cliente
                    </Button>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>Mais Relatórios em Breve</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta área está sendo desenvolvida. Em breve, você poderá gerar mais relatórios detalhados para seus clientes e para a gestão interna da agência.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
