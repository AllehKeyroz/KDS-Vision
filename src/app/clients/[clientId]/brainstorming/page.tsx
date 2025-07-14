'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runClientBrainstorming } from '@/app/actions';
import { CLIENT_CONTEXT_DATA } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, ListTodo, Loader2, Wand2 } from 'lucide-react';
import type { ClientBrainstormingOutput } from '@/ai/flows/client-brainstorming';

export default function BrainstormingPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [objective, setObjective] = useState('');
    const [result, setResult] = useState<ClientBrainstormingOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const clientContextData = CLIENT_CONTEXT_DATA[clientId] || {};
    const clientContext = Object.entries(clientContextData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective) {
            toast({
                title: 'Objetivo necessário',
                description: 'Por favor, descreva o objetivo do brainstorming.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setResult(null);

        try {
            const response = await runClientBrainstorming({ clientContext, objective });
            setResult(response);
        } catch (error) {
            toast({
                title: 'Erro no Brainstorming',
                description: 'Não foi possível gerar as ideias. Tente novamente.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Brainstorming com IA</CardTitle>
                    <CardDescription>
                        Gere ideias e tarefas para o cliente com base no seu contexto e um objetivo específico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="objective">Objetivo do Brainstorming</Label>
                            <Textarea
                                id="objective"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Ex: Aumentar o engajamento no Instagram em 20% no próximo trimestre."
                                rows={4}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando Ideias...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Gerar Ideias
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className={!result && !isLoading ? 'hidden lg:block lg:opacity-0' : ''}>
                <CardHeader>
                    <CardTitle className="font-headline">Resultados Gerados</CardTitle>
                    <CardDescription>
                        Aqui estão as ideias e tarefas sugeridas pela IA.
                    </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-muted-foreground">A IA está pensando...</p>
                        </div>
                    )}
                    {result && (
                        <div className="space-y-6 animate-in fade-in-50">
                            <div>
                                <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><Lightbulb className="w-5 h-5 text-amber-500" /> Ideias</h3>
                                <ul className="space-y-2 list-disc list-inside text-sm">
                                    {result.ideas.map((idea, index) => (
                                        <li key={`idea-${index}`}>{idea}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-4">
                                <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><ListTodo className="w-5 h-5 text-sky-500" /> Tarefas</h3>
                                <ul className="space-y-2 list-disc list-inside text-sm">
                                    {result.tasks.map((task, index) => (
                                        <li key={`task-${index}`}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
