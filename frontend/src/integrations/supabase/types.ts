export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          last_decision: string | null
          metrics: Json | null
          name: string
          role: Database["public"]["Enums"]["agent_role"]
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          last_decision?: string | null
          metrics?: Json | null
          name: string
          role: Database["public"]["Enums"]["agent_role"]
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          last_decision?: string | null
          metrics?: Json | null
          name?: string
          role?: Database["public"]["Enums"]["agent_role"]
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Relationships: []
      }
      edges: {
        Row: {
          created_at: string
          diameter_mm: number
          flow_lps: number | null
          from_node_id: string
          id: string
          length_m: number
          name: string
          status: Database["public"]["Enums"]["edge_status"]
          to_node_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diameter_mm: number
          flow_lps?: number | null
          from_node_id: string
          id?: string
          length_m: number
          name: string
          status?: Database["public"]["Enums"]["edge_status"]
          to_node_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diameter_mm?: number
          flow_lps?: number | null
          from_node_id?: string
          id?: string
          length_m?: number
          name?: string
          status?: Database["public"]["Enums"]["edge_status"]
          to_node_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_prices: {
        Row: {
          created_at: string
          id: string
          is_off_peak: boolean | null
          price_per_kwh: number
          timestamp: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_off_peak?: boolean | null
          price_per_kwh: number
          timestamp: string
        }
        Update: {
          created_at?: string
          id?: string
          is_off_peak?: boolean | null
          price_per_kwh?: number
          timestamp?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          asset_ref: string | null
          asset_type: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          severity: Database["public"]["Enums"]["event_severity"]
          state: Database["public"]["Enums"]["event_state"]
          timeline: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          asset_ref?: string | null
          asset_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          severity: Database["public"]["Enums"]["event_severity"]
          state?: Database["public"]["Enums"]["event_state"]
          timeline?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          asset_ref?: string | null
          asset_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          severity?: Database["public"]["Enums"]["event_severity"]
          state?: Database["public"]["Enums"]["event_state"]
          timeline?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      nodes: {
        Row: {
          created_at: string
          elevation: number
          id: string
          name: string
          pressure: number | null
          type: Database["public"]["Enums"]["node_type"]
          updated_at: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          elevation?: number
          id?: string
          name: string
          pressure?: number | null
          type: Database["public"]["Enums"]["node_type"]
          updated_at?: string
          x: number
          y: number
        }
        Update: {
          created_at?: string
          elevation?: number
          id?: string
          name?: string
          pressure?: number | null
          type?: Database["public"]["Enums"]["node_type"]
          updated_at?: string
          x?: number
          y?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sensors: {
        Row: {
          asset_id: string
          asset_type: string
          created_at: string
          id: string
          last_seen: string | null
          type: Database["public"]["Enums"]["sensor_type"]
          unit: string
          updated_at: string
          value: number | null
        }
        Insert: {
          asset_id: string
          asset_type: string
          created_at?: string
          id?: string
          last_seen?: string | null
          type: Database["public"]["Enums"]["sensor_type"]
          unit: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          asset_id?: string
          asset_type?: string
          created_at?: string
          id?: string
          last_seen?: string | null
          type?: Database["public"]["Enums"]["sensor_type"]
          unit?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      valves_pumps: {
        Row: {
          created_at: string
          edge_id: string
          id: string
          kind: Database["public"]["Enums"]["valve_kind"]
          name: string
          setpoint: number | null
          status: Database["public"]["Enums"]["edge_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          edge_id: string
          id?: string
          kind: Database["public"]["Enums"]["valve_kind"]
          name: string
          setpoint?: number | null
          status?: Database["public"]["Enums"]["edge_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          edge_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["valve_kind"]
          name?: string
          setpoint?: number | null
          status?: Database["public"]["Enums"]["edge_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "valves_pumps_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "edges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_role: "leak-preempt" | "energy-optimizer" | "safety"
      agent_status: "enabled" | "disabled" | "running"
      app_role: "operator" | "engineer" | "admin"
      edge_status: "open" | "closed" | "isolated"
      event_kind: "leak" | "quality" | "energy" | "maintenance"
      event_severity: "low" | "medium" | "high" | "critical"
      event_state: "open" | "acknowledged" | "resolved"
      node_type: "junction" | "tank" | "reservoir"
      sensor_type: "pressure" | "flow" | "acoustic" | "quality"
      valve_kind: "valve" | "pump"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_role: ["leak-preempt", "energy-optimizer", "safety"],
      agent_status: ["enabled", "disabled", "running"],
      app_role: ["operator", "engineer", "admin"],
      edge_status: ["open", "closed", "isolated"],
      event_kind: ["leak", "quality", "energy", "maintenance"],
      event_severity: ["low", "medium", "high", "critical"],
      event_state: ["open", "acknowledged", "resolved"],
      node_type: ["junction", "tank", "reservoir"],
      sensor_type: ["pressure", "flow", "acoustic", "quality"],
      valve_kind: ["valve", "pump"],
    },
  },
} as const
