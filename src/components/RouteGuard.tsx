import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole, PermissoesIndividuais } from "@/types/domain";

interface GuardProps {
  children: ReactNode;
  roles?: AppRole[];
  permissao?: keyof Omit<PermissoesIndividuais, "id" | "usuario_id" | "updated_at">;
}

/** HOC de proteção: valida JWT + Role + Permissão Individual. */
export function RouteGuard({ children, roles, permissao }: GuardProps) {
  const { loading, user, perfil, hasRole, hasPermissao, isAdminOrDev } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (!perfil) return;

    let allowed = true;
    if (roles && roles.length > 0 && !isAdminOrDev) {
      allowed = hasRole(roles);
    }
    if (allowed && permissao && !isAdminOrDev) {
      allowed = hasPermissao(permissao);
    }
    if (!allowed) {
      toast.error("Violação de acesso", {
        description: "Você não possui permissão para acessar este recurso.",
      });
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, perfil, roles, permissao, hasRole, hasPermissao, isAdminOrDev, navigate]);

  if (loading || !user || !perfil) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Validando sessão…
      </div>
    );
  }
  return <>{children}</>;
}
