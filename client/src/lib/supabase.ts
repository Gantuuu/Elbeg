import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for auth state
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// Helper function for file upload
export const uploadImage = async (file: File, bucket = 'images') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
};

// Database types (generated from schema)
export type Database = {
    public: {
        Tables: {
            products: {
                Row: {
                    id: number;
                    name: string;
                    name_ru: string | null;
                    name_en: string | null;
                    description: string;
                    description_ru: string | null;
                    description_en: string | null;
                    category: string;
                    price: number;
                    image_url: string;
                    stock: number;
                    min_order_quantity: number | null;
                    store_id: number | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['products']['Insert']>;
            };
            orders: {
                Row: {
                    id: number;
                    user_id: number | null;
                    customer_name: string;
                    customer_email: string;
                    customer_phone: string;
                    customer_address: string;
                    payment_method: string;
                    total_amount: number;
                    status: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status'>;
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
            };
            users: {
                Row: {
                    id: number;
                    username: string;
                    password: string;
                    email: string;
                    name: string | null;
                    phone: string | null;
                    google_id: string | null;
                    profile_image_url: string | null;
                    is_admin: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'is_admin'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            categories: {
                Row: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    image_url: string | null;
                    order: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['categories']['Insert']>;
            };
        };
    };
};
