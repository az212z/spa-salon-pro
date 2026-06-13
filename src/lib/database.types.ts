export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_holds: {
        Row: {
          ends_at: string
          expires_at: string
          id: string
          session_token: string
          staff_id: string
          starts_at: string
          tenant_id: string
        }
        Insert: {
          ends_at: string
          expires_at?: string
          id?: string
          session_token: string
          staff_id: string
          starts_at: string
          tenant_id: string
        }
        Update: {
          ends_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          staff_id?: string
          starts_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_holds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "booking_holds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_holds_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          duration_minutes: number
          id: string
          price: number
          service_id: string
          service_name: string
          sort: number
          tenant_id: string
        }
        Insert: {
          booking_id: string
          duration_minutes: number
          id?: string
          price: number
          service_id: string
          service_name: string
          sort?: number
          tenant_id: string
        }
        Update: {
          booking_id?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id?: string
          service_name?: string
          sort?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_tenant_id_booking_id_fkey"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "booking_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "booking_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      bookings: {
        Row: {
          branch_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          coupon_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_note: string | null
          deposit_amount: number
          discount_amount: number
          ends_at: string
          group_id: string | null
          id: string
          internal_note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          source: Database["public"]["Enums"]["booking_source"]
          staff_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_note?: string | null
          deposit_amount?: number
          discount_amount?: number
          ends_at: string
          group_id?: string | null
          id?: string
          internal_note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          source?: Database["public"]["Enums"]["booking_source"]
          staff_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_note?: string | null
          deposit_amount?: number
          discount_amount?: number
          ends_at?: string
          group_id?: string | null
          id?: string
          internal_note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          source?: Database["public"]["Enums"]["booking_source"]
          staff_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_coupon_fk"
            columns: ["tenant_id", "coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_branch_id_fkey"
            columns: ["tenant_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          location: Json | null
          name: string
          phone: string | null
          tenant_id: string
          working_hours: Json
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: Json | null
          name: string
          phone?: string | null
          tenant_id: string
          working_hours?: Json
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: Json | null
          name?: string
          phone?: string | null
          tenant_id?: string
          working_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          segment: Json
          sent_count: number
          status: string
          tenant_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          segment?: Json
          sent_count?: number
          status?: string
          tenant_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          segment?: Json
          sent_count?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          booking_id: string | null
          coupon_id: string
          created_at: string
          customer_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          booking_id?: string | null
          coupon_id: string
          created_at?: string
          customer_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          booking_id?: string | null
          coupon_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_tenant_id_booking_id_fkey"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_coupon_id_fkey"
            columns: ["tenant_id", "coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_uses: number | null
          max_uses_per_customer: number
          min_amount: number
          tenant_id: string
          type: Database["public"]["Enums"]["discount_type"]
          used_count: number
          valid_from: string
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_customer?: number
          min_amount?: number
          tenant_id: string
          type: Database["public"]["Enums"]["discount_type"]
          used_count?: number
          valid_from?: string
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_customer?: number
          min_amount?: number
          tenant_id?: string
          type?: Database["public"]["Enums"]["discount_type"]
          used_count?: number
          valid_from?: string
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_notes_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_packages: {
        Row: {
          customer_id: string
          expires_at: string
          id: string
          package_id: string
          purchased_at: string
          sessions_total: number
          sessions_used: number
          tenant_id: string
        }
        Insert: {
          customer_id: string
          expires_at: string
          id?: string
          package_id: string
          purchased_at?: string
          sessions_total: number
          sessions_used?: number
          tenant_id: string
        }
        Update: {
          customer_id?: string
          expires_at?: string
          id?: string
          package_id?: string
          purchased_at?: string
          sessions_total?: number
          sessions_used?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_packages_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_packages_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_packages_tenant_id_package_id_fkey"
            columns: ["tenant_id", "package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      customer_tag_links: {
        Row: {
          customer_id: string
          tag_id: string
          tenant_id: string
        }
        Insert: {
          customer_id: string
          tag_id: string
          tenant_id: string
        }
        Update: {
          customer_id?: string
          tag_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tag_links_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_tag_links_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_tag_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_tag_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tag_links_tenant_id_tag_id_fkey"
            columns: ["tenant_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "customer_tags"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          color: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customer_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          beauty_profile: Json
          birth_date: string | null
          created_at: string
          email: string | null
          gender: string | null
          id: string
          last_visit_at: string | null
          marketing_opt_in: boolean
          name: string
          no_show_count: number
          phone: string
          points_balance: number
          referral_code: string
          referred_by: string | null
          source: string
          tenant_id: string
          tier: Database["public"]["Enums"]["customer_tier"]
          total_spent: number
          updated_at: string
          user_id: string | null
          visits_count: number
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          beauty_profile?: Json
          birth_date?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          last_visit_at?: string | null
          marketing_opt_in?: boolean
          name: string
          no_show_count?: number
          phone: string
          points_balance?: number
          referral_code?: string
          referred_by?: string | null
          source?: string
          tenant_id: string
          tier?: Database["public"]["Enums"]["customer_tier"]
          total_spent?: number
          updated_at?: string
          user_id?: string | null
          visits_count?: number
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          beauty_profile?: Json
          birth_date?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          last_visit_at?: string | null
          marketing_opt_in?: boolean
          name?: string
          no_show_count?: number
          phone?: string
          points_balance?: number
          referral_code?: string
          referred_by?: string | null
          source?: string
          tenant_id?: string
          tier?: Database["public"]["Enums"]["customer_tier"]
          total_spent?: number
          updated_at?: string
          user_id?: string | null
          visits_count?: number
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_referred_by_fkey"
            columns: ["tenant_id", "referred_by"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customers_tenant_id_referred_by_fkey"
            columns: ["tenant_id", "referred_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          balance: number
          buyer_customer_id: string | null
          code: string
          created_at: string
          design: string
          expires_at: string | null
          id: string
          message: string | null
          recipient_name: string | null
          recipient_phone: string | null
          status: Database["public"]["Enums"]["gift_card_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          balance: number
          buyer_customer_id?: string | null
          code: string
          created_at?: string
          design?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: Database["public"]["Enums"]["gift_card_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          balance?: number
          buyer_customer_id?: string | null
          code?: string
          created_at?: string
          design?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: Database["public"]["Enums"]["gift_card_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_tenant_id_buyer_customer_id_fkey"
            columns: ["tenant_id", "buyer_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "gift_cards_tenant_id_buyer_customer_id_fkey"
            columns: ["tenant_id", "buyer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "gift_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "gift_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          note: string | null
          points: number
          reason: Database["public"]["Enums"]["points_reason"]
          tenant_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          note?: string | null
          points: number
          reason: Database["public"]["Enums"]["points_reason"]
          tenant_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          note?: string | null
          points?: number
          reason?: Database["public"]["Enums"]["points_reason"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_tenant_id_booking_id_fkey"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "loyalty_transactions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "loyalty_transactions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "loyalty_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      package_services: {
        Row: {
          package_id: string
          service_id: string
          tenant_id: string
        }
        Insert: {
          package_id: string
          service_id: string
          tenant_id: string
        }
        Update: {
          package_id?: string
          service_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "package_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_services_tenant_id_package_id_fkey"
            columns: ["tenant_id", "package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "package_services_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          sessions_count: number
          tenant_id: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          sessions_count?: number
          tenant_id: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          sessions_count?: number
          tenant_id?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          name_en: string | null
          price_monthly: number
          price_yearly: number | null
          sort: number
        }
        Insert: {
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          name_en?: string | null
          price_monthly: number
          price_yearly?: number | null
          sort?: number
        }
        Update: {
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          name_en?: string | null
          price_monthly?: number
          price_yearly?: number | null
          sort?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          rewarded_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          rewarded_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_referred_id_fkey"
            columns: ["tenant_id", "referred_id"]
            isOneToOne: true
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_referred_id_fkey"
            columns: ["tenant_id", "referred_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_referrer_id_fkey"
            columns: ["tenant_id", "referrer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_referrer_id_fkey"
            columns: ["tenant_id", "referrer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_published: boolean
          rating: number
          reply: string | null
          staff_id: string | null
          tenant_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_published?: boolean
          rating: number
          reply?: string | null
          staff_id?: string | null
          tenant_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_published?: boolean
          rating?: number
          reply?: string | null
          staff_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_tenant_id_booking_id_fkey"
            columns: ["tenant_id", "booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      services: {
        Row: {
          branch_id: string | null
          buffer_minutes: number
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          sort: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          buffer_minutes?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
          sort?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          buffer_minutes?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          sort?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_branch_id_fkey"
            columns: ["tenant_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "services_tenant_id_category_id_fkey"
            columns: ["tenant_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch_id: string | null
          commission_percent: number
          created_at: string
          id: string
          is_active: boolean
          is_bookable: boolean
          name: string
          permissions: Json
          tenant_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch_id?: string | null
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_bookable?: boolean
          name: string
          permissions?: Json
          tenant_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch_id?: string | null
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_bookable?: boolean
          name?: string
          permissions?: Json
          tenant_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_tenant_id_branch_id_fkey"
            columns: ["tenant_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          breaks: Json
          end_time: string
          id: string
          staff_id: string
          start_time: string
          tenant_id: string
          weekday: number
        }
        Insert: {
          breaks?: Json
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          tenant_id: string
          weekday: number
        }
        Update: {
          breaks?: Json
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          tenant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "staff_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      staff_services: {
        Row: {
          service_id: string
          staff_id: string
          tenant_id: string
        }
        Insert: {
          service_id: string
          staff_id: string
          tenant_id: string
        }
        Update: {
          service_id?: string
          staff_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "staff_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "staff_services_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      staff_time_off: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          reason: string | null
          reviewed_by: string | null
          staff_id: string
          starts_at: string
          status: Database["public"]["Enums"]["time_off_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          reason?: string | null
          reviewed_by?: string | null
          staff_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["time_off_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string | null
          reviewed_by?: string | null
          staff_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "staff_time_off_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_off_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan_id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          display_name: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          allowed_payment_methods: Database["public"]["Enums"]["payment_method"][]
          cancellation_window_hours: number
          deposit_mode: string
          deposit_percent: number
          features: Json
          locale_default: string
          loyalty: Json
          no_show_policy: Json
          slot_granularity_minutes: number
          tenant_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          allowed_payment_methods?: Database["public"]["Enums"]["payment_method"][]
          cancellation_window_hours?: number
          deposit_mode?: string
          deposit_percent?: number
          features?: Json
          locale_default?: string
          loyalty?: Json
          no_show_policy?: Json
          slot_granularity_minutes?: number
          tenant_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          allowed_payment_methods?: Database["public"]["Enums"]["payment_method"][]
          cancellation_window_hours?: number
          deposit_mode?: string
          deposit_percent?: number
          features?: Json
          locale_default?: string
          loyalty?: Json
          no_show_policy?: Json
          slot_granularity_minutes?: number
          tenant_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          about: string | null
          brand: Json
          city: string | null
          cover_url: string | null
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          trial_ends_at: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          about?: string | null
          brand?: Json
          city?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          trial_ends_at?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          about?: string | null
          brand?: Json
          city?: string | null
          cover_url?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          trial_ends_at?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notified_at: string | null
          preferred_date: string
          service_id: string
          staff_id: string | null
          status: string
          tenant_id: string
          time_window: Json | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notified_at?: string | null
          preferred_date: string
          service_id: string
          staff_id?: string | null
          status?: string
          tenant_id: string
          time_window?: Json | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notified_at?: string | null
          preferred_date?: string
          service_id?: string
          staff_id?: string | null
          status?: string
          tenant_id?: string
          time_window?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string
          campaign_id: string | null
          created_at: string
          customer_id: string | null
          error: string | null
          id: string
          provider_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          template_key: string | null
          tenant_id: string
          to_phone: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          error?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          template_key?: string | null
          tenant_id: string
          to_phone: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          created_at?: string
          customer_id?: string | null
          error?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          template_key?: string | null
          tenant_id?: string
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_tenant_id_campaign_id_fkey"
            columns: ["tenant_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body: string
          id: string
          is_enabled: boolean
          key: string
          name: string
          tenant_id: string
        }
        Insert: {
          body: string
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          tenant_id: string
        }
        Update: {
          body?: string
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_segments: {
        Row: {
          avatar_url: string | null
          beauty_profile: Json | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          gender: string | null
          id: string | null
          last_visit_at: string | null
          marketing_opt_in: boolean | null
          name: string | null
          no_show_count: number | null
          phone: string | null
          points_balance: number | null
          referral_code: string | null
          referred_by: string | null
          segment: string | null
          source: string | null
          tenant_id: string | null
          tier: Database["public"]["Enums"]["customer_tier"] | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
          visits_count: number | null
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          beauty_profile?: Json | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id?: string | null
          last_visit_at?: string | null
          marketing_opt_in?: boolean | null
          name?: string | null
          no_show_count?: number | null
          phone?: string | null
          points_balance?: number | null
          referral_code?: string | null
          referred_by?: string | null
          segment?: never
          source?: string | null
          tenant_id?: string | null
          tier?: Database["public"]["Enums"]["customer_tier"] | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
          visits_count?: number | null
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          beauty_profile?: Json | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id?: string | null
          last_visit_at?: string | null
          marketing_opt_in?: boolean | null
          name?: string | null
          no_show_count?: number | null
          phone?: string | null
          points_balance?: number | null
          referral_code?: string | null
          referred_by?: string | null
          segment?: never
          source?: string | null
          tenant_id?: string | null
          tier?: Database["public"]["Enums"]["customer_tier"] | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
          visits_count?: number | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_referred_by_fkey"
            columns: ["tenant_id", "referred_by"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customers_tenant_id_referred_by_fkey"
            columns: ["tenant_id", "referred_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tenant_public_info: {
        Row: {
          allowed_payment_methods:
            | Database["public"]["Enums"]["payment_method"][]
            | null
          cancellation_window_hours: number | null
          deposit_mode: string | null
          deposit_percent: number | null
          slot_granularity_minutes: number | null
          slug: string | null
          tenant_id: string | null
          timezone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      cleanup_expired_holds: { Args: never; Returns: number }
      create_booking: {
        Args: {
          p_customer?: string
          p_customer_note?: string
          p_group?: string
          p_hold?: string
          p_service_ids: string[]
          p_source?: Database["public"]["Enums"]["booking_source"]
          p_staff: string
          p_starts_at: string
          p_tenant: string
        }
        Returns: string
      }
      get_available_slots: {
        Args: {
          p_date: string
          p_service_ids: string[]
          p_staff?: string
          p_tenant: string
        }
        Returns: {
          ends_at: string
          staff_id: string
          starts_at: string
        }[]
      }
      has_tenant_role: {
        Args: { roles: Database["public"]["Enums"]["tenant_role"][]; t: string }
        Returns: boolean
      }
      hold_slot: {
        Args: {
          p_service_ids: string[]
          p_staff: string
          p_starts_at: string
          p_tenant: string
        }
        Returns: {
          expires_at: string
          hold_id: string
          session_token: string
        }[]
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { t: string }; Returns: boolean }
      is_tenant_desk: { Args: { t: string }; Returns: boolean }
      is_tenant_member: { Args: { t: string }; Returns: boolean }
      my_customer_ids: { Args: never; Returns: string[] }
      my_staff_ids: { Args: never; Returns: string[] }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      booking_source: "online" | "phone" | "walk_in" | "manual"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      customer_tier: "bronze" | "silver" | "gold" | "vip"
      discount_type: "percent" | "fixed"
      gift_card_status: "active" | "redeemed" | "expired" | "cancelled"
      message_status: "queued" | "sent" | "delivered" | "read" | "failed"
      payment_method:
        | "mada"
        | "apple_pay"
        | "card"
        | "cash"
        | "wallet"
        | "gift_card"
      payment_status:
        | "unpaid"
        | "deposit_paid"
        | "paid"
        | "refunded"
        | "partially_refunded"
      points_reason:
        | "visit"
        | "referral"
        | "signup"
        | "birthday"
        | "gift"
        | "redeem"
        | "adjust"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      tenant_role: "owner" | "manager" | "receptionist" | "staff"
      tenant_status: "trial" | "active" | "suspended" | "cancelled"
      time_off_status: "pending" | "approved" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_source: ["online", "phone", "walk_in", "manual"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      customer_tier: ["bronze", "silver", "gold", "vip"],
      discount_type: ["percent", "fixed"],
      gift_card_status: ["active", "redeemed", "expired", "cancelled"],
      message_status: ["queued", "sent", "delivered", "read", "failed"],
      payment_method: [
        "mada",
        "apple_pay",
        "card",
        "cash",
        "wallet",
        "gift_card",
      ],
      payment_status: [
        "unpaid",
        "deposit_paid",
        "paid",
        "refunded",
        "partially_refunded",
      ],
      points_reason: [
        "visit",
        "referral",
        "signup",
        "birthday",
        "gift",
        "redeem",
        "adjust",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      tenant_role: ["owner", "manager", "receptionist", "staff"],
      tenant_status: ["trial", "active", "suspended", "cancelled"],
      time_off_status: ["pending", "approved", "rejected"],
    },
  },
} as const

