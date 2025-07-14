import { CLIENTS_DATA } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ClientsPage() {
  const activeProjects = (id: string) => {
      const client = CLIENTS_DATA.find(c => c.id === id);
      if(!client) return "N/A";
      if(client.activeProjects > 1) return `${client.activeProjects} projetos`;
      if(client.activeProjects === 1) return `${client.activeProjects} projeto`;
      return "Nenhum projeto";
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes Ativos</h1>
        <Button variant="secondary">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
        </Button>
      </div>

      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Projetos Ativos</TableHead>
                    <TableHead>Contato Principal</TableHead>
                    <TableHead className="text-right">Acessar</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {CLIENTS_DATA.map((client) => (
                    <TableRow key={client.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Image src={client.logo} alt={`Logo ${client.name}`} width={40} height={40} className="rounded-full border" data-ai-hint="logo company" />
                                {client.name}
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{activeProjects(client.id)}</TableCell>
                        <TableCell className="text-muted-foreground">{client.contactPerson}</TableCell>
                        <TableCell className="text-right">
                             <Link href={`/clients/${client.id}`} passHref>
                                <Button variant="ghost" size="icon">
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </Card>
    </div>
  );
}
