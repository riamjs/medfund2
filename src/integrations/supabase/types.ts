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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      donations: {
        Row: {
          amount: number
          asset: string
          confirmed: boolean
          created_at: string
          donor_address: string
          donor_id: string | null
          fundraiser_id: string
          id: string
          tx_hash: string
        }
        Insert: {
          amount: number
          asset?: string
          confirmed?: boolean
          created_at?: string
          donor_address: string
          donor_id?: string | null
          fundraiser_id: string
          id?: string
          tx_hash: string
        }
        Update: {
          amount?: number
          asset?: string
          confirmed?: boolean
          created_at?: string
          donor_address?: string
          donor_id?: string | null
          fundraiser_id?: string
          id?: string
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraisers: {
        Row: {
          cause: string
          created_at: string
          goal_amount: number
          id: string
          location: string
          owner_id: string | null
          patient: string
          payout_address: string | null
          raised_amount: number
          released_amount: number
          slug: string
          status: Database["public"]["Enums"]["fundraiser_status"]
          summary: string
          updated_at: string
        }
        Insert: {
          cause: string
          created_at?: string
          goal_amount: number
          id?: string
          location?: string
          owner_id?: string | null
          patient: string
          payout_address?: string | null
          raised_amount?: number
          released_amount?: number
          slug: string
          status?: Database["public"]["Enums"]["fundraiser_status"]
          summary?: string
          updated_at?: string
        }
        Update: {
          cause?: string
          created_at?: string
          goal_amount?: number
          id?: string
          location?: string
          owner_id?: string | null
          patient?: string
          payout_address?: string | null
          raised_amount?: number
          released_amount?: number
          slug?: string
          status?: Database["public"]["Enums"]["fundraiser_status"]
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      ledger_events: {
        Row: {
          actor: string | null
          amount: number | null
          created_at: string
          detail: string | null
          fundraiser_id: string | null
          id: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          milestone_id: string | null
          tx_hash: string | null
        }
        Insert: {
          actor?: string | null
          amount?: number | null
          created_at?: string
          detail?: string | null
          fundraiser_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          milestone_id?: string | null
          tx_hash?: string | null
        }
        Update: {
          actor?: string | null
          amount?: number | null
          created_at?: string
          detail?: string | null
          fundraiser_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["ledger_kind"]
          milestone_id?: string | null
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_events_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_events_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_evidence: {
        Row: {
          content_type: string
          created_at: string
          file_name: string
          id: string
          milestone_id: string
          note: string | null
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          file_name: string
          id?: string
          milestone_id: string
          note?: string | null
          size_bytes?: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          file_name?: string
          id?: string
          milestone_id?: string
          note?: string | null
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_evidence_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          amount: number
          created_at: string
          description: string
          fundraiser_id: string
          id: string
          position: number
          release_tx: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at: string
          verified_at: string | null
          verifier_id: string | null
          verifier_note: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          fundraiser_id: string
          id?: string
          position?: number
          release_tx?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
          updated_at?: string
          verified_at?: string | null
          verifier_id?: string | null
          verifier_note?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          fundraiser_id?: string
          id?: string
          position?: number
          release_tx?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
          updated_at?: string
          verified_at?: string | null
          verifier_id?: string | null
          verifier_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "verifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          payout_address: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          payout_address?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          payout_address?: string | null
          updated_at?: string
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
      verifiers: {
        Row: {
          applied_at: string
          approved: boolean
          contact: string
          id: string
          kind: Database["public"]["Enums"]["verifier_kind"]
          org: string
          slug: string
          stellar_address: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applied_at?: string
          approved?: boolean
          contact: string
          id?: string
          kind?: Database["public"]["Enums"]["verifier_kind"]
          org: string
          slug: string
          stellar_address?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applied_at?: string
          approved?: boolean
          contact?: string
          id?: string
          kind?: Database["public"]["Enums"]["verifier_kind"]
          org?: string
          slug?: string
          stellar_address?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      app_role: "patient" | "verifier" | "admin"
      fundraiser_status: "open" | "funded" | "completed" | "cancelled"
      ledger_kind:
        | "created"
        | "donated"
        | "evidence_submitted"
        | "verified"
        | "rejected"
        | "released"
      milestone_status:
        | "pending"
        | "awaiting_verification"
        | "verified"
        | "released"
        | "rejected"
      verifier_kind: "Hospital" | "NGO"
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
      app_role: ["patient", "verifier", "admin"],
      fundraiser_status: ["open", "funded", "completed", "cancelled"],
      ledger_kind: [
        "created",
        "donated",
        "evidence_submitted",
        "verified",
        "rejected",
        "released",
      ],
      milestone_status: [
        "pending",
        "awaiting_verification",
        "verified",
        "released",
        "rejected",
      ],
      verifier_kind: ["Hospital", "NGO"],
    },
  },
} as const
