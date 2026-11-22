import type { R2Bucket } from "@cloudflare/workers-types";
import type { Product } from "@shared/schema";

export const publicCatalogKey = "public-catalog/last-success-v1.json";
const refreshAfterMs = 10 * 60 * 1000;

function publicProduct(product: Product) {
    const {
        id, name, nameRu, nameEn, description, descriptionRu, descriptionEn,
        category, price, imageUrl, thumbnailUrl, stock, minOrderQuantity, storeId, createdAt,
    } = product;
    return {
        id, name, nameRu, nameEn, description, descriptionRu, descriptionEn,
        category, price, imageUrl, thumbnailUrl, stock, minOrderQuantity, storeId, createdAt,
    };
}

export async function savePublicCatalog(bucket: R2Bucket, products: Product[], savedAt: number) {
    // An empty result is authoritative; publish transitions to/from empty immediately.
    const empty = String(products.length === 0);
    for (let attempt = 0; attempt < 3; attempt++) {
        const current = await bucket.head(publicCatalogKey);
        if (current) {
            const previous = Number(current.customMetadata?.savedAt) || current.uploaded.getTime();
            if (previous > savedAt) return;
            // Millisecond timestamps can tie. Keep an authoritative empty snapshot on a tie.
            if (previous === savedAt && current.customMetadata?.empty === "true") return;
            if (current.customMetadata?.empty === empty && savedAt - previous < refreshAfterMs) return;
        }
        const written = await bucket.put(publicCatalogKey, JSON.stringify({
            version: 1, savedAt, products: products.map(publicProduct),
        }), {
            onlyIf: current ? { etagMatches: current.etag } : { etagDoesNotMatch: "*" },
            httpMetadata: { contentType: "application/json; charset=utf-8", cacheControl: "no-store" },
            customMetadata: { savedAt: String(savedAt), empty },
        });
        if (written) return;
        // A different reader won the conditional write. Recheck its timestamp before retrying.
    }
}
