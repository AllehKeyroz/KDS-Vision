
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignupPage() {
    const { signUpWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await signUpWithEmail(name, email, password);
            setSuccess(true);
        } catch (err: any) {
            if (err.message.includes('auth/email-already-in-use')) {
                 setError('Este email já está em uso. Tente fazer login.');
            } else if (err.message.includes('auth/weak-password')) {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else if (err.message.includes('invitation-not-found')) {
                setError('Email não autorizado. Você precisa de um convite para criar uma conta.');
            }
             else {
                setError(err.message || 'Falha ao criar conta.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
                 <div className="fixed top-0 left-0 w-full h-full animated-aurora -z-10"></div>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Verifique seu Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertTitle>Cadastro realizado com sucesso!</AlertTitle>
                            <AlertDescription>
                                Enviamos um link de verificação para o seu email. Por favor, verifique sua caixa de entrada para ativar sua conta.
                            </AlertDescription>
                        </Alert>
                        <Button asChild className="w-full mt-4">
                            <Link href="/login">Voltar para o Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
            <div className="fixed top-0 left-0 w-full h-full animated-aurora -z-10"></div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Criar Conta</CardTitle>
                    <CardDescription>Insira seus dados para se cadastrar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu Nome" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Cadastrar
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="underline">
                            Faça login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
