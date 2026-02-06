import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for managing order notifications
 * Monitors pending order count and triggers browser notifications when new orders arrive
 */
export function useOrderNotifications() {
  const previousCountRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Query pending orders count every 10 seconds
  const { data: pendingData, isLoading } = useQuery<{ count: number }>({
    queryKey: ['/api/admin/pending-orders-count'],
    refetchInterval: 10000, // Check every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache this data
  });

  const currentCount = pendingData?.count ?? 0;

  useEffect(() => {
    // Skip on first load to prevent false alerts
    if (!isInitializedRef.current) {
      previousCountRef.current = currentCount;
      isInitializedRef.current = true;
      return;
    }

    // Update previous count (browser notifications removed, but other functionality preserved)
    previousCountRef.current = currentCount;
  }, [currentCount]);

  return {
    pendingCount: currentCount,
    isLoading
  };
}