import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Bindings } from './types';
import { authMiddleware } from './middleware';
import { D1Storage } from './storage';
import { getDb } from './db';

import authApp from './api/auth';
import { enforcePasswordRotation } from './password-rotation';
import productsApp from './api/products';
import { publicCatalogKey } from './public-catalog';
import shopApp from './api/shop';
import ordersApp from './api/orders';
import cmsApp from './api/cms';

import { IStorage } from './storage';

type Env = {
    Bindings: Bindings;
    Variables: {
        storage: IStorage;
    };
};

const app = new Hono<Env>();

// Global middleware
app.use('*', async (c, next) => {
    // We need to initialize storage here to have access to DB and BUCKET from env
    if (!c.get('storage')) {
        const db = getDb(c.env.DB);
        // Cast BUCKET to any to avoid type mismatch between different R2Bucket definitions
        const storage = new D1Storage(db, c.env.BUCKET as any);
        c.set('storage', storage);
    }
    await next();
});

// Global middleware
// Admin search terms can contain customer names. Retain the route, status and timing.
app.use('*', logger(line => console.log(line.replace(/(\/api\/admin\/order-summaries)\?\S+/g, '$1'))));
app.use('*', cors({
    origin: (origin) => origin, // Allow all origins for now
    credentials: true,
}));
app.use('/api/*', authMiddleware);

// Routes
app.get('/api/setup-admin', (c) => c.notFound());
app.use('/api/login', enforcePasswordRotation);
app.use('/api/admin/login', enforcePasswordRotation);
app.route('/api', authApp);
app.route('/api/products', productsApp);
app.route('/api', shopApp); // shopApp mounts at root of /api (e.g. /api/categories)
app.route('/api', ordersApp); // ordersApp mounts at root of /api
app.route('/api', cmsApp); // cmsApp mounts at root of /api

app.get('/uploads/*', async (c) => {
    try {
        const key = c.req.path.replace(/^\/uploads\//, '');
        // Decode URI component to handle spaces and special characters
        const decodedKey = decodeURIComponent(key);

        const object = await c.env.BUCKET.get(decodedKey);

        if (!object) {
            return c.text('Object Not Found', 404);
        }

        const headers = new Headers();
        // @ts-ignore - Headers type mismatch between DOM and Workers types
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        headers.set('Cache-Control', decodedKey === publicCatalogKey
            ? 'no-store' : 'public, max-age=31536000, immutable');

        // Ensure CORS headers are also present on direct R2 responses
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

        return new Response(object.body as any, {
            headers,
        });
    } catch (e) {
        console.error('Error serving file:', e);
        return c.text('Internal Server Error', 500);
    }
});

app.onError((err, c) => {
    console.error('Global Error Handler:', err);
    return c.json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, 500);
});

// Serve static assets (React App)
app.get('*', async (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
