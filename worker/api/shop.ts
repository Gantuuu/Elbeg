import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireAdmin } from '../middleware';
import { UserWithNullablePhone } from '@shared/schema';
import { D1Storage, IStorage } from '../storage';

type Env = {
    Bindings: Bindings;
    Variables: {
        user: UserWithNullablePhone | null;
        storage: IStorage;
    };
};

const app = new Hono<Env>();

// Categories
app.get('/categories', async (c) => {
    const storage = c.get('storage');
    const categories = await storage.getCategories();
    return c.json(categories);
});

app.get('/categories/:slug', async (c) => {
    const storage = c.get('storage');
    const slug = c.req.param('slug');
    const category = await storage.getCategoryBySlug(slug);

    if (!category) {
        return c.json({ message: "Category not found" }, 404);
    }

    return c.json(category);
});

app.post('/categories', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const category = await storage.createCategory(body);
    return c.json(category, 201);
});

app.patch('/categories/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const category = await storage.updateCategory(id, body);

    if (!category) return c.json({ message: "Category not found" }, 404);
    return c.json(category);
});

app.delete('/categories/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteCategory(id);

    if (!success) return c.json({ message: "Category not found" }, 404);
    return c.json({ success: true });
});

app.post('/categories/reorder', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const { ids } = await c.req.json();
    const success = await storage.updateCategoriesOrder(ids);
    return c.json({ success });
});

// Meal Kits
app.get('/meal-kits', async (c) => {
    const storage = c.get('storage');
    const mealKits = await storage.getMealKits();
    return c.json(mealKits);
});

app.get('/meal-kits/:id', async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const mealKit = await storage.getMealKit(id);

    if (!mealKit) return c.json({ message: "Meal kit not found" }, 404);
    return c.json(mealKit);
});

app.post('/meal-kits', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const mealKit = await storage.createMealKit(body);
    return c.json(mealKit, 201);
});

app.patch('/meal-kits/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const mealKit = await storage.updateMealKit(id, body);

    if (!mealKit) return c.json({ message: "Meal kit not found" }, 404);
    return c.json(mealKit);
});

app.delete('/meal-kits/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteMealKit(id);

    if (!success) return c.json({ message: "Meal kit not found" }, 404);
    return c.json({ success: true });
});

// Meal Kit Components
app.post('/meal-kit-components', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const component = await storage.createMealKitComponent(body);
    return c.json(component, 201);
});

app.patch('/meal-kit-components/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const component = await storage.updateMealKitComponent(id, body);

    if (!component) return c.json({ message: "Component not found" }, 404);
    return c.json(component);
});

app.delete('/meal-kit-components/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteMealKitComponent(id);

    if (!success) return c.json({ message: "Component not found" }, 404);
    return c.json({ success: true });
});

// Generated Meal Kits
app.post('/generated-meal-kits/generate', async (c) => {
    const storage = c.get('storage');
    const user = c.get('user');
    const body = await c.req.json();

    const generatedKit = await storage.generateMealKit({
        ...body,
        userId: user?.id
    });

    return c.json(generatedKit, 201);
});

app.get('/generated-meal-kits', async (c) => {
    const storage = c.get('storage');
    const user = c.get('user');
    const sessionId = c.req.query('sessionId');

    const kits = await storage.getGeneratedMealKits(user?.id, sessionId);
    return c.json(kits);
});

app.get('/generated-meal-kits/:id', async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const kit = await storage.getGeneratedMealKit(id);

    if (!kit) return c.json({ message: "Generated meal kit not found" }, 404);
    return c.json(kit);
});

// Service Categories
app.get('/service-categories', async (c) => {
    const storage = c.get('storage');
    const categories = await storage.getServiceCategories();
    return c.json(categories);
});

app.get('/service-categories/:slug', async (c) => {
    const storage = c.get('storage');
    const slug = c.req.param('slug');
    const category = await storage.getServiceCategoryBySlug(slug);

    if (!category) return c.json({ message: "Category not found" }, 404);
    return c.json(category);
});

// Stores
app.get('/stores', async (c) => {
    const storage = c.get('storage');
    const categoryId = c.req.query('categoryId');

    if (categoryId) {
        const stores = await storage.getStoresByCategory(parseInt(categoryId));
        return c.json(stores);
    }

    const stores = await storage.getStores();
    return c.json(stores);
});

app.get('/stores/:id', async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const store = await storage.getStoreWithProducts(id);

    if (!store) return c.json({ message: "Store not found" }, 404);
    return c.json(store);
});

// Reviews
app.get('/reviews', async (c) => {
    const storage = c.get('storage');

    // Public users only see approved reviews
    const reviews = await storage.getApprovedReviews();
    return c.json(reviews);
});

app.post('/reviews', requireAuth, async (c) => {
    const storage = c.get('storage');
    const body = await c.req.json();
    const user = c.get('user')!;

    const review = await storage.createReview({
        ...body,
        userId: user.id
    });

    return c.json(review, 201);
});

// Admin Review Management
app.get('/admin/reviews', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const reviews = await storage.getReviews();
    return c.json(reviews);
});

app.patch('/admin/reviews/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const review = await storage.updateReview(id, body);

    if (!review) return c.json({ message: "Review not found" }, 404);
    return c.json(review);
});

app.delete('/admin/reviews/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteReview(id);

    if (!success) return c.json({ message: "Review not found" }, 404);
    return c.json({ success: true });
});

export default app;
