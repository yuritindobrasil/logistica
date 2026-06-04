import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Settings2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { perfil, isAdminOrDev } = useAuth();

  const { data: counts } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const [u, c] = await Promise.all([
        supabase.from("usuarios_perfis" as never).select("*", { count: "exact", head: true }),
        supabase.from("clientes" as never).select("*", { count: "exact", head: true }),
      ]);
      return { usuarios: u.count ?? 0, clientes: c.count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Bem-vindo, {perfil?.nome_completo.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Perfil ativo:{" "}
          <span className="text-foreground">{perfil ? ROLE_LABELS[perfil.role] : ""}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isAdminOrDev && <StatCard icon={Users} label="Usuários" value={counts?.usuarios ?? "—"} />}
        <StatCard icon={Building2} label="Clientes" value={counts?.clientes ?? "—"} />
        <StatCard icon={ShieldCheck} label="Status" value="Operacional" />
        {perfil?.role === "desenvolvedor" && (
          <StatCard icon={Settings2} label="Modo" value="Super Admin" />
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Etapa 1 — Fundação Enterprise
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>✓ Autenticação fechada (sem auto-cadastro)</li>
          <li>✓ Controle granular por Role + Permissões Individuais</li>
          <li>✓ Higienização extrema no cadastro de clientes</li>
          <li>✓ Painel de configurações globais editável (JSONB)</li>
        </ul>
      </div>
    </div>
  );
}
