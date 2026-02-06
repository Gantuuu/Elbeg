import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAdmin } from '../middleware';
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

app.get('/', async (c) => {
    const storage = c.get('storage');
    const category = c.req.query('category');

    if (category) {
        const products = await storage.getProductsByCategory(category);
        return c.json(products);
    }

    const products = await storage.getProducts();
    return c.json(products);
});

app.get('/:id', async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));
    const product = await storage.getProduct(id);

    if (!product) {
        return c.json({ message: "Product not found" }, 404);
    }

    return c.json(product);
});

// Create product with image upload
app.post('/', requireAdmin, async (c) => {
    const storage = c.get('storage');

    // Parse multipart form data
    const body = await c.req.parseBody();
    const file = body['image'];

    let imageUrl = '';

    // Handle file upload to R2 if present
    if (file && file instanceof File) {
        const fileName = `products/${Date.now()}_${file.name}`;
        imageUrl = await storage.uploadFile('media', fileName, file);
    } else if (typeof body['imageUrl'] === 'string') {
        imageUrl = body['imageUrl'];
    }

    try {
        // Parse productData JSON if sent from frontend
        let parsedData: any = {};
        if (body['productData'] && typeof body['productData'] === 'string') {
            parsedData = JSON.parse(body['productData']);
        }

        // Merge parsed data with direct form fields (for backward compatibility)
        const productData = {
            name: parsedData.name || body['name'] as string,
            nameRu: parsedData.nameRu || body['nameRu'] as string || '',
            nameEn: parsedData.nameEn || body['nameEn'] as string || '',
            description: parsedData.description || body['description'] as string || '',
            descriptionRu: parsedData.descriptionRu || body['descriptionRu'] as string || '',
            descriptionEn: parsedData.descriptionEn || body['descriptionEn'] as string || '',
            price: parseFloat(parsedData.price || body['price'] as string),
            category: parsedData.category || body['category'] as string,
            imageUrl: imageUrl || parsedData.imageUrl || '',
            stock: parseInt(parsedData.stock || body['stock'] as string || '999'),
            minOrderQuantity: parseFloat(parsedData.minOrderQuantity || body['minOrderQuantity'] as string || '1'),
            storeId: parsedData.storeId ? parseInt(parsedData.storeId) : (body['storeId'] ? parseInt(body['storeId'] as string) : undefined)
        };

        const newProduct = await storage.createProduct(productData);
        return c.json(newProduct, 201);
    } catch (error: any) {
        console.error("Error creating product:", error);
        return c.json({
            message: "Error creating product",
            error: error.message,
            stack: error.stack
        }, 500);
    }
});

app.put('/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));

    const body = await c.req.parseBody();
    const file = body['image'];

    // Parse productData JSON if sent from frontend
    let parsedData: any = {};
    if (body['productData'] && typeof body['productData'] === 'string') {
        parsedData = JSON.parse(body['productData']);
    }

    // Build update data from parsed JSON or direct form fields
    const updateData: any = {
        name: parsedData.name || body['name'],
        nameRu: parsedData.nameRu || body['nameRu'] || '',
        nameEn: parsedData.nameEn || body['nameEn'] || '',
        description: parsedData.description || body['description'] || '',
        descriptionRu: parsedData.descriptionRu || body['descriptionRu'] || '',
        descriptionEn: parsedData.descriptionEn || body['descriptionEn'] || '',
        category: parsedData.category || body['category'],
        imageUrl: parsedData.imageUrl || body['imageUrl'] || '',
    };

    // Clean up types
    if (parsedData.price || body['price']) {
        updateData.price = parseFloat(parsedData.price || body['price'] as string);
    }
    if (parsedData.stock || body['stock']) {
        updateData.stock = parseInt(parsedData.stock || body['stock'] as string);
    }
    if (parsedData.minOrderQuantity || body['minOrderQuantity']) {
        updateData.minOrderQuantity = parseFloat(parsedData.minOrderQuantity || body['minOrderQuantity'] as string);
    }
    if (parsedData.storeId || body['storeId']) {
        updateData.storeId = parseInt(parsedData.storeId || body['storeId'] as string);
    }

    try {
        const updatedProduct = await storage.updateProduct(id, updateData);

        if (!updatedProduct) {
            return c.json({ message: "Product not found" }, 404);
        }

        return c.json(updatedProduct);
    } catch (error: any) {
        console.error("Error updating product:", error);
        return c.json({
            message: "Error updating product",
            error: error.message,
            stack: error.stack
        }, 500);
    }
});

app.delete('/:id', requireAdmin, async (c) => {
    const storage = c.get('storage');
    const id = parseInt(c.req.param('id'));

    // Omit image deletion from R2 for now to be safe, or implement delete logic
    const success = await storage.deleteProduct(id);

    if (!success) {
        return c.json({ message: "Product not found" }, 404);
    }

    return c.json({ success: true });
});

export default app;
