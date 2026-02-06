import { createMiddleware } from 'hono/factory';
import { getSignedCookie } from 'hono/cookie';
import { Bindings } from './types';
import { User, UserWithNullablePhone } from '@shared/schema';
import { IStorage } from './storage';
import { SupabaseStorage } from './supabase-storage';
// import { getDb } from './db';
// import { D1Storage } from './storage';

type Env = {
    Bindings: Bindings;
    Variables: {
        user: UserWithNullablePhone | null;
        storage: IStorage; // Use Interface instead of concrete class
    };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    // Initialize storage with Supabase
    // const db = getDb(c.env.DB);
    // const storage = new D1Storage(db);

    // Fallback logic for VITE_ env vars vs standard
    const supabaseUrl = c.env.VITE_SUPABASE_URL || c.env.SUPABASE_URL;
    const supabaseKey = c.env.VITE_SUPABASE_ANON_KEY || c.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials in middleware");
        // We can't Initialize storage, but we can proceed with null user?
        // Or throw error?
        // Better to proceed and let subsequent calls fail or handle it.
        c.set('user', null);
        await next();
        return;
    }

    const storage = new SupabaseStorage(supabaseUrl, supabaseKey);
    c.set('storage', storage);

    // Check for session cookie
    const sessionSecret = c.env.SESSION_SECRET || 'gerinmah-secret-key'; // Fallback for dev
    const userIdCookie = await getSignedCookie(c, sessionSecret, 'auth_user_id');

    if (userIdCookie) {
        const userId = parseInt(userIdCookie);
        if (!isNaN(userId)) {
            const user = await storage.getUser(userId);
            if (user) {
                c.set('user', user as UserWithNullablePhone);
                await next();
                return;
            }
        }
    }

    // No authenticated user
    c.set('user', null);
    await next();
});

export const requireAuth = createMiddleware<Env>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" }, 401);
    }
    await next();
});

export const requireAdmin = createMiddleware<Env>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ message: "Үйлдлийг гүйцэтгэхийн тулд нэвтрэх шаардлагатай" }, 401);
    }

    if (!user.isAdmin) {
        return c.json({ message: "Зөвхөн админ хандах боломжтой" }, 403);
    }

    await next();
});
