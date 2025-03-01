export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      dns_records: {
        Row: {
          created_at: string | null
          id: string
          priority: number | null
          record_type: Database["public"]["Enums"]["dns_record_type"]
          status: Database["public"]["Enums"]["dns_record_status"] | null
          subdomain: string
          target: string
          ttl: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority?: number | null
          record_type: Database["public"]["Enums"]["dns_record_type"]
          status?: Database["public"]["Enums"]["dns_record_status"] | null
          subdomain: string
          target: string
          ttl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          priority?: number | null
          record_type?: Database["public"]["Enums"]["dns_record_type"]
          status?: Database["public"]["Enums"]["dns_record_status"] | null
          subdomain?: string
          target?: string
          ttl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      domain_analytics: {
        Row: {
          domain_id: string | null
          favorites: number | null
          id: string
          last_updated: string | null
          offers: number | null
          views: number | null
        }
        Insert: {
          domain_id?: string | null
          favorites?: number | null
          id?: string
          last_updated?: string | null
          offers?: number | null
          views?: number | null
        }
        Update: {
          domain_id?: string | null
          favorites?: number | null
          id?: string
          last_updated?: string | null
          offers?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_analytics_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_history: {
        Row: {
          action: string
          created_at: string
          domain_id: string
          id: string
          new_status: string | null
          performed_by: string | null
          previous_status: string | null
          price_change: number | null
        }
        Insert: {
          action: string
          created_at?: string
          domain_id: string
          id?: string
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
          price_change?: number | null
        }
        Update: {
          action?: string
          created_at?: string
          domain_id?: string
          id?: string
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
          price_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_history_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_offers: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string | null
          domain_id: string | null
          id: string
          message: string | null
          seller_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string | null
          domain_id?: string | null
          id?: string
          message?: string | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string | null
          domain_id?: string | null
          id?: string
          message?: string | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_offers_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_sale_settings: {
        Row: {
          created_at: string | null
          domain_id: string | null
          escrow_service: boolean | null
          id: string
          installment_available: boolean | null
          installment_terms: Json | null
          payment_methods: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain_id?: string | null
          escrow_service?: boolean | null
          id?: string
          installment_available?: boolean | null
          installment_terms?: Json | null
          payment_methods?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain_id?: string | null
          escrow_service?: boolean | null
          id?: string
          installment_available?: boolean | null
          installment_terms?: Json | null
          payment_methods?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_sale_settings_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verifications: {
        Row: {
          created_at: string | null
          domain_id: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          verification_data: Json | null
          verification_type: string
        }
        Insert: {
          created_at?: string | null
          domain_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
          verification_type: string
        }
        Update: {
          created_at?: string | null
          domain_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          buy_now_price: number | null
          category: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          featured_rank: number | null
          featured_until: string | null
          id: string
          is_featured: boolean | null
          keywords: string[] | null
          last_verified_at: string | null
          meta_description: string | null
          meta_title: string | null
          minimum_offer: number | null
          minimum_price: number | null
          name: string
          negotiable: boolean | null
          owner_id: string | null
          payment_plans: Json | null
          previous_sales: Json | null
          price: number
          registrar: string | null
          registration_date: string | null
          sale_type: string | null
          status: string | null
          traffic_stats: Json | null
          verification_status: string | null
        }
        Insert: {
          buy_now_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          featured_rank?: number | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          keywords?: string[] | null
          last_verified_at?: string | null
          meta_description?: string | null
          meta_title?: string | null
          minimum_offer?: number | null
          minimum_price?: number | null
          name: string
          negotiable?: boolean | null
          owner_id?: string | null
          payment_plans?: Json | null
          previous_sales?: Json | null
          price: number
          registrar?: string | null
          registration_date?: string | null
          sale_type?: string | null
          status?: string | null
          traffic_stats?: Json | null
          verification_status?: string | null
        }
        Update: {
          buy_now_price?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          featured_rank?: number | null
          featured_until?: string | null
          id?: string
          is_featured?: boolean | null
          keywords?: string[] | null
          last_verified_at?: string | null
          meta_description?: string | null
          meta_title?: string | null
          minimum_offer?: number | null
          minimum_price?: number | null
          name?: string
          negotiable?: boolean | null
          owner_id?: string | null
          payment_plans?: Json | null
          previous_sales?: Json | null
          price?: number
          registrar?: string | null
          registration_date?: string | null
          sale_type?: string | null
          status?: string | null
          traffic_stats?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          full_name: string | null
          id: string
          is_seller: boolean | null
          payment_info: Json | null
          preferred_payment_methods: string[] | null
          seller_rating: number | null
          seller_verified: boolean | null
          total_sales: number | null
          updated_at: string
          username: string | null
          verification_documents: Json | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_seller?: boolean | null
          payment_info?: Json | null
          preferred_payment_methods?: string[] | null
          seller_rating?: number | null
          seller_verified?: boolean | null
          total_sales?: number | null
          updated_at?: string
          username?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_seller?: boolean | null
          payment_info?: Json | null
          preferred_payment_methods?: string[] | null
          seller_rating?: number | null
          seller_verified?: boolean | null
          total_sales?: number | null
          updated_at?: string
          username?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          key: string
          section: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          key: string
          section?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          key?: string
          section?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          is_multilingual: boolean | null
          key: string
          section: string | null
          type: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_multilingual?: boolean | null
          key: string
          section?: string | null
          type?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_multilingual?: boolean | null
          key?: string
          section?: string | null
          type?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          enabled: boolean | null
          from_email: string
          from_name: string
          host: string
          id: string
          password: string
          port: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          from_email: string
          from_name: string
          host: string
          id?: string
          password: string
          port: number
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          from_email?: string
          from_name?: string
          host?: string
          id?: string
          password?: string
          port?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string
          domain_id: string
          id: string
          payment_id: string | null
          payment_method: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string
          domain_id: string
          id?: string
          payment_id?: string | null
          payment_method: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string
          domain_id?: string
          id?: string
          payment_id?: string | null
          payment_method?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string
          id: string
          key: string
          language_code: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          language_code: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          language_code?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string | null
          domain_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          domain_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          domain_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
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
      dns_record_status: "active" | "pending" | "disabled"
      dns_record_type:
        | "A"
        | "AAAA"
        | "CNAME"
        | "MX"
        | "TXT"
        | "NS"
        | "SRV"
        | "CAA"
      domain_category:
        | "standard"
        | "premium"
        | "business"
        | "numeric"
        | "short"
        | "brandable"
        | "keyword"
      domain_status:
        | "available"
        | "sold"
        | "reserved"
        | "pending"
        | "expired"
        | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
