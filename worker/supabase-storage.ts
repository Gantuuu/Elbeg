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

    private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.supabaseUrl}/rest/v1/${path}`;
        const headers = {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            ...(options?.headers || {})
        };

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase error: ${response.status} ${text}`);
        }

        // For HEAD or empty responses
        if (response.status === 204) return {} as T;

        return await response.json() as T;
    }

    // User operations
    async getAllUsers(): Promise<User[]> {
        return await this.fetch<User[]>('users?select=*&order=createdAt.desc');
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
        const users = await this.fetch<User[]>(`users?googleId=eq.${googleId}&select=*`);
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
        // url: orders?select=*,items:order_items(select=*,product:products(*))&userId=eq.1
        const orders = await this.fetch<any[]>(`orders?select=*,items:order_items(*,product:products(*))&userId=eq.${userId}&order=createdAt.desc`);
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
        return await this.fetch<BankAccount[]>('bankAccounts?select=*');
    }

    async getDefaultBankAccount(): Promise<BankAccount | undefined> {
        const accounts = await this.fetch<BankAccount[]>('bankAccounts?isDefault=eq.true&select=*');
        return accounts[0];
    }

    async getBankAccount(id: number): Promise<BankAccount | undefined> {
        const accounts = await this.fetch<BankAccount[]>(`bankAccounts?id=eq.${id}&select=*`);
        return accounts[0];
    }

    async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
        const accounts = await this.fetch<BankAccount[]>('bankAccounts', {
            method: 'POST',
            body: JSON.stringify(bankAccount),
            headers: { 'Prefer': 'return=representation' }
        });
        return accounts[0];
    }

    async updateBankAccount(id: number, bankAccount: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
        const accounts = await this.fetch<BankAccount[]>(`bankAccounts?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(bankAccount),
            headers: { 'Prefer': 'return=representation' }
        });
        return accounts[0];
    }

    async deleteBankAccount(id: number): Promise<boolean> {
        const account = await this.getBankAccount(id);
        if (!account) return false; // Not found

        await this.fetch(`bankAccounts?id=eq.${id}`, {
            method: 'DELETE'
        });
        return true;
    }

    async setDefaultBankAccount(id: number): Promise<boolean> {
        // Transaction not supported easily in one go, sequential update
        // 1. Set all to false
        await this.fetch('bankAccounts?isDefault=eq.true', {
            method: 'PATCH',
            body: JSON.stringify({ isDefault: false })
        });

        // 2. Set target to true
        const accounts = await this.fetch<BankAccount[]>(`bankAccounts?id=eq.${id}`, {
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
    getProducts(): Promise<Product[]> { throw new Error("Method not implemented."); }
    getProductsByCategory(category: string): Promise<Product[]> { throw new Error("Method not implemented."); }
    getProduct(id: number): Promise<Product | undefined> { throw new Error("Method not implemented."); }
    createProduct(product: InsertProduct): Promise<Product> { throw new Error("Method not implemented."); }
    updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> { throw new Error("Method not implemented."); }
    deleteProduct(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getOrders(startDate?: Date, endDate?: Date): Promise<Order[]> { throw new Error("Method not implemented."); }
    getOrdersWithItems(startDate?: Date, endDate?: Date): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> { throw new Error("Method not implemented."); }
    getOrder(id: number): Promise<Order | undefined> { throw new Error("Method not implemented."); }
    getOrderWithItems(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> { throw new Error("Method not implemented."); }
    createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> { throw new Error("Method not implemented."); }
    updateOrderStatus(id: number, status: string): Promise<Order | undefined> { throw new Error("Method not implemented."); }
    getSiteContents(): Promise<SiteContent[]> { throw new Error("Method not implemented."); }
    getSiteContentByKey(key: string): Promise<SiteContent | undefined> { throw new Error("Method not implemented."); }
    createSiteContent(content: InsertSiteContent): Promise<SiteContent> { throw new Error("Method not implemented."); }
    updateSiteContent(id: number, content: Partial<InsertSiteContent>): Promise<SiteContent | undefined> { throw new Error("Method not implemented."); }
    deleteSiteContent(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getNavigationItems(): Promise<NavigationItem[]> { throw new Error("Method not implemented."); }
    getNavigationItemsTree(): Promise<NavigationItem[]> { throw new Error("Method not implemented."); }
    getNavigationItem(id: number): Promise<NavigationItem | undefined> { throw new Error("Method not implemented."); }
    createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem> { throw new Error("Method not implemented."); }
    updateNavigationItem(id: number, item: Partial<InsertNavigationItem>): Promise<NavigationItem | undefined> { throw new Error("Method not implemented."); }
    updateNavigationItemsOrder(itemIds: number[]): Promise<boolean> { throw new Error("Method not implemented."); }
    deleteNavigationItem(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getMediaItems(): Promise<MediaItem[]> { throw new Error("Method not implemented."); }
    getMediaItem(id: number): Promise<MediaItem | undefined> { throw new Error("Method not implemented."); }
    createMediaItem(media: InsertMediaItem): Promise<MediaItem> { throw new Error("Method not implemented."); }
    updateMediaItem(id: number, media: Partial<InsertMediaItem>): Promise<MediaItem | undefined> { throw new Error("Method not implemented."); }
    deleteMediaItem(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getSiteSettings(): Promise<SiteSetting[]> { throw new Error("Method not implemented."); }
    getSiteSettingByKey(key: string): Promise<SiteSetting | undefined> { throw new Error("Method not implemented."); }
    createSiteSetting(setting: InsertSiteSetting): Promise<SiteSetting> { throw new Error("Method not implemented."); }
    updateSiteSetting(id: number, setting: Partial<InsertSiteSetting>): Promise<SiteSetting | undefined> { throw new Error("Method not implemented."); }
    updateSiteSettingByKey(key: string, value: string): Promise<SiteSetting | undefined> { throw new Error("Method not implemented."); }
    getFooterSettings(): Promise<FooterSetting | undefined> { throw new Error("Method not implemented."); }
    updateFooterSettings(settings: Partial<InsertFooterSetting>): Promise<FooterSetting> { throw new Error("Method not implemented."); }
    getMealKits(): Promise<MealKit[]> { throw new Error("Method not implemented."); }
    getMealKit(id: number): Promise<(MealKit & { components: (MealKitComponent & { product: Product })[] }) | undefined> { throw new Error("Method not implemented."); }
    createMealKit(mealKit: InsertMealKit): Promise<MealKit> { throw new Error("Method not implemented."); }
    updateMealKit(id: number, mealKit: Partial<InsertMealKit>): Promise<MealKit | undefined> { throw new Error("Method not implemented."); }
    deleteMealKit(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getMealKitComponents(mealKitId: number): Promise<(MealKitComponent & { product: Product })[]> { throw new Error("Method not implemented."); }
    createMealKitComponent(component: InsertMealKitComponent): Promise<MealKitComponent> { throw new Error("Method not implemented."); }
    updateMealKitComponent(id: number, component: Partial<InsertMealKitComponent>): Promise<MealKitComponent | undefined> { throw new Error("Method not implemented."); }
    deleteMealKitComponent(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getGeneratedMealKits(userId?: number, sessionId?: string): Promise<GeneratedMealKit[]> { throw new Error("Method not implemented."); }
    getGeneratedMealKit(id: number): Promise<(GeneratedMealKit & { components: (GeneratedMealKitComponent & { product: Product })[] }) | undefined> { throw new Error("Method not implemented."); }
    createGeneratedMealKit(mealKit: InsertGeneratedMealKit, components: InsertGeneratedMealKitComponent[]): Promise<GeneratedMealKit> { throw new Error("Method not implemented."); }
    updateGeneratedMealKit(id: number, mealKit: Partial<InsertGeneratedMealKit>): Promise<GeneratedMealKit | undefined> { throw new Error("Method not implemented."); }
    deleteGeneratedMealKit(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getGeneratedMealKitComponents(mealKitId: number): Promise<(GeneratedMealKitComponent & { product: Product })[]> { throw new Error("Method not implemented."); }
    generateMealKit(params: any): Promise<GeneratedMealKit & { components: (GeneratedMealKitComponent & { product: Product })[] }> { throw new Error("Method not implemented."); }
    getServiceCategories(): Promise<ServiceCategory[]> { throw new Error("Method not implemented."); }
    getServiceCategoryBySlug(slug: string): Promise<ServiceCategory | undefined> { throw new Error("Method not implemented."); }
    createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> { throw new Error("Method not implemented."); }
    updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> { throw new Error("Method not implemented."); }
    deleteServiceCategory(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getStores(): Promise<Store[]> { throw new Error("Method not implemented."); }
    getStoresByCategory(categoryId: number): Promise<Store[]> { throw new Error("Method not implemented."); }
    getStoresByCategorySlug(slug: string): Promise<Store[]> { throw new Error("Method not implemented."); }
    getStore(id: number): Promise<Store | undefined> { throw new Error("Method not implemented."); }
    getStoreWithProducts(id: number): Promise<(Store & { products: Product[] }) | undefined> { throw new Error("Method not implemented."); }
    createStore(store: InsertStore): Promise<Store> { throw new Error("Method not implemented."); }
    updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined> { throw new Error("Method not implemented."); }
    deleteStore(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getNonDeliveryDays(): Promise<NonDeliveryDay[]> { throw new Error("Method not implemented."); }
    getNonDeliveryDay(id: number): Promise<NonDeliveryDay | undefined> { throw new Error("Method not implemented."); }
    createNonDeliveryDay(day: InsertNonDeliveryDay): Promise<NonDeliveryDay> { throw new Error("Method not implemented."); }
    updateNonDeliveryDay(id: number, day: Partial<InsertNonDeliveryDay>): Promise<NonDeliveryDay | undefined> { throw new Error("Method not implemented."); }
    deleteNonDeliveryDay(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
    getDeliverySettings(): Promise<DeliverySetting | undefined> { throw new Error("Method not implemented."); }
    updateDeliverySettings(settings: Partial<InsertDeliverySetting>): Promise<DeliverySetting> { throw new Error("Method not implemented."); }
    getReviews(): Promise<Review[]> { throw new Error("Method not implemented."); }
    getApprovedReviews(): Promise<Review[]> { throw new Error("Method not implemented."); }
    getReview(id: number): Promise<Review | undefined> { throw new Error("Method not implemented."); }
    createReview(review: InsertReview): Promise<Review> { throw new Error("Method not implemented."); }
    updateReview(id: number, review: Partial<InsertReview & { isApproved: boolean }>): Promise<Review | undefined> { throw new Error("Method not implemented."); }
    deleteReview(id: number): Promise<boolean> { throw new Error("Method not implemented."); }
}
