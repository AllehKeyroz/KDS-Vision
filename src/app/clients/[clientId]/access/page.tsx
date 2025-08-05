
'use client'

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, PlusCircle, Trash2, Loader2, Eye, EyeOff, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClientAccess as NewClientAccess, AccessDetail } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


// Type for old data structure for migration
type OldClientAccess = {
    id: string;
    platform: string;
    link?: string;
    login?: string;
    password_plain?: string;
    apiKey?: string;
    details?: AccessDetail[]; // New field might not exist on old data
};


const SecretValue = ({ value }: { value: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div className="relative flex-1">
            <Input 
                value={value} 
                readOnly 
                type={isVisible ? 'text' : 'password'}
                className="bg-muted text-xs h-8 pr-8" 
            />
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setIsVisible(v => !v)}
            >
                {isVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </Button>
        </div>
    );
};


export default function AccessPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    const [accessList, setAccessList] = useState<NewClientAccess[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for creating a new platform
    const [newPlatformName, setNewPlatformName] = useState('');
    const [isCreatingPlatform, setIsCreatingPlatform] = useState(false);
    
    // State for adding a new detail to a platform
    const [newDetailData, setNewDetailData] = useState<{ accessId: string; type: string; value: string; isSecret: boolean; } | null>(null);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);

    const accessCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'access'), [clientId]);

    useEffect(() => {
        if (!clientId) return;
        setIsLoading(true);
        const unsubscribe = onSnapshot(accessCollectionRef, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => {
                const docData = { id: doc.id, ...doc.data() } as OldClientAccess;
                
                // This is the migration logic
                if (!docData.details) {
                    const details: AccessDetail[] = [];
                    if (docData.link) details.push({ id: uuidv4(), type: 'Link', value: docData.link, isSecret: false });
                    if (docData.login) details.push({ id: uuidv4(), type: 'Login', value: docData.login, isSecret: false });
                    if (docData.password_plain) details.push({ id: uuidv4(), type: 'Senha', value: docData.password_plain, isSecret: true });
                    if (docData.apiKey) details.push({ id: uuidv4(), type: 'API Key', value: docData.apiKey, isSecret: true });
                    
                    return {
                        id: docData.id,
                        platform: docData.platform,
                        details: details,
                    } as NewClientAccess;
                }

                return docData as NewClientAccess;
            });
            setAccessList(data.sort((a,b) => a.platform.localeCompare(b.platform)));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching access data:", error);
            toast({
                title: "Erro ao carregar acessos",
                description: "Não foi possível buscar os dados de acesso do cliente.",
                variant: "destructive"
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [clientId, toast]);

    const handleCopy = (text: string | undefined, fieldName: string) => {
        if (!text) {
             toast({ title: 'Campo vazio', description: `Não há ${fieldName} para copiar.`, variant: 'destructive' });
            return;
        }
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado!', description: `O campo ${fieldName} foi copiado.` });
    }

    const handleCreatePlatform = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlatformName.trim()) {
            toast({ title: "Nome da plataforma é obrigatório.", variant: "destructive" });
            return;
        }
        setIsCreatingPlatform(true);
        try {
            await addDoc(accessCollectionRef, { platform: newPlatformName, details: [] });
            toast({ title: "Plataforma Adicionada!" });
            setNewPlatformName('');
        } catch (error) {
            console.error("Error saving platform:", error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setIsCreatingPlatform(false);
        }
    }
    
    const handleDeletePlatform = async (accessId: string) => {
        try {
            const docRef = doc(db, 'clients', clientId, 'access', accessId);
            await deleteDoc(docRef);
            toast({ title: "Plataforma Removida!", description: "A plataforma e todos os seus acessos foram removidos." });
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    }

    const handleAddDetail = async (accessId: string) => {
        if (!newDetailData || newDetailData.accessId !== accessId || !newDetailData.type || !newDetailData.value) {
            toast({ title: 'Campos obrigatórios', description: 'Tipo e Valor são obrigatórios.', variant: 'destructive' });
            return;
        }
        const detailToAdd: AccessDetail = {
            id: uuidv4(),
            type: newDetailData.type,
            value: newDetailData.value,
            isSecret: newDetailData.isSecret,
        };
        try {
            const docRef = doc(db, 'clients', clientId, 'access', accessId);
            await updateDoc(docRef, {
                details: arrayUnion(detailToAdd)
            });
            toast({ title: "Acesso Adicionado!", description: "A nova informação foi adicionada com sucesso." });
            setNewDetailData(null);
        } catch (error) {
            console.error("Error adding detail:", error);
            toast({ title: 'Erro ao adicionar acesso', variant: 'destructive' });
        }
    }
    
    const handleDeleteDetail = async (accessId: string, detailToDelete: AccessDetail) => {
         try {
            const docRef = doc(db, 'clients', clientId, 'access', accessId);
            await updateDoc(docRef, {
                details: arrayRemove(detailToDelete)
            });
            toast({ title: "Acesso Removido!", variant: "destructive" });
        } catch (error) {
            toast({ title: 'Erro ao remover acesso', variant: 'destructive' });
        }
    }

    const allUsedTypes = useMemo(() => {
        const usedTypes = new Set<string>(['Login', 'Senha', 'API Key', 'Token', 'Link']);
        accessList.forEach(access => {
            access.details?.forEach(detail => {
                usedTypes.add(detail.type);
            });
        });
        return Array.from(usedTypes).sort();
    }, [accessList]);


    return (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Adicionar Nova Plataforma</CardTitle>
                    <CardDescription>Crie um grupo para armazenar os acessos (Ex: Google Ads, Meta Business, etc.)</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreatePlatform} className="flex gap-2">
                        <Input 
                            id="platform" 
                            placeholder="Nome da Plataforma" 
                            value={newPlatformName} 
                            onChange={(e) => setNewPlatformName(e.target.value)} 
                        />
                        <Button type="submit" variant="secondary" disabled={isCreatingPlatform}>
                            {isCreatingPlatform ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Criar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Plataformas e Acessos</CardTitle>
                    <CardDescription>Clique em uma plataforma para ver e gerenciar seus acessos.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : accessList.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {accessList.map(access => (
                                <AccordionItem value={access.id} key={access.id} className="border-x-0 border-t-0 px-4">
                                     <div className="flex justify-between items-center w-full">
                                        <AccordionTrigger className="flex-1 text-base font-semibold">
                                           {access.platform}
                                        </AccordionTrigger>
                                        <div className="flex items-center gap-2 pr-4">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Excluir Plataforma?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>A plataforma "{access.platform}" e todos os seus acessos serão excluídos.</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeletePlatform(access.id)}>Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                     </div>
                                    <AccordionContent className="pt-4 pb-6 bg-secondary/30 -mx-4 px-4">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-muted-foreground">Acessos Salvos</h4>
                                            
                                            {access.details && access.details.map(detail => (
                                                <div key={detail.id} className="flex items-center gap-2 p-2 rounded-md bg-background/50">
                                                     <p className="font-semibold w-32 truncate" title={detail.type}>{detail.type}:</p>
                                                     {detail.isSecret ? (
                                                         <SecretValue value={detail.value} />
                                                     ) : (
                                                        <Input value={detail.value} readOnly className="flex-1 bg-muted text-xs h-8" />
                                                     )}
                                                     <Button variant="ghost" size="sm" onClick={() => handleCopy(detail.value, detail.type)}><Copy className="mr-2 h-3 w-3" /> Copiar</Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Excluir Acesso?</AlertDialogTitle></AlertDialogHeader>
                                                            <AlertDialogDescription>O acesso "{detail.type}" será excluído permanentemente.</AlertDialogDescription>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteDetail(access.id, detail)}>Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            ))}

                                            <div className="pt-4 space-y-2">
                                                <Label className="flex items-center gap-2"><PlusCircle className="h-4 w-4 text-primary"/> Adicionar Novo Acesso</Label>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={isComboboxOpen}
                                                                className="w-[150px] justify-between bg-background"
                                                            >
                                                                {newDetailData?.accessId === access.id && newDetailData.type
                                                                    ? newDetailData.type
                                                                    : "Tipo (Ex: Login)"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[150px] p-0">
                                                            <Command>
                                                                <CommandInput 
                                                                    placeholder="Buscar ou criar tipo..."
                                                                    onValueChange={(currentValue) => setNewDetailData(prev => ({ ...prev, accessId: access.id, type: currentValue, value: prev?.value || '', isSecret: prev?.isSecret || false }))}
                                                                />
                                                                <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandList>
                                                                        {allUsedTypes.map((type) => (
                                                                            <CommandItem
                                                                                key={type}
                                                                                value={type}
                                                                                onSelect={(currentValue) => {
                                                                                    setNewDetailData(prev => ({ ...prev, accessId: access.id, type: currentValue === newDetailData?.type ? '' : currentValue, value: prev?.value || '', isSecret: prev?.isSecret || false }))
                                                                                    setIsComboboxOpen(false)
                                                                                }}
                                                                            >
                                                                                <Check className={cn("mr-2 h-4 w-4", newDetailData?.type === type ? "opacity-100" : "opacity-0")} />
                                                                                {type}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandList>
                                                                </CommandGroup>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    
                                                    <Input 
                                                        placeholder="Valor (Ex: admin@cliente.com)" 
                                                        value={(newDetailData?.accessId === access.id) ? (newDetailData.value || '') : ''}
                                                        onChange={(e) => setNewDetailData(prev => ({ ...prev, accessId: access.id, type: prev?.type || '', value: e.target.value, isSecret: prev?.isSecret || false }))}
                                                        className="bg-background flex-1 min-w-[150px]"
                                                    />
                                                    <Select 
                                                        onValueChange={(val) => setNewDetailData(prev => ({ ...prev, accessId: access.id, type: prev?.type || '', value: prev?.value || '', isSecret: val === 'secret' }))} 
                                                        defaultValue="visible"
                                                    >
                                                        <SelectTrigger className="w-[120px] bg-background">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="visible">Visível</SelectItem>
                                                            <SelectItem value="secret">Secreto</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button onClick={() => handleAddDetail(access.id)}>Salvar</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground">Nenhuma plataforma cadastrada.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
