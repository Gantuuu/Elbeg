import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatOrderId, formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const { toast } = useToast();

  // Use order notifications
  const { pendingCount } = useOrderNotifications();

  // Fetch orders for display in the dashboard
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<any[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *,
            product:products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch products to count total products
  const { data: productsCount = 0, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch all users to count total registered users
  const { data: usersCount = 0, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });



  // Get recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Calculate statistics
  // Calculate statistics
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_amount?.toString() || "0"), 0);
  const totalProducts = productsCount;
  const totalCustomers = usersCount; // 전체 가입 사용자 수

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />

      <div className="flex-1 overflow-hidden">
        <AdminHeader title="Хянах самбар" />

        <div className="p-6 overflow-auto" style={{ height: "calc(100vh - 70px)" }}>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#9b1f24] text-white">
                    <span className="material-icons">shopping_basket</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Захиалга</p>
                    <h3 className="font-bold text-2xl">
                      {isOrdersLoading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        totalOrders
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#9b1f24] text-white">
                    <span className="material-icons">receipt_long</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Борлуулалт</p>
                    <h3 className="font-bold text-2xl">
                      {isOrdersLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        formatPrice(totalSales).replace('₩', 'M₩')
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#9b1f24] text-white">
                    <span className="material-icons">inventory_2</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Бүтээгдэхүүн</p>
                    <h3 className="font-bold text-2xl">
                      {isProductsLoading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        totalProducts
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-[#9b1f24] text-white">
                    <span className="material-icons">person</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Хэрэглэгч</p>
                    <h3 className="font-bold text-2xl">
                      {isUsersLoading ? (
                        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        totalCustomers
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="mb-6">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Сүүлийн захиалгууд</h2>
              <Button
                variant="link"
                className="text-[#9b1f24] font-medium"
                asChild
              >
                <Link href="/admin/orders">Бүгдийг харах</Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Захиалгын ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Харилцагч</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бүтээгдэхүүн</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дүн</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Огноо</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isOrdersLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-6 py-4">
                          <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                        </td>
                      </tr>
                    ))
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Захиалга байхгүй байна
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatOrderId(order.id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.items?.map((item: any) => item.product?.name).join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <OrderStatusBadge status={order.status} orderId={order.id} isEditable={true} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/admin/orders?id=${order.id}`}>
                            <a className="text-[#9b1f24] hover:brightness-125 mr-3 font-medium">Харах</a>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Product Management Preview */}
          <Card>
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Бүтээгдэхүүний удирдлага</h2>
              <Button
                className="bg-[#9b1f24] hover:brightness-105 text-white font-medium py-2 px-4 rounded flex items-center"
                asChild
              >
                <Link href="/admin/products?new=true">
                  <span className="material-icons mr-2">add</span>
                  Шинэ бүтээгдэхүүн
                </Link>
              </Button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <Link href="/admin/products">
                  <Button variant="outline" className="w-full md:w-auto border-[#9b1f24] hover:border-[#9b1f24] hover:text-[#9b1f24]">
                    Бүтээгдэхүүний жагсаалт руу очих
                    <span className="material-icons ml-2">arrow_forward</span>
                  </Button>
                </Link>
              </div>

              <div className="bg-red-50 border border-[#9b1f24]/20 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <span className="material-icons text-[#9b1f24] mr-2">info</span>
                  <div>
                    <h3 className="font-bold text-[#9b1f24]">Өнөөдрийн статистик</h3>
                    <p className="text-sm text-gray-700">
                      Нийт {totalProducts} төрлийн бүтээгдэхүүнтэй, {totalOrders} захиалга хүлээн авсан.
                      Одоогоор {totalCustomers} харилцагч бүртгэлтэй байна.
                      Бүх бүтээгдэхүүн, захиалга, хэрэглэгчийн мэдээллийг дэлгэрэнгүй харахыг хүсвэл дээрх цэснээс сонгоно уу.
                    </p>
                  </div>
                </div>
              </div>



            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
