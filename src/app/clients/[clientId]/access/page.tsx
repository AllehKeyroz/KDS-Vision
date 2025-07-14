'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { CLIENT_ACCESS_DATA } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, PlusCircle, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AccessPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();

    // In a real app, this data would be fetched and managed via state
    const accessList = CLIENT_ACCESS_DATA[clientId] || [];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copiado!',
            description: 'A informação foi copiada para a área de transferência.',
        });
    }

    return (
        <div className="space-y-6">
            <form className="max-w-md space-y-4">
                <div>
                    <Label htmlFor="platform" className="pb-2">Plataforma</Label>
                    <Input id="platform" placeholder="Ex: Plataforma de Anúncios" />
                </div>
                 <div>
                    <Label htmlFor="link" className="pb-2">Link</Label>
                    <Input id="link" placeholder="Ex: Link para a plataforma" />
                </div>
                 <div>
                    <Label htmlFor="login" className="pb-2">Login</Label>
                    <Input id="login" placeholder="Ex: Login de acesso" />
                </div>
                 <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" placeholder="Ex: Senha de acesso" />
                </div>
                 <div>
                    <Label htmlFor="apiKey" className="pb-2">Chave de API</Label>
                    <Input id="apiKey" placeholder="Ex: Chave de API para integração" />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="secondary" className="font-bold tracking-wide">
                        Salvar Acesso
                    </Button>
                </div>
            </form>
            <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plataforma</TableHead>
                            <TableHead>Login</TableHead>
                            <TableHead>Senha</TableHead>
                            <TableHead>Chave API</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accessList.length > 0 ? accessList.map(access => (
                            <TableRow key={access.id}>
                                <TableCell className="font-medium">
                                    <a href={access.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                        {access.platform}
                                    </a>
                                </TableCell>
                                <TableCell>{access.login}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(access.password_plain)}>
                                        <Copy className="mr-2 h-3 w-3" />
                                        Copiar Senha
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    {access.apiKey ? <Badge>Presente</Badge> : <Badge variant="secondary">N/A</Badge>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum acesso cadastrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
}
