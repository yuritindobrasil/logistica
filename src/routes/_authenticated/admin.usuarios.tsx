import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Settings2 } from "lucide-react";
import { RouteGuard } from "@/components/RouteGuard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ROLE_LABELS,
  ROLES,
  type AppRole,
  type PermissoesIndividuais,
  type UsuarioPerfil,
} from "@/types/domain";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: () => (
    <RouteGuard roles={["admin", "desenvolvedor"]}>
      <UsuariosPage />
    </RouteGuard>
  ),
});

const PERM_KEYS: Array<{
  key: keyof Omit<PermissoesIndividuais, "id" | "usuario_id" | "updated_at">;
  label: string;
}> = [
  { key: "pode_avancar_etapa", label: "Avançar Etapa" },
  { key: "pode_ver_obs_privadas", label: "Ver Observações Privadas" },
  { key: "pode_cadastrar_clientes", label: "Cadastrar Clientes" },
  { key: "pode_solicitar_compra", label: "Solicitar Compra" },
  { key: "pode_cancelar_nf", label: "Cancelar NF" },
];

function UsuariosPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "todos">("todos");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<UsuarioPerfil | null>(null);
  const pageSize = 10;

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios_perfis" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UsuarioPerfil[];
    },
  });

  const filtered = useMemo(() => {
    return (usuarios ?? []).filter((u) => {
      const matchBusca =
        !busca ||
        u.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase());
      const matchRole = roleFilter === "todos" || u.role === roleFilter;
      return matchBusca && matchRole;
    });
  }, [usuarios, busca, roleFilter]);

  const pageData = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase
        .from("usuarios_perfis" as never)
        .update({ role } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role atualizada");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Gestão de Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Visão Administrativa — Roles e Permissões Individuais.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v as AppRole | "todos");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-[180px]">Role</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[140px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum usuário
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome_completo}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => roleMutation.mutate({ id: u.id, role: v as AppRole })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status ? "default" : "secondary"}>
                      {u.status ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(u)}>
                      <Settings2 className="mr-2 h-3.5 w-3.5" /> Permissões
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border p-3 text-sm">
          <p className="text-muted-foreground">
            {filtered.length} usuário(s) · Página {page + 1}/{totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <PermissoesSheet usuario={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PermissoesSheet({
  usuario,
  onClose,
}: {
  usuario: UsuarioPerfil | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data: perm } = useQuery({
    queryKey: ["perm", usuario?.id],
    enabled: !!usuario,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissoes_individuais" as never)
        .select("*")
        .eq("usuario_id", usuario!.id)
        .maybeSingle();
      if (error) throw error;
      return data as PermissoesIndividuais | null;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (!usuario) return;
      const { error } = await supabase
        .from("permissoes_individuais" as never)
        .update({ [key]: value } as never)
        .eq("usuario_id", usuario.id);
      if (error) throw error;
    },
    onMutate: async ({ key, value }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ["perm", usuario?.id] });
      const prev = qc.getQueryData<PermissoesIndividuais | null>(["perm", usuario?.id]);
      if (prev) qc.setQueryData(["perm", usuario?.id], { ...prev, [key]: value });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["perm", usuario?.id], ctx.prev);
      toast.error("Falha", { description: e.message });
    },
    onSuccess: () => toast.success("Permissão atualizada"),
  });

  return (
    <Sheet open={!!usuario} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Permissões Individuais</SheetTitle>
          <SheetDescription>
            {usuario?.nome_completo} ·{" "}
            <span className="text-foreground">{usuario && ROLE_LABELS[usuario.role]}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-4">
          {PERM_KEYS.map(({ key, label }) => {
            const checked = !!perm?.[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border border-border bg-secondary/30 p-3"
              >
                <Label htmlFor={key} className="cursor-pointer">
                  {label}
                </Label>
                <Switch
                  id={key}
                  checked={checked}
                  onCheckedChange={(v) => mutation.mutate({ key, value: v })}
                />
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
