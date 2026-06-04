export type AppRole = 'desenvolvedor' | 'admin' | 'gestor' | 'logistica' | 'vendedor';

export interface UsuarioPerfil {
  id: string;
  nome_completo: string;
  email: string;
  role: AppRole;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissoesIndividuais {
  id: string;
  usuario_id: string;
  pode_avancar_etapa: boolean;
  pode_ver_obs_privadas: boolean;
  pode_cadastrar_clientes: boolean;
  pode_solicitar_compra: boolean;
  pode_cancelar_nf: boolean;
  updated_at: string;
}

export interface ConfiguracaoGlobal {
  id: string;
  chave: string;
  valor: Record<string, unknown>;
  descricao: string | null;
  updated_at: string;
}

export interface Cliente {
  id: string;
  codigo_cliente: string;
  razao_social: string;
  usuario_criador_id: string | null;
  data_cadastro: string;
}

export type StatusPedido = 
  | 'Aguardando Separação'
  | 'Em Separação'
  | 'Em Conferência'
  | 'Alteração de Pedido'
  | 'Aguardando Compra'
  | 'Faturamento'
  | 'Em Rota'
  | 'Entregue'
  | 'Cancelado';

export interface Pedido {
  id: string;
  numero_pedido_externo: string;
  cliente_id: string;
  vendedor_id: string;
  valor_total: number;
  status_atual: StatusPedido;
  observacoes_iniciais: string | null;
  criado_em: string;
  // For relations:
  cliente?: Cliente;
  vendedor?: UsuarioPerfil;
}

export interface LogStatus {
  id: string;
  pedido_id: string;
  etapa_nome: StatusPedido;
  data_hora_inicio: string;
  data_hora_fim: string | null;
  usuario_responsavel_id: string | null;
  // For relations:
  responsavel?: UsuarioPerfil;
}

export interface ObservacaoOperacional {
  id: string;
  pedido_id: string;
  usuario_id: string | null;
  texto_observacao: string;
  criado_em: string;
  // For relations:
  usuario?: UsuarioPerfil;
}

export interface FaixasEficiencia {
  padrao: number;
  faixa_2: number;
  faixa_3: number;
  faixa_4: number;
  faixa_5: number;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  desenvolvedor: 'Desenvolvedor',
  admin: 'Administrador',
  gestor: 'Gestor',
  logistica: 'Logística',
  vendedor: 'Vendedor',
};

export const ROLES: AppRole[] = ['desenvolvedor', 'admin', 'gestor', 'logistica', 'vendedor'];
