
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, PlusCircle, Trash2, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

type UsefulLink = {
  id: string;
  name: string;
  url: string;
  createdAt: any;
}

const linksCollectionRef = collection(db, 'agency', 'internal', 'useful_links');

export default function UsefulLinksPage() {
    const { toast } = useToast();

    const [links, setLinks] = useState<UsefulLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', url: '' });
    
    useEffect(() => {
        setIsLoading(true);
        const q = query(linksCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UsefulLink[];
            setLinks(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching links:", error);
            toast({ title: "Erro ao carregar links", variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.url) {
            toast({ title: "Campos obrigatórios", description: "Nome e URL são obrigatórios.", variant: "destructive" });
            return;
        }
         if (!formData.url.startsWith('http')) {
            toast({ title: "URL Inválida", description: "A URL deve começar com http:// ou https://", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(linksCollectionRef, { ...formData, createdAt: serverTimestamp() });
            toast({ title: "Link Salvo!", description: "O link foi salvo com sucesso." });
            setFormData({ name: '', url: '' });
        } catch (error) {
            console.error("Error saving link:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleDelete = async (linkId: string) => {
        try {
            const docRef = doc(db, 'agency', 'internal', 'useful_links', linkId);
            await deleteDoc(docRef);
            toast({ title: "Link Removido!", description: "O link foi removido com sucesso." });
        } catch (error) {
            console.error("Error deleting link:", error);
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon /> Adicionar Novo Link Útil</CardTitle>
                    <CardDescription>Salve links importantes para a agência, como ferramentas, documentos ou referências.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">Nome do Link</Label>
                                <Input id="name" placeholder="Ex: Ferramenta de SEO" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="url">URL Completa</Label>
                                <Input id="url" placeholder="https://exemplo.com" value={formData.url} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" variant="secondary" className="font-bold tracking-wide" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Salvar Link
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Links Salvos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : links.length > 0 ? links.map(link => (
                                <TableRow key={link.id}>
                                    <TableCell className="font-medium">{link.name}</TableCell>
                                    <TableCell>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                                            {link.url} <ExternalLink className="h-3 w-3" />
                                        </a>
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
                                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o link.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(link.id)}>Continuar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        Nenhum link útil cadastrado.
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
