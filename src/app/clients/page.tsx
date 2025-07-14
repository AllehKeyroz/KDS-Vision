'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients: ", error);
        toast({
          title: "Erro ao buscar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [toast]);
  
  const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const newClient = {
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactEmail: formData.get('contactEmail') as string,
      logo: `https://placehold.co/64x64/2E9AFE/FFFFFF.png?text=${(formData.get('name') as string)[0]}`,
      activeProjects: 0,
    };

    if (!newClient.name || !newClient.contactPerson || !newClient.contactEmail) {
        toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha todos os campos.",
            variant: "destructive",
        });
        return;
    }

    try {
      const docRef = await addDoc(collection(db, "clients"), newClient);
      setClients(prevClients => [...prevClients, { id: docRef.id, ...newClient }]);
      toast({
        title: "Cliente Adicionado!",
        description: `O cliente ${newClient.name} foi adicionado com sucesso.`,
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding client: ", error);
      toast({
        title: "Erro ao adicionar cliente",
        description: "Não foi possível adicionar o novo cliente.",
        variant: "destructive",
      });
    }
  };

  const activeProjects = (count: number) => {
    if (count > 1) return `${count} projetos`;
    if (count === 1) return `${count} projeto`;
    return "Nenhum projeto";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes Ativos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Cliente</Label>
                <Input id="name" name="name" placeholder="Ex: Tech Inova Soluções" required />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contato Principal</Label>
                <Input id="contactPerson" name="contactPerson" placeholder="Ex: Fernando Pereira" required />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email de Contato</Label>
                <Input id="contactEmail" name="contactEmail" type="email" placeholder="Ex: fernando@techinova.com" required />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="secondary">Salvar Cliente</Button>
              </div>
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
                      <TableHead className="text-right">Acessar</TableHead>
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
                               <Link href={`/clients/${client.id}`} passHref>
                                  <Button variant="ghost" size="icon">
                                      <ArrowRight className="w-4 h-4" />
                                  </Button>
                              </Link>
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
    </div>
  );
}
