import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/auth", replace: true });
  }, [loading, user, navigate]);
  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Carregando…
    </div>
  );
}
