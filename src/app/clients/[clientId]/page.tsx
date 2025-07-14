'use client'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Save, Building2, Palette, Package, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

export default function ClientContextPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    // In a real app, you would fetch this data from Firebase and handle state updates
    // For now, we use a local state for the form fields
    const [companyInfo, setCompanyInfo] = useState({
        history: '',
        mission: '',
        vision: '',
        values: '',
        team: '',
    });
    const [branding, setBranding] = useState({
        toneOfVoice: '',
        visualIdentity: '',
        differentials: '',
    });
    const [products, setProducts] = useState({
        mainProducts: '',
        productDetails: '',
        pricing: '',
    });
    const [marketing, setMarketing] = useState({
        targetAudience: '',
        pastCampaigns: '',
        plannedInvestment: '',
        promotions: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // In a real app, you would save all this data to the client's document in Firestore
        toast({
            title: "Contexto Salvo!",
            description: "As informações do cliente foram atualizadas com sucesso.",
        });
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
                        <TabsTrigger value="company"><Building2 className="mr-2"/>Empresa</TabsTrigger>
                        <TabsTrigger value="branding"><Palette className="mr-2"/>Branding</TabsTrigger>
                        <TabsTrigger value="products"><Package className="mr-2"/>Produtos/Serviços</TabsTrigger>
                        <TabsTrigger value="marketing"><TrendingUp className="mr-2"/>Marketing</TabsTrigger>
                    </TabsList>
                    
                    <form onSubmit={handleSubmit}>
                        <TabsContent value="company" className="mt-6 space-y-6">
                            <h3 className="text-lg font-semibold">Informações da Empresa</h3>
                            <div className="space-y-2">
                                <Label htmlFor="history">História da Empresa</Label>
                                <Textarea id="history" rows={3} placeholder="Descreva brevemente a história da empresa..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mission">Missão</Label>
                                <Input id="mission" placeholder="Qual a missão da empresa?"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="vision">Visão</Label>
                                <Input id="vision" placeholder="Qual a visão de futuro?"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="values">Valores</Label>
                                <Textarea id="values" rows={2} placeholder="Liste os principais valores da empresa." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="team">Equipe Principal</Label>
                                <Textarea id="team" rows={2} placeholder="Quem são os principais pontos de contato e suas funções?" />
                            </div>
                        </TabsContent>

                        <TabsContent value="branding" className="mt-6 space-y-6">
                             <h3 className="text-lg font-semibold">Branding</h3>
                            <div className="space-y-2">
                                <Label htmlFor="toneOfVoice">Tom de Voz</Label>
                                <Textarea id="toneOfVoice" rows={3} placeholder="Descreva o tom de voz da marca (Ex: formal, amigável, divertido)." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="visualIdentity">Identidade Visual</Label>
                                <Textarea id="visualIdentity" rows={3} placeholder="Descreva as diretrizes da identidade visual (cores, fontes, etc.) ou cole links de referência." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="differentials">Diferenciais</Label>
                                <Textarea id="differentials" rows={3} placeholder="Quais são os principais diferenciais da empresa/produto no mercado?" />
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="products" className="mt-6 space-y-6">
                            <h3 className="text-lg font-semibold">Produtos & Serviços</h3>
                            <div className="space-y-2">
                                <Label htmlFor="mainProducts">Principais Produtos/Serviços</Label>
                                <Textarea id="mainProducts" rows={3} placeholder="Liste os produtos ou serviços mais importantes." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productDetails">Detalhes dos Produtos/Serviços</Label>
                                <Textarea id="productDetails" rows={5} placeholder="Forneça detalhes, características e benefícios de cada produto/serviço." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="pricing">Estratégia de Preços</Label>
                                <Textarea id="pricing" rows={2} placeholder="Como os produtos/serviços são precificados?" />
                            </div>
                        </TabsContent>

                        <TabsContent value="marketing" className="mt-6 space-y-6">
                            <h3 className="text-lg font-semibold">Marketing & Vendas</h3>
                            <div className="space-y-2">
                                <Label htmlFor="targetAudience">Público-Alvo Detalhado (ICP)</Label>
                                <Textarea id="targetAudience" rows={4} placeholder="Descreva o perfil de cliente ideal, incluindo dores, necessidades e demografia." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pastCampaigns">Campanhas Anteriores</Label>
                                <Textarea id="pastCampaigns" rows={3} placeholder="Descreva resultados de campanhas de marketing anteriores (sucessos e fracassos)." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="plannedInvestment">Investimento Planejado</Label>
                                <Input id="plannedInvestment" type="text" placeholder="Qual o orçamento disponível para marketing e anúncios?" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="promotions">Promoções e Ofertas</Label>
                                <Textarea id="promotions" rows={2} placeholder="Existem promoções ou ofertas recorrentes? Quais são as regras?" />
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
