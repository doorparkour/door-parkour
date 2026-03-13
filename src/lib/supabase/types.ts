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
          phone: string | null;
          avatar_url: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          date_of_birth: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          date_of_birth?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          date_of_birth?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          is_published?: boolean;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          status?: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          stripe_payment_intent_id?: string | null;
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
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          image_url: string | null;
          inventory: number;
          slug: string;
          is_active: boolean;
          on_demand: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents: number;
          image_url?: string | null;
          inventory?: number;
          slug: string;
          is_active?: boolean;
          on_demand?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          image_url?: string | null;
          inventory?: number;
          slug?: string;
          is_active?: boolean;
          on_demand?: boolean;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          stripe_checkout_session_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_checkout_session_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_checkout_session_id?: string | null;
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
          quantity: number;
          unit_price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
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
      booking_status: "confirmed" | "cancelled" | "waitlist";
      order_status: "pending" | "paid" | "fulfilled" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
