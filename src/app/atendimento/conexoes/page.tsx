
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Server, AlertTriangle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runCreateEvolutionInstance, runFetchEvolutionInstances, runGetEvolutionInstanceQR } from '@/app/actions';
import type { EvolutionInstance } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

export default function ConexoesPage() {
    const { toast } = useToast();
    const [instances, setInstances] = useState<EvolutionInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [qrInstanceName, setQrInstanceName] = useState('');
    const [isQrLoading, setIsQrLoading] = useState(false);

    const fetchInstances = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await runFetchEvolutionInstances();
            setInstances(Array.isArray(result) ? result : []);
        } catch (error) {
            toast({
                title: 'Erro ao buscar instâncias',
                description: (error as Error).message,
                variant: 'destructive',
            });
            setInstances([]); 
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    const handleCreateInstance = async () => {
        if (!newInstanceName) {
            toast({ title: 'Nome da instância é obrigatório', variant: 'destructive' });
            return;
        }
        setIsCreating(true);
        try {
            const response = await runCreateEvolutionInstance({ instanceName: newInstanceName });
            toast({ title: 'Instância Criada!', description: `A instância "${newInstanceName}" foi criada. Gere o QR Code para conectar.` });
            setNewInstanceName('');
            await fetchInstances(); 
            // Automatically open QR code dialog for the new instance if QR code is available
            if (response.qrcode?.base64) {
                 handleGetQRCode(response.instance.instanceName);
            }
        } catch (error) {
            toast({
                title: 'Erro ao criar instância',
                description: (error as Error).message,
                variant: 'destructive',
            });
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleGetQRCode = async (instanceName: string) => {
        setQrInstanceName(instanceName);
        setIsQrDialogOpen(true);
        setIsQrLoading(true);
        setQrCode(''); 
        try {
            const result = await runGetEvolutionInstanceQR(instanceName);
            if (result.base64) {
                setQrCode(result.base64.startsWith('data:image') ? result.base64 : `data:image/png;base64,${result.base64}`);
            } else {
                 toast({ title: 'QR Code não recebido', description: 'A instância já pode estar conectada ou houve um erro.', variant: 'destructive' });
                 setIsQrDialogOpen(false);
            }
        } catch (error) {
            toast({ title: 'Erro ao gerar QR Code', description: (error as Error).message, variant: 'destructive' });
            setIsQrDialogOpen(false);
        } finally {
            setIsQrLoading(false);
        }
    };

    const getStatusVariant = (status: EvolutionInstance['connectionStatus']) => {
        switch (status) {
            case 'open':
            case 'connected': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'connecting': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'close': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'secondary';
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Criar Nova Conexão</CardTitle>
                    <CardDescription>Adicione um novo número de WhatsApp criando uma instância na Evolution API.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="instanceName" className="sr-only">Nome da Instância</Label>
                        <Input 
                            id="instanceName" 
                            value={newInstanceName}
                            onChange={(e) => setNewInstanceName(e.target.value)}
                            placeholder="Ex: whatsapp-vendas"
                        />
                    </div>
                    <Button onClick={handleCreateInstance} disabled={isCreating}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Criar Instância
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Conexões Ativas</CardTitle>
                    <CardDescription>Gerencie suas conexões com o WhatsApp.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : instances.length === 0 ? (
                        <div className="text-center py-10">
                            <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-sm font-medium">Nenhuma instância encontrada</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Crie sua primeira instância para começar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {instances.filter(instance => instance && instance.name).map((instance) => (
                                <Card key={instance.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">{instance.name}</CardTitle>
                                            <Badge className={cn(getStatusVariant(instance.connectionStatus))}>{instance.connectionStatus}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button 
                                            className="w-full"
                                            onClick={() => handleGetQRCode(instance.name)}
                                            disabled={instance.connectionStatus === 'connected' || instance.connectionStatus === 'open'}
                                        >
                                            <QrCode className="mr-2 h-4 w-4"/>
                                            Conectar / QR Code
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conectar Instância: {qrInstanceName}</DialogTitle>
                        <DialogDescription>Escaneie o QR Code com o seu WhatsApp para conectar.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4 min-h-[256px]">
                        {isQrLoading ? (
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        ) : qrCode ? (
                            <Image src={qrCode} alt="QR Code" width={256} height={256} />
                        ) : (
                             <div className="text-center text-muted-foreground">
                                <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-2" />
                                <p>Não foi possível carregar o QR Code.</p>
                                <p className="text-xs">A instância pode já estar conectada ou ocorreu um erro.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
