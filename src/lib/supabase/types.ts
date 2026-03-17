export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          date_of_birth: string | null;
          shirt_size: string | null;
          waiver_signed_at: string | null;
          refund_policy_agreed_at: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          date_of_birth?: string | null;
          shirt_size?: string | null;
          waiver_signed_at?: string | null;
          refund_policy_agreed_at?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          date_of_birth?: string | null;
          shirt_size?: string | null;
          waiver_signed_at?: string | null;
          refund_policy_agreed_at?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      refund_requests: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          status: "pending" | "approved" | "rejected";
          requested_at: string;
          decided_at: string | null;
          decided_by: string | null;
          reason: string | null;
          customer_reason: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          status?: "pending" | "approved" | "rejected";
          requested_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          reason?: string | null;
          customer_reason?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          status?: "pending" | "approved" | "rejected";
          requested_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          reason?: string | null;
          customer_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "refund_requests_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refund_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string;
          starts_at: string;
          duration_mins: number;
          capacity: number;
          spots_remaining: number;
          price_cents: number;
          image_url: string | null;
          is_published: boolean;
          is_cancelled: boolean;
          cancelled_at: string | null;
          age_group: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location: string;
          starts_at: string;
          duration_mins: number;
          capacity: number;
          spots_remaining: number;
          price_cents: number;
          image_url?: string | null;
          is_published?: boolean;
          is_cancelled?: boolean;
          cancelled_at?: string | null;
          age_group?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string;
          starts_at?: string;
          duration_mins?: number;
          capacity?: number;
          spots_remaining?: number;
          price_cents?: number;
          image_url?: string | null;
          age_group?: string;
          is_published?: boolean;
          is_cancelled?: boolean;
          cancelled_at?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          status: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id: string | null;
          refund_email_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          status?: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id?: string | null;
          refund_email_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id?: string | null;
          refund_email_sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string | null;
          inventory: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size?: string | null;
          inventory?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string | null;
          inventory?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          image_url: string | null;
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          on_demand: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents: number;
          image_url?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["product_status"];
          on_demand?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          image_url?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["product_status"];
          on_demand?: boolean;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      booking_status: "confirmed" | "cancelled" | "waitlist" | "payment_failed" | "refunded" | "partially_refunded";
      order_status: "pending" | "paid" | "fulfilled" | "cancelled" | "payment_failed" | "refunded" | "partially_refunded";
      product_status: "active" | "draft" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
