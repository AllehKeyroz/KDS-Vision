'use client'
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Save, Building2, Palette, Package, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientContextPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [contextData, setContextData] = useState({
        company: { history: '', mission: '', vision: '', values: '', team: '' },
        branding: { toneOfVoice: '', visualIdentity: '', differentials: '' },
        products: { mainProducts: '', productDetails: '', pricing: '' },
        marketing: { targetAudience: '', pastCampaigns: '', plannedInvestment: '', promotions: '' },
    });
    
    useEffect(() => {
        if (!clientId) return;
        const docRef = doc(db, 'clients', clientId, 'context', 'data');
        const fetchContext = async () => {
            setIsLoading(true);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setContextData(docSnap.data() as any);
            }
            setIsLoading(false);
        }
        fetchContext();
    }, [clientId]);

    const handleChange = (tab: string, field: string, value: string) => {
        setContextData(prev => ({
            ...prev,
            [tab]: {
                // @ts-ignore
                ...prev[tab],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const docRef = doc(db, 'clients', clientId, 'context', 'data');
        try {
            await setDoc(docRef, contextData, { merge: true });
            toast({
                title: "Contexto Salvo!",
                description: "As informações do cliente foram atualizadas com sucesso.",
            });
        } catch (error) {
             toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    }

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full mb-6" />
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Contexto do Cliente</CardTitle>
                <CardDescription>
                    Centralize todas as informações cruciais do cliente para alinhar a equipe e a IA.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="company" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="company" className="flex items-center gap-2"><Building2 className="h-4 w-4"/>Empresa</TabsTrigger>
                        <TabsTrigger value="branding" className="flex items-center gap-2"><Palette className="h-4 w-4"/>Branding</TabsTrigger>
                        <TabsTrigger value="products" className="flex items-center gap-2"><Package className="h-4 w-4"/>Produtos/Serviços</TabsTrigger>
                        <TabsTrigger value="marketing" className="flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Marketing</TabsTrigger>
                    </TabsList>
                    
                    <form onSubmit={handleSubmit}>
                        <TabsContent value="company" className="mt-6 space-y-6">
                            <h3 className="text-lg font-semibold">Informações da Empresa</h3>
                            <div className="space-y-2">
                                <Label htmlFor="history">História da Empresa</Label>
                                <Textarea id="history" value={contextData.company.history} onChange={e => handleChange('company', 'history', e.target.value)} rows={3} placeholder="Descreva brevemente a história da empresa..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mission">Missão</Label>
                                <Input id="mission" value={contextData.company.mission} onChange={e => handleChange('company', 'mission', e.target.value)} placeholder="Qual a missão da empresa?"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="vision">Visão</Label>
                                <Input id="vision" value={contextData.company.vision} onChange={e => handleChange('company', 'vision', e.target.value)} placeholder="Qual a visão de futuro?"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="values">Valores</Label>
                                <Textarea id="values" value={contextData.company.values} onChange={e => handleChange('company', 'values', e.target.value)} rows={2} placeholder="Liste os principais valores da empresa." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="team">Equipe Principal</Label>
                                <Textarea id="team" value={contextData.company.team} onChange={e => handleChange('company', 'team', e.target.value)} rows={2} placeholder="Quem são os principais pontos de contato e suas funções?" />
                            </div>
                        </TabsContent>

                        <TabsContent value="branding" className="mt-6 space-y-6">
                             <h3 className="text-lg font-semibold">Branding</h3>
                            <div className="space-y-2">
                                <Label htmlFor="toneOfVoice">Tom de Voz</Label>
                                <Textarea id="toneOfVoice" value={contextData.branding.toneOfVoice} onChange={e => handleChange('branding', 'toneOfVoice', e.target.value)} rows={3} placeholder="Descreva o tom de voz da marca (Ex: formal, amigável, divertido)." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="visualIdentity">Identidade Visual</Label>
                                <Textarea id="visualIdentity" value={contextData.branding.visualIdentity} onChange={e => handleChange('branding', 'visualIdentity', e.target.value)} rows={3} placeholder="Descreva as diretrizes da identidade visual (cores, fontes, etc.) ou cole links de referência." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="differentials">Diferenciais</Label>
                                <Textarea id="differentials" value={contextData.branding.differentials} onChange={e => handleChange('branding', 'differentials', e.target.value)} rows={3} placeholder="Quais são os principais diferenciais da empresa/produto no mercado?" />
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="products" className="mt-6 space-y-6">
                            <h3 className="text-lg font-semibold">Produtos & Serviços</h3>
                            <div className="space-y-2">
                                <Label htmlFor="mainProducts">Principais Produtos/Serviços</Label>
                                <Textarea id="mainProducts" value={contextData.products.mainProducts} onChange={e => handleChange('products', 'mainProducts', e.target.value)} rows={3} placeholder="Liste os produtos ou serviços mais importantes." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productDetails">Detalhes dos Produtos/Serviços</Label>
                                <Textarea id="productDetails" value={contextData.products.productDetails} onChange={e => handleChange('products', 'productDetails', e.target.value)} rows={5} placeholder="Forneça detalhes, características e benefícios de cada produto/serviço." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="pricing">Estratégia de Preços</Label>
                                <Textarea id="pricing" value={contextData.products.pricing} onChange={e => handleChange('products', 'pricing', e.target.value)} rows={2} placeholder="Como os produtos/serviços são precificados?" />
                            </div>
                        </TabsContent>

                        <TabsContent value="marketing" className="mt-6 space-y-6">
                            <h3 className="text-lg font-semibold">Marketing & Vendas</h3>
                            <div className="space-y-2">
                                <Label htmlFor="targetAudience">Público-Alvo Detalhado (ICP)</Label>
                                <Textarea id="targetAudience" value={contextData.marketing.targetAudience} onChange={e => handleChange('marketing', 'targetAudience', e.target.value)} rows={4} placeholder="Descreva o perfil de cliente ideal, incluindo dores, necessidades e demografia." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pastCampaigns">Campanhas Anteriores</Label>
                                <Textarea id="pastCampaigns" value={contextData.marketing.pastCampaigns} onChange={e => handleChange('marketing', 'pastCampaigns', e.target.value)} rows={3} placeholder="Descreva resultados de campanhas de marketing anteriores (sucessos e fracassos)." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="plannedInvestment">Investimento Planejado</Label>
                                <Input id="plannedInvestment" value={contextData.marketing.plannedInvestment} onChange={e => handleChange('marketing', 'plannedInvestment', e.target.value)} type="text" placeholder="Qual o orçamento disponível para marketing e anúncios?" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="promotions">Promoções e Ofertas</Label>
                                <Textarea id="promotions" value={contextData.marketing.promotions} onChange={e => handleChange('marketing', 'promotions', e.target.value)} rows={2} placeholder="Existem promoções ou ofertas recorrentes? Quais são as regras?" />
                            </div>
                        </TabsContent>
                        
                        <div className="flex justify-end mt-8">
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Contexto
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </CardContent>
        </Card>
    );
}
