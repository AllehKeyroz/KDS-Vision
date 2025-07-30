
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Notebook, PlusCircle, Loader2, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Note } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

// Simple debounce function
function debounce<F extends (...args: any[]) => void>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export default function NotesPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newNoteData, setNewNoteData] = useState({ title: '', content: '' });
    
    // State for editing title
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');


    const notesCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'notes'), [clientId]);

    useEffect(() => {
        if (!clientId) return;

        const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (docSnap) => {
            const notesData = docSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Note));
            setNotes(notesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching notes:", error);
            toast({ title: "Erro ao carregar anotações", variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [clientId, notesCollectionRef, toast]);
    
    const handleUpdateNoteContent = useCallback(
        debounce(async (noteId: string, newContent: string) => {
            const noteRef = doc(db, 'clients', clientId, 'notes', noteId);
            try {
                await updateDoc(noteRef, { content: newContent });
                 toast({
                    title: 'Anotação Salva!',
                    description: 'Suas alterações foram salvas automaticamente.',
                });
            } catch (error) {
                console.error("Error saving note:", error);
                toast({ title: "Erro ao salvar", description: "Não foi possível salvar a anotação.", variant: "destructive" });
            }
        }, 1500), // Debounce time: 1.5 seconds
        [clientId, toast]
    );

    const handleContentChange = (noteId: string, newContent: string) => {
        setNotes(notes.map(n => n.id === noteId ? { ...n, content: newContent } : n));
        handleUpdateNoteContent(noteId, newContent);
    };

    const handleCreateNote = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newNoteData.title) {
            toast({ title: "Título é obrigatório", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(notesCollectionRef, {
                ...newNoteData,
                createdAt: serverTimestamp() as Timestamp
            });
            toast({ title: 'Anotação Criada!', description: 'Sua nova anotação foi salva.' });
            setIsCreateDialogOpen(false);
            setNewNoteData({ title: '', content: '' });
        } catch (error) {
            toast({ title: 'Erro ao criar anotação', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteNote = async (noteId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'notes', noteId));
            toast({ title: 'Anotação Excluída', variant: 'destructive' });
        } catch (error) {
            toast({ title: 'Erro ao excluir', variant: 'destructive' });
        }
    };
    
    const startEditingTitle = (note: Note) => {
        setEditingNoteId(note.id);
        setEditingTitle(note.title);
    };
    
    const handleUpdateNoteTitle = async (noteId: string) => {
        if (!editingTitle.trim()) {
            toast({ title: "Título não pode ser vazio", variant: "destructive" });
            return;
        }
        const noteRef = doc(db, 'clients', clientId, 'notes', noteId);
        try {
            await updateDoc(noteRef, { title: editingTitle });
            toast({ title: "Título atualizado!" });
            setEditingNoteId(null);
        } catch (error) {
            toast({ title: "Erro ao atualizar título", variant: "destructive" });
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2"><Notebook /> Anotações</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Nova Anotação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Anotação</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateNote} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Título</Label>
                                <Input 
                                    id="title" 
                                    value={newNoteData.title}
                                    onChange={(e) => setNewNoteData({...newNoteData, title: e.target.value})}
                                    placeholder="Título da sua anotação"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="content">Conteúdo (Opcional)</Label>
                                <Textarea 
                                    id="content"
                                    value={newNoteData.content}
                                    onChange={(e) => setNewNoteData({...newNoteData, content: e.target.value})}
                                    placeholder="Comece a digitar aqui..."
                                    rows={5}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            {notes.length > 0 ? (
                 <Accordion type="multiple" className="w-full space-y-4">
                    {notes.map(note => (
                        <AccordionItem value={note.id} key={note.id} className="border-b-0">
                           <Card>
                                <div className="flex justify-between items-center w-full p-4">
                                     {editingNoteId === note.id ? (
                                        <div className="flex-1 flex items-center gap-2 pr-2">
                                            <Input
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="h-9 text-lg font-semibold"
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateNoteTitle(note.id); if (e.key === 'Escape') setEditingNoteId(null);}}
                                            />
                                            <Button size="icon" className="h-9 w-9" onClick={(e) => {e.stopPropagation(); handleUpdateNoteTitle(note.id);}}><Check className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={(e) => {e.stopPropagation(); setEditingNoteId(null);}}><X className="h-4 w-4" /></Button>
                                        </div>
                                     ) : (
                                        <AccordionTrigger className="flex-1 py-0 text-left">
                                            <div>
                                                <h3 className="font-semibold text-lg">{note.title}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Criado em: {note.createdAt ? format(note.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '...'}
                                                </p>
                                            </div>
                                        </AccordionTrigger>
                                     )}
                                     <div className="flex items-center pl-2">
                                        {editingNoteId !== note.id && (
                                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); startEditingTitle(note); }}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Excluir Anotação?</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                     </div>
                                </div>
                               <AccordionContent className="px-6 pb-6">
                                   <Textarea
                                        value={note.content}
                                        onChange={(e) => handleContentChange(note.id, e.target.value)}
                                        placeholder="Comece a digitar aqui..."
                                        className="min-h-[200px] text-base"
                                    />
                               </AccordionContent>
                           </Card>
                        </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                 <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Nenhuma anotação criada</CardTitle>
                        <CardDescription>Crie sua primeira anotação para este cliente.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}
