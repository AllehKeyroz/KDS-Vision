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
import { Loader2, Wand2, Newspaper, Target, Milestone, Wallet, Lightbulb, Bot, Image as ImageIcon } from 'lucide-react';
import type { AdsIACreatorOutput } from '@/ai/flows/ads-ia-creator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
            <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                <Card>
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
                 {result && (
                    <Card className="animate-in fade-in-50">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Bot /> Resumo Estratégico da IA</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="flex items-center gap-2"><Wallet className="w-4 h-4"/> Orçamento Sugerido: R$ {result.overallBudget.suggestion.toFixed(2)}</Badge>
                                <Badge variant="secondary" className="flex items-center gap-2"><Lightbulb className="w-4 h-4"/> Alocação: {result.overallBudget.allocation}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{result.summary}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="lg:col-span-2 space-y-6">
                {isLoading && (
                    <Card className="flex flex-col items-center justify-center h-96">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="mt-4 text-lg text-muted-foreground">A IA está montando sua campanha...</p>
                    </Card>
                )}
                {result && (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {result.campaigns.map((campaign, campIndex) => (
                             <Card key={campIndex} className="animate-in fade-in-50">
                                <CardHeader>
                                     <CardTitle className="font-headline flex items-center gap-2 text-xl"><Milestone /> Campanha: {campaign.campaignName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="multiple" className="w-full">
                                        {campaign.adSets.map((adSet, adSetIndex) => (
                                            <AccordionItem value={`adset-${campIndex}-${adSetIndex}`} key={adSetIndex}>
                                                <AccordionTrigger className="font-semibold text-base font-headline">
                                                    <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary"/>Conjunto: {adSet.adSetName}</div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pl-6 space-y-4">
                                                    <p><span className="font-semibold">Direcionamento:</span> {adSet.targeting}</p>
                                                    <p><span className="font-semibold">Orçamento do Conjunto:</span> R$ {adSet.budget.toFixed(2)}</p>
                                                    <h4 className="font-semibold text-md mt-4">Criativos:</h4>
                                                    <Accordion type="multiple" className="w-full space-y-2">
                                                        {adSet.creatives.map((creative, cIndex) => (
                                                            <AccordionItem value={`creative-${campIndex}-${adSetIndex}-${cIndex}`} key={cIndex} className="border p-3 rounded-lg bg-secondary/30">
                                                                <AccordionTrigger className="text-sm font-semibold p-2">
                                                                    <div className="flex items-center gap-2"><Newspaper className="w-4 h-4" />{creative.creativeName}</div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-4 px-2 space-y-3 text-xs">
                                                                    <div>
                                                                        <h6 className="font-bold">Títulos:</h6>
                                                                        <ul className="list-disc pl-5">
                                                                            {creative.titles.map((t, i) => <li key={i}>{t}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                     <div>
                                                                        <h6 className="font-bold">Descrições:</h6>
                                                                        <ul className="list-disc pl-5">
                                                                            {creative.descriptions.map((d, i) => <li key={i}>{d}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                     <div>
                                                                        <h6 className="font-bold">CTAs:</h6>
                                                                        <ul className="list-disc pl-5">
                                                                            {creative.ctas.map((c, i) => <li key={i}>{c}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="font-bold flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Ideias de Imagem/Vídeo:</h6>
                                                                        <ul className="list-disc pl-5">
                                                                            {creative.imageIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                                                                        </ul>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        ))}
                    </Accordion>
                )}
            </div>
        </div>
    );
}
