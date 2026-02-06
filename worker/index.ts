import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Bindings } from './types';
import { authMiddleware } from './middleware';

import authApp from './api/auth';
import productsApp from './api/products';
import shopApp from './api/shop';
import ordersApp from './api/orders';
import cmsApp from './api/cms';

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
    origin: (origin) => origin, // Allow all origins for now
    credentials: true,
}));
app.use('*', authMiddleware);

// Routes
app.route('/api', authApp);
app.route('/api/products', productsApp);
app.route('/api', shopApp); // shopApp mounts at root of /api (e.g. /api/categories)
app.route('/api', ordersApp); // ordersApp mounts at root of /api
app.route('/api', cmsApp); // cmsApp mounts at root of /api

app.get('/', (c) => {
    return c.text('Elbeg Meat API is running on Cloudflare Workers!');
});

app.get('/uploads/*', async (c) => {
    const key = c.req.path.replace('/uploads/', '');
    const object = await c.env.BUCKET.get(key);

    if (!object) {
        return c.text('Not Found', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new Response(object.body, {
        headers,
    });
});

app.onError((err, c) => {
    console.error('Global Error Handler:', err);
    return c.json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, 500);
});

export default app;
