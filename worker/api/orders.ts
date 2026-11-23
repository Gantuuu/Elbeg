import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireAdmin } from '../middleware';
import { UserWithNullablePhone } from '@shared/schema';
import { D1Storage, IStorage } from '../storage';
import { scheduleOrderReadMigrations } from '../order-read-migrations';
import { parseOrderPage } from '../../shared/admin-order-page';
import { getAdminOrderPage, orderPageTag } from '../admin-order-page';

type Env = {
    Bindings: Bindings;
    Variables: {
        user: UserWithNullablePhone | null;
        storage: IStorage;
    };
};

const app = new Hono<Env>();

// Orders
app.on('GET', ['/orders/pending-count', '/admin/pending-orders-count'], requireAdmin, async (c) => {
    const storage = c.get('storage');
    const count = await storage.getPendingOrdersCount();
    scheduleOrderReadMigrations(c.req.url, c.env.DB, c.executionCtx);
    return c.json({ count });
});

app.get('/orders/stats', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const stats = await storage.getStats();
    return c.json(stats);
});

app.get('/admin/order-summaries', requireAdmin, async (c) => {
    const filters = parseOrderPage(new URL(c.req.url).searchParams);
    if (!filters) return c.json({ message: 'Invalid order page or date' }, 400);
    const { revision, tag } = await orderPageTag(c.env.DB, c.get('user')!.id, filters);
    c.header('Cache-Control', 'private, no-cache');
    c.header('Vary', 'Cookie, Authorization, X-Client', { append: true });
    if (tag) {
        c.header('ETag', tag);
        if (c.req.header('If-None-Match') === tag) return c.body(null, 304);
    }
    return c.json(await getAdminOrderPage(c.env.DB, filters, revision));
});

app.get('/orders', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const recentOnly = c.req.query('view') === 'recent';
    const startDateStr = c.req.query('startDate');
    const endDateStr = c.req.query('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Read the generation first so concurrent writes can only cause an extra refresh.
    let generation: string | null = null;
    try {
        generation = await c.env.DB.prepare(
            'SELECT version FROM order_list_revision WHERE id = 1'
        ).first<string>('version');
    } catch (error) {
        // Older databases serve the original list until the migration is applied.
        if (!(error instanceof Error) || !/no such table: (?:main\.)?order_list_revision\b/i.test(error.message)) {
            throw error;
        }
    }
    if (generation) {
        const tag = `W/"orders-v1${recentOnly ? "-recent" : ""}-${c.get('user')!.id}-${startDate?.getTime() ?? "all"}-${endDate?.getTime() ?? "all"}-${generation}"`;
        c.header('Cache-Control', 'private, no-cache');
        c.header('Vary', 'Cookie, Authorization, X-Client', { append: true });
        c.header('ETag', tag);
        if (c.req.header('If-None-Match') === tag) return c.body(null, 304);
    }
    const orders = await storage.getOrdersWithItems(startDate, endDate, recentOnly ? 5 : undefined);
    return c.json(orders);
});

app.get('/orders/:id', requireAuth, async (c) => {
    const storage = c.get('storage');
    const user = c.get('user')!;
    const id = parseInt(c.req.param('id'));

    const order = await storage.getOrderWithItems(id);

    if (!order) {
        return c.json({ message: "Order not found" }, 404);
    }

    // Provide access if admin or own order
    if (!user.isAdmin && order.userId !== user.id) {
        return c.json({ message: "Unauthorized" }, 403);
    }

    return c.json(order);
});

app.post('/orders', async (c) => {
    const storage = c.get('storage');
    const user = c.get('user');
    const body = await c.req.json();

    // Handle two possible formats:
    // 1. Frontend format: { orderData: {...}, cartItems: [...] }
    // 2. Direct format: { items: [...], ...orderData }
    let orderData: any;
    let items: any[];

    if (body.orderData && body.cartItems) {
        // Frontend format
        orderData = body.orderData;
        items = body.cartItems;
    } else if (body.items) {
        // Direct format
        const { items: bodyItems, ...rest } = body;
        orderData = rest;
        items = bodyItems;
    } else {
        return c.json({ message: "Order must have items" }, 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return c.json({ message: "Order must have items" }, 400);
    }

    try {
        const order = await storage.createOrder({
            ...orderData,
            userId: user?.id || null // Allow guest checkout if userId provided or null
        }, items);

        // Send email logic would go here

        return c.json(order, 201);
    } catch (error) {
        console.error("Order creation failed:", error);
        return c.json({ message: "Order creation failed" }, 500);
    }
});

app.patch('/orders/:id/status', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const { status } = await c.req.json();

    const order = await storage.updateOrderStatus(id, status);
    if (!order) return c.json({ message: "Order not found" }, 404);

    return c.json(order);
});

app.delete('/orders/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));

    // Check if order exists
    const order = await storage.getOrder(id);
    if (!order) {
        return c.json({ message: "Захиалга олдсонгүй" }, 404);
    }

    const success = await storage.deleteOrder(id);
    if (success) {
        return c.json({ message: "Захиалга амжилттай устгагдлаа", id });
    } else {
        return c.json({ message: "Захиалгийг устгахад алдаа гарлаа" }, 500);
    }
});

// Bank Accounts
app.get('/bank-accounts', async (c) => {
    const storage = c.get('storage');
    const accounts = await storage.getBankAccounts();
    return c.json(accounts);
});

app.get('/bank-accounts/default', async (c) => {
    const storage = c.get('storage');
    const account = await storage.getDefaultBankAccount();
    if (!account) return c.json({ message: "No default account" }, 404);
    return c.json(account);
});

app.post('/bank-accounts', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const account = await storage.createBankAccount(body);
    return c.json(account, 201);
});

app.patch('/bank-accounts/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const account = await storage.updateBankAccount(id, body);
    if (!account) return c.json({ message: "Account not found" }, 404);
    return c.json(account);
});

app.delete('/bank-accounts/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteBankAccount(id);
    if (!success) return c.json({ message: "Account not found or is default" }, 400);
    return c.json({ success: true });
});

app.post('/bank-accounts/:id/set-default', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.setDefaultBankAccount(id);
    if (!success) return c.json({ message: "Failed to set default" }, 500);
    return c.json({ success: true });
});

// Delivery Settings
app.get('/delivery-settings', async (c) => {
    const storage = c.get('storage');
    const settings = await storage.getDeliverySettings();
    // Return default if not set
    if (!settings) return c.json({
        cutoffHour: 18,
        cutoffMinute: 30,
        processingDays: 1
    });
    return c.json(settings);
});

app.put('/delivery-settings', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const settings = await storage.updateDeliverySettings(body);
    return c.json(settings);
});

// Non-delivery days
app.get('/non-delivery-days', async (c) => {
    const storage = c.get('storage');
    const days = await storage.getNonDeliveryDays();
    return c.json(days);
});

app.post('/non-delivery-days', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const day = await storage.createNonDeliveryDay(body);
    return c.json(day, 201);
});

app.delete('/non-delivery-days/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteNonDeliveryDay(id);
    if (!success) return c.json({ message: "Day not found" }, 404);
    return c.json({ success: true });
});

export default app;
