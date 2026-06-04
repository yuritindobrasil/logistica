import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Pedido, StatusPedido, Cliente } from '@/types/domain';

export const Route = createFileRoute('/_authenticated/pedidos/meus')({
  component: MeusPedidosPage,
});

const statusColors: Record<StatusPedido, string> = {
  'Aguardando Separação': 'bg-gray-500 hover:bg-gray-600',
  'Em Separação': 'bg-blue-500 hover:bg-blue-600',
  'Em Conferência': 'bg-purple-500 hover:bg-purple-600',
  'Alteração de Pedido': 'bg-orange-500 hover:bg-orange-600',
  'Aguardando Compra': 'bg-yellow-600 hover:bg-yellow-700',
  'Faturamento': 'bg-teal-500 hover:bg-teal-600',
  'Em Rota': 'bg-indigo-500 hover:bg-indigo-600',
  'Entregue': 'bg-green-600 hover:bg-green-700',
  'Cancelado': 'bg-red-600 hover:bg-red-700',
};

function MeusPedidosPage() {
  const { user, hasRole } = useAuth();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos', 'meus'],
    enabled: !!user,
    queryFn: async () => {
      // Admin, Gestor and Logistica can see all orders in this list, or we could just show everything.
      // But since it's "Meus Pedidos", if you are Vendedor you only see yours.
      // The RLS policy naturally enforces that Vendedor only sees theirs.
      let q = supabase
        .from('pedidos' as never)
        .select(`
          *,
          cliente:clientes ( id, razao_social )
        ` as never)
        .order('criado_em', { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Array<Pedido & { cliente: Cliente }>;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Meus Pedidos</h1>
        <p className="text-sm text-muted-foreground">Listagem de todos os pedidos cadastrados.</p>
      </header>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Externo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px]">Data Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : !pedidos || pedidos.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
            ) : (
              pedidos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono font-medium">{p.numero_pedido_externo}</TableCell>
                  <TableCell>{p.cliente?.razao_social}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor_total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[p.status_atual]} text-white border-transparent`}>
                      {p.status_atual}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(p.criado_em).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
