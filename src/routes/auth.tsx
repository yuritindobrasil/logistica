import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
// Sincronização forçada Lovable 2
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const emailStr = values.email.trim();
    const { error } = await signIn(emailStr, values.password);
    setSubmitting(false);
    if (error) {
      if (error.includes("Email not confirmed")) {
        toast.error("E-mail não confirmado no Supabase!", {
          description:
            "Você desligou a confirmação, mas a sua conta antiga ainda está presa. Vá no Supabase > Authentication > Users, APAGUE o seu e-mail e clique em CRIAR CONTA MANUALMENTE aqui na tela.",
          duration: 20000,
        });
      } else {
        toast.error("Acesso negado", {
          description: `Detalhes: ${error}`,
          duration: 15000,
        });
      }
      return;
    }
    toast.success("Sessão iniciada");
    navigate({ to: "/dashboard", replace: true });
  };

  const onSignUp = async () => {
    const emailStr = document.querySelector<HTMLInputElement>("#email")?.value.trim();
    const passwordStr = document.querySelector<HTMLInputElement>("#password")?.value;
    if (!emailStr || !passwordStr) {
      toast.error("Preencha email e senha para criar a conta!");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailStr,
      password: passwordStr,
      options: { data: { full_name: emailStr.split("@")[0] } },
    });
    setSubmitting(false);

    if (error) {
      if (error.message.includes("weak")) {
        toast.error("SENHA MUITO FRACA!", {
          description: "O sistema recusou sua senha. Use algo mais forte, ex: Logistica@2026Yuri!",
          duration: 20000,
        });
      } else {
        toast.error("Erro ao criar conta", { description: error.message, duration: 15000 });
      }
    } else if (data.session) {
      toast.success("Conta criada e sessão ativada com sucesso! Redirecionando...");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.warning("Sua conta foi criada, mas o Supabase AINDA EXIGE CONFIRMAÇÃO DE E-MAIL!", {
        description:
          "Você precisa desligar a chave 'Confirm email' no painel do Supabase, depois apagar a conta e tentar de novo.",
        duration: 20000,
      });
    }
  };

  const onTestLogin = async () => {
    setSubmitting(true);
    const testEmail = "admin@logistica.com";
    const testPass = "Logistica@2026Yuri!";

    // Tenta logar primeiro
    const { error: loginError } = await signIn(testEmail, testPass);

    if (!loginError) {
      toast.success("Sessão iniciada como Administrador de Teste");
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    // Se falhar, tenta criar a conta de teste
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPass,
      options: { data: { full_name: "Administrador de Teste" } },
    });
    setSubmitting(false);

    if (error) {
      toast.error("Erro ao criar conta de teste", { description: error.message, duration: 15000 });
    } else if (data.session) {
      toast.success("Conta de teste criada e ativada! Redirecionando...");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.error("Erro: Confirmação de e-mail ainda está ativada no banco de dados.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Logística Interna Infinity</h1>
            <p className="text-xs text-muted-foreground">Acesso restrito · uso corporativo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="username" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              ENTRAR
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onSignUp}
              disabled={submitting}
            >
              CRIAR CONTA MANUALMENTE
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full mt-4 border-2 border-primary"
              onClick={onTestLogin}
              disabled={submitting}
            >
              LOGIN DE EMERGÊNCIA (TESTE)
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sistema fechado. Credenciais fornecidas exclusivamente pelo administrador.
        </p>
      </div>
    </div>
  );
}
