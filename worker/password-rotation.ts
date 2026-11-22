import { createMiddleware } from 'hono/factory';
import type { IStorage } from './storage';
import type { Bindings } from './types';
import { comparePasswords, hashPassword } from './utils';

type Env = { Bindings: Bindings; Variables: { storage: IStorage } };

export const enforcePasswordRotation = createMiddleware<Env>(async (c, next) => {
    if (c.req.method !== 'POST') return next();
    const { ADMIN_USERNAME: identifier, ADMIN_PASSWORD: configuredPassword } = c.env;
    const configured = Boolean(identifier && configuredPassword);
    const adminOnly = c.req.path === '/api/admin/login';
    if (!configured && !adminOnly) return next();

    const body = await c.req.json().catch(() => null);
    const { username, password } = body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return c.json({ success: false, message: 'Username and password are required' }, 400);
    }
    const deny = () => c.json({ success: false, message: 'Invalid credentials' }, 401);
    if (configured && username === identifier && password !== configuredPassword) return deny();
    if (configured && username !== identifier && !identifier?.includes('@') && !username.includes('@')) return next();

    const storage = c.get('storage');
    const byName = await storage.getUserByUsername(username);
    const user = byName ?? (username.includes('@') ? await storage.getUserByEmail(username) : undefined);
    if (!configured) {
        // Without a configured bootstrap identity only a real database administrator can log in.
        if (!user?.isAdmin || !await comparePasswords(password, user.password)) return deny();
        return next();
    }
    if (!user || (user.username !== identifier && user.email !== identifier)) return next();
    if (password !== configuredPassword) return deny();
    if (!await comparePasswords(password, user.password)) {
        const replacement = await hashPassword(password);
        const updated = await c.env.DB.prepare(
            'UPDATE users SET password = ? WHERE id = ? AND password = ?'
        ).bind(replacement, user.id, user.password).run();
        if (updated.meta.changes !== 1) {
            // Another login may already have synchronized the same value.
            const current = await storage.getUser(user.id);
            if (!current || current.username !== user.username || !await comparePasswords(password, current.password)) {
                return c.json({ success: false, message: 'Please try again' }, 503);
            }
        }
    }
    return next();
});
