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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          first_purchase_date: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_purchase_date?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_purchase_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_data: {
        Row: {
          app_settings: Json | null
          business_segment: string
          company_name: string
          created_at: string
          current_year_data: Json
          custom_logo_url: string | null
          historical_data: Json
          id: string
          kpis: Json
          last_upload_date: string | null
          mentorship_start_date: string | null
          selected_month: string | null
          team: Json
          updated_at: string
          user_id: string
          years_available: number[] | null
        }
        Insert: {
          app_settings?: Json | null
          business_segment?: string
          company_name?: string
          created_at?: string
          current_year_data?: Json
          custom_logo_url?: string | null
          historical_data?: Json
          id?: string
          kpis?: Json
          last_upload_date?: string | null
          mentorship_start_date?: string | null
          selected_month?: string | null
          team?: Json
          updated_at?: string
          user_id: string
          years_available?: number[] | null
        }
        Update: {
          app_settings?: Json | null
          business_segment?: string
          company_name?: string
          created_at?: string
          current_year_data?: Json
          custom_logo_url?: string | null
          historical_data?: Json
          id?: string
          kpis?: Json
          last_upload_date?: string | null
          mentorship_start_date?: string | null
          selected_month?: string | null
          team?: Json
          updated_at?: string
          user_id?: string
          years_available?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fivi_sessions: {
        Row: {
          actions_executed: string | null
          created_at: string
          date: string
          failed_actions: string | null
          id: string
          improvement_ideas: string | null
          notes: string | null
          previous_commitment: number | null
          previous_realized: number | null
          salesperson_id: string
          salesperson_name: string
          status: string
          support_needed: string | null
          updated_at: string
          user_id: string
          week_number: number
          weekly_commitment: number
          weekly_goal: number
          weekly_realized: number
        }
        Insert: {
          actions_executed?: string | null
          created_at?: string
          date?: string
          failed_actions?: string | null
          id?: string
          improvement_ideas?: string | null
          notes?: string | null
          previous_commitment?: number | null
          previous_realized?: number | null
          salesperson_id: string
          salesperson_name: string
          status?: string
          support_needed?: string | null
          updated_at?: string
          user_id: string
          week_number: number
          weekly_commitment?: number
          weekly_goal?: number
          weekly_realized?: number
        }
        Update: {
          actions_executed?: string | null
          created_at?: string
          date?: string
          failed_actions?: string | null
          id?: string
          improvement_ideas?: string | null
          notes?: string | null
          previous_commitment?: number | null
          previous_realized?: number | null
          salesperson_id?: string
          salesperson_name?: string
          status?: string
          support_needed?: string | null
          updated_at?: string
          user_id?: string
          week_number?: number
          weekly_commitment?: number
          weekly_goal?: number
          weekly_realized?: number
        }
        Relationships: []
      }
      invites: {
        Row: {
          consultant_name: string | null
          created_at: string
          created_by: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          invite_token: string | null
          registered_uid: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          consultant_name?: string | null
          created_at?: string
          created_by: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string | null
          registered_uid?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          consultant_name?: string | null
          created_at?: string
          created_by?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string | null
          registered_uid?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_registered_uid_fkey"
            columns: ["registered_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          approach_date: string | null
          client_name: string
          closing_date: string | null
          comments: string | null
          converted_sale_id: string | null
          created_at: string | null
          email: string | null
          estimated_value: number | null
          followup_date: string | null
          id: string
          lead_source: string | null
          negotiation_date: string | null
          next_contact_date: string | null
          next_contact_notes: string | null
          phone: string | null
          post_sale_date: string | null
          presentation_date: string | null
          prospecting_date: string | null
          salesperson_id: string | null
          salesperson_name: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approach_date?: string | null
          client_name: string
          closing_date?: string | null
          comments?: string | null
          converted_sale_id?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          followup_date?: string | null
          id?: string
          lead_source?: string | null
          negotiation_date?: string | null
          next_contact_date?: string | null
          next_contact_notes?: string | null
          phone?: string | null
          post_sale_date?: string | null
          presentation_date?: string | null
          prospecting_date?: string | null
          salesperson_id?: string | null
          salesperson_name?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approach_date?: string | null
          client_name?: string
          closing_date?: string | null
          comments?: string | null
          converted_sale_id?: string | null
          created_at?: string | null
          email?: string | null
          estimated_value?: number | null
          followup_date?: string | null
          id?: string
          lead_source?: string | null
          negotiation_date?: string | null
          next_contact_date?: string | null
          next_contact_notes?: string | null
          phone?: string | null
          post_sale_date?: string | null
          presentation_date?: string | null
          prospecting_date?: string | null
          salesperson_id?: string | null
          salesperson_name?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_sale_id_fkey"
            columns: ["converted_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_view: string | null
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          priority: string
          read: boolean | null
          related_student_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_view?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          priority?: string
          read?: boolean | null
          related_student_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_view?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          priority?: string
          read?: boolean | null
          related_student_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pgv_entries: {
        Row: {
          created_at: string
          daily_goal: number
          id: string
          monthly_accumulated: number
          pgv_week_id: string
          salesperson_id: string
          salesperson_name: string
          updated_at: string
          user_id: string
          weekly_goal: number
          weekly_realized: number
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          id?: string
          monthly_accumulated?: number
          pgv_week_id: string
          salesperson_id: string
          salesperson_name: string
          updated_at?: string
          user_id: string
          weekly_goal?: number
          weekly_realized?: number
        }
        Update: {
          created_at?: string
          daily_goal?: number
          id?: string
          monthly_accumulated?: number
          pgv_week_id?: string
          salesperson_id?: string
          salesperson_name?: string
          updated_at?: string
          user_id?: string
          weekly_goal?: number
          weekly_realized?: number
        }
        Relationships: [
          {
            foreignKeyName: "pgv_entries_pgv_week_id_fkey"
            columns: ["pgv_week_id"]
            isOneToOne: false
            referencedRelation: "pgv_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      pgv_weeks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          month: number
          monthly_goal: number
          start_date: string
          updated_at: string
          user_id: string
          week_number: number
          working_days: number
          year: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          month: number
          monthly_goal?: number
          start_date: string
          updated_at?: string
          user_id: string
          week_number: number
          working_days?: number
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          month?: number
          monthly_goal?: number
          start_date?: string
          updated_at?: string
          user_id?: string
          week_number?: number
          working_days?: number
          year?: number
        }
        Relationships: []
      }
      premium_policies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          tiers: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tiers?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tiers?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          onboarding_completed: boolean | null
          plan_expires_at: string | null
          plan_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          segment: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id: string
          onboarding_completed?: boolean | null
          plan_expires_at?: string | null
          plan_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          segment?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          onboarding_completed?: boolean | null
          plan_expires_at?: string | null
          plan_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          segment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      rmr_meetings: {
        Row: {
          created_at: string
          date: string
          highlight_reason: string | null
          highlighted_employee_id: string | null
          highlighted_employee_name: string | null
          id: string
          month: number
          monthly_goal: number
          motivational_theme: string | null
          notes: string | null
          previous_month_revenue: number
          status: string
          strategies: Json | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          date: string
          highlight_reason?: string | null
          highlighted_employee_id?: string | null
          highlighted_employee_name?: string | null
          id?: string
          month: number
          monthly_goal?: number
          motivational_theme?: string | null
          notes?: string | null
          previous_month_revenue?: number
          status?: string
          strategies?: Json | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          date?: string
          highlight_reason?: string | null
          highlighted_employee_id?: string | null
          highlighted_employee_name?: string | null
          id?: string
          month?: number
          monthly_goal?: number
          motivational_theme?: string | null
          notes?: string | null
          previous_month_revenue?: number
          status?: string
          strategies?: Json | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          acquisition_cost: number | null
          amount: number
          channel: Database["public"]["Enums"]["sale_channel"]
          client_id: string | null
          client_name: string | null
          created_at: string
          entry_type: string | null
          id: string
          is_new_client: boolean
          lead_source: Database["public"]["Enums"]["lead_source"] | null
          notes: string | null
          product_service: string | null
          sale_date: string
          salesperson_id: string
          salesperson_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_cost?: number | null
          amount: number
          channel?: Database["public"]["Enums"]["sale_channel"]
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          entry_type?: string | null
          id?: string
          is_new_client?: boolean
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          notes?: string | null
          product_service?: string | null
          sale_date?: string
          salesperson_id: string
          salesperson_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_cost?: number | null
          amount?: number
          channel?: Database["public"]["Enums"]["sale_channel"]
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          entry_type?: string | null
          id?: string
          is_new_client?: boolean
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          notes?: string | null
          product_service?: string | null
          sale_date?: string
          salesperson_id?: string
          salesperson_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_students: number
          name: string
          price_monthly: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_students: number
          name: string
          price_monthly?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_students?: number
          name?: string
          price_monthly?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whitelabel_settings: {
        Row: {
          accent_color: string | null
          created_at: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          sidebar_color: string | null
          system_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          sidebar_color?: string | null
          system_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          sidebar_color?: string | null
          system_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lead_source:
        | "indicacao"
        | "redes_sociais"
        | "google"
        | "evento"
        | "cold_call"
        | "parceiro"
        | "outro"
      sale_channel: "online" | "presencial"
      user_role: "consultant" | "business_owner"
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
      lead_source: [
        "indicacao",
        "redes_sociais",
        "google",
        "evento",
        "cold_call",
        "parceiro",
        "outro",
      ],
      sale_channel: ["online", "presencial"],
      user_role: ["consultant", "business_owner"],
    },
  },
} as const
