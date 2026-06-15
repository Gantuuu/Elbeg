import { createMiddleware } from 'hono/factory';
import { getSignedCookie } from 'hono/cookie';
import { verifyToken } from './token';
import { Bindings } from './types';
import { User, UserWithNullablePhone } from '@shared/schema';
import { IStorage } from './storage';
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
    // Storage is already initialized in worker/index.ts
    const storage = c.get('storage');

    if (!storage) {
        console.error("Storage not initialized in middleware");
        c.set('user', null);
        await next();
        return;
    }

    const sessionSecret = c.env.SESSION_SECRET || 'gerinmah-secret-key';

    let userId: number | null = null;

    // 1) 네이티브 앱: Authorization: Bearer <token>
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        userId = await verifyToken(authHeader.slice(7), sessionSecret);
    }

    // 2) 웹: 서명된 세션 쿠키 (폴백)
    if (userId === null) {
        const userIdCookie = await getSignedCookie(c, sessionSecret, 'auth_user_id');
        if (userIdCookie) {
            const parsed = parseInt(userIdCookie);
            if (!isNaN(parsed)) userId = parsed;
        }
    }

    if (userId !== null) {
        const user = await storage.getUser(userId);
        if (user) {
            c.set('user', user as UserWithNullablePhone);
            await next();
            return;
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
