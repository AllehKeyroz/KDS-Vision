'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runSocialStrategist } from '@/app/actions';
import { CLIENT_CONTEXT_DATA } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Lightbulb, Loader2, List, Wand2 } from 'lucide-react';
import type { SocialStrategistIAOutput } from '@/ai/flows/social-strategist-ia';

export default function SocialStrategistPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [desiredPlatforms, setDesiredPlatforms] = useState('');
    const [contentGoals, setContentGoals] = useState('');
    const [recentPosts, setRecentPosts] = useState('');
    const [result, setResult] = useState<SocialStrategistIAOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const clientContextData = CLIENT_CONTEXT_DATA[clientId] || {};
    const clientContext = Object.entries(clientContextData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desiredPlatforms || !contentGoals) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Plataformas e objetivos são necessários.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setResult(null);

        try {
            const response = await runSocialStrategist({ clientContext, desiredPlatforms, contentGoals, recentPosts });
            setResult(response);
        } catch (error) {
            toast({
                title: 'Erro na Estratégia',
                description: 'Não foi possível gerar a estratégia. Tente novamente.',
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
                    <CardTitle className="font-headline">Social Strategist IA</CardTitle>
                    <CardDescription>
                        Gere ideias de posts e uma estratégia de conteúdo para as redes sociais do seu cliente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="platforms">Plataformas Desejadas</Label>
                            <Input id="platforms" value={desiredPlatforms} onChange={e => setDesiredPlatforms(e.target.value)} placeholder="Ex: Instagram, TikTok, LinkedIn" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goals">Objetivos do Conteúdo</Label>
                            <Input id="goals" value={contentGoals} onChange={e => setContentGoals(e.target.value)} placeholder="Ex: Aumentar reconhecimento da marca, gerar leads" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recentPosts">Posts Recentes (Opcional)</Label>
                            <Textarea id="recentPosts" value={recentPosts} onChange={e => setRecentPosts(e.target.value)} placeholder="Cole aqui exemplos de posts recentes para referência de estilo." rows={3} />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Estratégia...</>
                            ) : (
                                <><Wand2 className="w-4 h-4 mr-2" /> Gerar Estratégia Social</>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className={!result && !isLoading ? 'hidden lg:block lg:opacity-0' : ''}>
                <CardHeader>
                    <CardTitle className="font-headline">Estratégia Gerada</CardTitle>
                    <CardDescription>
                        Ideias de posts e estratégia de conteúdo para aplicar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-muted-foreground">Criando estratégia...</p>
                        </div>
                    )}
                    {result && (
                        <div className="space-y-6 animate-in fade-in-50">
                            <div>
                                <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><Lightbulb className="w-5 h-5 text-amber-500" /> Ideias de Posts</h3>
                                <ul className="space-y-2 list-disc list-inside text-sm">
                                    {result.postIdeas.map((idea, index) => (
                                        <li key={`idea-${index}`}>{idea}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-4">
                                <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><List className="w-5 h-5 text-sky-500" /> Estratégia de Conteúdo</h3>
                                <p className="text-sm">{result.contentStrategy}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
