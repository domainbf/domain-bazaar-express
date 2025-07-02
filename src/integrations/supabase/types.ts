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
      auction_bids: {
        Row: {
          amount: number
          auction_id: string | null
          bidder_id: string | null
          created_at: string | null
          id: string
          is_automatic: boolean | null
        }
        Insert: {
          amount: number
          auction_id?: string | null
          bidder_id?: string | null
          created_at?: string | null
          id?: string
          is_automatic?: boolean | null
        }
        Update: {
          amount?: number
          auction_id?: string | null
          bidder_id?: string | null
          created_at?: string | null
          id?: string
          is_automatic?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "domain_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      domain_auctions: {
        Row: {
          bid_increment: number | null
          created_at: string | null
          current_price: number
          domain_id: string | null
          end_time: string
          id: string
          reserve_price: number | null
          start_time: string
          starting_price: number
          status: string | null
          total_bids: number | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          bid_increment?: number | null
          created_at?: string | null
          current_price: number
          domain_id?: string | null
          end_time: string
          id?: string
          reserve_price?: number | null
          start_time: string
          starting_price: number
          status?: string | null
          total_bids?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          bid_increment?: number | null
          created_at?: string | null
          current_price?: number
          domain_id?: string | null
          end_time?: string
          id?: string
          reserve_price?: number | null
          start_time?: string
          starting_price?: number
          status?: string | null
          total_bids?: number | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_auctions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domain_listings"
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
      domain_listings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          highlight: boolean | null
          id: string
          is_verified: boolean | null
          name: string
          owner_id: string | null
          price: number
          status: string | null
          verification_status: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          highlight?: boolean | null
          id?: string
          is_verified?: boolean | null
          name: string
          owner_id?: string | null
          price: number
          status?: string | null
          verification_status?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          highlight?: boolean | null
          id?: string
          is_verified?: boolean | null
          name?: string
          owner_id?: string | null
          price?: number
          status?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      domain_monitoring: {
        Row: {
          check_interval: number | null
          created_at: string | null
          domain_name: string
          id: string
          last_checked: string | null
          notifications_enabled: boolean | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_interval?: number | null
          created_at?: string | null
          domain_name: string
          id?: string
          last_checked?: string | null
          notifications_enabled?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_interval?: number | null
          created_at?: string | null
          domain_name?: string
          id?: string
          last_checked?: string | null
          notifications_enabled?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      domain_monitoring_history: {
        Row: {
          checked_at: string | null
          error_message: string | null
          id: string
          monitoring_id: string
          response_time: number | null
          status_after: string | null
          status_before: string | null
        }
        Insert: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          monitoring_id: string
          response_time?: number | null
          status_after?: string | null
          status_before?: string | null
        }
        Update: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          monitoring_id?: string
          response_time?: number | null
          status_after?: string | null
          status_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_monitoring_history_monitoring_id_fkey"
            columns: ["monitoring_id"]
            isOneToOne: false
            referencedRelation: "domain_monitoring"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_offers: {
        Row: {
          amount: number
          buyer_id: string | null
          contact_email: string | null
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
          contact_email?: string | null
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
          contact_email?: string | null
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
            referencedRelation: "domain_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_price_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          domain_id: string | null
          id: string
          previous_price: number | null
          price: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          domain_id?: string | null
          id?: string
          previous_price?: number | null
          price: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          domain_id?: string | null
          id?: string
          previous_price?: number | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "domain_price_history_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domain_listings"
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
      domain_shares: {
        Row: {
          created_at: string | null
          domain_id: string | null
          id: string
          ip_address: unknown | null
          platform: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          domain_id?: string | null
          id?: string
          ip_address?: unknown | null
          platform?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          domain_id?: string | null
          id?: string
          ip_address?: unknown | null
          platform?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_shares_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domain_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_valuations: {
        Row: {
          category: string | null
          created_at: string | null
          domain_name: string
          estimated_value: number
          expires_at: string | null
          factors: Json | null
          id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          domain_name: string
          estimated_value: number
          expires_at?: string | null
          factors?: Json | null
          id?: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          domain_name?: string
          estimated_value?: number
          expires_at?: string | null
          factors?: Json | null
          id?: string
        }
        Relationships: []
      }
      domain_verifications: {
        Row: {
          created_at: string | null
          domain_id: string | null
          expiry_date: string | null
          id: string
          last_checked: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          verification_attempts: number | null
          verification_data: Json | null
          verification_method: string | null
          verification_type: string
        }
        Insert: {
          created_at?: string | null
          domain_id?: string | null
          expiry_date?: string | null
          id?: string
          last_checked?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_attempts?: number | null
          verification_data?: Json | null
          verification_method?: string | null
          verification_type: string
        }
        Update: {
          created_at?: string | null
          domain_id?: string | null
          expiry_date?: string | null
          id?: string
          last_checked?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_attempts?: number | null
          verification_data?: Json | null
          verification_method?: string | null
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
      escrow_services: {
        Row: {
          created_at: string | null
          escrow_fee: number | null
          escrow_provider: string | null
          funded_at: string | null
          id: string
          released_at: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escrow_fee?: number | null
          escrow_provider?: string | null
          funded_at?: string | null
          id?: string
          released_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escrow_fee?: number | null
          escrow_provider?: string | null
          funded_at?: string | null
          id?: string
          released_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_services_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
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
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          provider_data: Json
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          provider_data: Json
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          provider_data?: Json
          type?: string
          updated_at?: string | null
          user_id?: string | null
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
          custom_url: string | null
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
          custom_url?: string | null
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
          custom_url?: string | null
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
      referral_rewards: {
        Row: {
          created_at: string | null
          id: string
          paid_at: string | null
          referred_user_id: string | null
          referrer_id: string | null
          reward_amount: number | null
          reward_type: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_amount?: number | null
          reward_type?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_amount?: number | null
          reward_type?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      user_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          reviewed_user_id: string | null
          reviewer_id: string | null
          transaction_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewed_user_id?: string | null
          reviewer_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          reviewed_user_id?: string | null
          reviewer_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_valuations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_notifications: {
        Args: { user_id_param: string }
        Returns: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      handle_new_offer: {
        Args: {
          p_domain_name: string
          p_offer_amount: number
          p_contact_email: string
          p_message: string
          p_buyer_id: string
          p_seller_id: string
          p_domain_listing_id: string
        }
        Returns: undefined
      }
      mark_all_notifications_as_read: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      mark_notification_as_read: {
        Args: { notification_id_param: string }
        Returns: undefined
      }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dns_record_status: ["active", "pending", "disabled"],
      dns_record_type: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"],
      domain_category: [
        "standard",
        "premium",
        "business",
        "numeric",
        "short",
        "brandable",
        "keyword",
      ],
      domain_status: [
        "available",
        "sold",
        "reserved",
        "pending",
        "expired",
        "premium",
      ],
    },
  },
} as const
