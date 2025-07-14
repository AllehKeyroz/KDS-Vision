import { CLIENTS_DATA } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Clientes Ativos</h1>
        <p className="text-muted-foreground">Gerencie todos os seus clientes e projetos em um só lugar.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CLIENTS_DATA.map((client) => (
          <Card key={client.id} className="flex flex-col transition-all duration-300 ease-in-out shadow-sm hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex-row items-center gap-4">
              <Image src={client.logo} alt={`Logo ${client.name}`} width={48} height={48} className="rounded-lg border" data-ai-hint="logo company" />
              <div>
                <CardTitle className="text-lg font-headline">{client.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{client.contactPerson}</span>
                {' · '}
                {client.contactEmail}
              </p>
              <div className="mt-2 text-sm">
                <span className="font-bold">{client.activeProjects}</span> projetos ativos
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/clients/${client.id}`} className="w-full" passHref>
                <Button className="w-full" variant="outline">
                  Acessar Painel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
