
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { runSocialStrategist } from '@/app/actions';
import { CLIENT_CONTEXT_DATA } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Loader2, List, Wand2, Save, Trash2, Check, Pencil, X } from 'lucide-react';
import type { SocialStrategistIAOutput } from '@/ai/flows/social-strategist-ia';
import type { SocialSession } from '@/lib/types';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export default function SocialStrategistPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [formData, setFormData] = useState({
        desiredPlatforms: '',
        contentGoals: '',
        recentPosts: ''
    });
    const [generatedResult, setGeneratedResult] = useState<SocialStrategistIAOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<SocialSession[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");

    const sessionsCollectionRef = useMemo(() => collection(db, 'clients', clientId, 'social_sessions'), [clientId]);

    useEffect(() => {
        const unsubscribe = onSnapshot(sessionsCollectionRef, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialSession));
            setSessions(sessionsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setIsSessionsLoading(false);
        });
        return () => unsubscribe();
    }, [sessionsCollectionRef]);

    const clientContextData = CLIENT_CONTEXT_DATA[clientId] || {};
    const clientContext = Object.entries(clientContextData)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.desiredPlatforms || !formData.contentGoals) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Plataformas e objetivos são necessários.',
                variant: 'destructive',
            });
            return;
        }
        setIsLoading(true);
        setGeneratedResult(null);

        try {
            const response = await runSocialStrategist({ clientContext, ...formData });
            setGeneratedResult(response);
        } catch (error) {
            toast({
                title: 'Erro na Estratégia',
                description: 'Não foi possível gerar a estratégia. Tente novamente.',
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
                title: `Estratégia para ${formData.desiredPlatforms}`,
                postIdeas: generatedResult.postIdeas.map(text => ({ text, completed: false })),
                contentStrategy: generatedResult.contentStrategy,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Sessão Salva!", description: "A estratégia social foi salva com sucesso." });
            setGeneratedResult(null);
            setFormData({ desiredPlatforms: '', contentGoals: '', recentPosts: '' });
        } catch (error) {
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a sessão.", variant: 'destructive' });
        }
    };

    const handleToggleIdea = async (sessionId: string, ideaIndex: number, completed: boolean) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        const updatedIdeas = [...session.postIdeas];
        updatedIdeas[ideaIndex].completed = completed;
        
        const docRef = doc(db, 'clients', clientId, 'social_sessions', sessionId);
        await updateDoc(docRef, { postIdeas: updatedIdeas });
    };

    const handleUpdateIdeaText = async (sessionId: string, ideaIndex: number) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session || !editingText) return;

        const updatedIdeas = [...session.postIdeas];
        updatedIdeas[ideaIndex].text = editingText;

        const docRef = doc(db, 'clients', clientId, 'social_sessions', sessionId);
        await updateDoc(docRef, { postIdeas: updatedIdeas });
        setEditingItemId(null);
        setEditingText("");
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await deleteDoc(doc(db, 'clients', clientId, 'social_sessions', sessionId));
            toast({ title: "Sessão Excluída", description: "A sessão foi removida com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao Excluir", variant: "destructive" });
        }
    };
    
    const startEditing = (currentText: string, sessionId: string, index: number) => {
        setEditingItemId(`${sessionId}-${index}`);
        setEditingText(currentText);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Social Strategist IA</CardTitle>
                    <CardDescription>
                        Gere ideias de posts e uma estratégia de conteúdo para as redes sociais do seu cliente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="platforms">Plataformas Desejadas</Label>
                            <Input id="platforms" value={formData.desiredPlatforms} onChange={e => setFormData({...formData, desiredPlatforms: e.target.value})} placeholder="Ex: Instagram, TikTok, LinkedIn" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goals">Objetivos do Conteúdo</Label>
                            <Input id="goals" value={formData.contentGoals} onChange={e => setFormData({...formData, contentGoals: e.target.value})} placeholder="Ex: Aumentar reconhecimento da marca, gerar leads" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recentPosts">Posts Recentes (Opcional)</Label>
                            <Textarea id="recentPosts" value={formData.recentPosts} onChange={e => setFormData({...formData, recentPosts: e.target.value})} placeholder="Cole aqui exemplos de posts recentes para referência de estilo." rows={3} />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Estratégia...</> : <><Wand2 className="w-4 h-4 mr-2" /> Gerar Estratégia Social</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {(generatedResult && !isLoading) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Estratégia Gerada</CardTitle>
                        <CardDescription>Salve a estratégia para poder editá-la e acompanhá-la.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 animate-in fade-in-50">
                        <div>
                            <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><Lightbulb className="w-5 h-5 text-amber-500" /> Ideias de Posts</h3>
                            <ul className="space-y-2 list-disc list-inside text-sm">{generatedResult.postIdeas.map((idea, index) => (<li key={`idea-${index}`}>{idea}</li>))}</ul>
                        </div>
                        <div className="mt-4">
                            <h3 className="flex items-center gap-2 mb-2 text-lg font-semibold font-headline"><List className="w-5 h-5 text-sky-500" /> Estratégia de Conteúdo</h3>
                            <p className="text-sm">{generatedResult.contentStrategy}</p>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button onClick={handleSaveSession}><Save className="w-4 h-4 mr-2" /> Salvar Estratégia</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Histórico de Estratégias</h2>
                {isSessionsLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) :
                 sessions.length === 0 ? <p className="text-muted-foreground">Nenhuma estratégia salva ainda.</p> :
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
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Ideias de Post</h3>
                                <ul className="space-y-2 text-sm">
                                    {session.postIdeas.map((idea, index) => (
                                        <li key={`idea-${session.id}-${index}`} className="flex items-center gap-2 group">
                                            <Checkbox id={`idea-${session.id}-${index}`} checked={idea.completed} onCheckedChange={(checked) => handleToggleIdea(session.id, index, !!checked)} />
                                            {editingItemId === `${session.id}-${index}` ? (
                                                <div className="flex-1 flex gap-2">
                                                    <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-8" />
                                                    <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateIdeaText(session.id, index)}><Check className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingItemId(null)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ) : (
                                                <label htmlFor={`idea-${session.id}-${index}`} className={`flex-1 ${idea.completed ? 'line-through text-muted-foreground' : ''}`}>{idea.text}</label>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => startEditing(idea.text, session.id, index)}><Pencil className="h-3 w-3" /></Button>
                                        </li>
                                    ))}
                                </ul>
                           </div>
                           <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><List className="w-5 h-5 text-sky-500" /> Estratégia de Conteúdo</h3>
                                <p className="text-sm text-muted-foreground">{session.contentStrategy}</p>
                           </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
