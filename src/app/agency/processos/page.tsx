
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, Trash2, CheckSquare, X, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { ProcessoTemplate, ProcessoItem } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const suggestedTemplates = [
    {
        title: "Onboarding de Novo Cliente",
        items: [
            { text: "Contrato assinado e arquivado" },
            { text: "Pagamento inicial confirmado" },
            { text: "Reunião de Kick-off agendada" },
            { text: "Acessos necessários solicitados (redes sociais, site, etc.)" },
            { text: "Questionário de Briefing enviado ao cliente" },
            { text: "Criação do grupo de comunicação (WhatsApp, Slack, etc.)" },
            { text: "Apresentação da equipe responsável ao cliente" },
        ],
    },
    {
        title: "Análise de Concorrentes",
        items: [
            { text: "Identificar 3-5 concorrentes diretos" },
            { text: "Analisar presença nas redes sociais (conteúdo, frequência, engajamento)" },
            { text: "Analisar site e blog (palavras-chave, qualidade do conteúdo)" },
            { text: "Analisar campanhas de tráfego pago (se visível)" },
            { text: "Identificar pontos fortes e fracos dos concorrentes" },
            { text: "Compilar relatório de análise competitiva" },
        ],
    },
    {
        title: "Checklist de Google Meu Negócio",
        items: [
            { text: "Reivindicar ou criar o perfil da empresa" },
            { text: "Verificar se o nome, endereço e telefone (NAP) estão corretos" },
            { text: "Selecionar categorias primárias e secundárias" },
            { text: "Adicionar horário de funcionamento" },
            { text: "Escrever descrição da empresa com SEO" },
            { text: "Fazer upload de 10 fotos de alta qualidade (logo, capa, internas, externas, equipe)" },
            { text: "Adicionar lista de produtos e serviços" },
            { text: "Configurar a ferramenta de mensagens" },
            { text: "Criar uma primeira postagem de boas-vindas" },
            { text: "Criar link para solicitar avaliações dos clientes" },
        ],
    },
    {
        title: "SEO On-Page (Básico)",
        items: [
            { text: "Pesquisa de palavra-chave principal e secundárias para a página" },
            { text: "Otimizar Título da Página (Title Tag)" },
            { text: "Otimizar Meta Descrição" },
            { text: "Usar URLs amigáveis" },
            { text: "Verificar o uso correto de Heading Tags (H1, H2, H3)" },
            { text: "Otimizar atributos 'alt' das imagens" },
            { text: "Verificar a velocidade de carregamento da página" },
            { text: "Garantir que a página seja responsiva (mobile-friendly)" },
            { text: "Adicionar links internos para outras páginas relevantes" },
        ],
    },
    {
        title: "Setup de Campanha (Tráfego Pago)",
        items: [
            { text: "Definir objetivo principal da campanha (vendas, leads, tráfego)" },
            { text: "Definir persona e público-alvo" },
            { text: "Configurar Pixel de Rastreamento/Conversão no site" },
            { text: "Criar estrutura da campanha (Campanha > Conjuntos de Anúncios > Anúncios)" },
            { text: "Definir orçamentos diários/vitalícios" },
            { text: "Criar os criativos (imagens/vídeos)" },
            { text: "Escrever as copies (títulos, descrições, CTAs)" },
            { text: "Configurar segmentação de público (interesses, demografia, etc.)" },
            { text: "Revisar e publicar a campanha" },
        ],
    },
];


export default function ProcessosPage() {
    const { toast } = useToast();

    const [templates, setTemplates] = useState<ProcessoTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    
    // States for creating a new template
    const [newTemplateTitle, setNewTemplateTitle] = useState('');
    const [newTemplateItems, setNewTemplateItems] = useState<Omit<ProcessoItem, 'completed'>[]>([]);
    const [newItemText, setNewItemText] = useState('');

    const templatesCollectionRef = useMemo(() => collection(db, 'agency', 'internal', 'processo_templates'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(templatesCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcessoTemplate));
            setTemplates(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [templatesCollectionRef]);

    const handleAddNewItem = () => {
        if (newItemText.trim()) {
            setNewTemplateItems([...newTemplateItems, { text: newItemText.trim() }]);
            setNewItemText('');
        }
    };

    const handleRemoveNewItem = (index: number) => {
        setNewTemplateItems(newTemplateItems.filter((_, i) => i !== index));
    };

    const handleSaveTemplate = async () => {
        if (!newTemplateTitle.trim() || newTemplateItems.length === 0) {
            toast({ title: "Campos obrigatórios", description: "O título do template e pelo menos um item são necessários.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(templatesCollectionRef, {
                title: newTemplateTitle,
                items: newTemplateItems,
            });
            toast({ title: "Template Salvo!", description: "O novo processo foi salvo com sucesso." });
            setNewTemplateTitle('');
            setNewTemplateItems([]);
        } catch (error) {
            console.error("Error saving template:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await deleteDoc(doc(db, 'agency', 'internal', 'processo_templates', templateId));
            toast({ title: "Template Excluído", variant: "destructive" });
        } catch (error) {
            console.error("Error deleting template:", error);
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    }

    const handleSeedTemplates = async () => {
        setIsSeeding(true);
        try {
            const batch = writeBatch(db);
            suggestedTemplates.forEach(template => {
                const docRef = doc(templatesCollectionRef);
                batch.set(docRef, template);
            });
            await batch.commit();
            toast({ title: "Processos Adicionados!", description: "Os templates sugeridos foram adicionados à sua lista." });
        } catch (error) {
             console.error("Error seeding templates:", error);
            toast({ title: "Erro ao adicionar templates", variant: "destructive" });
        } finally {
            setIsSeeding(false);
        }
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckSquare /> Criar Novo Template de Processo</CardTitle>
                    <CardDescription>Crie modelos de checklists para processos padronizados da sua agência (ex: Onboarding, SEO Básico, etc).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="templateTitle">Título do Processo</Label>
                        <Input 
                            id="templateTitle" 
                            value={newTemplateTitle} 
                            onChange={(e) => setNewTemplateTitle(e.target.value)} 
                            placeholder="Ex: Checklist de Google Meu Negócio"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Itens do Checklist</Label>
                        <div className="flex gap-2">
                             <Input 
                                value={newItemText} 
                                onChange={(e) => setNewItemText(e.target.value)}
                                placeholder="Ex: Otimizar descrição com SEO"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewItem()}
                            />
                            <Button variant="secondary" onClick={handleAddNewItem}>Adicionar Item</Button>
                        </div>
                    </div>

                    {newTemplateItems.length > 0 && (
                        <div className="p-4 border rounded-md space-y-2">
                            <h4 className="font-semibold">Itens a serem adicionados:</h4>
                            <ul className="space-y-1 list-disc list-inside">
                                {newTemplateItems.map((item, index) => (
                                    <li key={index} className="flex items-center justify-between">
                                        <span>{item.text}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveNewItem(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveTemplate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Salvar Template
                    </Button>
                </CardFooter>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Automação de Processos</CardTitle>
                     <CardDescription>Não sabe por onde começar? Adicione nossos templates de processos sugeridos com um clique.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleSeedTemplates} disabled={isSeeding}>
                        {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Adicionar Processos Sugeridos
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Templates Salvos</CardTitle>
                </CardHeader>
                <CardContent>
                     {isLoading ? <Loader2 className="animate-spin" /> : templates.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum template de processo criado ainda.</p>
                     ) : (
                        <Accordion type="multiple" className="w-full">
                            {templates.map(template => (
                                <AccordionItem value={template.id} key={template.id}>
                                    <div className="flex justify-between items-center w-full pr-4 py-2">
                                        <AccordionTrigger className="flex-1 py-0">
                                            <span className="font-semibold text-lg">{template.title}</span>
                                        </AccordionTrigger>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Excluir Template?</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogDescription>Esta ação não pode ser desfeita e removerá o template para sempre.</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <AccordionContent>
                                        <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                                            {template.items.map((item, index) => (
                                                <li key={index}>{item.text}</li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
