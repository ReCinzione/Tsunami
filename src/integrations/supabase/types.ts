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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      archetype_levels: {
        Row: {
          archetype: Database["public"]["Enums"]["archetype_type"]
          created_at: string
          description: string
          emerging_quality: string
          id: string
          imaginal_object_name: string
          level_name: string
          level_number: number
          shadow_aspect: string
          xp_required: number
        }
        Insert: {
          archetype: Database["public"]["Enums"]["archetype_type"]
          created_at?: string
          description: string
          emerging_quality: string
          id?: string
          imaginal_object_name: string
          level_name: string
          level_number: number
          shadow_aspect: string
          xp_required: number
        }
        Update: {
          archetype?: Database["public"]["Enums"]["archetype_type"]
          created_at?: string
          description?: string
          emerging_quality?: string
          id?: string
          imaginal_object_name?: string
          level_name?: string
          level_number?: number
          shadow_aspect?: string
          xp_required?: number
        }
        Relationships: []
      }
      daily_moods: {
        Row: {
          created_at: string
          date: string
          id: string
          mood: Database["public"]["Enums"]["daily_mood"]
          suggested_ritual: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mood: Database["public"]["Enums"]["daily_mood"]
          suggested_ritual?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood?: Database["public"]["Enums"]["daily_mood"]
          suggested_ritual?: string | null
          user_id?: string
        }
        Relationships: []
      }
      imaginal_objects: {
        Row: {
          archetype_level_id: string
          id: string
          last_used_at: string | null
          times_used: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          archetype_level_id: string
          id?: string
          last_used_at?: string | null
          times_used?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          archetype_level_id?: string
          id?: string
          last_used_at?: string | null
          times_used?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaginal_objects_archetype_level_id_fkey"
            columns: ["archetype_level_id"]
            isOneToOne: false
            referencedRelation: "archetype_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      mental_inbox: {
        Row: {
          content: string
          content_type: string | null
          converted_to_task: boolean | null
          created_at: string
          id: string
          is_processed: boolean | null
          processed_at: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string | null
          converted_to_task?: boolean | null
          created_at?: string
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string | null
          converted_to_task?: boolean | null
          created_at?: string
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          combattente_percentage: number | null
          costruttore_percentage: number | null
          created_at: string
          current_level: number | null
          display_name: string | null
          dominant_archetype:
            | Database["public"]["Enums"]["archetype_type"]
            | null
          google_calendar_access_token: string | null
          google_calendar_refresh_token: string | null
          id: string
          silenzioso_percentage: number | null
          sognatore_percentage: number | null
          test_completed: boolean | null
          total_xp: number | null
          updated_at: string
          user_id: string
          visionario_percentage: number | null
        }
        Insert: {
          avatar_url?: string | null
          combattente_percentage?: number | null
          costruttore_percentage?: number | null
          created_at?: string
          current_level?: number | null
          display_name?: string | null
          dominant_archetype?:
            | Database["public"]["Enums"]["archetype_type"]
            | null
          google_calendar_access_token?: string | null
          google_calendar_refresh_token?: string | null
          id?: string
          silenzioso_percentage?: number | null
          sognatore_percentage?: number | null
          test_completed?: boolean | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
          visionario_percentage?: number | null
        }
        Update: {
          avatar_url?: string | null
          combattente_percentage?: number | null
          costruttore_percentage?: number | null
          created_at?: string
          current_level?: number | null
          display_name?: string | null
          dominant_archetype?:
            | Database["public"]["Enums"]["archetype_type"]
            | null
          google_calendar_access_token?: string | null
          google_calendar_refresh_token?: string | null
          id?: string
          silenzioso_percentage?: number | null
          sognatore_percentage?: number | null
          test_completed?: boolean | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
          visionario_percentage?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          energy_required: Database["public"]["Enums"]["energy_level"] | null
          id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          energy_required?: Database["public"]["Enums"]["energy_level"] | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          energy_required?: Database["public"]["Enums"]["energy_level"] | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_goals: {
        Row: {
          category: string
          created_at: string
          current_value: number
          id: string
          routine_id: string
          target_value: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_value?: number
          id?: string
          routine_id: string
          target_value: number
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: number
          id?: string
          routine_id?: string
          target_value?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_goals_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_items: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          name: string
          order_index: number
          routine_id: string
          time_duration: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          name: string
          order_index?: number
          routine_id: string
          time_duration?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          name?: string
          order_index?: number
          routine_id?: string
          time_duration?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_items_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          category: string
          created_at: string
          day_of_month: number | null
          days_of_week: string[] | null
          end_time: string | null
          id: string
          is_active: boolean
          name: string
          start_time: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          day_of_month?: number | null
          days_of_week?: string[] | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_time?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          day_of_month?: number | null
          days_of_week?: string[] | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_time?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_interventions: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_interventions_task_id"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          energy_required: Database["public"]["Enums"]["energy_level"] | null
          google_calendar_event_id: string | null
          id: string
          is_recurring: boolean | null
          postponed_count: number | null
          recurrence_pattern: string | null
          status: string | null
          task_type: Database["public"]["Enums"]["task_type"] | null
          title: string
          updated_at: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          energy_required?: Database["public"]["Enums"]["energy_level"] | null
          google_calendar_event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          postponed_count?: number | null
          recurrence_pattern?: string | null
          status?: string | null
          task_type?: Database["public"]["Enums"]["task_type"] | null
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          energy_required?: Database["public"]["Enums"]["energy_level"] | null
          google_calendar_event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          postponed_count?: number | null
          recurrence_pattern?: string | null
          status?: string | null
          task_type?: Database["public"]["Enums"]["task_type"] | null
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          answer_letter: string
          answer_text: string
          archetype: Database["public"]["Enums"]["archetype_type"]
          created_at: string
          id: string
          question_id: string
        }
        Insert: {
          answer_letter: string
          answer_text: string
          archetype: Database["public"]["Enums"]["archetype_type"]
          created_at?: string
          id?: string
          question_id: string
        }
        Update: {
          answer_letter?: string
          answer_text?: string
          archetype?: Database["public"]["Enums"]["archetype_type"]
          created_at?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          created_at: string
          id: string
          question_number: number
          question_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_number: number
          question_text: string
        }
        Update: {
          created_at?: string
          id?: string
          question_number?: number
          question_text?: string
        }
        Relationships: []
      }
      traces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          task_id: string | null
          trace_type: string
          user_id: string
          xp_gained: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          task_id?: string | null
          trace_type: string
          user_id: string
          xp_gained?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          task_id?: string | null
          trace_type?: string
          user_id?: string
          xp_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "traces_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_test_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          selected_answer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          selected_answer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          selected_answer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_test_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_test_responses_selected_answer_id_fkey"
            columns: ["selected_answer_id"]
            isOneToOne: false
            referencedRelation: "test_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_xp_for_level: {
        Args: { level_num: number }
        Returns: number
      }
    }
    Enums: {
      archetype_type:
        | "visionario"
        | "costruttore"
        | "sognatore"
        | "silenzioso"
        | "combattente"
      daily_mood: "congelato" | "disorientato" | "in_flusso" | "ispirato"
      energy_level: "bassa" | "media" | "alta" | "molto_bassa" | "molto_alta"
      task_type:
        | "azione"
        | "riflessione"
        | "comunicazione"
        | "creativita"
        | "organizzazione"
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
      archetype_type: [
        "visionario",
        "costruttore",
        "sognatore",
        "silenzioso",
        "combattente",
      ],
      daily_mood: ["congelato", "disorientato", "in_flusso", "ispirato"],
      energy_level: ["bassa", "media", "alta", "molto_bassa", "molto_alta"],
      task_type: [
        "azione",
        "riflessione",
        "comunicazione",
        "creativita",
        "organizzazione",
      ],
    },
  },
} as const
