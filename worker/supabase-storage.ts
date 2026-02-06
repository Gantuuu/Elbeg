import {
    products, type Product, type InsertProduct,
    orders, type Order, type InsertOrder,
    orderItems, type OrderItem, type InsertOrderItem,
    users, type User, type UserWithNullablePhone, type InsertUser,
    siteContent, type SiteContent, type InsertSiteContent,
    bankAccounts, type BankAccount, type InsertBankAccount,
    navigationItems, type NavigationItem, type InsertNavigationItem,
    categories, type Category, type InsertCategory,
    mediaLibrary, type MediaItem, type InsertMediaItem,
    siteSettings, type SiteSetting, type InsertSiteSetting,
    footerSettings, type FooterSetting, type InsertFooterSetting,
    mealKits, type MealKit, type InsertMealKit,
    mealKitComponents, type MealKitComponent, type InsertMealKitComponent,
    generatedMealKits, type GeneratedMealKit, type InsertGeneratedMealKit,
    generatedMealKitComponents, type GeneratedMealKitComponent, type InsertGeneratedMealKitComponent,
    serviceCategories, type ServiceCategory, type InsertServiceCategory,
    stores, type Store, type InsertStore,
    nonDeliveryDays, type NonDeliveryDay, type InsertNonDeliveryDay,
    deliverySettings, type DeliverySetting, type InsertDeliverySetting,
    reviews, type Review, type InsertReview
} from "@shared/schema";
import { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
    supabaseUrl: string;
    supabaseKey: string;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
    }

    private isPlainObject(obj: any): boolean {
        return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && obj.constructor === Object;
    }

    private toCamel(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.toCamel(v));
        } else if (this.isPlainObject(obj)) {
            return Object.keys(obj).reduce(
                (result, key) => ({
                    ...result,
                    [key.replace(/(_\w)/g, m => m[1].toUpperCase())]: this.toCamel(obj[key]),
                }),
                {},
            );
        }
        return obj;
    }

    private toSnake(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.toSnake(v));
        } else if (this.isPlainObject(obj)) {
            return Object.keys(obj).reduce(
                (result, key) => ({
                    ...result,
                    [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)]: this.toSnake(obj[key]),
                }),
                {},
            );
        }
        return obj;
    }

    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.supabaseUrl}/rest/v1/${path}`;

        // Convert body to snake_case if it's a plain search params object or similar
        // BUT if it's already a string, we assume it's JSON.
        // We only want to snake_case the TOP LEVEL properties for PostgREST.
        let body = options?.body;
        if (body && typeof body === 'string') {
            try {
                const parsed = JSON.parse(body);
                // ONLY snake_case top level keys to avoid corrupting nested JSON strings or values
                if (this.isPlainObject(parsed)) {
                    const snaked: any = {};
                    for (const key of Object.keys(parsed)) {
                        const snakedKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                        snaked[snakedKey] = parsed[key];
                    }
                    body = JSON.stringify(snaked);
                }
            } catch (e) {
                // Not JSON or already processed
            }
        }

        const headers = {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            ...(options?.headers || {})
        };

        const response = await fetch(url, { ...options, body, headers });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error: ${response.status} ${text}`);
        }

        // For HEAD or empty responses
        if (response.status === 204) return {} as T;

        const data = await response.json();
        return this.toCamel(data) as T;
    }

    // Storage/Upload operations
    async uploadFile(bucket: string, path: string, file: File): Promise<string> {
        const url = `${this.supabaseUrl}/storage/v1/object/${bucket}/${path}`;

        // Use ArrayBuffer for more reliable fetch in Worker environments
        const arrayBuffer = await file.arrayBuffer();

        const response = await fetch(url, {
            method: 'POST',
            body: arrayBuffer,
            headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Content-Type': file.type || 'application/octet-stream',
                'x-upsert': 'true'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase Storage error: ${response.status} ${text}`);
        }

        // Return public URL (assuming public bucket)
        return `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    }

    // User operations
    async getAllUsers(): Promise<User[]> {
        return await this.fetch<User[]>('users?select=*&order=created_at.desc');
    }

    async getUser(id: number): Promise<User | undefined> {
        const users = await this.fetch<User[]>(`users?id=eq.${id}&select=*`);
        return users[0];
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const users = await this.fetch<User[]>(`users?username=eq.${username}&select=*`);
        return users[0];
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const users = await this.fetch<User[]>(`users?email=eq.${encodeURIComponent(email)}&select=*`);
        return users[0];
    }

    async getUserByGoogleId(googleId: string): Promise<User | undefined> {
        const users = await this.fetch<User[]>(`users?google_id=eq.${googleId}&select=*`);
        return users[0];
    }

    async updateUserGoogleId(userId: number, googleId: string, profileImageUrl?: string): Promise<User | undefined> {
        const data: any = { googleId };
        if (profileImageUrl) data.profileImageUrl = profileImageUrl;

        const users = await this.fetch<User[]>(`users?id=eq.${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: { 'Prefer': 'return=representation' }
        });
        return users[0];
    }

    async createUser(user: InsertUser): Promise<User> {
        const users = await this.fetch<User[]>(`users`, {
            method: 'POST',
            body: JSON.stringify({ ...user, isAdmin: false }),
            headers: { 'Prefer': 'return=representation' }
        });
        return users[0];
    }

    async getUserOrders(userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
        // Complex query, implementing basic fetch for now
        // This requires joins which PostgREST handles via embedding
        // url: orders?select=*,items:order_items(select=*,product:products(*))&user_id=eq.1
        const orders = await this.fetch<any[]>(`orders?select=*,items:order_items(*,product:products(*))&user_id=eq.${userId}&order=created_at.desc`);
        return orders;
    }

    async getPendingOrdersCount(): Promise<number> {
        // Using HEAD to count
        const url = `${this.supabaseUrl}/rest/v1/orders?status=eq.pending`;
        const response = await fetch(url, {
            method: 'HEAD',
            headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Prefer': 'count=exact'
            }
        });

        const countRange = response.headers.get('content-range');
        if (countRange) {
            return parseInt(countRange.split('/')[1]);
        }
        return 0;
    }

    // Bank Account operations
    async getBankAccounts(): Promise<BankAccount[]> {
        return await this.fetch<BankAccount[]>('bank_accounts?select=*');
    }

    async getDefaultBankAccount(): Promise<BankAccount | undefined> {
        const accounts = await this.fetch<BankAccount[]>('bank_accounts?is_default=eq.true&select=*');
        return accounts[0];
    }

    async getBankAccount(id: number): Promise<BankAccount | undefined> {
        const accounts = await this.fetch<BankAccount[]>(`bank_accounts?id=eq.${id}&select=*`);
        return accounts[0];
    }

    async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
        const accounts = await this.fetch<BankAccount[]>('bank_accounts', {
            method: 'POST',
            body: JSON.stringify(bankAccount),
            headers: { 'Prefer': 'return=representation' }
        });
        return accounts[0];
    }

    async updateBankAccount(id: number, bankAccount: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
        const accounts = await this.fetch<BankAccount[]>(`bank_accounts?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(bankAccount),
            headers: { 'Prefer': 'return=representation' }
        });
        return accounts[0];
    }

    async deleteBankAccount(id: number): Promise<boolean> {
        const account = await this.getBankAccount(id);
        if (!account) return false; // Not found

        await this.fetch(`bank_accounts?id=eq.${id}`, {
            method: 'DELETE'
        });
        return true;
    }

    async setDefaultBankAccount(id: number): Promise<boolean> {
        // Transaction not supported easily in one go, sequential update
        // 1. Set all to false
        await this.fetch('bank_accounts?is_default=eq.true', {
            method: 'PATCH',
            body: JSON.stringify({ isDefault: false })
        });

        // 2. Set target to true
        const accounts = await this.fetch<BankAccount[]>(`bank_accounts?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isDefault: true }),
            headers: { 'Prefer': 'return=representation' }
        });

        return !!accounts[0];
    }

    // Category operations
    async getCategories(): Promise<Category[]> {
        return await this.fetch<Category[]>('categories?select=*&order=order.asc');
    }

    async getCategory(id: number): Promise<Category | undefined> {
        const items = await this.fetch<Category[]>(`categories?id=eq.${id}`);
        return items[0];
    }

    async getCategoryBySlug(slug: string): Promise<Category | undefined> {
        const items = await this.fetch<Category[]>(`categories?slug=eq.${slug}`);
        return items[0];
    }

    async createCategory(category: InsertCategory): Promise<Category> {
        const items = await this.fetch<Category[]>('categories', {
            method: 'POST',
            body: JSON.stringify(category),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
        const items = await this.fetch<Category[]>(`categories?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(category),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateCategoriesOrder(categoryIds: number[]): Promise<boolean> {
        // Sequential update
        for (let i = 0; i < categoryIds.length; i++) {
            await this.fetch(`categories?id=eq.${categoryIds[i]}`, {
                method: 'PATCH',
                body: JSON.stringify({ order: i })
            });
        }
        return true;
    }

    async deleteCategory(id: number): Promise<boolean> {
        await this.fetch(`categories?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }

    // Stubs for other methods (implement as needed/lazy)
    // Product operations
    async getProducts(): Promise<Product[]> {
        return await this.fetch<Product[]>('products?select=*&order=created_at.desc');
    }

    async getProductsByCategory(category: string): Promise<Product[]> {
        return await this.fetch<Product[]>(`products?category=eq.${category}&select=*`);
    }

    async getProduct(id: number): Promise<Product | undefined> {
        const items = await this.fetch<Product[]>(`products?id=eq.${id}&select=*`);
        return items[0];
    }

    async createProduct(product: InsertProduct): Promise<Product> {
        const items = await this.fetch<Product[]>('products', {
            method: 'POST',
            body: JSON.stringify(product),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
        const items = await this.fetch<Product[]>(`products?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(product),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteProduct(id: number): Promise<boolean> {
        await this.fetch(`products?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }
    // Order operations
    async getOrders(startDate?: Date, endDate?: Date): Promise<Order[]> {
        let query = 'orders?select=*&order=created_at.desc';
        if (startDate) {
            query += `&created_at=gte.${startDate.toISOString()}`;
        }
        if (endDate) {
            query += `&created_at=lte.${endDate.toISOString()}`;
        }
        return await this.fetch<Order[]>(query);
    }

    async getOrdersWithItems(startDate?: Date, endDate?: Date): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
        let query = 'orders?select=*,items:order_items(*,product:products(*))&order=created_at.desc';
        if (startDate) {
            query += `&created_at=gte.${startDate.toISOString()}`;
        }
        if (endDate) {
            query += `&created_at=lte.${endDate.toISOString()}`;
        }
        return await this.fetch<any[]>(query);
    }

    async getOrder(id: number): Promise<Order | undefined> {
        const items = await this.fetch<Order[]>(`orders?id=eq.${id}&select=*`);
        return items[0];
    }

    async getOrderWithItems(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
        const items = await this.fetch<any[]>(`orders?id=eq.${id}&select=*,items:order_items(*,product:products(*))`);
        return items[0];
    }

    async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
        // 1. Create Order
        const newOrders = await this.fetch<Order[]>('orders', {
            method: 'POST',
            body: JSON.stringify({ ...order, status: 'pending', userId: order.userId || null }),
            headers: { 'Prefer': 'return=representation' }
        });
        const newOrder = newOrders[0];

        // 2. Create Items
        if (items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                orderId: newOrder.id
            }));
            await this.fetch('order_items', {
                method: 'POST',
                body: JSON.stringify(itemsToInsert)
            });

            // 3. Update Stock (Simple sequential for now, ideally RPC)
            for (const item of items) {
                // We need to get current stock first? Or just decrement?
                // Supabase doesn't have atomic decrement via REST easily without RPC.
                // For now, fetch product, subtraction, update. Race condition possible but acceptable for now.
                const products = await this.fetch<Product[]>(`products?id=eq.${item.productId}`);
                if (products[0]) {
                    const newStock = Math.max(0, products[0].stock - item.quantity);
                    await this.fetch(`products?id=eq.${item.productId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ stock: newStock })
                    });
                }
            }
        }

        return newOrder;
    }

    async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
        const items = await this.fetch<Order[]>(`orders?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }
    // Site Content
    async getSiteContents(): Promise<SiteContent[]> {
        return await this.fetch<SiteContent[]>('site_content?select=*');
    }

    async getSiteContentByKey(key: string): Promise<SiteContent | undefined> {
        const items = await this.fetch<SiteContent[]>(`site_content?key=eq.${key}&select=*`);
        return items[0];
    }

    async createSiteContent(content: InsertSiteContent): Promise<SiteContent> {
        const items = await this.fetch<SiteContent[]>('site_content', {
            method: 'POST',
            body: JSON.stringify(content),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateSiteContent(id: number, content: Partial<InsertSiteContent>): Promise<SiteContent | undefined> {
        const items = await this.fetch<SiteContent[]>(`site_content?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...content, updatedAt: new Date() }),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteSiteContent(id: number): Promise<boolean> {
        await this.fetch(`site_content?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }

    // Navigation
    async getNavigationItems(): Promise<NavigationItem[]> {
        return await this.fetch<NavigationItem[]>('navigation_items?select=*&order=order.asc');
    }

    async getNavigationItemsTree(): Promise<NavigationItem[]> {
        const items = await this.getNavigationItems();
        const topLevelItems = items.filter(item => !item.parentId);

        // Recursively build tree locally
        type NavigationItemWithChildren = NavigationItem & { children: NavigationItemWithChildren[] };
        const buildTree = (parentItems: NavigationItem[]): NavigationItemWithChildren[] => {
            return parentItems.map(item => {
                const children = items.filter(i => i.parentId === item.id);
                return {
                    ...item,
                    children: children.length > 0 ? buildTree(children) : []
                } as NavigationItemWithChildren;
            });
        };

        return buildTree(topLevelItems);
    }

    async getNavigationItem(id: number): Promise<NavigationItem | undefined> {
        const items = await this.fetch<NavigationItem[]>(`navigation_items?id=eq.${id}`);
        return items[0];
    }

    async createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem> {
        const items = await this.fetch<NavigationItem[]>('navigation_items', {
            method: 'POST',
            body: JSON.stringify(item),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateNavigationItem(id: number, item: Partial<InsertNavigationItem>): Promise<NavigationItem | undefined> {
        const items = await this.fetch<NavigationItem[]>(`navigation_items?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(item),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateNavigationItemsOrder(itemIds: number[]): Promise<boolean> {
        for (let i = 0; i < itemIds.length; i++) {
            await this.fetch(`navigation_items?id=eq.${itemIds[i]}`, {
                method: 'PATCH',
                body: JSON.stringify({ order: i })
            });
        }
        return true;
    }

    async deleteNavigationItem(id: number): Promise<boolean> {
        await this.fetch(`navigation_items?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }

    // Media
    async getMediaItems(): Promise<MediaItem[]> {
        return await this.fetch<MediaItem[]>('media_library?select=*&order=created_at.desc');
    }

    async getMediaItem(id: number): Promise<MediaItem | undefined> {
        const items = await this.fetch<MediaItem[]>(`media_library?id=eq.${id}&select=*`);
        return items[0];
    }

    async createMediaItem(media: InsertMediaItem): Promise<MediaItem> {
        const items = await this.fetch<MediaItem[]>('media_library', {
            method: 'POST',
            body: JSON.stringify(media),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateMediaItem(id: number, media: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
        const items = await this.fetch<MediaItem[]>(`media_library?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(media),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteMediaItem(id: number): Promise<boolean> {
        await this.fetch(`media_library?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }
    // Site Settings methods
    async getSiteSettings(): Promise<SiteSetting[]> {
        return await this.fetch<SiteSetting[]>('site_settings?select=*');
    }

    async getSiteSettingByKey(key: string): Promise<SiteSetting | undefined> {
        const settings = await this.fetch<SiteSetting[]>(`site_settings?key=eq.${key}&select=*`);
        return settings[0];
    }

    async createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> {
        const settings = await this.fetch<SiteSetting[]>('site_settings', {
            method: 'POST',
            body: JSON.stringify(setting),
            headers: { 'Prefer': 'return=representation' }
        });
        return settings[0];
    }

    async updateSiteSetting(id: number, setting: Partial<InsertSiteSetting>): Promise<SiteSetting | undefined> {
        const settings = await this.fetch<SiteSetting[]>(`site_settings?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...setting, updatedAt: new Date() }),
            headers: { 'Prefer': 'return=representation' }
        });
        return settings[0];
    }

    async updateSiteSettingByKey(key: string, value: string): Promise<SiteSetting | undefined> {
        // First check if it exists to decide whether to update or create happens in controller usually, 
        // but here we just update by key.
        // Supabase update by key requires the key to be unique, which it is.
        const settings = await this.fetch<SiteSetting[]>(`site_settings?key=eq.${key}`, {
            method: 'PATCH',
            body: JSON.stringify({ value, updatedAt: new Date() }),
            headers: { 'Prefer': 'return=representation' }
        });
        return settings[0];
    }

    // Meal Kits
    async getMealKits(): Promise<MealKit[]> {
        return await this.fetch<MealKit[]>('meal_kits?select=*');
    }

    async getMealKit(id: number): Promise<(MealKit & { components: (MealKitComponent & { product: Product })[] }) | undefined> {
        const items = await this.fetch<any[]>(`meal_kits?id=eq.${id}&select=*,components:meal_kit_components(*,product:products(*))`);
        return items[0];
    }

    async createMealKit(mealKit: InsertMealKit): Promise<MealKit> {
        const items = await this.fetch<MealKit[]>('meal_kits', {
            method: 'POST',
            body: JSON.stringify(mealKit),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateMealKit(id: number, mealKit: Partial<InsertMealKit>): Promise<MealKit | undefined> {
        const items = await this.fetch<MealKit[]>(`meal_kits?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(mealKit),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteMealKit(id: number): Promise<boolean> {
        await this.fetch(`meal_kits?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }

    // Meal Kit Components
    async getMealKitComponents(mealKitId: number): Promise<(MealKitComponent & { product: Product })[]> {
        const items = await this.fetch<any[]>(`meal_kit_components?meal_kit_id=eq.${mealKitId}&select=*,product:products(*)`);
        return items;
    }

    async createMealKitComponent(component: InsertMealKitComponent): Promise<MealKitComponent> {
        const items = await this.fetch<MealKitComponent[]>('meal_kit_components', {
            method: 'POST',
            body: JSON.stringify(component),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateMealKitComponent(id: number, component: Partial<InsertMealKitComponent>): Promise<MealKitComponent | undefined> {
        const items = await this.fetch<MealKitComponent[]>(`meal_kit_components?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(component),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteMealKitComponent(id: number): Promise<boolean> {
        await this.fetch(`meal_kit_components?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }

    // Generated Meal Kits (Simplifying for now, might need RPC for complexity)
    async getGeneratedMealKits(userId?: number, sessionId?: string): Promise<GeneratedMealKit[]> {
        let query = 'generated_meal_kits?select=*&order=created_at.desc';
        if (userId) query += `&user_id=eq.${userId}`;
        if (sessionId) query += `&session_id=eq.${sessionId}`;
        return await this.fetch<GeneratedMealKit[]>(query);
    }

    // Stubs for complex generated meal kits which are less critical for daily admin
    getGeneratedMealKit(id: number): Promise<(GeneratedMealKit & { components: (GeneratedMealKitComponent & { product: Product })[] }) | undefined> { throw new Error("Method not implemented."); }
    createGeneratedMealKit(mealKit: InsertGeneratedMealKit, components: InsertGeneratedMealKitComponent[]): Promise<GeneratedMealKit> { throw new Error("Method not implemented."); }
    updateGeneratedMealKit(id: number, mealKit: Partial<InsertGeneratedMealKit>): Promise<GeneratedMealKit | undefined> { throw new Error("Method not implemented."); }
    deleteGeneratedMealKit(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getGeneratedMealKitComponents(mealKitId: number): Promise<(GeneratedMealKitComponent & { product: Product })[]> { throw new Error("Method not implemented."); }
    generateMealKit(params: any): Promise<GeneratedMealKit & { components: (GeneratedMealKitComponent & { product: Product })[] }> { throw new Error("Method not implemented."); }
    // Service Categories
    async getServiceCategories(): Promise<ServiceCategory[]> {
        return await this.fetch<ServiceCategory[]>('service_categories?select=*');
    }

    async getServiceCategoryBySlug(slug: string): Promise<ServiceCategory | undefined> {
        const items = await this.fetch<ServiceCategory[]>(`service_categories?slug=eq.${slug}`);
        return items[0];
    }

    async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
        const items = await this.fetch<ServiceCategory[]>('service_categories', {
            method: 'POST',
            body: JSON.stringify(category),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> {
        const items = await this.fetch<ServiceCategory[]>(`service_categories?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(category),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteServiceCategory(id: number): Promise<boolean> {
        await this.fetch(`service_categories?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }

    // Stores
    async getStores(): Promise<Store[]> {
        return await this.fetch<Store[]>('stores?select=*');
    }

    async getStoresByCategory(categoryId: number): Promise<Store[]> {
        return await this.fetch<Store[]>(`stores?category_id=eq.${categoryId}`);
    }

    async getStoresByCategorySlug(slug: string): Promise<Store[]> {
        // Need to fetch category first to get ID, or join... simplest is fetch category first
        const category = await this.getServiceCategoryBySlug(slug);
        if (!category) return [];
        return await this.getStoresByCategory(category.id);
    }

    async getStore(id: number): Promise<Store | undefined> {
        const items = await this.fetch<Store[]>(`stores?id=eq.${id}`);
        return items[0];
    }

    async getStoreWithProducts(id: number): Promise<(Store & { products: Product[] }) | undefined> {
        // Join with products
        const items = await this.fetch<any[]>(`stores?id=eq.${id}&select=*,products(*)`);
        return items[0];
    }

    async createStore(store: InsertStore): Promise<Store> {
        const items = await this.fetch<Store[]>('stores', {
            method: 'POST',
            body: JSON.stringify(store),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined> {
        const items = await this.fetch<Store[]>(`stores?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(store),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteStore(id: number): Promise<boolean> {
        await this.fetch(`stores?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }
    // Non-Delivery Days
    async getNonDeliveryDays(): Promise<NonDeliveryDay[]> {
        return await this.fetch<NonDeliveryDay[]>('non_delivery_days?select=*&order=date.asc');
    }

    async getNonDeliveryDay(id: number): Promise<NonDeliveryDay | undefined> {
        const items = await this.fetch<NonDeliveryDay[]>(`non_delivery_days?id=eq.${id}`);
        return items[0];
    }

    async createNonDeliveryDay(day: InsertNonDeliveryDay): Promise<NonDeliveryDay> {
        const items = await this.fetch<NonDeliveryDay[]>('non_delivery_days', {
            method: 'POST',
            body: JSON.stringify(day),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateNonDeliveryDay(id: number, day: Partial<InsertNonDeliveryDay>): Promise<NonDeliveryDay | undefined> {
        const items = await this.fetch<NonDeliveryDay[]>(`non_delivery_days?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(day),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteNonDeliveryDay(id: number): Promise<boolean> {
        await this.fetch(`non_delivery_days?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }
    // Delivery Settings
    async getDeliverySettings(): Promise<DeliverySetting | undefined> {
        const items = await this.fetch<DeliverySetting[]>('delivery_settings?select=*');
        return items[0];
    }

    async updateDeliverySettings(settings: Partial<InsertDeliverySetting>): Promise<DeliverySetting> {
        // Upsert logic for single row settings
        // If row exists (id=1 usually for singletons), update. Else create.
        // Or assume ID 1 exists.
        // Safe approach: check if exists
        const existing = await this.getDeliverySettings();

        if (existing) {
            const items = await this.fetch<DeliverySetting[]>(`delivery_settings?id=eq.${existing.id}`, {
                method: 'PATCH',
                body: JSON.stringify(settings),
                headers: { 'Prefer': 'return=representation' }
            });
            return items[0];
        } else {
            const items = await this.fetch<DeliverySetting[]>('delivery_settings', {
                method: 'POST',
                body: JSON.stringify(settings),
                headers: { 'Prefer': 'return=representation' }
            });
            return items[0];
        }
    }

    // Footer Settings
    async getFooterSettings(): Promise<FooterSetting | undefined> {
        const items = await this.fetch<FooterSetting[]>('footer_settings?select=*');
        return items[0];
    }

    async updateFooterSettings(settings: Partial<InsertFooterSetting>): Promise<FooterSetting> {
        const existing = await this.getFooterSettings();

        if (existing) {
            const items = await this.fetch<FooterSetting[]>(`footer_settings?id=eq.${existing.id}`, {
                method: 'PATCH',
                body: JSON.stringify(settings),
                headers: { 'Prefer': 'return=representation' }
            });
            return items[0];
        } else {
            const items = await this.fetch<FooterSetting[]>('footer_settings', {
                method: 'POST',
                body: JSON.stringify(settings),
                headers: { 'Prefer': 'return=representation' }
            });
            return items[0];
        }
    }
    // Reviews
    async getReviews(): Promise<Review[]> {
        return await this.fetch<Review[]>('reviews?select=*&order=created_at.desc');
    }

    async getApprovedReviews(): Promise<Review[]> {
        return await this.fetch<Review[]>('reviews?is_approved=eq.true&select=*&order=created_at.desc');
    }

    async getReview(id: number): Promise<Review | undefined> {
        const items = await this.fetch<Review[]>(`reviews?id=eq.${id}`);
        return items[0];
    }

    async createReview(review: InsertReview): Promise<Review> {
        const items = await this.fetch<Review[]>('reviews', {
            method: 'POST',
            body: JSON.stringify(review),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async updateReview(id: number, review: Partial<InsertReview & { isApproved: boolean }>): Promise<Review | undefined> {
        const items = await this.fetch<Review[]>(`reviews?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(review),
            headers: { 'Prefer': 'return=representation' }
        });
        return items[0];
    }

    async deleteReview(id: number): Promise<boolean> {
        await this.fetch(`reviews?id=eq.${id}`, { method: 'DELETE' });
        return true;
    }
}
