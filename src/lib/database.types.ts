export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          location: string | null;
          notes: string | null;
          patient_id: string;
          professional_id: string;
          starts_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          location?: string | null;
          notes?: string | null;
          patient_id: string;
          professional_id?: string;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          location?: string | null;
          notes?: string | null;
          patient_id?: string;
          professional_id?: string;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      care_assignments: {
        Row: {
          created_at: string;
          patient_id: string;
          professional_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          patient_id: string;
          professional_id: string;
        };
        Update: {
          created_at?: string;
          patient_id?: string;
          professional_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'care_assignments_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'care_assignments_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_comments: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          hidden: boolean;
          id: string;
          post_id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string;
          content: string;
          created_at?: string;
          hidden?: boolean;
          id?: string;
          post_id: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          hidden?: boolean;
          id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'community_profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'community_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      community_posts: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          hidden: boolean;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string;
          content: string;
          created_at?: string;
          hidden?: boolean;
          id?: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          hidden?: boolean;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'community_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      community_profiles: {
        Row: {
          created_at: string;
          pseudonym: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          pseudonym: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          pseudonym?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      medication_intakes: {
        Row: {
          id: string;
          patient_id: string;
          prescription_id: string;
          scheduled_at: string;
          status: Database['public']['Enums']['intake_status'];
          taken_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          patient_id: string;
          prescription_id: string;
          scheduled_at: string;
          status?: Database['public']['Enums']['intake_status'];
          taken_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          prescription_id?: string;
          scheduled_at?: string;
          status?: Database['public']['Enums']['intake_status'];
          taken_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medication_intakes_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medication_intakes_prescription_id_fkey';
            columns: ['prescription_id'];
            isOneToOne: false;
            referencedRelation: 'prescriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      mood_logs: {
        Row: {
          day: string;
          mood: number;
          patient_id: string;
        };
        ComputedFields: never;
        Insert: {
          day?: string;
          mood: number;
          patient_id: string;
        };
        Update: {
          day?: string;
          mood?: number;
          patient_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mood_logs_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      nursing_notes: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          nurse_id: string;
          patient_id: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          nurse_id: string;
          patient_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          nurse_id?: string;
          patient_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nursing_notes_nurse_id_fkey';
            columns: ['nurse_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nursing_notes_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      prescriptions: {
        Row: {
          active: boolean;
          created_at: string;
          dosage: string;
          end_date: string | null;
          id: string;
          medication: string;
          patient_id: string;
          prescribed_by: string;
          start_date: string;
          times_of_day: string[];
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          dosage: string;
          end_date?: string | null;
          id?: string;
          medication: string;
          patient_id: string;
          prescribed_by: string;
          start_date?: string;
          times_of_day: string[];
        };
        Update: {
          active?: boolean;
          created_at?: string;
          dosage?: string;
          end_date?: string | null;
          id?: string;
          medication?: string;
          patient_id?: string;
          prescribed_by?: string;
          start_date?: string;
          times_of_day?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'prescriptions_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prescriptions_prescribed_by_fkey';
            columns: ['prescribed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      private_journal: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          patient_id: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          patient_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          patient_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'private_journal_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          first_name: string;
          id: string;
          language: string;
          last_name: string;
          notif_community: boolean;
          notif_meds: boolean;
          notif_tips: boolean;
          role: Database['public']['Enums']['app_role'];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          first_name?: string;
          id: string;
          language?: string;
          last_name?: string;
          notif_community?: boolean;
          notif_meds?: boolean;
          notif_tips?: boolean;
          role?: Database['public']['Enums']['app_role'];
        };
        Update: {
          created_at?: string;
          first_name?: string;
          id?: string;
          language?: string;
          last_name?: string;
          notif_community?: boolean;
          notif_meds?: boolean;
          notif_tips?: boolean;
          role?: Database['public']['Enums']['app_role'];
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          created_at: string;
          emoji: string;
          id: string;
          image_url: string | null;
          ingredients_ar: string;
          ingredients_en: string;
          ingredients_fr: string;
          ingredients_tn: string;
          phase: Database['public']['Enums']['recipe_phase'];
          prep_minutes: number | null;
          slug: string;
          steps_ar: string;
          steps_en: string;
          steps_fr: string;
          steps_tn: string;
          summary_ar: string;
          summary_en: string;
          summary_fr: string;
          summary_tn: string;
          title_ar: string;
          title_en: string;
          title_fr: string;
          title_tn: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          emoji?: string;
          id?: string;
          image_url?: string | null;
          ingredients_ar: string;
          ingredients_en: string;
          ingredients_fr: string;
          ingredients_tn: string;
          phase?: Database['public']['Enums']['recipe_phase'];
          prep_minutes?: number | null;
          slug: string;
          steps_ar: string;
          steps_en: string;
          steps_fr: string;
          steps_tn: string;
          summary_ar: string;
          summary_en: string;
          summary_fr: string;
          summary_tn: string;
          title_ar: string;
          title_en: string;
          title_fr: string;
          title_tn: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          id?: string;
          image_url?: string | null;
          ingredients_ar?: string;
          ingredients_en?: string;
          ingredients_fr?: string;
          ingredients_tn?: string;
          phase?: Database['public']['Enums']['recipe_phase'];
          prep_minutes?: number | null;
          slug?: string;
          steps_ar?: string;
          steps_en?: string;
          steps_fr?: string;
          steps_tn?: string;
          summary_ar?: string;
          summary_en?: string;
          summary_fr?: string;
          summary_tn?: string;
          title_ar?: string;
          title_en?: string;
          title_fr?: string;
          title_tn?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          comment_id: string | null;
          created_at: string;
          details: string | null;
          id: string;
          post_id: string | null;
          reason: string;
          reporter_id: string;
        };
        ComputedFields: never;
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          post_id?: string | null;
          reason: string;
          reporter_id?: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          post_id?: string | null;
          reason?: string;
          reporter_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_comment_id_fkey';
            columns: ['comment_id'];
            isOneToOne: false;
            referencedRelation: 'community_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      stores: {
        Row: {
          address: string | null;
          city: string;
          created_at: string;
          id: string;
          kind: string;
          lat: number;
          lon: number;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city: string;
          created_at?: string;
          id?: string;
          kind?: string;
          lat: number;
          lon: number;
          name: string;
        };
        Update: {
          address?: string | null;
          city?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          lat?: number;
          lon?: number;
          name?: string;
        };
        Relationships: [];
      };
      symptom_logs: {
        Row: {
          id: string;
          logged_at: string;
          notes: string | null;
          on_period: boolean;
          pain_level: number | null;
          patient_id: string;
          stools_per_day: number | null;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          logged_at?: string;
          notes?: string | null;
          on_period?: boolean;
          pain_level?: number | null;
          patient_id: string;
          stools_per_day?: number | null;
        };
        Update: {
          id?: string;
          logged_at?: string;
          notes?: string | null;
          on_period?: boolean;
          pain_level?: number | null;
          patient_id?: string;
          stools_per_day?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'symptom_logs_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tips: {
        Row: {
          ar: string | null;
          category: string;
          en: string | null;
          fr: string;
          id: number;
          tn: string | null;
        };
        ComputedFields: never;
        Insert: {
          ar?: string | null;
          category: string;
          en?: string | null;
          fr: string;
          id?: number;
          tn?: string | null;
        };
        Update: {
          ar?: string | null;
          category?: string;
          en?: string | null;
          fr?: string;
          id?: number;
          tn?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      generate_intakes: { Args: { p_days?: number }; Returns: number };
      in_my_care_team: { Args: { p_profile: string }; Returns: boolean };
      is_assigned_to: { Args: { p_patient: string }; Returns: boolean };
      monthly_adherence: { Args: { p_month?: string }; Returns: number };
      my_role: { Args: Record<PropertyKey, never>; Returns: Database['public']['Enums']['app_role'] };
    };
    Enums: {
      app_role: 'patient' | 'doctor' | 'nurse';
      intake_status: 'pending' | 'taken' | 'skipped';
      recipe_phase: 'flare' | 'remission' | 'all';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['patient', 'doctor', 'nurse'],
      intake_status: ['pending', 'taken', 'skipped'],
      recipe_phase: ['flare', 'remission', 'all'],
    },
  },
} as const;
