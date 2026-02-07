import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { compressImage } from './image-utils';


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
    // 1. Start Logging
    logger.custom('⏳', '이미지 업로드 시작:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        bucket: bucket
    });

    try {
        const fileExt = file.name.split('.').pop();
        const originalSize = file.size;

        // 2. Compression & WebP Conversion
        const compressedFile = await compressImage(file);

        // Log compression results
        logger.success('이미지 압축 완료:', {
            originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
            compressedSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
            reduction: `${((1 - compressedFile.size / originalSize) * 100).toFixed(1)}%`,
            format: compressedFile.type
        });

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`; // Force .webp extension

        // 3. Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, compressedFile);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        // 4. Success Logging
        logger.success('이미지 업로드 성공:', {
            path: data.path,
            url: publicUrl,
            bucket: bucket
        });

        return publicUrl;
    } catch (error: any) {
        logger.error('이미지 업로드 실패:', {
            fileName: file.name,
            error: error.message,
            details: error
        });
        throw error;
    }
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
