'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PROSPECTS_DATA } from "@/lib/data";
import type { Prospect } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";


const PROSPECTS_LIST = [
    { id: 'p1', name: 'Empresa A', status: 'Qualificado', nextFollowUp: '2024-07-15' },
    { id: 'p2', name: 'Empresa B', status: 'Em Contato', nextFollowUp: '2024-07-10' },
    { id: 'p3', name: 'Empresa C', status: 'Follow-up Agendado', nextFollowUp: '2024-07-20' },
    { id: 'p4', name: 'Empresa D', status: 'Fechado', nextFollowUp: 'N/A' },
    { id: 'p5', name: 'Empresa E', status: 'Qualificado', nextFollowUp: '2024-07-12' },
];

export default function ProspectsPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Prospecção</h1>
            <Button variant="secondary">Adicionar Prospect</Button>
        </div>

        <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Lista de Prospects</h2>
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Prospect</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                            <TableHead>Próximo Follow-up</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PROSPECTS_LIST.map((prospect) => (
                            <TableRow key={prospect.id}>
                                <TableCell className="font-medium">{prospect.name}</TableCell>
                                <TableCell>
                                    <Button variant="secondary" size="sm" className="w-full">{prospect.status}</Button>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{prospect.nextFollowUp}</TableCell>
                                <TableCell className="text-right font-bold text-muted-foreground"><a href="#" className="hover:underline">Agendar Follow-up</a></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </section>

        <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Calendário de Follow-ups</h2>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardContent className="p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="w-full"
                            components={{
                                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                            }}
                         />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                         <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            month={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                            className="w-full"
                            components={{
                                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                            }}
                         />
                    </CardContent>
                </Card>
            </div>
        </section>
    </div>
  );
}
