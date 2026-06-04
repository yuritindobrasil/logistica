import { createFileRoute } from "@tanstack/react-router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Cliente } from "@/types/domain";

const schema = z.object({
  codigo_cliente: z
    .string()
    .min(1, "Obrigatório")
    .max(50)
    .regex(/^[a-zA-Z0-9]+$/, "Apenas letras e números (sem símbolos)"),
  razao_social: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(255)
    .transform((v) => v.toUpperCase())
    .refine((v) => v === v.toUpperCase(), "Deve estar em MAIÚSCULAS"),
});
type FormValues = z.input<typeof schema>;

export const Route = createFileRoute("/_authenticated/clientes")({ component: ClientesPage });

function ClientesPage() {
  const qc = useQueryClient();
  const { user, isAdminOrDev, perfil, hasPermissao } = useAuth();
  const canCreate =
    isAdminOrDev || perfil?.role === "vendedor" || hasPermissao("pode_cadastrar_clientes");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { codigo_cliente: "", razao_social: "" },
  });

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes" as never)
        .select("*")
        .order("data_cadastro", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const razao = values.razao_social.toUpperCase();
      const { error } = await supabase.from("clientes" as never).insert({
        codigo_cliente: values.codigo_cliente,
        razao_social: razao,
        usuario_criador_id: user?.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado");
      reset();
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Cadastro com higienização extrema de dados.</p>
      </header>

      {canCreate && (
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[200px_1fr_auto]"
        >
          <div>
            <Label htmlFor="codigo_cliente">Código *</Label>
            <Input
              id="codigo_cliente"
              placeholder="Ex: CLI001"
              {...register("codigo_cliente", {
                onChange: (e) => {
                  // bloqueia símbolos em tempo real
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                },
              })}
            />
            {errors.codigo_cliente && (
              <p className="mt-1 text-xs text-destructive">{errors.codigo_cliente.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="razao_social">Razão Social *</Label>
            <Input
              id="razao_social"
              placeholder="EX: DISTRIBUIDORA EXEMPLO LTDA"
              {...register("razao_social", {
                onChange: (e) => {
                  // INTERCEPTADOR: força MAIÚSCULAS sempre
                  const upper = e.target.value.toUpperCase();
                  e.target.value = upper;
                  setValue("razao_social", upper, { shouldValidate: true });
                },
              })}
            />
            {errors.razao_social && (
              <p className="mt-1 text-xs text-destructive">{errors.razao_social.message}</p>
            )}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Cadastrar
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Código</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead className="w-[200px]">Cadastrado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : !clientes || clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum cliente cadastrado
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.codigo_cliente}</TableCell>
                  <TableCell>{c.razao_social}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(c.data_cadastro).toLocaleString("pt-BR")}
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
