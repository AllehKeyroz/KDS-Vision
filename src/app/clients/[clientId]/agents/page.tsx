'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runCreateAgent } from '@/app/actions';
import { CLIENTS_DATA } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AgentsPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [agentName, setAgentName] = useState('');
    const [agentDescription, setAgentDescription] = useState('');
    const [prompt, setPrompt] = useState('');
    const [resultMessage, setResultMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const client = CLIENTS_DATA.find(c => c.id === clientId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentName || !prompt) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Nome do agente e prompt são necessários.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setResultMessage('');

        try {
            const response = await runCreateAgent({
                clientName: client?.name || 'Cliente',
                agentName,
                agentDescription,
                prompt,
            });
            setResultMessage(response.message);
            toast({
                title: 'Agente Criado!',
                description: response.message,
            });
        } catch (error) {
            toast({
                title: 'Erro ao Criar Agente',
                description: 'Não foi possível criar o agente. Tente novamente.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Gerenciamento de Agentes de IA</CardTitle>
                <CardDescription>
                    Crie e salve agentes com prompts personalizados para automatizar tarefas para este cliente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="agentName">Nome do Agente</Label>
                            <Input
                                id="agentName"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                placeholder="Ex: Analista de SEO"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agentDescription">Descrição do Agente</Label>
                            <Input
                                id="agentDescription"
                                value={agentDescription}
                                onChange={(e) => setAgentDescription(e.target.value)}
                                placeholder="Ex: Analisa textos e sugere palavras-chave"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt">Prompt do Agente</Label>
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Descreva a instrução principal para o agente. Ex: 'Você é um especialista em SEO. Analise o seguinte texto e retorne 5 sugestões de palavras-chave de cauda longa...'"
                            rows={8}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Criando Agente...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Criar e Salvar Agente
                                </>
                            )}
                        </Button>
                    </div>
                </form>
                {resultMessage && (
                    <Alert className="mt-6">
                        <Bot className="w-4 h-4" />
                        <AlertTitle>Sucesso!</AlertTitle>
                        <AlertDescription>{resultMessage}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
