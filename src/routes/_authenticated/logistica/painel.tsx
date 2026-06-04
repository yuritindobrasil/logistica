import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AcoesPedido } from '@/components/logistica/AcoesPedido';
import { LinhaDoTempoObservacoes } from '@/components/logistica/LinhaDoTempoObservacoes';
import type { Pedido, StatusPedido, Cliente } from '@/types/domain';

export const Route = createFileRoute('/_authenticated/logistica/painel')({
  component: PainelOperacionalPage,
});

const KANBAN_COLUMNS: StatusPedido[] = [
  'Aguardando Separação',
  'Em Separação',
  'Em Conferência',
  'Aguardando Compra',
  'Faturamento',
  'Em Rota',
];

function PainelOperacionalPage() {
  const { user } = useAuth();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos', 'operacional'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos' as never)
        .select(`
          *,
          cliente:clientes ( id, razao_social, codigo_cliente )
        ` as never)
        .neq('status_atual', 'Entregue' as never)
        .neq('status_atual', 'Cancelado' as never)
        .order('criado_em', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as Array<Pedido & { cliente: Cliente }>;
    },
    refetchInterval: 10000, // Refetch a cada 10s para manter o kanban atualizado
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold">Painel Operacional (Kanban)</h1>
        <p className="text-sm text-muted-foreground">Gestão de fluxo dos pedidos ativos.</p>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start">
          {KANBAN_COLUMNS.map((coluna) => {
            const pedidosColuna = pedidos?.filter(p => p.status_atual === coluna) || [];
            
            return (
              <div key={coluna} className="bg-secondary/20 border border-border rounded-lg min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col max-h-full">
                <div className="p-3 border-b border-border bg-secondary/40 font-semibold flex items-center justify-between">
                  <span>{coluna}</span>
                  <Badge variant="secondary">{pedidosColuna.length}</Badge>
                </div>
                <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {pedidosColuna.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground italic border-2 border-dashed border-border/50 rounded-md">
                      Nenhum pedido nesta etapa
                    </div>
                  ) : (
                    pedidosColuna.map((pedido) => (
                      <Card key={pedido.id} className="shadow-sm border-border/50">
                        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
                          <CardTitle className="text-sm font-bold tracking-tight">
                            #{pedido.numero_pedido_externo}
                          </CardTitle>
                          <div className="flex items-center text-xs text-muted-foreground gap-1" title="Tempo desde a criação">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(pedido.criado_em), { locale: ptBR })}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-sm text-foreground truncate font-medium">
                            {pedido.cliente?.codigo_cliente} - {pedido.cliente?.razao_social}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                          </p>
                          
                          <AcoesPedido pedido={pedido} />
                          <LinhaDoTempoObservacoes pedido={pedido} />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
