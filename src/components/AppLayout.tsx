import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Settings2,
  Wrench,
  Building2,
  Package,
  PackagePlus,
  Kanban,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  show: boolean;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { perfil, isAdminOrDev, hasPermissao, signOut } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  const items: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    {
      to: "/pedidos/novo",
      label: "Novo Pedido",
      icon: PackagePlus,
      show: isAdminOrDev || perfil?.role === "vendedor" || perfil?.role === "gestor",
    },
    {
      to: "/pedidos/meus",
      label: "Meus Pedidos",
      icon: Package,
      show: isAdminOrDev || perfil?.role === "vendedor" || perfil?.role === "gestor",
    },
    {
      to: "/logistica/painel",
      label: "Painel Operacional",
      icon: Kanban,
      show: isAdminOrDev || perfil?.role === "logistica" || perfil?.role === "gestor",
    },
    {
      to: "/clientes",
      label: "Clientes",
      icon: Building2,
      show: isAdminOrDev || perfil?.role === "vendedor" || hasPermissao("pode_cadastrar_clientes"),
    },
    { to: "/admin/usuarios", label: "Usuários", icon: Users, show: isAdminOrDev },
    { to: "/admin/permissoes-globais", label: "Permissões", icon: Settings2, show: isAdminOrDev },
    {
      to: "/dev/config",
      label: "Configurações Globais",
      icon: Wrench,
      show: perfil?.role === "desenvolvedor",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border px-6 py-5">
          <h1 className="text-sm font-semibold tracking-wide text-sidebar-foreground">
            LOGÍSTICA INTERNA
          </h1>
          <p className="text-xs text-muted-foreground">infinity · enterprise</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items
            .filter((i) => i.show)
            .map((i) => {
              const active = location.pathname === i.to || location.pathname.startsWith(i.to + "/");
              const Icon = i.icon;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {i.label}
                </Link>
              );
            })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium">{perfil?.nome_completo}</p>
          <p className="truncate text-xs text-muted-foreground">
            {perfil ? ROLE_LABELS[perfil.role] : ""}
          </p>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
