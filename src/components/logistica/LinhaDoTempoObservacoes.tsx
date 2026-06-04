import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, MessageSquarePlus, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Pedido, ObservacaoOperacional } from '@/types/domain';

export function LinhaDoTempoObservacoes({ pedido }: { pedido: Pedido }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [novaObs, setNovaObs] = useState('');

  const { data: observacoes, isLoading } = useQuery({
    queryKey: ['observacoes', pedido.id],
    enabled: isOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observacoes_operacionais' as never)
        .select('*, usuario:usuarios_perfis(nome_completo)' as never)
        .eq('pedido_id', pedido.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (texto: string) => {
      if (!user) throw new Error("Usuário não logado");
      const { error } = await supabase.from('observacoes_operacionais' as never).insert({
        pedido_id: pedido.id,
        usuario_id: user.id,
        texto_observacao: texto,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Observação adicionada!');
      setNovaObs('');
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ['observacoes', pedido.id] });
      setIsOpen(true); // Garante que a lista abra após adicionar
    },
    onError: (e: Error) => toast.error('Erro ao adicionar', { description: e.message }),
  });

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between border">
              Ver Histórico ({observacoes?.length ?? '...'})
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {isLoading && <p className="text-xs text-muted-foreground text-center">Carregando...</p>}
            {!isLoading && observacoes?.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Sem observações.</p>
            )}
            {observacoes?.map((obs) => (
              <div key={obs.id} className="bg-secondary/40 p-2 rounded-md text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-muted-foreground">
                  <span>{obs.usuario?.nome_completo ?? 'Sistema'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {new Date(obs.criado_em).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-foreground">{obs.texto_observacao}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" title="Adicionar Observação">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Observação</DialogTitle>
              <DialogDescription>Adicione anotações operacionais sobre o pedido {pedido.numero_pedido_externo}.</DialogDescription>
            </DialogHeader>
            <Textarea
              value={novaObs}
              onChange={(e) => setNovaObs(e.target.value)}
              placeholder="O que está acontecendo com este pedido?"
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button 
                disabled={!novaObs.trim() || mutation.isPending}
                onClick={() => mutation.mutate(novaObs)}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar Observação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
