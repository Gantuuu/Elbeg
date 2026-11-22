import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CATALOG_SNAPSHOT_TTL_MS, fetchStorefrontCatalog, fetchStorefrontCategories } from "@/lib/storefront-catalog";

function useSnapshotExpired(readOnly: boolean, savedAt: number | undefined) {
  const [expiredAt, setExpiredAt] = useState<number>();
  useEffect(() => {
    if (!readOnly || savedAt === undefined) return;
    const delay = savedAt + CATALOG_SNAPSHOT_TTL_MS - Date.now();
    const timer = window.setTimeout(() => setExpiredAt(savedAt), Math.max(0, delay));
    return () => window.clearTimeout(timer);
  }, [readOnly, savedAt]);
  return readOnly && savedAt !== undefined &&
    (expiredAt === savedAt || Date.now() >= savedAt + CATALOG_SNAPSHOT_TTL_MS);
}

export function useStorefrontCategories(preview = false) {
  const query = useQuery({
    queryKey: preview ? ["design-preview-categories"] : ["categories", "storefront"],
    queryFn: async ({ signal }) => {
      if (preview) {
        const { previewCategories } = await import("@/lib/design-preview-data");
        return { categories: previewCategories, savedAt: Date.now(), readOnly: false };
      }
      return fetchStorefrontCategories(signal);
    },
    staleTime: 5 * 60 * 1000,
  });
  const expired = useSnapshotExpired(query.isError || !!query.data?.readOnly, query.data?.savedAt);
  return expired ? [] : query.data?.categories ?? [];
}

export function useStorefrontProducts(preview = false) {
  const query = useQuery({
    queryKey: preview ? ["design-preview-products"] : ["products", "storefront"],
    queryFn: async ({ signal }) => {
      if (preview) {
        const { previewProducts } = await import("@/lib/design-preview-data");
        return { products: previewProducts, savedAt: Date.now(), readOnly: false };
      }
      return fetchStorefrontCatalog(signal);
    },
    staleTime: 2 * 60 * 1000,
  });
  const readOnly = query.isError || !!query.data?.readOnly;
  const expired = useSnapshotExpired(readOnly, query.data?.savedAt);
  return {
    products: expired ? undefined : query.data?.products,
    isLoading: query.isLoading,
    isError: readOnly,
    isFetching: query.isFetching,
    readOnly,
    refetch: query.refetch,
  };
}
