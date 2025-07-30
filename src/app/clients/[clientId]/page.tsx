
'use client'
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Save, Building2, Palette, Package, TrendingUp, HelpCircle, PlusCircle, Trash2, Pencil, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import ClientFinancialsPage from './financials/page';

type FaqItem = {
    id: string;
    question: string;
    answer: string;
}

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
        faq: [] as FaqItem[]
    });
    
    // FAQ specific state
    const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
    const [currentFaq, setCurrentFaq] = useState<Partial<FaqItem> | null>(null);
    const [isSavingFaq, setIsSavingFaq] = useState(false);
    
    const contextDocRef = doc(db, 'clients', clientId, 'context', 'data');
    
    useEffect(() => {
        if (!clientId) return;

        const fetchContext = async () => {
            setIsLoading(true);
            const docSnap = await getDoc(contextDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setContextData({
                    company: data.company || { history: '', mission: '', vision: '', values: '', team: '' },
                    branding: data.branding || { toneOfVoice: '', visualIdentity: '', differentials: '' },
                    products: data.products || { mainProducts: '', productDetails: '', pricing: '' },
                    marketing: data.marketing || { targetAudience: '', pastCampaigns: '', plannedInvestment: '', promotions: '' },
                    faq: data.faq || []
                });
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
        try {
            await setDoc(contextDocRef, contextData, { merge: true });
            toast({
                title: "Contexto Salvo!",
                description: "As informações do cliente foram atualizadas com sucesso.",
            });
        } catch (error) {
             toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    }
    
    const handleOpenFaqDialog = (faq: Partial<FaqItem> | null) => {
        setCurrentFaq(faq);
        setIsFaqDialogOpen(true);
    };

    const handleFaqSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSavingFaq(true);
        const formData = new FormData(event.currentTarget);
        const question = formData.get('question') as string;
        const answer = formData.get('answer') as string;

        if (!question || !answer) {
            toast({ title: 'Campos obrigatórios', description: 'Pergunta e resposta são obrigatórios.', variant: 'destructive' });
            setIsSavingFaq(false);
            return;
        }

        let updatedFaqs: FaqItem[];

        if (currentFaq && currentFaq.id) {
            // Editing existing FAQ
            updatedFaqs = contextData.faq.map(item => 
                item.id === currentFaq.id ? { ...item, question, answer } : item
            );
        } else {
            // Adding new FAQ
            const newFaq: FaqItem = { id: uuidv4(), question, answer };
            updatedFaqs = [...contextData.faq, newFaq];
        }

        try {
            await setDoc(contextDocRef, { faq: updatedFaqs }, { merge: true });
            setContextData(prev => ({ ...prev, faq: updatedFaqs }));
            toast({ title: 'FAQ Salvo!', description: 'A lista de perguntas foi atualizada.' });
            setIsFaqDialogOpen(false);
            setCurrentFaq(null);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao salvar FAQ', variant: 'destructive' });
        } finally {
            setIsSavingFaq(false);
        }
    };
    
    const handleDeleteFaq = async (faqId: string) => {
        const updatedFaqs = contextData.faq.filter(item => item.id !== faqId);
        try {
            await setDoc(contextDocRef, { faq: updatedFaqs }, { merge: true });
            setContextData(prev => ({ ...prev, faq: updatedFaqs }));
            toast({ title: 'FAQ Removido!', variant: 'destructive' });
        } catch (error) {
            toast({ title: 'Erro ao remover FAQ', variant: 'destructive' });
        }
    };


    const renderLoadingState = () => (
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
    );

    return (
        <div className="space-y-6">
            <ClientFinancialsPage />
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Contexto do Cliente</CardTitle>
                    <CardDescription>
                        Centralize todas as informações cruciais do cliente para alinhar a equipe e a IA.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? renderLoadingState() : (
                        <Tabs defaultValue="company" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                                <TabsTrigger value="company" className="flex items-center gap-2"><Building2 className="h-4 w-4"/>Empresa</TabsTrigger>
                                <TabsTrigger value="branding" className="flex items-center gap-2"><Palette className="h-4 w-4"/>Branding</TabsTrigger>
                                <TabsTrigger value="products" className="flex items-center gap-2"><Package className="h-4 w-4"/>Produtos/Serviços</TabsTrigger>
                                <TabsTrigger value="marketing" className="flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Marketing</TabsTrigger>
                                <TabsTrigger value="faq" className="flex items-center gap-2"><HelpCircle className="h-4 w-4"/>FAQ</TabsTrigger>
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
                                
                                <TabsContent value="faq" className="mt-6 space-y-6">
                                     <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">Perguntas Frequentes (FAQ)</h3>
                                        <Button type="button" onClick={() => handleOpenFaqDialog(null)}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar FAQ
                                        </Button>
                                    </div>
                                    {contextData.faq.length > 0 ? (
                                        <Accordion type="multiple" className="w-full space-y-2">
                                            {contextData.faq.map((item) => (
                                                <AccordionItem value={item.id} key={item.id} className="border rounded-md px-4">
                                                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                                                        {item.question}
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <p className="text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                                                        <div className="flex justify-end gap-2 mt-4">
                                                            <Button type="button" variant="outline" size="sm" onClick={() => handleOpenFaqDialog(item)}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Editar
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button type="button" variant="destructive" size="sm">
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader><AlertDialogTitle>Excluir Pergunta?</AlertDialogTitle></AlertDialogHeader>
                                                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteFaq(item.id)}>Excluir</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma pergunta frequente adicionada ainda.</p>
                                    )}
                                </TabsContent>
                                
                                <div className="flex justify-end mt-8">
                                    <Button type="submit">
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Contexto
                                    </Button>
                                </div>
                            </form>
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentFaq?.id ? 'Editar FAQ' : 'Adicionar FAQ'}</DialogTitle>
                        <DialogDescription>Adicione uma pergunta e resposta para treinar a IA e alinhar a equipe.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFaqSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question">Pergunta</Label>
                            <Input id="question" name="question" defaultValue={currentFaq?.question || ''} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="answer">Resposta</Label>
                            <Textarea id="answer" name="answer" defaultValue={currentFaq?.answer || ''} rows={5} required />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isSavingFaq}>
                                {isSavingFaq ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
