'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runAdsCreator } from '@/app/actions';
import { CLIENT_CONTEXT_DATA } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Newspaper, Target, Milestone, Wallet, Lightbulb } from 'lucide-react';
import type { AdsIACreatorOutput } from '@/ai/flows/ads-ia-creator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export default function AdsCreatorPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [formData, setFormData] = useState({
        advertisingGoal: '',
        productOrService: '',
        targetAudience: '',
    });
    const [result, setResult] = useState<AdsIACreatorOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const clientContextData = CLIENT_CONTEXT_DATA[clientId] || {};
    const clientContext = Object.entries(clientContextData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.advertisingGoal || !formData.productOrService || !formData.targetAudience) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Todos os campos são necessários para criar a campanha.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setResult(null);

        try {
            const response = await runAdsCreator({ clientContext, ...formData });
            setResult(response);
        } catch (error) {
            toast({
                title: 'Erro ao Criar Campanha',
                description: 'Não foi possível gerar a estrutura da campanha. Tente novamente.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline">Ads IA Creator</CardTitle>
                    <CardDescription>
                        Crie uma campanha de anúncios completa com a ajuda da IA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="productOrService">Produto/Serviço a Anunciar</Label>
                            <Input id="productOrService" value={formData.productOrService} onChange={handleChange} placeholder="Ex: Novo tênis de corrida 'Speedster'" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="advertisingGoal">Objetivo da Publicidade</Label>
                            <Input id="advertisingGoal" value={formData.advertisingGoal} onChange={handleChange} placeholder="Ex: Vender o novo tênis" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetAudience">Público-alvo Detalhado</Label>
                            <Textarea id="targetAudience" value={formData.targetAudience} onChange={handleChange} placeholder="Ex: Corredores amadores, 25-40 anos, interessados em maratonas" rows={3} />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Campanha...</> : <><Wand2 className="w-4 h-4 mr-2" /> Gerar Estrutura de Campanha</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="lg:col-span-2">
                {isLoading && (
                    <Card className="flex flex-col items-center justify-center h-96">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="mt-4 text-lg text-muted-foreground">A IA está montando sua campanha...</p>
                    </Card>
                )}
                {result && (
                    <Card className="animate-in fade-in-50">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Milestone /> Estrutura da Campanha: {result.campaignStructure.campaignName}</CardTitle>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Badge variant="secondary" className="flex items-center gap-2"><Wallet className="w-4 h-4"/> Orçamento Sugerido: R$ {result.budgetSuggestion.toFixed(2)}</Badge>
                                <Badge variant="secondary" className="flex items-center gap-2"><Lightbulb className="w-4 h-4"/> Alocação: {result.budgetAllocation}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {result.campaignStructure.adSets.map((adSet, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger className="font-semibold text-base font-headline">
                                            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary"/>Conjunto: {adSet.adSetName}</div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-6 space-y-4">
                                            <p><span className="font-semibold">Direcionamento:</span> {adSet.targeting}</p>
                                            <p><span className="font-semibold">Orçamento do Conjunto:</span> R$ {adSet.budget.toFixed(2)}</p>
                                            <h4 className="font-semibold text-md mt-4">Criativos:</h4>
                                            <div className="space-y-4">
                                            {adSet.creatives.map((creative, cIndex) => (
                                                <div key={cIndex} className="p-3 border rounded-lg bg-secondary/50">
                                                    <h5 className="font-semibold flex items-center gap-2"><Newspaper className="w-4 h-4" />{creative.creativeName}</h5>
                                                    <p className="text-sm mt-2"><span className="font-semibold">Copy:</span> {creative.copy}</p>
                                                    <p className="text-sm mt-1"><span className="font-semibold">Descrição Visual:</span> {creative.description}</p>
                                                </div>
                                            ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
