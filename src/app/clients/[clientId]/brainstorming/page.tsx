
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runClientBrainstorming } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, ListTodo, Loader2, Wand2, Save, Trash2, Check, Pencil, X } from 'lucide-react';
import type { ClientBrainstormingOutput } from '@/ai/flows/client-brainstorming';
import type { BrainstormSession, Client } from '@/lib/types';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function BrainstormingPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [client, setClient] = useState<Client | null>(null);
    const [objective, setObjective] = useState('');
    const [generatedResult, setGeneratedResult] = useState<ClientBrainstormingOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<BrainstormSession[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");

    const sessionsCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'brainstorm_sessions'), [clientId]);

    useEffect(() => {
         if (!clientId) return;

        const fetchClient = async () => {
            const docRef = doc(db, 'clients', clientId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setClient({ id: docSnap.id, ...docSnap.data() } as Client);
            }
        };

        const unsubscribe = onSnapshot(sessionsCollectionRef, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrainstormSession));
            setSessions(sessionsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setIsSessionsLoading(false);
        });

        fetchClient();
        return () => unsubscribe();
    }, [clientId, sessionsCollectionRef]);

    const getClientContext = () => {
        if (!client) return "";
        return `Client Name: ${client.name}\nContact: ${client.contactPerson} (${client.contactEmail})`;
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective) {
            toast({
                title: 'Objetivo necessário',
                description: 'Por favor, descreva o objetivo do brainstorming.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setGeneratedResult(null);

        try {
            const response = await runClientBrainstorming({ clientContext: getClientContext(), objective });
            setGeneratedResult(response);
        } catch (error) {
            toast({
                title: 'Erro no Brainstorming',
                description: 'Não foi possível gerar as ideias. Tente novamente.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSession = async () => {
        if (!generatedResult) return;
        try {
            await addDoc(sessionsCollectionRef, {
                title: objective,
                ideas: generatedResult.ideas.map(text => ({ text, completed: false })),
                tasks: generatedResult.tasks.map(text => ({ text, completed: false })),
                createdAt: serverTimestamp(),
            });
            toast({ title: "Sessão Salva!", description: "A sessão de brainstorming foi salva com sucesso." });
            setGeneratedResult(null);
            setObjective('');
        } catch (error) {
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a sessão.", variant: 'destructive' });
        }
    };
    
    const handleToggleItem = async (sessionId: string, itemType: 'ideas' | 'tasks', itemIndex: number, completed: boolean) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const updatedItems = [...session[itemType]];
        updatedItems[itemIndex].completed = completed;
        
        const docRef = doc(db, 'clients', clientId, 'brainstorm_sessions', sessionId);
        await updateDoc(docRef, { [itemType]: updatedItems });
    };
    
    const handleUpdateItemText = async (sessionId: string, itemType: 'ideas' | 'tasks', itemIndex: number) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session || !editingText) return;

        const updatedItems = [...session[itemType]];
        updatedItems[itemIndex].text = editingText;

        const docRef = doc(db, 'clients', clientId, 'brainstorm_sessions', sessionId);
        await updateDoc(docRef, { [itemType]: updatedItems });
        setEditingItemId(null);
        setEditingText("");
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'brainstorm_sessions', sessionId));
            toast({ title: "Sessão Excluída", description: "A sessão foi removida com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao Excluir", variant: "destructive" });
        }
    };
    
    const startEditing = (currentText: string, sessionId: string, itemType: 'ideas' | 'tasks', index: number) => {
        setEditingItemId(`${sessionId}-${itemType}-${index}`);
        setEditingText(currentText);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Brainstorming com IA</CardTitle>
                    <CardDescription>
                        Gere ideias e tarefas para o cliente com base no seu contexto e um objetivo específico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="objective">Objetivo do Brainstorming</Label>
                            <Textarea
                                id="objective"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Ex: Aumentar o engajamento no Instagram em 20% no próximo trimestre."
                                rows={4}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Ideias...</> : <><Wand2 className="w-4 h-4 mr-2" /> Gerar Ideias</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {(generatedResult && !isLoading) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Resultados Gerados</CardTitle>
                        <CardDescription>Aqui estão as ideias e tarefas sugeridas pela IA. Salve a sessão para poder editá-las.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 animate-in fade-in-50">
                        <div>
                            <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><Lightbulb className="w-5 h-5 text-amber-500" /> Ideias</h3>
                            <ul className="space-y-2 list-disc list-inside text-sm">{generatedResult.ideas.map((idea, index) => (<li key={`idea-${index}`}>{idea}</li>))}</ul>
                        </div>
                        <div>
                            <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><ListTodo className="w-5 h-5 text-sky-500" /> Tarefas</h3>
                            <ul className="space-y-2 list-disc list-inside text-sm">{generatedResult.tasks.map((task, index) => (<li key={`task-${index}`}>{task}</li>))}</ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveSession}><Save className="w-4 h-4 mr-2" /> Salvar Sessão</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Histórico de Sessões</h2>
                {isSessionsLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                 ) :
                 sessions.length === 0 ? <p className="text-muted-foreground">Nenhuma sessão salva ainda.</p> :
                 sessions.map(session => (
                    <Card key={session.id}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle>{session.title}</CardTitle>
                                <CardDescription>Criado em: {new Date(session.createdAt?.toDate()).toLocaleDateString()}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(session.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Ideias</h3>
                                <ul className="space-y-2 text-sm">
                                    {session.ideas.map((idea, index) => (
                                        <li key={`idea-${session.id}-${index}`} className="flex items-center gap-2 group">
                                            <Checkbox id={`idea-${session.id}-${index}`} checked={idea.completed} onCheckedChange={(checked) => handleToggleItem(session.id, 'ideas', index, !!checked)} />
                                            {editingItemId === `${session.id}-ideas-${index}` ? (
                                                <div className="flex-1 flex gap-2">
                                                    <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-8" />
                                                    <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateItemText(session.id, 'ideas', index)}><Check className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingItemId(null)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ) : (
                                                <label htmlFor={`idea-${session.id}-${index}`} className={`flex-1 ${idea.completed ? 'line-through text-muted-foreground' : ''}`}>{idea.text}</label>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => startEditing(idea.text, session.id, 'ideas', index)}><Pencil className="h-3 w-3" /></Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><ListTodo className="w-5 h-5 text-sky-500" /> Tarefas</h3>
                                <ul className="space-y-2 text-sm">
                                    {session.tasks.map((task, index) => (
                                        <li key={`task-${session.id}-${index}`} className="flex items-center gap-2 group">
                                            <Checkbox id={`task-${session.id}-${index}`} checked={task.completed} onCheckedChange={(checked) => handleToggleItem(session.id, 'tasks', index, !!checked)} />
                                            {editingItemId === `${session.id}-tasks-${index}` ? (
                                                 <div className="flex-1 flex gap-2">
                                                    <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-8" />
                                                    <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateItemText(session.id, 'tasks', index)}><Check className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingItemId(null)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ) : (
                                                <label htmlFor={`task-${session.id}-${index}`} className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</label>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => startEditing(task.text, session.id, 'tasks', index)}><Pencil className="h-3 w-3" /></Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
