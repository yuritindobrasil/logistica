import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cliente } from "@/types/domain";

const schema = z.object({
  numero_pedido_externo: z.string().min(1, "Número do pedido é obrigatório").max(50),
  cliente_id: z.string().min(1, "Selecione um cliente"),
  valor_total: z.coerce.number().min(0, "Valor deve ser positivo"),
  observacoes_iniciais: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/pedidos/novo")({
  component: NovoPedidoPage,
});

function NovoPedidoPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_pedido_externo: "",
      cliente_id: "",
      valor_total: 0,
      observacoes_iniciais: "",
    },
  });

  const clienteIdWatcher = watch("cliente_id");

  const { data: clientes, isLoading: isLoadingClientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes" as never)
        .select("id, razao_social, codigo_cliente")
        .order("razao_social");
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Insert Pedido
      const { data: pedido, error: errorPedido } = await supabase
        .from("pedidos" as never)
        .insert({
          numero_pedido_externo: values.numero_pedido_externo,
          cliente_id: values.cliente_id,
          vendedor_id: user.id,
          valor_total: values.valor_total,
          observacoes_iniciais: values.observacoes_iniciais || null,
          status_atual: "Aguardando Separação",
        } as never)
        .select("id")
        .single();

      if (errorPedido) throw errorPedido;

      // 2. Insert Log Status Inicial (Garante o primeiro estado na máquina)
      const { error: errorLog } = await supabase.from("logs_status" as never).insert({
        pedido_id: (pedido as unknown as Pedido).id,
        etapa_nome: "Aguardando Separação",
        usuario_responsavel_id: user.id,
      } as never);

      if (errorLog) throw errorLog;
      return (pedido as unknown as Pedido).id;
    },
    onSuccess: () => {
      toast.success("Pedido criado com sucesso!");
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      navigate({ to: "/pedidos/meus" });
    },
    onError: (e: Error) => toast.error("Erro ao criar pedido", { description: e.message }),
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold">Novo Pedido</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados do pedido de venda.</p>
      </header>

      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="grid gap-6 rounded-lg border border-border bg-card p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="numero_pedido_externo">Número do Pedido *</Label>
            <Input
              id="numero_pedido_externo"
              placeholder="Ex: 123456"
              {...register("numero_pedido_externo")}
            />
            {errors.numero_pedido_externo && (
              <p className="mt-1 text-xs text-destructive">
                {errors.numero_pedido_externo.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="valor_total">Valor Total (R$) *</Label>
            <Input
              id="valor_total"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("valor_total")}
            />
            {errors.valor_total && (
              <p className="mt-1 text-xs text-destructive">{errors.valor_total.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Select
            value={clienteIdWatcher}
            onValueChange={(v) => setValue("cliente_id", v, { shouldValidate: true })}
          >
            <SelectTrigger id="cliente_id" className="w-full">
              <SelectValue
                placeholder={isLoadingClientes ? "Carregando clientes..." : "Selecione o cliente"}
              />
            </SelectTrigger>
            <SelectContent>
              {clientes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.codigo_cliente} - {c.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cliente_id && (
            <p className="mt-1 text-xs text-destructive">{errors.cliente_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="observacoes_iniciais">Observações Iniciais</Label>
          <Textarea
            id="observacoes_iniciais"
            placeholder="Anotações para a logística..."
            {...register("observacoes_iniciais")}
            className="min-h-[100px]"
          />
          {errors.observacoes_iniciais && (
            <p className="mt-1 text-xs text-destructive">{errors.observacoes_iniciais.message}</p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Criar Pedido
          </Button>
        </div>
      </form>
    </div>
  );
}
