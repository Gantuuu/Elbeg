import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

/**
 * Custom hook for managing order notifications
 * Monitors pending order count using polling
 */
export function useOrderNotifications() {
  const { user } = useAuth();
  // Ensure we only poll for admins
  const isAdmin = user?.isAdmin || false;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-orders-count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/pending-orders-count");
      return response;
    },
    // Only fetch if user is admin
    enabled: !!user && isAdmin,
    // Poll every 15 seconds
    refetchInterval: 15000,
    // Refetch even when window is not focused for notifications
    refetchIntervalInBackground: true,
  });

  return {
    pendingCount: data?.count || 0,
    isLoading,
  };
}
