export type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    SESSION_SECRET: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    BASE_URL?: string;
    ASSETS: Fetcher;
    // Supabase
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
};
