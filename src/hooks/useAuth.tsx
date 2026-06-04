import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, PermissoesIndividuais, UsuarioPerfil } from "@/types/domain";

const PROFILE_INTEGRITY_MESSAGE =
  "Erro de integridade de perfil. Usuário não possui dados na tabela de perfis.";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  perfil: UsuarioPerfil | null;
  permissoes: PermissoesIndividuais | null;
  loading: boolean;
  isAdminOrDev: boolean;
  hasRole: (role: AppRole | AppRole[]) => boolean;
  hasPermissao: (
    key: keyof Omit<PermissoesIndividuais, "id" | "usuario_id" | "updated_at">,
  ) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesIndividuais | null>(null);
  const [loading, setLoading] = useState(true);
  const integrityToastShownRef = useRef(false);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setPerfil(null);
    setPermissoes(null);
  }, []);

  const handleProfileIntegrityFailure = useCallback(
    async (error: unknown) => {
      console.error("[Auth] Falha de integridade ao carregar perfil/permissões:", error);
      clearAuthState();
      setLoading(false);
      if (!integrityToastShownRef.current) {
        integrityToastShownRef.current = true;
        toast.error(PROFILE_INTEGRITY_MESSAGE);
      }
      await supabase.auth.signOut();
    },
    [clearAuthState],
  );

  const loadPerfil = useCallback(
    async (uid: string) => {
      try {
        const [{ data: p, error: perfilError }, { data: perm, error: permissoesError }] =
          await Promise.all([
            supabase
              .from("usuarios_perfis" as never)
              .select("*")
              .eq("id", uid)
              .maybeSingle(),
            supabase
              .from("permissoes_individuais" as never)
              .select("*")
              .eq("usuario_id", uid)
              .maybeSingle(),
          ]);

        if (perfilError || permissoesError) {
          throw perfilError ?? permissoesError;
        }

        let finalP = p;
        let finalPerm = perm;

        if (!p) {
          const { data: userData } = await supabase.auth.getUser();
          const email = userData.user?.email || "";
          const role = email === "marcosyuriaraujosouza@gmail.com" ? "desenvolvedor" : "vendedor";

          const { data: newP, error: errP } = await supabase
            .from("usuarios_perfis" as never)
            .insert({
              id: uid,
              email: email,
              nome_completo: email.split("@")[0],
              role: role,
              status: true,
            } as never)
            .select()
            .single();
          if (errP) throw errP;
          finalP = newP;
        }

        if (!perm) {
          const { data: newPerm, error: errPerm } = await supabase
            .from("permissoes_individuais" as never)
            .insert({
              usuario_id: uid,
              pode_avancar_etapa: true,
              pode_ver_obs_privadas: true,
              pode_cadastrar_clientes: true,
              pode_solicitar_compra: true,
              pode_cancelar_nf: true,
            } as never)
            .select()
            .single();
          if (errPerm) throw errPerm;
          finalPerm = newPerm;
        }

        setPerfil(finalP as UsuarioPerfil);
        setPermissoes(finalPerm as PermissoesIndividuais);
      } catch (error) {
        await handleProfileIntegrityFailure(error);
      }
    },
    [handleProfileIntegrityFailure],
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setLoading(true);
        setTimeout(() => {
          void loadPerfil(s.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        clearAuthState();
        setLoading(false);
      }
    });

    const validateInitialSession = async () => {
      try {
        const [{ data: sessionData }, { data: userData, error: userError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        if (userError || !userData.user) {
          clearAuthState();
          return;
        }

        setSession(sessionData.session);
        setUser(userData.user);
        await loadPerfil(userData.user.id);
      } catch (error) {
        console.error("[Auth] Falha ao validar sessão inicial:", error);
        clearAuthState();
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };

    void validateInitialSession();

    return () => subscription.unsubscribe();
  }, [clearAuthState, loadPerfil]);

  const signIn = async (email: string, password: string) => {
    integrityToastShownRef.current = false;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
    setPermissoes(null);
  };

  const refreshPerfil = async () => {
    if (user) await loadPerfil(user.id);
  };

  const hasRole = (role: AppRole | AppRole[]) => {
    if (!perfil) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(perfil.role);
  };

  const hasPermissao: AuthContextValue["hasPermissao"] = (key) => {
    return !!permissoes?.[key];
  };

  const isAdminOrDev = !!perfil && (perfil.role === "admin" || perfil.role === "desenvolvedor");

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        perfil,
        permissoes,
        loading,
        isAdminOrDev,
        hasRole,
        hasPermissao,
        signIn,
        signOut,
        refreshPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
