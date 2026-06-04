export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      clientes: {
        Row: {
          codigo_cliente: string;
          data_cadastro: string;
          id: string;
          razao_social: string;
          usuario_criador_id: string | null;
        };
        Insert: {
          codigo_cliente: string;
          data_cadastro?: string;
          id?: string;
          razao_social: string;
          usuario_criador_id?: string | null;
        };
        Update: {
          codigo_cliente?: string;
          data_cadastro?: string;
          id?: string;
          razao_social?: string;
          usuario_criador_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clientes_usuario_criador_id_fkey";
            columns: ["usuario_criador_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      configuracoes_globais: {
        Row: {
          chave: string;
          descricao: string | null;
          id: string;
          updated_at: string;
          valor: Json;
        };
        Insert: {
          chave: string;
          descricao?: string | null;
          id?: string;
          updated_at?: string;
          valor: Json;
        };
        Update: {
          chave?: string;
          descricao?: string | null;
          id?: string;
          updated_at?: string;
          valor?: Json;
        };
        Relationships: [];
      };
      permissoes_individuais: {
        Row: {
          id: string;
          pode_avancar_etapa: boolean;
          pode_cadastrar_clientes: boolean;
          pode_cancelar_nf: boolean;
          pode_solicitar_compra: boolean;
          pode_ver_obs_privadas: boolean;
          updated_at: string;
          usuario_id: string;
        };
        Insert: {
          id?: string;
          pode_avancar_etapa?: boolean;
          pode_cadastrar_clientes?: boolean;
          pode_cancelar_nf?: boolean;
          pode_solicitar_compra?: boolean;
          pode_ver_obs_privadas?: boolean;
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          id?: string;
          pode_avancar_etapa?: boolean;
          pode_cadastrar_clientes?: boolean;
          pode_cancelar_nf?: boolean;
          pode_solicitar_compra?: boolean;
          pode_ver_obs_privadas?: boolean;
          updated_at?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "permissoes_individuais_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: true;
            referencedRelation: "usuarios_perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      usuarios_perfis: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          nome_completo: string;
          role: Database["public"]["Enums"]["app_role"];
          status: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          nome_completo: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          nome_completo?: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      pedidos: {
        Row: {
          id: string;
          numero_pedido_externo: string;
          cliente_id: string;
          vendedor_id: string;
          valor_total: number;
          status_atual: Database["public"]["Enums"]["status_pedido"];
          observacoes_iniciais: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          numero_pedido_externo: string;
          cliente_id: string;
          vendedor_id: string;
          valor_total?: number;
          status_atual?: Database["public"]["Enums"]["status_pedido"];
          observacoes_iniciais?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          numero_pedido_externo?: string;
          cliente_id?: string;
          vendedor_id?: string;
          valor_total?: number;
          status_atual?: Database["public"]["Enums"]["status_pedido"];
          observacoes_iniciais?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pedidos_vendedor_id_fkey";
            columns: ["vendedor_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      logs_status: {
        Row: {
          id: string;
          pedido_id: string;
          etapa_nome: Database["public"]["Enums"]["status_pedido"];
          data_hora_inicio: string;
          data_hora_fim: string | null;
          usuario_responsavel_id: string | null;
        };
        Insert: {
          id?: string;
          pedido_id: string;
          etapa_nome: Database["public"]["Enums"]["status_pedido"];
          data_hora_inicio?: string;
          data_hora_fim?: string | null;
          usuario_responsavel_id?: string | null;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          etapa_nome?: Database["public"]["Enums"]["status_pedido"];
          data_hora_inicio?: string;
          data_hora_fim?: string | null;
          usuario_responsavel_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "logs_status_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logs_status_usuario_responsavel_id_fkey";
            columns: ["usuario_responsavel_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      observacoes_operacionais: {
        Row: {
          id: string;
          pedido_id: string;
          usuario_id: string | null;
          texto_observacao: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          pedido_id: string;
          usuario_id?: string | null;
          texto_observacao: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          usuario_id?: string | null;
          texto_observacao?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "observacoes_operacionais_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "observacoes_operacionais_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_perfis";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: { _user_id: string };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_permissao: {
        Args: { _permissao: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin_or_dev: { Args: { _user_id: string }; Returns: boolean };
      fn_avancar_etapa_pedido: {
        Args: {
          p_pedido_id: string;
          p_novo_status: Database["public"]["Enums"]["status_pedido"];
          p_usuario_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      app_role: "desenvolvedor" | "admin" | "gestor" | "logistica" | "vendedor";
      status_pedido:
        | "Aguardando Separação"
        | "Em Separação"
        | "Em Conferência"
        | "Alteração de Pedido"
        | "Aguardando Compra"
        | "Faturamento"
        | "Em Rota"
        | "Entregue"
        | "Cancelado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["desenvolvedor", "admin", "gestor", "logistica", "vendedor"],
      status_pedido: [
        "Aguardando Separação",
        "Em Separação",
        "Em Conferência",
        "Alteração de Pedido",
        "Aguardando Compra",
        "Faturamento",
        "Em Rota",
        "Entregue",
        "Cancelado",
      ],
    },
  },
} as const;
