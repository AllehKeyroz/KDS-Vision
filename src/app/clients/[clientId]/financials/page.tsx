
'use client'

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, User } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type ClientAnalysis = {
    totalInvestido: number;
    totalCustoReal: number;
    totalLucro: number;
    roi: number;
    projectsData: { name: string; value: number; cost: number; }[];
}

export default function ClientFinancialsPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [analysis, setAnalysis] = useState<ClientAnalysis | null>(null);
    const [isValuesVisible, setIsValuesVisible] = useState(false);

    useEffect(() => {
        if (!clientId) return;

        const projectsColRef = collection(db, 'clients', clientId, 'projects');
        const usersColRef = collection(db, 'users');

        const unsubscribeProjects = onSnapshot(query(projectsColRef), (snapshot) => {
             setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
             setIsAnalysisLoading(false);
        });

        const unsubscribeUsers = onSnapshot(query(usersColRef), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });

        return () => {
            unsubscribeProjects();
            unsubscribeUsers();
        };

    }, [clientId]);

    useEffect(() => {
        if (!isAnalysisLoading && projects.length > 0 && users.length > 0) {
            let totalInvestido = 0;
            let totalCustoReal = 0;
            const projectsData: { name: string; value: number; cost: number; }[] = [];

            projects.forEach(project => {
                totalInvestido += project.value;
                const projectCost = (project.sections || []).reduce((acc, section) => {
                    (section.tasks || []).forEach(task => {
                       (task.timeLogs || []).forEach(log => {
                           const user = users.find(u => u.id === log.userId);
                           if (user && user.costPerHour) {
                               acc += log.hours * user.costPerHour;
                           }
                       });
                   });
                   return acc;
                }, 0);
                totalCustoReal += projectCost;
                projectsData.push({ name: project.name, value: project.value, cost: projectCost });
            });

            const totalLucro = totalInvestido - totalCustoReal;
            const roi = totalCustoReal > 0 ? (totalLucro / totalCustoReal) * 100 : (totalInvestido > 0 ? Infinity : 0);
            
            setAnalysis({ totalInvestido, totalCustoReal, totalLucro, roi, projectsData });
        } else if (!isAnalysisLoading) {
            setAnalysis({ totalInvestido: 0, totalCustoReal: 0, totalLucro: 0, roi: 0, projectsData: [] });
        }
    }, [projects, users, isAnalysisLoading]);

    if (isAnalysisLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Skeleton className="h-80 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {analysis && (
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="font-headline flex items-center gap-2"><DollarSign /> Análise Financeira do Cliente</CardTitle>
                            <CardDescription>Esta análise consolida os dados de todos os projetos para este cliente.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsValuesVisible(!isValuesVisible)}>
                            {isValuesVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Investimento Total</p>
                                <p className="text-2xl font-bold text-primary">{isValuesVisible ? formatCurrency(analysis.totalInvestido) : 'R$ ******'}</p>
                            </div>
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Custo Real Total</p>
                                <p className="text-2xl font-bold text-destructive">{isValuesVisible ? formatCurrency(analysis.totalCustoReal) : 'R$ ******'}</p>
                            </div>
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Lucro Total</p>
                                <p className={cn("text-2xl font-bold", analysis.totalLucro >= 0 ? "text-green-500" : "text-red-500")}>
                                    {isValuesVisible ? formatCurrency(analysis.totalLucro) : 'R$ ******'}
                                </p>
                            </div>
                             <div className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">ROI</p>
                                <p className={cn("text-2xl font-bold", analysis.roi >= 0 ? "text-green-500" : "text-red-500")}>
                                    {isValuesVisible ? (analysis.roi === Infinity ? "∞" : `${analysis.roi.toFixed(2)}%`) : '****** %'}
                                </p>
                            </div>
                        </div>
                        {analysis.projectsData.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold mb-2 text-center">Desempenho por Projeto</h4>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysis.projectsData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => isValuesVisible ? formatCurrency(value, 'compact') : '***'}/>
                                            <Tooltip
                                                cursor={{ fill: 'hsl(var(--accent))' }}
                                                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                                formatter={(value: number) => isValuesVisible ? formatCurrency(value) : 'R$ ******'}
                                            />
                                            <Legend />
                                            <Bar dataKey="value" name="Valor Faturado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="cost" name="Custo Real" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
