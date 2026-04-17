export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: string;
          preferred_locale: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          slug: string;
          description_en: string | null;
          description_ar: string | null;
          price: number;
          compare_price: number | null;
          stock_qty: number;
          sku: string | null;
          brand: string | null;
          category_id: string | null;
          specs: Json;
          images: string[];
          is_featured: boolean;
          is_active: boolean;
          meta_title_en: string | null;
          meta_title_ar: string | null;
          meta_description_en: string | null;
          meta_description_ar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['products']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          status: string;
          full_name: string;
          phone: string;
          wilaya: string;
          commune: string;
          notes: string | null;
          total: number;
          items: Json;
          promo_code: string | null;
          discount_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['orders']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          product_snapshot: Json;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          slug: string;
          description_en: string | null;
          description_ar: string | null;
          image_url: string | null;
          parent_id: string | null;
          display_order: number;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      pc_builds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          components: Json;
          total_price: number;
          is_public: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pc_builds']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pc_builds']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
    };
  };
}
