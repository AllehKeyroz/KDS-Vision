
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, PlusCircle, Trash2, Save, Loader2, KeyRound, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { collection, addDoc, onSnapshot, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClientAccess } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const agencyAccessCollectionRef = collection(db, 'agency', 'internal', 'access');
const apiKeysCollectionRef = doc(db, 'agency', 'internal', 'api_keys', 'outscraper');

export default function AgencyAccessPage() {
    const { toast } = useToast();

    const [accessList, setAccessList] = useState<ClientAccess[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingAccess, setIsSavingAccess] = useState(false);
    const [isSavingApiKey, setIsSavingApiKey] = useState(false);
    const [accessFormData, setAccessFormData] = useState({ platform: '', link: '', login: '', password_plain: '', apiKey: '' });
    const [outscraperApiKey, setOutscraperApiKey] = useState('');

    useEffect(() => {
        setIsLoading(true);
        const unsubscribeAccess = onSnapshot(agencyAccessCollectionRef, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClientAccess[];
            setAccessList(data);
        }, (error) => {
            console.error("Error fetching agency access data:", error);
            toast({
                title: "Erro ao carregar acessos",
                description: "Não foi possível buscar os dados de acesso da agência.",
                variant: "destructive"
            });
        });
        
        const fetchApiKey = async () => {
             const docSnap = await getDoc(apiKeysCollectionRef);
             if (docSnap.exists()) {
                 setOutscraperApiKey(docSnap.data().key || '');
             }
             setIsLoading(false);
        };
        
        fetchApiKey();

        return () => {
            unsubscribeAccess();
        };
    }, [toast]);

    const handleCopy = (text: string, fieldName: string) => {
        if (!text) {
             toast({
                title: 'Campo vazio',
                description: `Não há ${fieldName} para copiar.`,
                variant: 'destructive'
            });
            return;
        }
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copiado!',
            description: `O ${fieldName} foi copiado para a área de transferência.`,
        });
    }

    const handleAccessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAccessFormData({ ...accessFormData, [e.target.id]: e.target.value });
    }

    const handleAccessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessFormData.platform || !accessFormData.login || !accessFormData.password_plain) {
            toast({ title: "Campos obrigatórios", description: "Plataforma, login e senha são obrigatórios.", variant: "destructive" });
            return;
        }
        setIsSavingAccess(true);
        try {
            await addDoc(agencyAccessCollectionRef, accessFormData);
            toast({ title: "Acesso Salvo!", description: "As informações foram salvas com sucesso." });
            setAccessFormData({ platform: '', link: '', login: '', password_plain: '', apiKey: '' });
        } catch (error) {
            console.error("Error saving access data:", error);
            toast({ title: "Erro ao salvar", description: "Não foi possível salvar os dados de acesso.", variant: "destructive" });
        } finally {
            setIsSavingAccess(false);
        }
    }
    
    const handleDelete = async (accessId: string) => {
        try {
            const docRef = doc(db, 'agency', 'internal', 'access', accessId);
            await deleteDoc(docRef);
            toast({ title: "Acesso Removido!", description: "O acesso foi removido com sucesso." });
        } catch (error) {
            console.error("Error deleting access data:", error);
            toast({ title: "Erro ao remover", description: "Não foi possível remover o acesso.", variant: "destructive" });
        }
    }

    const handleApiKeySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingApiKey(true);
        try {
            await setDoc(apiKeysCollectionRef, { key: outscraperApiKey });
            toast({ title: "Chave de API Salva!", description: "Sua chave da Outscraper foi salva com sucesso." });
        } catch (error) {
            console.error("Error saving API key:", error);
            toast({ title: "Erro ao salvar chave", variant: "destructive" });
        } finally {
            setIsSavingApiKey(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Chaves de API</CardTitle>
                    <CardDescription>Gerencie as chaves de API para integrações de terceiros.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleApiKeySubmit} className="space-y-4">
                         <div className="space-y-1">
                            <Label htmlFor="outscraperApiKey">Outscraper API Key</Label>
                            <div className="flex gap-2">
                                <Input id="outscraperApiKey" type="password" placeholder="Cole sua chave de API aqui" value={outscraperApiKey} onChange={(e) => setOutscraperApiKey(e.target.value)} />
                                <Button type="submit" variant="secondary" disabled={isSavingApiKey}>
                                    {isSavingApiKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Salvar Chave
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Acessos Internos da Agência</CardTitle>
                    <CardDescription>Guarde aqui os acessos a plataformas e ferramentas da própria agência.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleAccessSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="platform">Plataforma</Label>
                                <Input id="platform" placeholder="Ex: Conta de Hospedagem" value={accessFormData.platform} onChange={handleAccessChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="link">Link</Label>
                                <Input id="link" placeholder="Ex: https://painel.hospedagem.com" value={accessFormData.link} onChange={handleAccessChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="login">Login</Label>
                                <Input id="login" placeholder="Ex: login@agencia.com" value={accessFormData.login} onChange={handleAccessChange}/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password_plain">Senha</Label>
                                <Input id="password_plain" type="password" placeholder="Ex: Senha de acesso" value={accessFormData.password_plain} onChange={handleAccessChange}/>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="apiKey">Chave de API / Outras Infos</Label>
                            <Input id="apiKey" placeholder="Ex: Chave de API ou observação importante" value={accessFormData.apiKey} onChange={handleAccessChange}/>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" variant="secondary" className="font-bold tracking-wide" disabled={isSavingAccess}>
                                {isSavingAccess ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Salvar Acesso
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plataforma</TableHead>
                            <TableHead>Login</TableHead>
                            <TableHead>Senha</TableHead>
                            <TableHead>Chave / Info</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : accessList.length > 0 ? accessList.map(access => (
                            <TableRow key={access.id}>
                                <TableCell className="font-medium">
                                    <a href={access.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                        {access.platform}
                                    </a>
                                </TableCell>
                                <TableCell>{access.login}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(access.password_plain, 'senha')}>
                                        <Copy className="mr-2 h-3 w-3" />
                                        Copiar Senha
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(access.apiKey, 'Chave API')}>
                                        <KeyRound className="mr-2 h-3 w-3" />
                                        Copiar Chave
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o acesso
                                            e removerá os dados de nossos servidores.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(access.id)}>Continuar</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum acesso interno cadastrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
}
