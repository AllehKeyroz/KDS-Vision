'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, PlusCircle, Loader2, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "clients"), (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching clients: ", error);
      toast({
        title: "Erro ao buscar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const newClient: Omit<Client, 'id'> = {
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactEmail: formData.get('contactEmail') as string,
      logo: `https://placehold.co/64x64/2E9AFE/FFFFFF.png?text=${(formData.get('name') as string)[0] || 'A'}`,
      activeProjects: 0,
      whatsapp: formData.get('whatsapp') as string,
      socialMedia: {
        instagram: formData.get('instagram') as string,
        facebook: formData.get('facebook') as string,
      },
      address: {
        street: formData.get('street') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: formData.get('zip') as string,
      },
      additionalFields: {},
    };

    if (!newClient.name || !newClient.contactPerson || !newClient.contactEmail) {
        toast({
            title: "Campos obrigatórios",
            description: "Nome, contato e email são obrigatórios.",
            variant: "destructive",
        });
        setIsSaving(false);
        return;
    }

    try {
      await addDoc(collection(db, "clients"), newClient);
      toast({
        title: "Cliente Adicionado!",
        description: `O cliente ${newClient.name} foi adicionado com sucesso.`,
      });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding client: ", error);
      toast({
        title: "Erro ao adicionar cliente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setIsEditDialogOpen(true);
  }

  const handleUpdateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentClient) return;

    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const updatedData = {
        name: formData.get('name') as string,
        contactPerson: formData.get('contactPerson') as string,
        contactEmail: formData.get('contactEmail') as string,
        whatsapp: formData.get('whatsapp') as string,
        'socialMedia.instagram': formData.get('instagram') as string,
        'socialMedia.facebook': formData.get('facebook') as string,
        'address.street': formData.get('street') as string,
        'address.city': formData.get('city') as string,
        'address.state': formData.get('state') as string,
        'address.zip': formData.get('zip') as string,
    };

    try {
        const clientRef = doc(db, "clients", currentClient.id);
        await updateDoc(clientRef, updatedData);
        toast({ title: "Cliente Atualizado!", description: "Os dados do cliente foram atualizados." });
        setIsEditDialogOpen(false);
        setCurrentClient(null);
    } catch (error) {
        console.error("Error updating client: ", error);
        toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteDoc(doc(db, "clients", clientId));
      toast({ title: "Cliente Removido", description: "O cliente foi removido com sucesso." });
    } catch (error) {
      console.error("Error deleting client: ", error);
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  }

  const activeProjects = (count: number) => {
    if (count > 1) return `${count} projetos`;
    if (count === 1) return `${count} projeto`;
    return "Nenhum projeto";
  }

  const renderClientForm = (client?: Client | null) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informações de Contato</h3>
            <div>
                <Label htmlFor="name">Nome do Cliente</Label>
                <Input id="name" name="name" placeholder="Ex: Tech Inova Soluções" defaultValue={client?.name} required />
            </div>
            <div>
                <Label htmlFor="contactPerson">Contato Principal</Label>
                <Input id="contactPerson" name="contactPerson" placeholder="Ex: Fernando Pereira" defaultValue={client?.contactPerson} required />
            </div>
            <div>
                <Label htmlFor="contactEmail">Email de Contato</Label>
                <Input id="contactEmail" name="contactEmail" type="email" placeholder="Ex: fernando@techinova.com" defaultValue={client?.contactEmail} required />
            </div>
            <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" placeholder="(99) 99999-9999" defaultValue={client?.whatsapp} />
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Presença Online</h3>
            <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" name="instagram" placeholder="@seucliente" defaultValue={client?.socialMedia?.instagram}/>
            </div>
            <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" name="facebook" placeholder="facebook.com/seucliente" defaultValue={client?.socialMedia?.facebook}/>
            </div>

            <h3 className="font-semibold text-lg pt-4">Endereço</h3>
            <div>
                <Label htmlFor="street">Rua e Número</Label>
                <Input id="street" name="street" placeholder="Rua das Flores, 123" defaultValue={client?.address?.street} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" placeholder="São Paulo" defaultValue={client?.address?.city}/>
                </div>
                <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" name="state" placeholder="SP" defaultValue={client?.address?.state}/>
                </div>
            </div>
             <div>
                <Label htmlFor="zip">CEP</Label>
                <Input id="zip" name="zip" placeholder="01234-567" defaultValue={client?.address?.zip}/>
            </div>
        </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes Ativos</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>Preencha os campos abaixo para cadastrar um novo cliente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient}>
              {renderClientForm()}
              <DialogFooter className="pt-8">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" variant="secondary" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Cliente
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Projetos Ativos</TableHead>
                      <TableHead>Contato Principal</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {clients.length > 0 ? clients.map((client) => (
                      <TableRow key={client.id}>
                          <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                  <Image src={client.logo} alt={`Logo ${client.name}`} width={40} height={40} className="rounded-full border" data-ai-hint="logo company" />
                                  {client.name}
                              </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{activeProjects(client.activeProjects)}</TableCell>
                          <TableCell className="text-muted-foreground">{client.contactPerson}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                               <Link href={`/clients/${client.id}`} passHref>
                                  <Button variant="ghost" size="icon" asChild>
                                      <ArrowRight className="w-4 h-4" />
                                  </Button>
                              </Link>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Essa ação não pode ser desfeita e irá remover o cliente permanentemente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Nenhum cliente cadastrado.
                        </TableCell>
                    </TableRow>
                  )}
              </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Atualize as informações do cliente abaixo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateClient}>
                {currentClient && renderClientForm(currentClient)}
                <DialogFooter className="pt-8">
                    <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button></DialogClose>
                    <Button type="submit" variant="secondary" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
