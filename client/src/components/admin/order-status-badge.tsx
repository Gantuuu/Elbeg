import { getOrderStatusColor } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface OrderStatusBadgeProps {
  status: string;
  orderId: number;
  isEditable?: boolean;
  forceLanguage?: "mn" | "ru" | "en"; // 강제로 특정 언어 사용
}

export function OrderStatusBadge({
  status,
  orderId,
  isEditable = false,
  forceLanguage,
}: OrderStatusBadgeProps) {
  const { t } = useLanguage();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const displayStatus = pendingStatus ?? status;
  const statusColor = getOrderStatusColor(displayStatus);

  // 몽골어 번역 정의
  const mongolianOrderStatus = {
    pending: "Төлбөр төлөлт хүлээгдэж байна",
    processing: "Төлбөр төлөгдсөн",
    completed: "Хүргэгдсэн",
    cancelled: "Цуцлагдсан",
  };

  // forceLanguage가 있으면 해당 언어 사용, 없으면 현재 언어 사용
  const translatedStatus =
    forceLanguage === "mn"
      ? mongolianOrderStatus[displayStatus as keyof typeof mongolianOrderStatus] || displayStatus
      : t.orderStatus[displayStatus as keyof typeof t.orderStatus] || displayStatus;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpdateStatus = async (newStatus: string) => {
    setPendingStatus(newStatus);

    try {
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, {
        status: newStatus,
      });

      const statusText =
        forceLanguage === "mn"
          ? mongolianOrderStatus[
              newStatus as keyof typeof mongolianOrderStatus
            ] || newStatus
          : t.orderStatus[newStatus as keyof typeof t.orderStatus] || newStatus;

      toast({
        title: "Төлөв шинэчлэгдлээ",
        description: `Захиалгын төлөв '${statusText}' болж шинэчлэгдлээ.`,
      });

    } catch {
      toast({
        title: "Алдаа гарлаа",
        description:
          "Захиалгын төлөв шинэчлэх үед алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    } finally {
      // A new summary revision already refreshes the open detail. Fetch directly on legacy databases.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/order-detail", null] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-orders-count"] }),
      ]);
      setPendingStatus(null);
    }
  };

  if (!isEditable) {
    return (
      <span
        className={cn(
          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
          statusColor,
        )}
      >
        {translatedStatus}
      </span>
    );
  }

  return (
    <div className="relative">
      <Select
        value={displayStatus}
        onValueChange={handleUpdateStatus}
        disabled={pendingStatus !== null}
      >
        <SelectTrigger
          className={cn("h-7 text-xs font-semibold border-none", statusColor)}
        >
          <SelectValue>{translatedStatus}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((statusOption) => (
            <SelectItem key={statusOption.value} value={statusOption.value}>
              {forceLanguage === "mn"
                ? mongolianOrderStatus[
                    statusOption.value as keyof typeof mongolianOrderStatus
                  ] || statusOption.label
                : t.orderStatus[
                    statusOption.value as keyof typeof t.orderStatus
                  ] || statusOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pendingStatus !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
          <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
