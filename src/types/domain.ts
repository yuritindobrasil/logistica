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
