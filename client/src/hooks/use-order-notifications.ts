import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for managing order notifications
 * Monitors pending order count using Supabase Realtime
 */
export function useOrderNotifications() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (error) throw error;
        if (mounted) {
          setPendingCount(count || 0);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching pending orders count:", error);
        if (mounted) setIsLoading(false);
      }
    };

    fetchPendingCount();

    // Subscribe to changes in the orders table
    const channel = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Re-fetch count on any change (insert, update, delete)
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    pendingCount,
    isLoading
  };
}