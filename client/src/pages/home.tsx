import React, { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage, getLocalizedProductName, getLocalizedProductDescription } from "@/contexts/language-context";
import { QuantityModal } from "@/components/quantity-modal";
import { useImagePreloader } from "@/hooks/use-image-preloader";
import { logMobileCookieDebug } from "@/utils/cookieUtils";
import { calculateDeliveryDate, formatDeliveryDate, getDeliveryMessage, DeliverySettings, NonDeliveryDay } from "@/lib/delivery-date";
import { Truck, Star, MessageSquare } from "lucide-react";
import { Review } from "@shared/schema";

export default function HomePage() {
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12); // Initial display count
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Fetch service categories for the homepage
  const { data: serviceCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch delivery settings and non-delivery days
  const { data: deliverySettings } = useQuery<DeliverySettings>({
    queryKey: ['delivery-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('delivery_settings').select('*').single();
      if (error) throw error;
      return data as DeliverySettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: nonDeliveryDays = [] } = useQuery<NonDeliveryDay[]>({
    queryKey: ['non-delivery-days'],
    queryFn: async () => {
      const { data, error } = await supabase.from('non_delivery_days').select('*');
      if (error) throw error;
      return data as NonDeliveryDay[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch approved reviews
  const { data: reviewsData = [] } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('rating', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Review[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product categories from category management
  const { data: productCategories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calculate delivery date
  const deliveryDate = useMemo(() => {
    if (!deliverySettings) return null;
    return calculateDeliveryDate(deliverySettings, nonDeliveryDays);
  }, [deliverySettings, nonDeliveryDays]);
  // Filter products based on selected category
  const filteredProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    if (selectedCategory === "all") {
      return products;
    }

    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  // Products to display (with pagination)
  const displayedProducts = React.useMemo(() => {
    return filteredProducts.slice(0, displayedCount);
  }, [filteredProducts, displayedCount]);

  // Preload product images for faster display
  const productImageUrls = useMemo(() => {
    return displayedProducts.map(product => product.imageUrl);
  }, [displayedProducts]);

  const { loadedImages, isLoading: imagesLoading } = useImagePreloader(productImageUrls);

  // Reset displayed count when category changes
  useEffect(() => {
    setDisplayedCount(12);
  }, [selectedCategory]);

  // Mobile cookie debugging - run once on mount
  useEffect(() => {
    // Only run on mobile browsers
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setTimeout(() => {
        logMobileCookieDebug();
      }, 2000); // Wait 2 seconds for page to fully load
    }
  }, []);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000) {
        if (displayedCount < filteredProducts.length) {
          setDisplayedCount(prev => Math.min(prev + 8, filteredProducts.length));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedCount, filteredProducts.length]);

  // Handle category click to navigate to the service category page
  const handleServiceCategoryClick = (slug: string) => {
    setLocation(`/service-categories/${slug}`);
  };

  // Memoize event handlers
  const handleAddToCartClick = useCallback((product: Product) => {
    if (!user) {
      toast({
        title: t.toast.loginRequired,
        description: t.toast.loginRequiredDesc,
        variant: "default",
      });
      setLocation("/auth");
      return;
    }

    setSelectedProduct(product);
    setIsQuantityModalOpen(true);
  }, [user, toast, setLocation]);

  const handleCloseModal = useCallback(() => {
    setIsQuantityModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleProductClick = useCallback((productId: number) => {
    setLocation(`/products/${productId}`);
  }, [setLocation]);

  // Optimized ProductCard component
  const ProductCard = memo(({ product }: { product: Product }) => {
    const fallbackImage = useMemo(() => {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="180" height="128" viewBox="0 0 180 128">
          <rect width="180" height="128" fill="#f3f4f6"/>
          <text x="90" y="70" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#6b7280">IMG</text>
        </svg>
      `)}`;
    }, []);

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement;

      // First try with cache-busting timestamp
      if (!target.src.includes('?t=')) {
        target.src = `${product.imageUrl}?t=${Date.now()}`;
        return;
      }

      // If cache-busting failed, use gradient fallback
      if (!target.src.includes('data:image/svg')) {
        const cleanProductName = product.name.replace(/[^\w\s]/g, '');
        target.src = `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="180" height="128" viewBox="0 0 180 128">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#9b1f24;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#9b1f24;stop-opacity:0.8" />
              </linearGradient>
            </defs>
            <rect width="180" height="128" fill="url(#grad)"/>
            <text x="90" y="55" font-family="Arial" font-size="11" text-anchor="middle" fill="white" font-weight="bold">${cleanProductName}</text>
            <text x="90" y="75" font-family="Arial" font-size="9" text-anchor="middle" fill="white">Image Loading</text>
          </svg>
        `)}`;
      }
    }, [product.imageUrl, product.name]);

    const price = useMemo(() => parseFloat(product.price.toString()), [product.price]);

    return (
      <div
        className="flex-shrink-0 w-[150px] md:w-[180px]"
        onClick={() => handleProductClick(product.id)}
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="h-32 overflow-hidden relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              sizes="(max-width: 768px) 150px, 180px"
            />
          </div>
          <div className="p-2 space-y-2">
            <h3 className="font-bold text-xs truncate leading-tight">{getLocalizedProductName(product, language)}</h3>
            <p className="text-[9px] text-gray-500 h-4 overflow-hidden leading-tight">
              {getLocalizedProductDescription(product, language)}
            </p>
            <div className="space-y-1">
              <div className="text-center">
                <span className="font-bold text-xs text-[#9b1f24]">
                  {price.toLocaleString()}₩
                </span>
              </div>
              <button
                className="w-full bg-[#9b1f24] hover:brightness-105 text-white text-[9px] px-1 py-1.5 rounded-md font-bold"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCartClick(product);
                }}
              >
                {t.addToCart}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Check for upcoming non-delivery days to show warning banner
  const upcomingNonDeliveryDays = useMemo(() => {
    if (!nonDeliveryDays || nonDeliveryDays.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return nonDeliveryDays.filter(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= today && dayDate <= nextWeek;
    });
  }, [nonDeliveryDays]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Non-delivery Days Warning Banner */}
      {upcomingNonDeliveryDays.length > 0 && (
        <div className="bg-red-50 border-b-2 border-red-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-icons text-red-600 flex-shrink-0">warning</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ Хүргэлтийн тухай:
                </p>
                <p className="text-xs text-red-700">
                  {upcomingNonDeliveryDays.map((day, idx) => (
                    <span key={day.id}>
                      {idx > 0 && ", "}
                      {new Date(day.date).toLocaleDateString('mn-MN')} ({day.reason})
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <Hero />

        {/* Reviews Section */}
        {reviewsData.length > 0 && (
          <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-2">Хэрэглэгчдийн сэтгэгдэл</h2>
                <p className="text-gray-600 text-sm">Чанар баталгааг амлая</p>
              </div>
              {/* Desktop: Grid layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-4">
                {reviewsData.slice(0, 3).map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-lg p-4 shadow-sm"
                    data-testid={`review-card-${review.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#9b1f24] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {review.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{review.customerName}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-3">{review.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile: Horizontal auto-scrolling carousel */}
              <div className="md:hidden overflow-hidden">
                <div className="flex gap-4 animate-scroll-x">
                  {[...reviewsData.slice(0, 3), ...reviewsData.slice(0, 3)].map((review, index) => (
                    <div
                      key={`${review.id}-${index}`}
                      className="bg-white rounded-lg p-4 shadow-sm flex-shrink-0 w-[280px]"
                      data-testid={`review-card-mobile-${review.id}-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#9b1f24] flex items-center justify-center text-white font-bold flex-shrink-0">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{review.customerName}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs line-clamp-3">{review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.featuredProducts}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
                {t.featuredProductsDesc}
              </p>
            </motion.div>

            {/* Category Pills - Below title */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-40 shadow-sm mb-8 -mx-6 px-6">
              <div className="py-3">
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-2 rounded-full font-medium transition-colors flex items-center justify-center ${selectedCategory === "all"
                      ? "bg-[#9b1f24] text-white"
                      : "bg-gray-100/80 text-gray-700"
                      }`}
                  >
                    <span className="font-bold text-center text-xs md:text-sm leading-tight">{t.categories.all}</span>
                  </button>

                  {/* Dynamic categories from API */}
                  {productCategories
                    .filter((cat: any) => cat.isActive !== false)
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((category: any) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`px-3 py-2 rounded-full font-medium transition-colors flex items-center justify-center ${selectedCategory === category.name
                          ? "bg-[#9b1f24] text-white"
                          : "bg-gray-100/80 text-gray-700"
                          }`}
                      >
                        <span className="font-bold text-center text-xs md:text-sm leading-tight">{category.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Product display section */}
            <div className="mb-10 max-w-4xl mx-auto">
              {productsLoading ? (
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300"></div>
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {displayedProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="aspect-square relative overflow-hidden bg-gray-50">
                          <img
                            src={product.imageUrl}
                            alt={getLocalizedProductName(product, language)}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-bg')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-bg absolute inset-0 bg-[#9b1f24] flex items-center justify-center';
                                fallback.innerHTML = `<span class="text-white font-bold text-xs text-center px-2">${product.name}</span>`;
                                parent.appendChild(fallback);
                              }
                            }}
                          />

                          {/* Description Badge */}
                          {product.description && (
                            <div className="absolute bottom-2 right-2 max-w-[calc(100%-16px)]">
                              <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full text-right ml-auto w-fit">
                                <span className="block truncate">
                                  {getLocalizedProductDescription(product, language)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex-1 flex flex-col">
                          <h3 className="font-bold text-sm mb-3 line-clamp-1 h-5 text-center">{getLocalizedProductName(product, language)}</h3>

                          <div className="mt-auto space-y-2">
                            {/* Price display - centered */}
                            <div className="text-center">
                              <span className="font-bold text-sm text-[#9b1f24]">
                                {(() => {
                                  const price = parseFloat(product.price.toString());

                                  // Display the price as stored (already calculated for packages)
                                  return `${price.toLocaleString()}₩`;
                                })()}
                              </span>
                            </div>

                            {/* Cart button - full width and centered */}
                            <Button
                              size="sm"
                              className="w-full bg-[#9b1f24] hover:brightness-105 text-white h-8 text-xs font-medium"
                              onClick={() => handleAddToCartClick(product)}
                            >
                              {t.addToCart}
                            </Button>

                            {/* Delivery date badge - mobile optimized */}
                            {deliveryDate && (
                              <div className="flex flex-col items-center justify-center bg-[#9b1f24] text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg" data-testid={`delivery-badge-${product.id}`}>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                  <span>{formatDeliveryDate(deliveryDate, language)}</span>
                                </div>
                                <span>{getDeliveryMessage(language)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More Indicator */}
                  {displayedCount < filteredProducts.length && (
                    <div className="text-center mt-8">
                      <div className="inline-flex items-center gap-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#9b1f24] rounded-full animate-spin"></div>
                        {t.loading}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <span className="material-icons text-gray-400 text-3xl">inventory_2</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Бүтээгдэхүүн олдсонгүй</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Таны сонгосон ангилалд одоогоор бүтээгдэхүүн байхгүй байна.
                  </p>
                  <Button
                    onClick={() => setSelectedCategory("all")}
                    className="bg-[#9b1f24] text-white"
                  >
                    Бүх бүтээгдэхүүн үзэх
                  </Button>
                </div>
              )}
            </div>


          </div>
        </section>
      </main>
      <Footer />
      {/* Quantity Modal */}
      <QuantityModal
        isOpen={isQuantityModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </div>
  );
}