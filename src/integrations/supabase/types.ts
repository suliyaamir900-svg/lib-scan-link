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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      book_categories: {
        Row: {
          created_at: string
          id: string
          library_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          library_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          library_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_categories_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      book_issues: {
        Row: {
          actual_return_date: string | null
          book_id: string
          borrower_department: string | null
          borrower_id: string
          borrower_name: string
          borrower_type: string
          created_at: string
          fine_amount: number | null
          fine_per_day: number | null
          id: string
          issue_date: string
          library_id: string
          notes: string | null
          return_date: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_return_date?: string | null
          book_id: string
          borrower_department?: string | null
          borrower_id: string
          borrower_name: string
          borrower_type?: string
          created_at?: string
          fine_amount?: number | null
          fine_per_day?: number | null
          id?: string
          issue_date?: string
          library_id: string
          notes?: string | null
          return_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_return_date?: string | null
          book_id?: string
          borrower_department?: string | null
          borrower_id?: string
          borrower_name?: string
          borrower_type?: string
          created_at?: string
          fine_amount?: number | null
          fine_per_day?: number | null
          id?: string
          issue_date?: string
          library_id?: string
          notes?: string | null
          return_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      book_reservations: {
        Row: {
          book_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          library_id: string
          queue_position: number | null
          reserved_at: string | null
          reserved_by_id: string
          reserved_by_name: string
          reserved_by_type: string | null
          status: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          library_id: string
          queue_position?: number | null
          reserved_at?: string | null
          reserved_by_id: string
          reserved_by_name: string
          reserved_by_type?: string | null
          status?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          library_id?: string
          queue_position?: number | null
          reserved_at?: string | null
          reserved_by_id?: string
          reserved_by_name?: string
          reserved_by_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_reservations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reservations_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          available_copies: number
          category_id: string | null
          category_name: string | null
          created_at: string
          edition: string | null
          id: string
          isbn: string | null
          last_borrower_id: string | null
          last_borrower_name: string | null
          library_id: string
          lost_date: string | null
          publisher: string | null
          rack_number: string | null
          replacement_fine: number | null
          row_number: string | null
          shelf_number: string | null
          status: string | null
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          author?: string
          available_copies?: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          edition?: string | null
          id?: string
          isbn?: string | null
          last_borrower_id?: string | null
          last_borrower_name?: string | null
          library_id: string
          lost_date?: string | null
          publisher?: string | null
          rack_number?: string | null
          replacement_fine?: number | null
          row_number?: string | null
          shelf_number?: string | null
          status?: string | null
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          author?: string
          available_copies?: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          edition?: string | null
          id?: string
          isbn?: string | null
          last_borrower_id?: string | null
          last_borrower_name?: string | null
          library_id?: string
          lost_date?: string | null
          publisher?: string | null
          rack_number?: string | null
          replacement_fine?: number | null
          row_number?: string | null
          shelf_number?: string | null
          status?: string | null
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "book_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      libraries: {
        Row: {
          admin_name: string
          college_name: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          qr_code_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_name: string
          college_name: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          qr_code_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_name?: string
          college_name?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          qr_code_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_seats: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          library_id: string
          seat_number: string
          section: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          library_id: string
          seat_number: string
          section?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          library_id?: string
          seat_number?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_seats_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      library_settings: {
        Row: {
          allow_reservations: boolean | null
          created_at: string | null
          default_fine_per_day: number | null
          default_issue_days: number | null
          id: string
          library_id: string
          max_capacity: number | null
          total_seats: number | null
          updated_at: string | null
        }
        Insert: {
          allow_reservations?: boolean | null
          created_at?: string | null
          default_fine_per_day?: number | null
          default_issue_days?: number | null
          id?: string
          library_id: string
          max_capacity?: number | null
          total_seats?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_reservations?: boolean | null
          created_at?: string | null
          default_fine_per_day?: number | null
          default_issue_days?: number | null
          id?: string
          library_id?: string
          max_capacity?: number | null
          total_seats?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_settings_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: true
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          library_id: string
          message: string | null
          related_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          library_id: string
          message?: string | null
          related_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          library_id?: string
          message?: string | null
          related_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      student_entries: {
        Row: {
          created_at: string
          department: string
          device_info: string | null
          email: string | null
          employee_id: string | null
          enrollment_number: string | null
          entry_date: string
          entry_time: string
          exit_time: string | null
          id: string
          id_card_number: string | null
          ip_address: string | null
          library_id: string
          mobile: string
          roll_number: string
          seat_id: string | null
          signature_path: string | null
          student_name: string
          user_type: string | null
          year: string
        }
        Insert: {
          created_at?: string
          department: string
          device_info?: string | null
          email?: string | null
          employee_id?: string | null
          enrollment_number?: string | null
          entry_date?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          id_card_number?: string | null
          ip_address?: string | null
          library_id: string
          mobile: string
          roll_number: string
          seat_id?: string | null
          signature_path?: string | null
          student_name: string
          user_type?: string | null
          year: string
        }
        Update: {
          created_at?: string
          department?: string
          device_info?: string | null
          email?: string | null
          employee_id?: string | null
          enrollment_number?: string | null
          entry_date?: string
          entry_time?: string
          exit_time?: string | null
          id?: string
          id_card_number?: string | null
          ip_address?: string | null
          library_id?: string
          mobile?: string
          roll_number?: string
          seat_id?: string | null
          signature_path?: string | null
          student_name?: string
          user_type?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_entries_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "super_admin" | "library_admin"
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
      app_role: ["super_admin", "library_admin"],
    },
  },
} as const
