
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MoreVertical, Edit, Trash2, Check, ChevronsUpDown, ArrowUpDown, Timer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, deleteDoc, collectionGroup } from 'firebase/firestore';
import type { Project, Client, Task } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { isPast } from 'date-fns';

const Countdown: React.FC<{ deadline: Date | undefined, isExpired: boolean }> = ({ deadline, isExpired }) => {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (!deadline) return;

        const interval = setInterval(() => {
            const now = new Date();
            const distance = deadline.getTime() - now.getTime();

            if (distance < 0) {
                setCountdown('Expirado');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            setCountdown(`${days}d ${hours}h ${minutes}m`);
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    if (!deadline) return <span>N/A</span>;

    return (
        <span className={cn(isExpired && "text-destructive font-semibold flex items-center gap-1", "flex items-center gap-1")}>
            <Timer className="h-4 w-4" />
            {countdown || 'Calculando...'}
        </span>
    );
};


export default function AllProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: 'deadline' | 'value'; order: 'asc' | 'desc' } | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const clientsQuery = query(collection(db, 'clients'));
        const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
            setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        });

        const projectsQuery = query(collectionGroup(db, 'projects'));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => {
                 if (!doc.ref.parent.parent) {
                    return null;
                }
                return {
                    id: doc.id,
                    ...doc.data(),
                    clientId: doc.ref.parent.parent.id, // Get clientId from parent collection
                } as Project;
            }).filter((p): p is Project => p !== null);
            setProjects(projectsData);
            setIsLoading(false);
        });

        return () => {
            unsubscribeProjects();
            unsubscribeClients();
        };
    }, []);

    const calculateProgress = useCallback((project: Project): number => {
        const sections = project.sections || [];
        const allTasks: Task[] = sections.flatMap(s => s.tasks || []);
        if (allTasks.length === 0) return 0;

        const completedTasks = allTasks.filter(t => t.completed).length;
        return Math.round((completedTasks / allTasks.length) * 100);
    }, []);

    const handleDelete = async (projectId: string, clientId: string) => {
        try {
            if (!clientId) throw new Error("Client ID não encontrado para o projeto.");
            await deleteDoc(doc(db, 'clients', clientId, 'projects', projectId));
            toast({ title: "Projeto Removido!", description: "O projeto foi removido com sucesso." });
        } catch (error) {
            console.error("Error deleting project:", error);
            toast({ title: "Erro ao remover", description: (error as Error).message, variant: "destructive" });
        }
    };
    
    const sortedAndFilteredProjects = useMemo(() => {
        let filtered = selectedClients.length === 0 
            ? projects 
            : projects.filter(p => selectedClients.includes(p.clientId));

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (sortConfig.key === 'value') {
                    return sortConfig.order === 'asc' ? a.value - b.value : b.value - a.value;
                }
                if (sortConfig.key === 'deadline') {
                    const dateA = a.deadline?.toMillis() || 0;
                    const dateB = b.deadline?.toMillis() || 0;
                    if (dateA === 0) return 1;
                    if (dateB === 0) return -1;
                    return sortConfig.order === 'asc' ? dateA - dateB : dateB - dateA;
                }
                return 0;
            });
        }

        return filtered;
    }, [projects, selectedClients, sortConfig]);

    const requestSort = (key: 'deadline' | 'value') => {
        let order: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Todos os Projetos</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Projetos Ativos e Concluídos</CardTitle>
                    <CardDescription>Uma visão geral de todos os projetos em todos os clientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center mb-4 gap-2">
                        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isFilterOpen}
                                className="w-[300px] justify-between"
                                >
                                {selectedClients.length > 0 ? `${selectedClients.length} cliente(s) selecionado(s)` : "Filtrar por cliente..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandList>
                                        {clients.map((client) => (
                                            <CommandItem
                                            key={client.id}
                                            value={client.name}
                                            onSelect={() => {
                                                setSelectedClients(
                                                    selectedClients.includes(client.id)
                                                    ? selectedClients.filter((id) => id !== client.id)
                                                    : [...selectedClients, client.id]
                                                );
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedClients.includes(client.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {client.name}
                                            </CommandItem>
                                        ))}
                                        </CommandList>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                         {selectedClients.length > 0 && (
                            <Button variant="ghost" onClick={() => setSelectedClients([])}>Limpar Filtro</Button>
                         )}
                    </div>
                {isLoading ? (
                     <div className="flex items-center justify-center h-64">
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Projeto</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Progresso</TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('value')}>
                                        Valor
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => requestSort('deadline')}>
                                        Prazo Restante
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {sortedAndFilteredProjects.length > 0 ? sortedAndFilteredProjects.map(project => {
                             const progress = calculateProgress(project);
                             const client = clients.find(c => c.id === project.clientId);
                             const isCompleted = progress === 100;
                             const deadlineDate = project.deadline?.toDate();
                             const isExpired = deadlineDate && isPast(deadlineDate) && !isCompleted;

                            return (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/clients/${project.clientId}/projects/${project.id}`} className="hover:underline">
                                           <div className="flex items-center gap-2">{isCompleted && <CheckCircle2 className="text-green-500 h-5 w-5"/>}{project.name}</div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>{client?.name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={progress} className="w-24" />
                                            <span className="text-sm font-medium">{progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatCurrency(project.value)}</TableCell>
                                    <TableCell>
                                        <Countdown deadline={deadlineDate} isExpired={isExpired} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => router.push(`/clients/${project.clientId}/projects/${project.id}`)}>
                                              <Edit className="mr-2 h-4 w-4" /> Ver/Editar
                                            </DropdownMenuItem>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>Esta ação não pode ser desfeita e removerá o projeto permanentemente.</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(project.id, project.clientId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Nenhum projeto encontrado com os filtros atuais.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
    )
}
