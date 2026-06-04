-- Criação do ENUM
CREATE TYPE public.status_pedido AS ENUM (
  'Aguardando Separação',
  'Em Separação',
  'Em Conferência',
  'Alteração de Pedido',
  'Aguardando Compra',
  'Faturamento',
  'Em Rota',
  'Entregue',
  'Cancelado'
);

-- Tabela de Pedidos
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido_externo VARCHAR NOT NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    vendedor_id UUID NOT NULL REFERENCES public.usuarios_perfis(id) ON DELETE RESTRICT,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    status_atual public.status_pedido NOT NULL DEFAULT 'Aguardando Separação'::public.status_pedido,
    observacoes_iniciais TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Logs de Status
CREATE TABLE public.logs_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    etapa_nome public.status_pedido NOT NULL,
    data_hora_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_hora_fim TIMESTAMPTZ,
    usuario_responsavel_id UUID REFERENCES public.usuarios_perfis(id) ON DELETE SET NULL
);

-- Tabela de Observações Operacionais
CREATE TABLE public.observacoes_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios_perfis(id) ON DELETE SET NULL,
    texto_observacao TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacoes_operacionais ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Pedidos
-- Vendedor vê apenas seus próprios pedidos
CREATE POLICY "vendedor_select_pedidos" ON public.pedidos
FOR SELECT
USING ( auth.uid() = vendedor_id OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'gestor'::public.app_role) OR public.has_role(auth.uid(), 'logistica'::public.app_role) );

-- Vendedor pode inserir seus próprios pedidos
CREATE POLICY "vendedor_insert_pedidos" ON public.pedidos
FOR INSERT
WITH CHECK ( auth.uid() = vendedor_id );

-- Todos podem atualizar os pedidos se tiverem permissão de avançar etapa (mas por segurança, restrinjo ao update de status via a function, ou policies gerais)
-- Vamos dar acesso de UPDATE para logistica, gestor e admin
CREATE POLICY "admin_logistica_update_pedidos" ON public.pedidos
FOR UPDATE
USING ( public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'gestor'::public.app_role) OR public.has_role(auth.uid(), 'logistica'::public.app_role) OR public.has_permissao(auth.uid(), 'pode_avancar_etapa') );

-- Políticas para logs_status (Todos podem ler e inserir, afinal qualquer ator pode ser o responsável por iniciar ou fechar a etapa)
CREATE POLICY "all_select_logs" ON public.logs_status FOR SELECT USING (true);
CREATE POLICY "all_insert_logs" ON public.logs_status FOR INSERT WITH CHECK (true);
CREATE POLICY "all_update_logs" ON public.logs_status FOR UPDATE USING (true);

-- Políticas para observacoes_operacionais
CREATE POLICY "all_select_obs" ON public.observacoes_operacionais FOR SELECT USING (true);
CREATE POLICY "all_insert_obs" ON public.observacoes_operacionais FOR INSERT WITH CHECK ( auth.uid() = usuario_id );


-- Função RPC para avançar etapa com segurança (Transação ACID)
CREATE OR REPLACE FUNCTION public.fn_avancar_etapa_pedido(
    p_pedido_id UUID,
    p_novo_status public.status_pedido,
    p_usuario_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios de quem criou, garantindo que o trigger/função faça os updates sem restrições de RLS caso haja alguma minúcia que trave
AS $$
BEGIN
    -- 1. Fecha o log anterior (aquele que está com data_hora_fim NULL)
    UPDATE public.logs_status
    SET data_hora_fim = NOW()
    WHERE pedido_id = p_pedido_id AND data_hora_fim IS NULL;

    -- 2. Insere o novo log
    INSERT INTO public.logs_status (pedido_id, etapa_nome, usuario_responsavel_id, data_hora_inicio)
    VALUES (p_pedido_id, p_novo_status, p_usuario_id, NOW());

    -- 3. Atualiza o status no pedido
    UPDATE public.pedidos
    SET status_atual = p_novo_status
    WHERE id = p_pedido_id;

END;
$$;
