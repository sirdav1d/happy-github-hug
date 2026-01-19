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
      annual_goals: {
        Row: {
          annual_goal: number
          created_at: string
          id: string
          monthly_distribution: Json | null
          notes: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          annual_goal?: number
          created_at?: string
          id?: string
          monthly_distribution?: Json | null
          notes?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          annual_goal?: number
          created_at?: string
          id?: string
          monthly_distribution?: Json | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      behavioral_conversations: {
        Row: {
          ai_analysis: Json | null
          ai_disc_scores: Json | null
          ai_values_scores: Json | null
          audio_file_path: string | null
          duration_seconds: number | null
          id: string
          processed_at: string | null
          profile_id: string | null
          recorded_at: string
          salesperson_id: string | null
          status: string
          transcription: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_disc_scores?: Json | null
          ai_values_scores?: Json | null
          audio_file_path?: string | null
          duration_seconds?: number | null
          id?: string
          processed_at?: string | null
          profile_id?: string | null
          recorded_at?: string
          salesperson_id?: string | null
          status?: string
          transcription?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_disc_scores?: Json | null
          ai_values_scores?: Json | null
          audio_file_path?: string | null
          duration_seconds?: number | null
          id?: string
          processed_at?: string | null
          profile_id?: string | null
          recorded_at?: string
          salesperson_id?: string | null
          status?: string
          transcription?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "behavioral_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_conversations_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_module_config: {
        Row: {
          allow_self_assessment: boolean
          created_at: string
          id: string
          is_enabled: boolean
          show_in_fivi: boolean
          show_in_rmr: boolean
          show_in_team_view: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_self_assessment?: boolean
          created_at?: string
          id?: string
          is_enabled?: boolean
          show_in_fivi?: boolean
          show_in_rmr?: boolean
          show_in_team_view?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_self_assessment?: boolean
          created_at?: string
          id?: string
          is_enabled?: boolean
          show_in_fivi?: boolean
          show_in_rmr?: boolean
          show_in_team_view?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      behavioral_profiles: {
        Row: {
          ai_summary: string | null
          attr_empathy: number | null
          attr_practical_thinking: number | null
          attr_role_awareness: number | null
          attr_self_direction: number | null
          attr_self_esteem: number | null
          attr_systems_judgment: number | null
          confidence_score: number | null
          created_at: string
          development_areas: string[] | null
          disc_c_adapted: number | null
          disc_c_natural: number | null
          disc_d_adapted: number | null
          disc_d_natural: number | null
          disc_i_adapted: number | null
          disc_i_natural: number | null
          disc_s_adapted: number | null
          disc_s_natural: number | null
          id: string
          salesperson_id: string | null
          source: string
          strengths: string[] | null
          updated_at: string
          user_id: string
          value_aesthetic: number | null
          value_altruistic: number | null
          value_economic: number | null
          value_individualist: number | null
          value_political: number | null
          value_regulatory: number | null
          value_theoretical: number | null
        }
        Insert: {
          ai_summary?: string | null
          attr_empathy?: number | null
          attr_practical_thinking?: number | null
          attr_role_awareness?: number | null
          attr_self_direction?: number | null
          attr_self_esteem?: number | null
          attr_systems_judgment?: number | null
          confidence_score?: number | null
          created_at?: string
          development_areas?: string[] | null
          disc_c_adapted?: number | null
          disc_c_natural?: number | null
          disc_d_adapted?: number | null
          disc_d_natural?: number | null
          disc_i_adapted?: number | null
          disc_i_natural?: number | null
          disc_s_adapted?: number | null
          disc_s_natural?: number | null
          id?: string
          salesperson_id?: string | null
          source?: string
          strengths?: string[] | null
          updated_at?: string
          user_id: string
          value_aesthetic?: number | null
          value_altruistic?: number | null
          value_economic?: number | null
          value_individualist?: number | null
          value_political?: number | null
          value_regulatory?: number | null
          value_theoretical?: number | null
        }
        Update: {
          ai_summary?: string | null
          attr_empathy?: number | null
          attr_practical_thinking?: number | null
          attr_role_awareness?: number | null
          attr_self_direction?: number | null
          attr_self_esteem?: number | null
          attr_systems_judgment?: number | null
          confidence_score?: number | null
          created_at?: string
          development_areas?: string[] | null
          disc_c_adapted?: number | null
          disc_c_natural?: number | null
          disc_d_adapted?: number | null
          disc_d_natural?: number | null
          disc_i_adapted?: number | null
          disc_i_natural?: number | null
          disc_s_adapted?: number | null
          disc_s_natural?: number | null
          id?: string
          salesperson_id?: string | null
          source?: string
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
          value_aesthetic?: number | null
          value_altruistic?: number | null
          value_economic?: number | null
          value_individualist?: number | null
          value_political?: number | null
          value_regulatory?: number | null
          value_theoretical?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_profiles_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_questionnaire_responses: {
        Row: {
          id: string
          profile_id: string
          question_id: string
          questionnaire_type: string
          responded_at: string
          response_value: Json
          user_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          question_id: string
          questionnaire_type: string
          responded_at?: string
          response_value: Json
          user_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          question_id?: string
          questionnaire_type?: string
          responded_at?: string
          response_value?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_questionnaire_responses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "behavioral_profiles"
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
      demo_mentoring_sessions: {
        Row: {
          consultant_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          student_company: string
          student_email: string
          title: string
          updated_at: string | null
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          student_company: string
          student_email: string
          title: string
          updated_at?: string | null
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          student_company?: string
          student_email?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      demo_students: {
        Row: {
          alerts: Json | null
          annual_goal: number | null
          annual_realized: number | null
          company_name: string
          consultant_id: string
          created_at: string
          email: string
          id: string
          kpis: Json | null
          last_upload_date: string | null
          mentorship_start_date: string | null
          monthly_data: Json | null
          segment: string | null
          team: Json | null
          team_size: number | null
          updated_at: string
        }
        Insert: {
          alerts?: Json | null
          annual_goal?: number | null
          annual_realized?: number | null
          company_name: string
          consultant_id: string
          created_at?: string
          email: string
          id?: string
          kpis?: Json | null
          last_upload_date?: string | null
          mentorship_start_date?: string | null
          monthly_data?: Json | null
          segment?: string | null
          team?: Json | null
          team_size?: number | null
          updated_at?: string
        }
        Update: {
          alerts?: Json | null
          annual_goal?: number | null
          annual_realized?: number | null
          company_name?: string
          consultant_id?: string
          created_at?: string
          email?: string
          id?: string
          kpis?: Json | null
          last_upload_date?: string | null
          mentorship_start_date?: string | null
          monthly_data?: Json | null
          segment?: string | null
          team?: Json | null
          team_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fivi_sessions: {
        Row: {
          actions_executed: string | null
          ai_commitments: string[] | null
          ai_concerns: string[] | null
          ai_confidence_score: number | null
          ai_key_points: Json | null
          ai_processed_at: string | null
          ai_sentiment_analysis: Json | null
          ai_summary: string | null
          ai_transcription: string | null
          audio_file_path: string | null
          created_at: string
          date: string
          failed_actions: string | null
          id: string
          improvement_ideas: string | null
          meeting_notes: string | null
          notes: string | null
          previous_commitment: number | null
          previous_realized: number | null
          recording_url: string | null
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
          ai_commitments?: string[] | null
          ai_concerns?: string[] | null
          ai_confidence_score?: number | null
          ai_key_points?: Json | null
          ai_processed_at?: string | null
          ai_sentiment_analysis?: Json | null
          ai_summary?: string | null
          ai_transcription?: string | null
          audio_file_path?: string | null
          created_at?: string
          date?: string
          failed_actions?: string | null
          id?: string
          improvement_ideas?: string | null
          meeting_notes?: string | null
          notes?: string | null
          previous_commitment?: number | null
          previous_realized?: number | null
          recording_url?: string | null
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
          ai_commitments?: string[] | null
          ai_concerns?: string[] | null
          ai_confidence_score?: number | null
          ai_key_points?: Json | null
          ai_processed_at?: string | null
          ai_sentiment_analysis?: Json | null
          ai_summary?: string | null
          ai_transcription?: string | null
          audio_file_path?: string | null
          created_at?: string
          date?: string
          failed_actions?: string | null
          id?: string
          improvement_ideas?: string | null
          meeting_notes?: string | null
          notes?: string | null
          previous_commitment?: number | null
          previous_realized?: number | null
          recording_url?: string | null
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
      goal_rules: {
        Row: {
          base_reference: Database["public"]["Enums"]["goal_base_reference"]
          created_at: string
          description: string | null
          fixed_value: number | null
          id: string
          is_default: boolean
          name: string
          new_hire_strategy: Database["public"]["Enums"]["new_hire_strategy"]
          percentage_value: number
          rampup_months: number | null
          rampup_start_percent: number | null
          rule_type: Database["public"]["Enums"]["goal_rule_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          base_reference?: Database["public"]["Enums"]["goal_base_reference"]
          created_at?: string
          description?: string | null
          fixed_value?: number | null
          id?: string
          is_default?: boolean
          name: string
          new_hire_strategy?: Database["public"]["Enums"]["new_hire_strategy"]
          percentage_value?: number
          rampup_months?: number | null
          rampup_start_percent?: number | null
          rule_type?: Database["public"]["Enums"]["goal_rule_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          base_reference?: Database["public"]["Enums"]["goal_base_reference"]
          created_at?: string
          description?: string | null
          fixed_value?: number | null
          id?: string
          is_default?: boolean
          name?: string
          new_hire_strategy?: Database["public"]["Enums"]["new_hire_strategy"]
          percentage_value?: number
          rampup_months?: number | null
          rampup_start_percent?: number | null
          rule_type?: Database["public"]["Enums"]["goal_rule_type"]
          updated_at?: string
          user_id?: string
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
      mentoring_sessions: {
        Row: {
          consultant_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          student_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          student_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          student_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mentorship_phases: {
        Row: {
          behavioral_module_enabled: boolean | null
          consultant_id: string | null
          created_at: string
          current_phase: number
          id: string
          phase_started_at: string
          phase_updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_module_enabled?: boolean | null
          consultant_id?: string | null
          created_at?: string
          current_phase?: number
          id?: string
          phase_started_at?: string
          phase_updated_at?: string
          user_id: string
        }
        Update: {
          behavioral_module_enabled?: boolean | null
          consultant_id?: string | null
          created_at?: string
          current_phase?: number
          id?: string
          phase_started_at?: string
          phase_updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          gamma_api_key: string | null
          id: string
          notebooklm_connected_at: string | null
          notebooklm_gcp_location: string | null
          notebooklm_gcp_project_id: string | null
          notebooklm_service_account_json: string | null
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
          gamma_api_key?: string | null
          id: string
          notebooklm_connected_at?: string | null
          notebooklm_gcp_location?: string | null
          notebooklm_gcp_project_id?: string | null
          notebooklm_service_account_json?: string | null
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
          gamma_api_key?: string | null
          id?: string
          notebooklm_connected_at?: string | null
          notebooklm_gcp_location?: string | null
          notebooklm_gcp_project_id?: string | null
          notebooklm_service_account_json?: string | null
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
          gamma_generation_id: string | null
          gamma_pptx_url: string | null
          gamma_url: string | null
          highlight_reason: string | null
          highlighted_employee_id: string | null
          highlighted_employee_name: string | null
          id: string
          month: number
          monthly_goal: number
          motivational_theme: string | null
          notebooklm_audio_url: string | null
          notebooklm_briefing_url: string | null
          notebooklm_faq_json: Json | null
          notebooklm_generated_at: string | null
          notebooklm_notebook_id: string | null
          notes: string | null
          previous_month_revenue: number
          selected_video_id: string | null
          selected_video_title: string | null
          selected_video_url: string | null
          slides_generated_at: string | null
          slides_version: number | null
          status: string
          strategies: Json | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          date: string
          gamma_generation_id?: string | null
          gamma_pptx_url?: string | null
          gamma_url?: string | null
          highlight_reason?: string | null
          highlighted_employee_id?: string | null
          highlighted_employee_name?: string | null
          id?: string
          month: number
          monthly_goal?: number
          motivational_theme?: string | null
          notebooklm_audio_url?: string | null
          notebooklm_briefing_url?: string | null
          notebooklm_faq_json?: Json | null
          notebooklm_generated_at?: string | null
          notebooklm_notebook_id?: string | null
          notes?: string | null
          previous_month_revenue?: number
          selected_video_id?: string | null
          selected_video_title?: string | null
          selected_video_url?: string | null
          slides_generated_at?: string | null
          slides_version?: number | null
          status?: string
          strategies?: Json | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          date?: string
          gamma_generation_id?: string | null
          gamma_pptx_url?: string | null
          gamma_url?: string | null
          highlight_reason?: string | null
          highlighted_employee_id?: string | null
          highlighted_employee_name?: string | null
          id?: string
          month?: number
          monthly_goal?: number
          motivational_theme?: string | null
          notebooklm_audio_url?: string | null
          notebooklm_briefing_url?: string | null
          notebooklm_faq_json?: Json | null
          notebooklm_generated_at?: string | null
          notebooklm_notebook_id?: string | null
          notes?: string | null
          previous_month_revenue?: number
          selected_video_id?: string | null
          selected_video_title?: string | null
          selected_video_url?: string | null
          slides_generated_at?: string | null
          slides_version?: number | null
          status?: string
          strategies?: Json | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      rmr_preparation_status: {
        Row: {
          ai_generated_highlights: Json | null
          ai_suggested_strategies: string[] | null
          ai_suggested_theme: string | null
          created_at: string
          generated_script_markdown: string | null
          generated_script_pdf_url: string | null
          id: string
          is_prepared: boolean
          last_reminder_sent_at: string | null
          preparation_deadline: string
          rmr_id: string | null
          script_generated_at: string | null
          script_month: number | null
          script_year: number | null
          slides_presentation_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated_highlights?: Json | null
          ai_suggested_strategies?: string[] | null
          ai_suggested_theme?: string | null
          created_at?: string
          generated_script_markdown?: string | null
          generated_script_pdf_url?: string | null
          id?: string
          is_prepared?: boolean
          last_reminder_sent_at?: string | null
          preparation_deadline: string
          rmr_id?: string | null
          script_generated_at?: string | null
          script_month?: number | null
          script_year?: number | null
          slides_presentation_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated_highlights?: Json | null
          ai_suggested_strategies?: string[] | null
          ai_suggested_theme?: string | null
          created_at?: string
          generated_script_markdown?: string | null
          generated_script_pdf_url?: string | null
          id?: string
          is_prepared?: boolean
          last_reminder_sent_at?: string | null
          preparation_deadline?: string
          rmr_id?: string | null
          script_generated_at?: string | null
          script_month?: number | null
          script_year?: number | null
          slides_presentation_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rmr_preparation_status_rmr_id_fkey"
            columns: ["rmr_id"]
            isOneToOne: false
            referencedRelation: "rmr_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      rmr_video_suggestions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          rmr_id: string | null
          suggested_by_ai: boolean
          title: string
          user_id: string
          user_rating: number | null
          video_id: string | null
          was_used: boolean
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          rmr_id?: string | null
          suggested_by_ai?: boolean
          title: string
          user_id: string
          user_rating?: number | null
          video_id?: string | null
          was_used?: boolean
          youtube_id: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          rmr_id?: string | null
          suggested_by_ai?: boolean
          title?: string
          user_id?: string
          user_rating?: number | null
          video_id?: string | null
          was_used?: boolean
          youtube_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rmr_video_suggestions_rmr_id_fkey"
            columns: ["rmr_id"]
            isOneToOne: false
            referencedRelation: "rmr_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rmr_video_suggestions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          acquisition_cost: number | null
          amount: number
          attendances: number | null
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
          sales_count: number
          salesperson_id: string
          salesperson_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_cost?: number | null
          amount: number
          attendances?: number | null
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
          sales_count?: number
          salesperson_id: string
          salesperson_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_cost?: number | null
          amount?: number
          attendances?: number | null
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
          sales_count?: number
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
      salespeople: {
        Row: {
          avatar_url: string | null
          channel_preference: string | null
          created_at: string
          email: string | null
          goal_override_percent: number | null
          goal_override_value: number | null
          goal_rule_id: string | null
          hire_date: string
          id: string
          legacy_id: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["salesperson_status"]
          termination_date: string | null
          termination_notes: string | null
          termination_reason:
            | Database["public"]["Enums"]["termination_reason"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          channel_preference?: string | null
          created_at?: string
          email?: string | null
          goal_override_percent?: number | null
          goal_override_value?: number | null
          goal_rule_id?: string | null
          hire_date: string
          id?: string
          legacy_id?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["salesperson_status"]
          termination_date?: string | null
          termination_notes?: string | null
          termination_reason?:
            | Database["public"]["Enums"]["termination_reason"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          channel_preference?: string | null
          created_at?: string
          email?: string | null
          goal_override_percent?: number | null
          goal_override_value?: number | null
          goal_rule_id?: string | null
          hire_date?: string
          id?: string
          legacy_id?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["salesperson_status"]
          termination_date?: string | null
          termination_notes?: string | null
          termination_reason?:
            | Database["public"]["Enums"]["termination_reason"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salespeople_goal_rule_id_fkey"
            columns: ["goal_rule_id"]
            isOneToOne: false
            referencedRelation: "goal_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          details: Json | null
          event_date: string
          event_type: Database["public"]["Enums"]["salesperson_event_type"]
          id: string
          salesperson_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          details?: Json | null
          event_date?: string
          event_type: Database["public"]["Enums"]["salesperson_event_type"]
          id?: string
          salesperson_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          details?: Json | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["salesperson_event_type"]
          id?: string
          salesperson_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_events_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
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
      test_users_log: {
        Row: {
          created_at: string
          created_by: string
          id: string
          test_user_email: string
          test_user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          test_user_email: string
          test_user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          test_user_email?: string
          test_user_id?: string
        }
        Relationships: []
      }
      user_favorite_videos: {
        Row: {
          created_at: string
          custom_notes: string | null
          id: string
          title: string
          user_id: string
          video_id: string | null
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          created_at?: string
          custom_notes?: string | null
          id?: string
          title: string
          user_id: string
          video_id?: string | null
          youtube_id: string
          youtube_url: string
        }
        Update: {
          created_at?: string
          custom_notes?: string | null
          id?: string
          title?: string
          user_id?: string
          video_id?: string | null
          youtube_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
      video_library: {
        Row: {
          average_rating: number | null
          categories: string[]
          channel_name: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          keywords: string[] | null
          language: string
          thumbnail_url: string | null
          times_used: number
          title: string
          updated_at: string
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          average_rating?: number | null
          categories?: string[]
          channel_name?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          language?: string
          thumbnail_url?: string | null
          times_used?: number
          title: string
          updated_at?: string
          youtube_id: string
          youtube_url: string
        }
        Update: {
          average_rating?: number | null
          categories?: string[]
          channel_name?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          language?: string
          thumbnail_url?: string | null
          times_used?: number
          title?: string
          updated_at?: string
          youtube_id?: string
          youtube_url?: string
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
      delete_user_and_all_data: {
        Args: { target_email: string }
        Returns: Json
      }
      is_consultant: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      goal_base_reference:
        | "previous_year_same_month"
        | "previous_month"
        | "team_average"
        | "manual"
      goal_rule_type: "percentage" | "fixed" | "manual"
      lead_source:
        | "indicacao"
        | "redes_sociais"
        | "google"
        | "evento"
        | "cold_call"
        | "parceiro"
        | "outro"
      new_hire_strategy: "team_average" | "fixed_rampup" | "manual" | "no_goal"
      sale_channel: "online" | "presencial"
      salesperson_event_type:
        | "hired"
        | "terminated"
        | "promoted"
        | "goal_changed"
        | "leave_started"
        | "leave_ended"
        | "status_changed"
      salesperson_status: "active" | "inactive" | "on_leave"
      termination_reason:
        | "dismissal"
        | "resignation"
        | "retirement"
        | "contract_end"
        | "other"
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
      goal_base_reference: [
        "previous_year_same_month",
        "previous_month",
        "team_average",
        "manual",
      ],
      goal_rule_type: ["percentage", "fixed", "manual"],
      lead_source: [
        "indicacao",
        "redes_sociais",
        "google",
        "evento",
        "cold_call",
        "parceiro",
        "outro",
      ],
      new_hire_strategy: ["team_average", "fixed_rampup", "manual", "no_goal"],
      sale_channel: ["online", "presencial"],
      salesperson_event_type: [
        "hired",
        "terminated",
        "promoted",
        "goal_changed",
        "leave_started",
        "leave_ended",
        "status_changed",
      ],
      salesperson_status: ["active", "inactive", "on_leave"],
      termination_reason: [
        "dismissal",
        "resignation",
        "retirement",
        "contract_end",
        "other",
      ],
      user_role: ["consultant", "business_owner"],
    },
  },
} as const
