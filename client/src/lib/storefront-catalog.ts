import { z } from "zod";
import type { Product } from "@shared/schema";

export const CATALOG_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
const key = `elbeg:public-catalog:v1:${import.meta.env.VITE_API_BASE_URL || "same-origin"}`;
const categoryKey = `elbeg:public-categories:v1:${import.meta.env.VITE_API_BASE_URL || "same-origin"}`;
const optionalText = z.string().nullable().default(null);

// Only public product fields may be written to the browser snapshot.
const catalogProducts = z.array(z.object({
  id: z.number().int().positive(),
  name: z.string(),
  nameRu: optionalText,
  nameEn: optionalText,
  description: z.string(),
  descriptionRu: optionalText,
  descriptionEn: optionalText,
  category: z.string(),
  price: z.number().finite(),
  imageUrl: z.string(),
  thumbnailUrl: optionalText,
  stock: z.number().finite(),
  minOrderQuantity: z.number().finite().nullable().default(null),
  storeId: z.number().int().nullable().default(null),
  createdAt: z.coerce.date().nullable().default(null),
}));

export function parseCatalogProducts(input: unknown): Product[] {
  return catalogProducts.parse(input);
}

const snapshotHeader = z.object({
  version: z.literal(1),
  savedAt: z.number().finite().refine(time => time <= Date.now() && time > Date.now() - CATALOG_SNAPSHOT_TTL_MS),
});
const productSnapshot = snapshotHeader.extend({ products: catalogProducts });
const categories = z.array(z.object({
  id: z.number().int().positive(),
  name: z.string(),
  isActive: z.boolean().nullish(),
  order: z.number().finite().nullish(),
}));
const categorySnapshot = snapshotHeader.extend({ categories });

export function parseCatalogSnapshot(input: unknown) {
  return productSnapshot.parse(input);
}

function writeSnapshot(storageKey: string, data: object) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, savedAt: Date.now(), ...data }));
  } catch {
    // A previously stored list must not outlive a successful replacement.
    try { localStorage.removeItem(storageKey); } catch { /* storage is unavailable */ }
  }
}

function readSnapshot<T>(storageKey: string, parse: (input: unknown) => T): T | undefined {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function saveCatalogSnapshot(products: Product[]) {
  writeSnapshot(key, { products: parseCatalogProducts(products) });
}

export function readCatalogSnapshot() {
  return readSnapshot(key, parseCatalogSnapshot);
}

export async function fetchStorefrontCategories(signal: AbortSignal) {
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  try {
    const response = await fetch(new URL("/api/categories", base), { credentials: "omit", cache: "no-store", signal });
    if (!response.ok) throw new Error("Categories unavailable");
    const active = categories.parse(await response.json()).filter(category => category.isActive !== false);
    writeSnapshot(categoryKey, { categories: active });
    return { categories: active, savedAt: Date.now(), readOnly: false };
  } catch (error) {
    if (signal.aborted) throw error;
    const stored = readSnapshot(categoryKey, input => categorySnapshot.parse(input));
    if (stored) return { ...stored, readOnly: true };
    throw error;
  }
}

export async function fetchStorefrontCatalog(signal: AbortSignal) {
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  // Public list and public snapshot also work when session lookup is unavailable.
  const options: RequestInit = { credentials: "omit", cache: "no-store", signal };
  try {
    const response = await fetch(new URL("/api/products", base), options);
    if (!response.ok) throw new Error("Catalog unavailable");
    const products = parseCatalogProducts(await response.json());
    saveCatalogSnapshot(products);
    return { products, savedAt: Date.now(), readOnly: false };
  } catch (error) {
    if (signal.aborted) throw error;
    const local = readCatalogSnapshot();
    if (local) return { ...local, readOnly: true };
    const url = new URL("/uploads/public-catalog/last-success-v1.json", base);
    const response = await fetch(url, options);
    if (!response.ok) throw error;
    const snapshot = parseCatalogSnapshot(await response.json());
    return { ...snapshot, readOnly: true };
  }
}
