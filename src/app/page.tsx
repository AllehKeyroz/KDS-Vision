import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CLIENTS_DATA, PROSPECTS_DATA } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio na Agência Digital.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CLIENTS_DATA.length}</div>
            <p className="text-xs text-muted-foreground">
              +2% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prospects em Andamento</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{PROSPECTS_DATA.length}</div>
            <p className="text-xs text-muted-foreground">
              3 novas propostas enviadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projetos Totais</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CLIENTS_DATA.reduce((acc, client) => acc + client.activeProjects, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Gerenciando o sucesso dos clientes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Acesso Rápido</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/clients" passHref>
            <Card className="hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-semibold">Gerenciar Clientes</h3>
                  <p className="text-sm text-muted-foreground">Acesse os painéis e projetos de seus clientes.</p>
                </div>
                <Button size="icon" variant="ghost">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/prospects" passHref>
            <Card className="hover:border-primary transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-semibold">Funil de Prospecção</h3>
                  <p className="text-sm text-muted-foreground">Organize seus leads e follow-ups.</p>
                </div>
                <Button size="icon" variant="ghost">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
