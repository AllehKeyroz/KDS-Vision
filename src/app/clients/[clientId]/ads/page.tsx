
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runAdsCreator } from '@/app/actions';
import { CLIENT_CONTEXT_DATA } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Newspaper, Target, Milestone, Wallet, Lightbulb, Bot, Image as ImageIcon, Save, Trash2, GalleryVerticalEnd } from 'lucide-react';
import type { AdsCampaign, AdsIACreatorOutput } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdsCreatorPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [formData, setFormData] = useState({
        productOrService: '',
        advertisingGoal: '',
        numCampaigns: 1,
        numAdSets: 1,
        numCreatives: 1,
    });
    const [generatedResult, setGeneratedResult] = useState<AdsIACreatorOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [savedCampaigns, setSavedCampaigns] = useState<AdsCampaign[]>([]);
    const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);

    const campaignsCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'ad_campaigns'), [clientId]);

    useEffect(() => {
        const unsubscribe = onSnapshot(campaignsCollectionRef, (snapshot) => {
            const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdsCampaign));
            setSavedCampaigns(campaignsData);
            setIsCampaignsLoading(false);
        });
        return () => unsubscribe();
    }, [campaignsCollectionRef]);
    
    // In a real app, this context would be fetched from Firestore. For now, we use the mock.
    const clientContextData = CLIENT_CONTEXT_DATA[clientId] || {};
    const clientContext = Object.entries(clientContextData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData({ 
            ...formData, 
            [id]: type === 'number' ? parseInt(value, 10) || 0 : value 
        });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.productOrService || !formData.advertisingGoal) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Preencha o que você quer anunciar e seu objetivo.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setGeneratedResult(null);

        try {
            const response = await runAdsCreator({ clientContext, ...formData });
            setGeneratedResult(response);
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

    const handleSaveCampaign = async () => {
        if (!generatedResult) return;
        try {
            await addDoc(campaignsCollectionRef, {
                title: formData.productOrService || 'Campanha Salva',
                request: formData,
                response: generatedResult,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Campanha Salva!", description: "A estrutura da campanha foi salva na galeria." });
            setGeneratedResult(null); // Clear the generated result after saving
        } catch (error) {
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a campanha.", variant: 'destructive' });
        }
    };
    
    const handleDeleteCampaign = async (campaignId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'ad_campaigns', campaignId));
            toast({ title: "Campanha Excluída", description: "A campanha foi removida da galeria." });
        } catch (error) {
            toast({ title: "Erro ao Excluir", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Ads IA Creator</CardTitle>
                    <CardDescription>
                        Descreva seu objetivo e deixe a IA montar a melhor estratégia de anúncios para você.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-4 p-4 border rounded-lg">
                           <h3 className="font-semibold text-lg">Briefing para a IA</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                   <Label htmlFor="productOrService">O que você quer anunciar?</Label>
                                   <Input id="productOrService" value={formData.productOrService} onChange={handleChange} placeholder="Ex: Meu curso de marketing digital" />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="advertisingGoal">Qual é o seu principal objetivo?</Label>
                                   <Input id="advertisingGoal" value={formData.advertisingGoal} onChange={handleChange} placeholder="Ex: Vender mais, conseguir mais clientes" />
                               </div>
                           </div>
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg">
                             <h3 className="font-semibold text-lg">Estrutura da Campanha</h3>
                             <CardDescription>Defina quantas variações a IA deve gerar.</CardDescription>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                     <Label htmlFor="numCampaigns">Campanhas</Label>
                                     <Input id="numCampaigns" type="number" value={formData.numCampaigns} onChange={handleChange} min="1" max="5"/>
                                 </div>
                                 <div className="space-y-2">
                                     <Label htmlFor="numAdSets">Conjuntos / Campanha</Label>
                                     <Input id="numAdSets" type="number" value={formData.numAdSets} onChange={handleChange} min="1" max="5"/>
                                 </div>
                                  <div className="space-y-2">
                                     <Label htmlFor="numCreatives">Criativos / Conjunto</Label>
                                     <Input id="numCreatives" type="number" value={formData.numCreatives} onChange={handleChange} min="1" max="5"/>
                                 </div>
                             </div>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Campanha...</> : <><Wand2 className="w-4 h-4 mr-2" /> Gerar Estrutura com IA</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {(generatedResult && !isLoading) && (
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                             <CardTitle className="font-headline">Resultado Gerado</CardTitle>
                             <CardDescription>Revise a estrutura abaixo e salve na sua galeria.</CardDescription>
                        </div>
                        <Button onClick={handleSaveCampaign}><Save className="w-4 h-4 mr-2" /> Salvar Campanha</Button>
                    </CardHeader>
                    <CardContent>
                        <GeneratedCampaignContent result={generatedResult} />
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><GalleryVerticalEnd /> Galeria de Campanhas</h2>
                {isCampaignsLoading ? <Loader2 className="animate-spin" /> :
                 savedCampaigns.length === 0 ? <p className="text-muted-foreground">Nenhuma campanha salva ainda.</p> :
                 <Accordion type="multiple" className="w-full space-y-4">
                     {savedCampaigns.map(campaign => (
                         <Card key={campaign.id}>
                           <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-xl">{campaign.title}</CardTitle>
                                    <CardDescription>Criado em: {new Date(campaign.createdAt?.toDate()).toLocaleDateString()}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteCampaign(campaign.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </CardHeader>
                             <CardContent>
                                 <GeneratedCampaignContent result={campaign.response} />
                             </CardContent>
                         </Card>
                     ))}
                 </Accordion>
                }
            </div>
        </div>
    );
}


function GeneratedCampaignContent({ result }: { result: AdsIACreatorOutput }) {
    return (
        <div className="space-y-6">
             <Card className="animate-in fade-in-50 bg-secondary/30">
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

            <Accordion type="multiple" className="w-full space-y-4">
                {result.campaigns.map((campaign, campIndex) => (
                     <Card key={campIndex} className="animate-in fade-in-50">
                        <CardHeader>
                             <CardTitle className="font-headline flex items-center gap-2 text-xl"><Milestone /> Campanha: {campaign.campaignName}</CardTitle>
                             <CardDescription>Tipo de Campanha Sugerido: <Badge variant="outline">{campaign.campaignType}</Badge></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                {campaign.adSets.map((adSet, adSetIndex) => (
                                    <AccordionItem value={`adset-${campIndex}-${adSetIndex}`} key={adSetIndex}>
                                        <AccordionTrigger className="font-semibold text-base font-headline">
                                            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary"/>Conjunto: {adSet.adSetName}</div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-6 space-y-4">
                                            <p><span className="font-semibold">Plataformas Recomendadas:</span> {adSet.platforms}</p>
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
        </div>
    );
}

