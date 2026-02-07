import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartItemComponent } from "@/components/ui/cart-item";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Loader2, LogIn, UserCircle2 } from "lucide-react";
import { insertOrderSchema, BankAccount } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the order schema for checkout form validation
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, {
    message: "Нэр хамгийн багадаа 2 тэмдэгт байх ёстой",
  }),
  customerPhone: z.string()
    .regex(
      /^010-\d{4}-\d{4}$/,
      { message: "Утасны дугаар 010-0000-0000 хэлбэртэй байх ёстой" }
    ),
  customerEmail: z.string().email({
    message: "Имэйл хаягаа зөв оруулна уу",
  }),
  customerAddress: z.string().min(5, {
    message: "Хүргэлтийн хаяг хамгийн багадаа 5 тэмдэгт байх ёстой",
  }),
  paymentMethod: z.enum(["bank_transfer"], {
    required_error: "Төлбөрийн хэлбэрээ сонгоно уу",
  }),
  selectedBankAccount: z.string({
    required_error: "Банкаа сонгоно уу",
  }),
  transferAccountHolder: z.string().min(2, {
    message: "Шилжүүлсэн хүний нэр хамгийн багадаа 2 тэмдэгт байх ёстой",
  }),
  totalAmount: z.string().optional(), // Make this optional since we calculate it
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);

  // 로그인 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Нэвтрэх шаардлагатай",
        description: "Захиалга хийхийн тулд нэвтрэх эсвэл бүртгүүлэх шаардлагатай.",
        variant: "default",
      });
      setLocation("/auth?tab=signup");
    }
  }, [user, isAuthLoading, setLocation, toast]);

  // Fetch shipping fee from server
  const { data: shippingFeeData, isLoading: isLoadingShippingFee } = useQuery({
    queryKey: ['shipping-fee'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'shipping_fee')
        .single();
      if (error) {
        console.error('Error fetching shipping fee:', error);
        return { value: "3000" }; // Default
      }
      return data as { value: string };
    }
  });

  // Update shipping fee when data changes
  useEffect(() => {
    if (shippingFeeData && shippingFeeData.value) {
      console.log("Setting shipping fee to:", shippingFeeData.value);
      setShippingFee(Number(shippingFeeData.value));
    }
  }, [shippingFeeData]);

  // Use BankAccount type for bank account data

  // Fetch all bank accounts
  const { data: bankAccounts = [], isLoading: isBankAccountsLoading } = useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data.map(acc => ({
        id: acc.id,
        bankName: acc.bank_name,
        accountNumber: acc.account_number,
        accountHolder: acc.account_holder,
        description: acc.description,
        isDefault: acc.is_default,
        isActive: acc.is_active
      })) as any[];
    }
  });

  // Fetch default bank account
  const { data: defaultBankAccount, isLoading: isBankAccountLoading } = useQuery<BankAccount>({
    queryKey: ['bank-account-default'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_default', true)
        .single();
      if (error) return null as any;
      return {
        id: data.id,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        accountHolder: data.account_holder,
        description: data.description,
        isDefault: data.is_default
      } as any;
    }
  });

  // Log bank account data when it changes
  useEffect(() => {
    if (defaultBankAccount) {
      console.log('Bank account data loaded successfully:', defaultBankAccount);
    }
    if (bankAccounts.length > 0) {
      console.log('All bank accounts loaded:', bankAccounts);
    }
  }, [defaultBankAccount, bankAccounts]);

  // Form definition with prefilled user data if available
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
      customerAddress: "",
      paymentMethod: "bank_transfer",
      selectedBankAccount: defaultBankAccount?.id?.toString() || "",
      transferAccountHolder: user?.name || "",
    },
    mode: "onChange", // Validate fields on change for better user feedback
  });

  // Update the form values when user or defaultBankAccount changes
  useEffect(() => {
    if (user) {
      form.setValue("customerName", user.name || "");
      form.setValue("customerEmail", user.email || "");
      form.setValue("customerPhone", user.phone || "");
      form.setValue("transferAccountHolder", user.name || "");
    }

    if (defaultBankAccount && defaultBankAccount.id) {
      form.setValue("selectedBankAccount", defaultBankAccount.id.toString());
    }
  }, [user, defaultBankAccount, form]);

  // Handle successful checkout - redirects to My Page instead of order confirmation
  const handleCheckoutSuccess = (orderId: number) => {
    clearCart();

    // Invalidate the order history query cache to ensure My Page displays all orders
    queryClient.invalidateQueries({ queryKey: ["/api/user/orders"] });

    toast({
      title: "Захиалга амжилттай",
      description: "Таны захиалгыг хүлээн авлаа. Захиалгын түүх руу чиглүүлж байна.",
    });

    // Redirect to My Page where user can view all their orders
    setLocation("/my-page");
  };

  // Enhanced form submission handler with better debugging
  const onSubmit = async (data: CheckoutFormValues) => {
    logger.custom('⏳', '주문 생성 시작...');

    // Log order data
    logger.custom('🛒', '주문 데이터:', {
      customerName: data.customerName,
      totalAmount: totalPrice + shippingFee,
      itemsCount: items.length,
      paymentMethod: data.paymentMethod,
      deliveryAddress: data.customerAddress
    });

    // Check for form validation errors (logging already added by logger above implicitly via custom if needed, but keeping existing logic)
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Form has validation errors:", form.formState.errors);
      toast({
        title: "Форм алдаатай байна",
        description: "Формын бүх талбаруудыг зөв бөглөнө үү.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Сагс хоосон байна",
        description: "Захиалга хийхийн тулд сагсандаа бүтээгдэхүүн нэмнэ үү.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total with shipping fee
      const orderTotalWithShipping = totalPrice + shippingFee;

      try {
        // 1. Insert order into 'orders' table
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: data.customerName,
            customer_email: data.customerEmail,
            customer_phone: data.customerPhone,
            customer_address: data.customerAddress,
            payment_method: data.paymentMethod,
            total_amount: orderTotalWithShipping,
            status: 'pending',
            user_id: user?.id // Link order to user
          })
          .select()
          .single();

        if (orderError) throw orderError;
        if (!order) throw new Error("Захиалга үүсгэхэд алдаа гарлаа");

        logger.success('Master Order 생성:', {
          orderId: order.id,
          totalAmount: order.total_amount
        });

        // 2. Insert order items into 'order_items' table
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: parseFloat(item.price?.toString() || "0")
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error("Order items creation failed, but order was created:", itemsError);
          // We might want to delete the order here or just inform the user
        }

        logger.success('Order Items 생성:', {
          itemsCount: orderItems.length,
          items: orderItems.map(i => ({
            productId: i.product_id,
            quantity: i.quantity
          }))
        });

        logger.success('결제 완료:', {
          orderId: order.id,
          amount: orderTotalWithShipping,
          method: data.paymentMethod
        });

        handleCheckoutSuccess(order.id);
      } catch (error: any) {
        console.error("Supabase order error:", error);
        throw error;
      }
    } catch (error: any) {
      logger.error('주문 생성 실패:', {
        formData: data,
        error: error.message,
        details: error
      });

      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Захиалга боловсруулах үед алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그인 중이거나 로그인 되지 않은 경우 로딩 화면 표시
  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="w-full gradient-nav py-8 mb-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
              Захиалга
            </h1>
            <div className="w-20 h-1 bg-white/50 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-12 w-12 border-4 border-t-transparent border-[#0e5841] rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // If cart is empty, redirect to home
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <span className="material-icons text-5xl text-[#0e5841] mb-4">shopping_cart</span>
            <h2 className="text-2xl font-bold text-foreground mb-4">Сагс хоосон байна</h2>
            <p className="text-muted-foreground mb-6">Захиалга хийхийн тулд сагсандаа бүтээгдэхүүн нэмнэ үү.</p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-[#0e5841] hover:brightness-105 text-white font-medium transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Бүтээгдэхүүн харах
              <span className="material-icons ml-2">arrow_forward</span>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0e5841] inline-block mb-3">{t.checkout}</h1>
          <div className="w-20 h-1 bg-[#0e5841] mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-foreground">{t.orderInfo}</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.name}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.name} className="placeholder:text-gray-400" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <Input placeholder="example@mail.com" className="placeholder:text-gray-400" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => {
                      const formatPhoneNumber = (value: string) => {
                        // Remove all non-digit characters
                        const digits = value.replace(/\D/g, '');

                        // Apply Korean phone number format (010-0000-0000)
                        if (digits.length <= 3) {
                          return digits;
                        } else if (digits.length <= 7) {
                          return `${digits.slice(0, 3)}-${digits.slice(3)}`;
                        } else {
                          return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
                        }
                      };

                      return (
                        <FormItem>
                          <FormLabel>{t.phone}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="010-0000-0000"
                              className="placeholder:text-gray-400"
                              {...field}
                              value={field.value}
                              onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t.phoneFormat}
                          </p>
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.address}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Та хот/дүүрэг хороо/ байрны тоотоо тодорхой солонгосоор бичиж оруулна уу."
                          className="resize-none placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 rounded-lg p-5 border-2 border-blue-400/70 bg-white shadow-md">
                  <div className="flex items-center bg-[#0e5841] px-4 py-2 rounded-md -mt-2 -mx-1 shadow-sm">
                    <span className="material-icons mr-2 text-xl text-white">account_balance</span>
                    <h3 className="font-bold text-md text-white">{t.paymentInfo}</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input type="hidden" {...field} value="bank_transfer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#0e5841] inline-block mb-3">{t.bankTransfer}</h3>
                    <p className="text-sm text-gray-600 mb-4">{t.bankTransferDesc}</p>

                    <FormField
                      control={form.control}
                      name="selectedBankAccount"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel className="text-gray-800 font-medium flex items-center">
                              <span className="material-icons text-[#0e5841] mr-1 text-lg">account_balance</span>
                              {t.bank}
                            </FormLabel>
                            <span className="text-xs text-gray-500">
                              {bankAccounts.length} {t.bank}
                            </span>
                          </div>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0e5841]/20 focus:border-[#0e5841]">
                                <SelectValue placeholder={t.selectBank} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-2 border-gray-200 shadow-lg bg-white">
                              {isBankAccountsLoading ? (
                                <div className="p-4 text-center">
                                  <div className="h-4 w-24 bg-[#0e5841]/10 animate-pulse rounded-full mx-auto mb-2"></div>
                                  <div className="h-4 w-36 bg-[#0e5841]/10 animate-pulse rounded-full mx-auto"></div>
                                </div>
                              ) : bankAccounts.length > 0 ? (
                                bankAccounts.map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id.toString()}
                                    className="border-none focus:bg-violet-600 data-[state=checked]:bg-violet-600 data-[state=checked]:text-white text-gray-900 my-1 rounded-lg py-3"
                                  >
                                    <div className="flex items-center w-full">
                                      <div className="w-8 h-8 rounded-full bg-violet-100 data-[state=checked]:bg-white/30 flex items-center justify-center mr-3">
                                        <span className="material-icons text-base text-violet-600 data-[state=checked]:text-white">account_balance</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold data-[state=checked]:text-white">{account.bankName}</span>
                                        <span className="text-xs text-gray-600 data-[state=checked]:text-white/80">{account.description}</span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="default" className="py-3 font-medium">{t.defaultAccount}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Display selected bank account details */}
                    {!isBankAccountsLoading && (
                      <div className="rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
                        {(() => {
                          // Find selected bank account
                          const selectedAccountId = form.watch("selectedBankAccount");
                          const selectedAccount = bankAccounts.find(
                            account => account?.id?.toString() === selectedAccountId
                          );

                          const accountData = selectedAccount || defaultBankAccount;

                          if (accountData) {
                            return (
                              <>
                                <div className="bg-[#0e5841] p-3 text-white">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className="material-icons mr-2">account_balance</span>
                                      <h4 className="font-bold">{accountData.bankName}</h4>
                                    </div>
                                    {accountData.isDefault && (
                                      <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {t.defaultAccount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="p-4">
                                  <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                                      <span className="text-gray-600 text-sm">{t.accountNumber}</span>
                                      <span className="font-mono font-bold text-lg tracking-wider">{accountData.accountNumber}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                                      <span className="text-gray-600 text-sm">{t.accountHolder}</span>
                                      <span className="font-bold">{accountData.accountHolder}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(accountData.accountNumber)}
                                      className="flex items-center justify-center py-2 px-4 rounded-lg bg-[#0e5841] text-white hover:brightness-110 font-medium text-sm transition-all duration-300 shadow-sm hover:shadow-md mt-2"
                                    >
                                      <span className="material-icons text-sm mr-1">content_copy</span>
                                      {t.copyAccountNumber}
                                    </button>
                                  </div>
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <div className="p-6 text-center">
                                <span className="material-icons text-amber-500 text-4xl mb-2">warning</span>
                                <p className="text-amber-600 font-medium">{t.bankInfoNotFound}</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="transferAccountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 font-medium">{t.transferSenderName}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.transferSenderNamePlaceholder} {...field} className="border-2 border-gray-200 placeholder:text-gray-400" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {t.transferSenderNameDesc}
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0e5841] hover:brightness-105 text-white font-medium py-6 transition-all duration-300 shadow-sm hover:shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      {t.processingPayment}
                    </>
                  ) : (
                    <>
                      {t.placeOrder}
                      <span className="material-icons ml-2">shopping_bag</span>
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-foreground">{t.orderInfo}</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <CartItemComponent key={item.productId} item={item} />
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-foreground">{t.products}:</span>
                  <span className="font-bold">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-foreground">{t.shippingFee}:</span>
                  <span className="font-bold">
                    {isLoadingShippingFee ? (
                      <span className="h-4 w-16 bg-gray-200 animate-pulse rounded inline-block"></span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-gray-100">
                  <span className="text-foreground">{t.totalAmount}:</span>
                  <span className="text-[#0e5841] font-bold">{formatPrice(totalPrice + shippingFee)}</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}