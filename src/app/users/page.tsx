
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, DollarSign, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { User, Client, Invitation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
    const { toast } = useToast();
    const { user: loggedInUser } = useAuth();

    const [users, setUsers] = useState<User[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // User Management Dialog
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    
    // Invitation Dialog
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [invitationData, setInvitationData] = useState({ name: '', email: '', role: 'user' as 'clientAdmin' | 'user', clientId: '' });


    const usersCollectionRef = useMemo(() => collection(db, 'users'), []);
    const clientsCollectionRef = useMemo(() => collection(db, 'clients'), []);
    const invitationsCollectionRef = useMemo(() => collection(db, 'invitations'), []);

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
            setIsLoading(false);
        });
        
        const unsubscribeClients = onSnapshot(clientsCollectionRef, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        });

        return () => {
            unsubscribeUsers();
            unsubscribeClients();
        };
    }, [usersCollectionRef, clientsCollectionRef]);

    const handleOpenUserDialog = (user: Partial<User> | null) => {
        setCurrentUser(user);
        setIsUserDialogOpen(true);
    };

    const handleCloseUserDialog = () => {
        setCurrentUser(null);
        setIsUserDialogOpen(false);
    };

    const handleUserSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentUser?.id) return;

        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const userData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as User['role'],
            costPerHour: Number(formData.get('costPerHour') || 0),
        };

        if (!userData.name || !userData.email || !userData.role) {
            toast({ title: "Campos obrigatórios", description: "Nome, email e função são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            const docRef = doc(db, 'users', currentUser.id);
            await updateDoc(docRef, userData);
            toast({ title: "Usuário Atualizado!", description: "O usuário foi atualizado com sucesso." });
            handleCloseUserDialog();
        } catch (error) {
            console.error("Error saving user:", error);
            toast({ title: "Erro ao salvar", description: "Não foi possível salvar o usuário.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            toast({ title: "Usuário Removido!", description: "O usuário foi removido com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao remover", description: "Não foi possível remover o usuário.", variant: "destructive" });
        }
    };
    
     const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        
        if (!invitationData.email || !invitationData.clientId || !invitationData.role) {
            toast({ title: "Campos obrigatórios", description: "Email, cliente e função são obrigatórios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        try {
            const newInvitation: Omit<Invitation, 'id'> = {
                email: invitationData.email.toLowerCase(),
                clientId: invitationData.clientId,
                role: invitationData.role,
                status: 'pending',
                invitedBy: loggedInUser?.id || 'admin',
                createdAt: serverTimestamp(),
            };
            await addDoc(invitationsCollectionRef, newInvitation);
            toast({ title: "Convite Enviado!", description: `Um convite foi enviado para ${invitationData.email}.` });
            setIsInviteDialogOpen(false);
            setInvitationData({ name: '', email: '', role: 'user', clientId: '' });
        } catch (error) {
            console.error("Error sending invitation:", error);
            toast({ title: "Erro ao enviar convite", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Gestão de Equipe</h1>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                         <Button disabled={loggedInUser?.role !== 'agencyAdmin'}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Convidar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Convidar Novo Usuário</DialogTitle>
                            <DialogDescription>
                                Preencha os dados abaixo para enviar um convite de acesso à plataforma.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                             <div>
                                <Label htmlFor="invite-name">Nome do Convidado</Label>
                                <Input id="invite-name" value={invitationData.name} onChange={(e) => setInvitationData({...invitationData, name: e.target.value})} required />
                            </div>
                            <div>
                                <Label htmlFor="invite-email">Email</Label>
                                <Input id="invite-email" type="email" value={invitationData.email} onChange={(e) => setInvitationData({...invitationData, email: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <Label htmlFor="invite-client">Atribuir ao Cliente</Label>
                                    <Select value={invitationData.clientId} onValueChange={(value) => setInvitationData({...invitationData, clientId: value})}>
                                        <SelectTrigger id="invite-client"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="invite-role">Função</Label>
                                    <Select value={invitationData.role} onValueChange={(value) => setInvitationData({...invitationData, role: value as 'clientAdmin' | 'user'})}>
                                        <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="clientAdmin">Admin do Cliente</SelectItem>
                                            <SelectItem value="user">Usuário</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar Convite
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                 ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Clientes Atribuídos</TableHead>
                            <TableHead>Custo/Hora</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="avatar person" />
                                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p>{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant={user.role === 'agencyAdmin' ? "default" : "secondary"}>{user.role}</Badge></TableCell>
                                <TableCell>
                                    {user.assignedClientIds && user.assignedClientIds.map(clientId => (
                                        <Badge key={clientId} variant="outline" className="mr-1 mb-1">
                                            {clients.find(c => c.id === clientId)?.name || 'Cliente Removido'}
                                        </Badge>
                                    ))}
                                </TableCell>
                                <TableCell>{formatCurrency(user.costPerHour || 0)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loggedInUser?.role !== 'agencyAdmin'}>
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleOpenUserDialog(user)}>
                                          <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Excluir usuário?</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogDescription>Esta ação não pode ser desfeita e removerá o usuário permanentemente.</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 )}
            </Card>

            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                            Altere as informações do usuário. A atribuição de clientes é feita via convite.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" name="name" defaultValue={currentUser?.name} required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={currentUser?.email} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="role">Função</Label>
                                <Select name="role" defaultValue={currentUser?.role}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Selecione a função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agencyAdmin">Admin da Agência</SelectItem>
                                        <SelectItem value="clientAdmin">Admin do Cliente</SelectItem>
                                        <SelectItem value="user">Usuário</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="costPerHour">Custo/Hora (R$)</Label>
                                <Input id="costPerHour" name="costPerHour" type="number" step="0.01" placeholder="Ex: 50.00" defaultValue={currentUser?.costPerHour} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseUserDialog}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
