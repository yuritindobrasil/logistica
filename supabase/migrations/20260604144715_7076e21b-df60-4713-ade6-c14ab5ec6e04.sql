
-- ENUM de roles
CREATE TYPE public.app_role AS ENUM ('desenvolvedor', 'admin', 'gestor', 'logistica', 'vendedor');

-- =========================================================
-- TABELA: configuracoes_globais
-- =========================================================
CREATE TABLE public.configuracoes_globais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.configuracoes_globais TO authenticated;
GRANT ALL ON public.configuracoes_globais TO service_role;
ALTER TABLE public.configuracoes_globais ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABELA: usuarios_perfis
-- =========================================================
CREATE TABLE public.usuarios_perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_perfis TO authenticated;
GRANT ALL ON public.usuarios_perfis TO service_role;
ALTER TABLE public.usuarios_perfis ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABELA: permissoes_individuais
-- =========================================================
CREATE TABLE public.permissoes_individuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE NOT NULL REFERENCES public.usuarios_perfis(id) ON DELETE CASCADE,
  pode_avancar_etapa BOOLEAN NOT NULL DEFAULT FALSE,
  pode_ver_obs_privadas BOOLEAN NOT NULL DEFAULT FALSE,
  pode_cadastrar_clientes BOOLEAN NOT NULL DEFAULT FALSE,
  pode_solicitar_compra BOOLEAN NOT NULL DEFAULT FALSE,
  pode_cancelar_nf BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissoes_individuais TO authenticated;
GRANT ALL ON public.permissoes_individuais TO service_role;
ALTER TABLE public.permissoes_individuais ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABELA: clientes
-- =========================================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cliente VARCHAR(50) UNIQUE NOT NULL,
  razao_social VARCHAR(255) NOT NULL,
  usuario_criador_id UUID REFERENCES public.usuarios_perfis(id) ON DELETE SET NULL,
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT codigo_cliente_alfanumerico CHECK (codigo_cliente ~ '^[a-zA-Z0-9]+$'),
  CONSTRAINT razao_social_uppercase CHECK (razao_social = upper(razao_social))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- SECURITY DEFINER FUNCTIONS (evita recursão em RLS)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.usuarios_perfis WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios_perfis WHERE id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dev(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_perfis
    WHERE id = _user_id AND role IN ('admin', 'desenvolvedor')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permissao(_user_id UUID, _permissao TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _result BOOLEAN;
BEGIN
  EXECUTE format('SELECT COALESCE(%I, FALSE) FROM public.permissoes_individuais WHERE usuario_id = $1', _permissao)
  INTO _result USING _user_id;
  RETURN COALESCE(_result, FALSE);
END;
$$;

-- =========================================================
-- POLICIES: configuracoes_globais (apenas desenvolvedor edita)
-- =========================================================
CREATE POLICY "auth_read_config" ON public.configuracoes_globais
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "dev_insert_config" ON public.configuracoes_globais
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "dev_update_config" ON public.configuracoes_globais
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'));
CREATE POLICY "dev_delete_config" ON public.configuracoes_globais
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'));

-- =========================================================
-- POLICIES: usuarios_perfis
-- =========================================================
CREATE POLICY "user_read_own_or_admin" ON public.usuarios_perfis
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin_or_dev(auth.uid()));

CREATE POLICY "admin_insert_perfil" ON public.usuarios_perfis
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_dev(auth.uid()));

-- Usuário pode atualizar próprio nome, mas NÃO role/status.
-- Admin/dev pode atualizar tudo.
CREATE POLICY "update_perfil" ON public.usuarios_perfis
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin_or_dev(auth.uid()))
  WITH CHECK (
    public.is_admin_or_dev(auth.uid())
    OR (auth.uid() = id AND role = public.get_user_role(auth.uid()))
  );

CREATE POLICY "admin_delete_perfil" ON public.usuarios_perfis
  FOR DELETE TO authenticated USING (public.is_admin_or_dev(auth.uid()));

-- =========================================================
-- POLICIES: permissoes_individuais (somente admin/dev)
-- =========================================================
CREATE POLICY "read_own_or_admin_perm" ON public.permissoes_individuais
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id OR public.is_admin_or_dev(auth.uid()));
CREATE POLICY "admin_insert_perm" ON public.permissoes_individuais
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_dev(auth.uid()));
CREATE POLICY "admin_update_perm" ON public.permissoes_individuais
  FOR UPDATE TO authenticated USING (public.is_admin_or_dev(auth.uid()));
CREATE POLICY "admin_delete_perm" ON public.permissoes_individuais
  FOR DELETE TO authenticated USING (public.is_admin_or_dev(auth.uid()));

-- =========================================================
-- POLICIES: clientes
-- =========================================================
CREATE POLICY "auth_read_clientes" ON public.clientes
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "cadastrar_clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_dev(auth.uid())
    OR public.has_role(auth.uid(), 'vendedor')
    OR public.has_permissao(auth.uid(), 'pode_cadastrar_clientes')
  );
CREATE POLICY "admin_update_cliente" ON public.clientes
  FOR UPDATE TO authenticated USING (public.is_admin_or_dev(auth.uid()));
CREATE POLICY "admin_delete_cliente" ON public.clientes
  FOR DELETE TO authenticated USING (public.is_admin_or_dev(auth.uid()));

-- =========================================================
-- TRIGGER: auto-criar perfil + permissões ao registrar
-- Primeiro usuário do sistema vira 'desenvolvedor'
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _count INT;
  _role public.app_role;
BEGIN
  SELECT COUNT(*) INTO _count FROM public.usuarios_perfis;
  IF _count = 0 THEN
    _role := 'desenvolvedor';
  ELSE
    _role := 'vendedor';
  END IF;

  INSERT INTO public.usuarios_perfis (id, nome_completo, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
    NEW.email,
    _role
  );

  INSERT INTO public.permissoes_individuais (usuario_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SEED: faixas_calculo_eficiencia
-- =========================================================
INSERT INTO public.configuracoes_globais (chave, valor, descricao) VALUES (
  'faixas_calculo_eficiencia',
  '{"padrao": 200, "faixa_2": 500, "faixa_3": 1000, "faixa_4": 5000, "faixa_5": 10000}'::jsonb,
  'Faixas de itens por hora para cálculo de eficiência logística'
);
