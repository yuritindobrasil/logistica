import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import type { Pedido, StatusPedido } from "@/types/domain";

const STATUS_OPTIONS: StatusPedido[] = [
  "Aguardando Separação",
  "Em Separação",
  "Em Conferência",
  "Alteração de Pedido",
  "Aguardando Compra",
  "Faturamento",
  "Em Rota",
  "Entregue",
  "Cancelado",
];

const NEXT_STATUS_MAP: Partial<Record<StatusPedido, StatusPedido>> = {
  "Aguardando Separação": "Em Separação",
  "Em Separação": "Em Conferência",
  "Em Conferência": "Faturamento",
  Faturamento: "Em Rota",
  "Em Rota": "Entregue",
};

export function AcoesPedido({ pedido }: { pedido: Pedido }) {
  const { user, hasRole, hasPermissao } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const suggestedNext = NEXT_STATUS_MAP[pedido.status_atual] || "Cancelado";
  const [novoStatus, setNovoStatus] = useState<StatusPedido>(suggestedNext);

  // Regra de segurança da UI
  const canAdvance =
    hasRole("admin") ||
    hasRole("logistica") ||
    hasRole("gestor") ||
    hasPermissao("pode_avancar_etapa");

  const mutation = useMutation({
    mutationFn: async (status: StatusPedido) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.rpc("fn_avancar_etapa_pedido", {
        p_pedido_id: pedido.id,
        p_novo_status: status,
        p_usuario_id: user.id,
      });
      if (error) throw error;
    },
    onMutate: async (newStatus) => {
      await qc.cancelQueries({ queryKey: ["pedidos", "operacional"] });
      const prev = qc.getQueryData(["pedidos", "operacional"]);

      // Optimistic update
      qc.setQueryData(["pedidos", "operacional"], (old: Pedido[] | undefined) => {
        if (!old) return old;
        return old.map((p: Pedido) => (p.id === pedido.id ? { ...p, status_atual: newStatus } : p));
      });
      return { prev };
    },
    onError: (e: Error, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(["pedidos", "operacional"], ctx.prev);
      toast.error("Erro ao avançar etapa", { description: e.message });
    },
    onSuccess: () => {
      toast.success("Etapa avançada com sucesso!");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["pedidos", "operacional"] });
    },
  });

  if (!canAdvance) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full mt-2">
          Avançar Etapa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avançar Pedido {pedido.numero_pedido_externo}</DialogTitle>
          <DialogDescription>
            Escolha a próxima etapa deste pedido. Isso encerrará o log atual e iniciará um novo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="status">Próxima Etapa</Label>
          <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as StatusPedido)}>
            <SelectTrigger id="status" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate(novoStatus)} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Confirmar Avanço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
