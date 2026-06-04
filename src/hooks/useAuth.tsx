import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, PermissoesIndividuais, UsuarioPerfil } from '@/types/domain';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  perfil: UsuarioPerfil | null;
  permissoes: PermissoesIndividuais | null;
  loading: boolean;
  isAdminOrDev: boolean;
  hasRole: (role: AppRole | AppRole[]) => boolean;
  hasPermissao: (key: keyof Omit<PermissoesIndividuais, 'id' | 'usuario_id' | 'updated_at'>) => boolean;
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

  const loadPerfil = async (uid: string) => {
    const { data: p } = await supabase
      .from('usuarios_perfis' as never)
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    const { data: perm } = await supabase
      .from('permissoes_individuais' as never)
      .select('*')
      .eq('usuario_id', uid)
      .maybeSingle();
    setPerfil((p as UsuarioPerfil | null) ?? null);
    setPermissoes((perm as PermissoesIndividuais | null) ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => { void loadPerfil(s.user.id); }, 0);
      } else {
        setPerfil(null);
        setPermissoes(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void loadPerfil(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
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

  const hasPermissao: AuthContextValue['hasPermissao'] = (key) => {
    return !!permissoes?.[key];
  };

  const isAdminOrDev = !!perfil && (perfil.role === 'admin' || perfil.role === 'desenvolvedor');

  return (
    <AuthContext.Provider
      value={{ session, user, perfil, permissoes, loading, isAdminOrDev, hasRole, hasPermissao, signIn, signOut, refreshPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
