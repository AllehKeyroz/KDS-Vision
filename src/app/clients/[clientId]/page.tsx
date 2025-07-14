'use client'
import { CLIENT_CONTEXT_DATA } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function ClientContextPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    // In a real app, you would fetch this data and handle state updates
    const context = CLIENT_CONTEXT_DATA[clientId] || { icp: '', cac: '', faq: '' };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // In a real app, you would save this data to a database
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="icp" className="font-semibold">Perfil de Cliente Ideal (ICP)</Label>
                        <Textarea id="icp" rows={5} defaultValue={context.icp} placeholder="Descreva o público-alvo, suas dores, necessidades e características demográficas..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cac" className="font-semibold">Custo de Aquisição (CAC) e Canais</Label>
                        <Textarea id="cac" rows={3} defaultValue={context.cac} placeholder="Informe o CAC médio e os principais canais de marketing utilizados..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="faq" className="font-semibold">Perguntas Frequentes (FAQ)</Label>
                        <Textarea id="faq" rows={5} defaultValue={context.faq} placeholder="Liste as perguntas mais comuns feitas pelos clientes e suas respostas..." />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Contexto
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
