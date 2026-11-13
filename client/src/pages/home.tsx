import React, { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import {
  useLanguage,
  getLocalizedProductName,
  getLocalizedProductDescription,
} from "@/contexts/language-context";
import { QuantityModal } from "@/components/quantity-modal";
import { useImagePreloader } from "@/hooks/use-image-preloader";
import { logMobileCookieDebug } from "@/utils/cookieUtils";
import {
  calculateDeliveryDate,
  formatDeliveryDate,
  getDeliveryMessage,
  DeliverySettings,
  NonDeliveryDay,
} from "@/lib/delivery-date";
import { Truck, Star, MessageSquare, ShoppingCart } from "lucide-react";
import { Review } from "@shared/schema";
import { getFullImageUrl } from "@/lib/image-utils";
import { isDesignPreview } from "@/lib/design-preview";

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
    queryKey: ["service-categories"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/service-categories");
      if (!Array.isArray(data)) return [];
      return data.filter((cat: any) => cat.isActive);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch featured products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [isDesignPreview ? "design-preview-products" : "products"],
    queryFn: async () => {
      if (isDesignPreview) return (await import("@/lib/design-preview-data")).previewProducts;
      return await apiRequest("GET", "/api/products");
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch delivery settings and non-delivery days
  const { data: deliverySettings } = useQuery<DeliverySettings>({
    queryKey: ["delivery-settings"],
    enabled: !isDesignPreview,
    queryFn: async () => {
      return await apiRequest("GET", "/api/delivery-settings");
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: nonDeliveryDays = [] } = useQuery<NonDeliveryDay[]>({
    queryKey: ["non-delivery-days"],
    enabled: !isDesignPreview,
    queryFn: async () => {
      return await apiRequest("GET", "/api/non-delivery-days");
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch approved reviews
  const { data: reviewsData = [] } = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/reviews");
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product categories from category management
  const { data: productCategories = [] } = useQuery<any[]>({
    queryKey: [isDesignPreview ? "design-preview-categories" : "categories"],
    queryFn: async () => {
      if (isDesignPreview) return (await import("@/lib/design-preview-data")).previewCategories;
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return await response.json();
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
    return displayedProducts.map((product) => product.imageUrl);
  }, [displayedProducts]);

  const { loadedImages, isLoading: imagesLoading } =
    useImagePreloader(productImageUrls);

  // Reset displayed count when category changes
  useEffect(() => {
    setDisplayedCount(12);
  }, [selectedCategory]);

  // Mobile cookie debugging - run once on mount
  useEffect(() => {
    // Only run on mobile browsers
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    if (isMobile) {
      setTimeout(() => {
        logMobileCookieDebug();
      }, 2000); // Wait 2 seconds for page to fully load
    }
  }, []);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (displayedCount < filteredProducts.length) {
          setDisplayedCount((prev) =>
            Math.min(prev + 8, filteredProducts.length),
          );
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayedCount, filteredProducts.length]);

  // Handle category click to navigate to the service category page
  const handleServiceCategoryClick = (slug: string) => {
    setLocation(`/service-categories/${slug}`);
  };

  // Memoize event handlers
  const handleAddToCartClick = useCallback(
    (product: Product) => {
      if (isDesignPreview) {
        toast({ title: "Загварын урьдчилсан харагдац", description: "Туршилтын бүтээгдэхүүн. Сагсанд нэмэгдэхгүй, бодит захиалга үүсэхгүй." });
        return;
      }
      if (!user) {
        toast({
          title: t.toast.loginRequired,
          description: t.toast.loginRequiredDesc,
          variant: "default",
        });
        setLocation("/auth?tab=signup");
        return;
      }

      setSelectedProduct(product);
      setIsQuantityModalOpen(true);
    },
    [user, toast, setLocation, t],
  );

  const handleCloseModal = useCallback(() => {
    setIsQuantityModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleProductClick = useCallback(
    (productId: number) => {
      setLocation(`/products/${productId}`);
    },
    [setLocation],
  );

  // Check for upcoming non-delivery days to show warning banner
  const upcomingNonDeliveryDays = useMemo(() => {
    if (!nonDeliveryDays || nonDeliveryDays.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return nonDeliveryDays.filter((day) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= today && dayDate <= nextWeek;
    });
  }, [nonDeliveryDays]);

  return (
    <div className="storefront min-h-screen flex flex-col">
      <Navbar />

      {/* Non-delivery Days Warning Banner */}
      {upcomingNonDeliveryDays.length > 0 && (
        <div className="bg-red-50 border-b-2 border-red-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-icons text-red-600 flex-shrink-0">
                warning
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ Хүргэлтийн тухай:
                </p>
                <p className="text-xs text-red-700">
                  {upcomingNonDeliveryDays.map((day, idx) => (
                    <span key={day.id}>
                      {idx > 0 && ", "}
                      {new Date(day.date).toLocaleDateString("mn-MN")} (
                      {day.reason})
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

        {/* Featured Products Section */}
        <section id="products" className="catalog-section py-10 md:py-16">
          <div className="container mx-auto px-6">
            <motion.div
              className="catalog-heading mb-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3">
                {t.featuredProducts}
              </h2>
              <p className="text-slate-500 max-w-2xl text-sm md:text-base">
                {t.featuredProductsDesc}
              </p>
            </motion.div>

            {/* Category Pills - Below title */}
            <div className="category-bar sticky top-0 z-40 mb-7 -mx-6 px-6">
              <div className="py-3">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  <button
                    aria-pressed={selectedCategory === "all"} onClick={() => setSelectedCategory("all")}
                    className={`category-pill shrink-0 px-5 py-2.5 rounded-full font-medium transition-colors flex items-center justify-center ${
                      selectedCategory === "all"
                        ? "bg-[#3c8fb8] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-[#3c8fb8]"
                    }`}
                  >
                    <span className="font-bold text-center text-xs md:text-sm leading-tight">
                      {t.categories.all}
                    </span>
                  </button>

                  {/* Dynamic categories from API */}
                  {Array.isArray(productCategories) &&
                    productCategories
                      .filter((cat: any) => cat.isActive !== false)
                      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                      .map((category: any) => (
                        <button
                          key={category.id}
                          aria-pressed={selectedCategory === category.name}
                          onClick={() => setSelectedCategory(category.name)}
                          className={`category-pill shrink-0 px-5 py-2.5 rounded-full font-medium transition-colors flex items-center justify-center ${
                            selectedCategory === category.name
                              ? "bg-[#3c8fb8] text-white"
                              : "bg-white text-slate-600 border border-slate-200 hover:border-[#3c8fb8]"
                          }`}
                        >
                          <span className="font-bold text-center text-xs md:text-sm leading-tight">
                            {category.name}
                          </span>
                        </button>
                      ))}
                </div>
              </div>
            </div>

            {/* Product display section */}
            <div className="mb-10">
              {productsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                  {Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
                      >
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                    {displayedProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="catalog-card bg-white overflow-hidden h-full flex flex-col"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link href={isDesignPreview ? "#products" : `/products/${product.id}`} onClick={isDesignPreview ? (event) => { event.preventDefault(); handleAddToCartClick(product); } : undefined} className="product-image aspect-square relative block overflow-hidden bg-slate-100">
                          <img
                            src={getFullImageUrl(
                              product.thumbnailUrl || product.imageUrl,
                            )}
                            alt={getLocalizedProductName(product, language)}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".fallback-bg")
                              ) {
                                const fallback = document.createElement("div");
                                fallback.className =
                                  "fallback-bg absolute inset-0 bg-[#3c8fb8] flex items-center justify-center";
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
                                  {getLocalizedProductDescription(
                                    product,
                                    language,
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </Link>

                        <div className="catalog-card-body">
                          <h3 className="catalog-card-title" title={getLocalizedProductName(product, language)}>
                            {getLocalizedProductName(product, language)}
                          </h3>

                          <div className="catalog-card-details">
                            {/* Price display - centered */}
                            <div className="text-left">
                              <span className="catalog-card-price">
                                {(() => {
                                  const price = parseFloat(
                                    product.price.toString(),
                                  );

                                  // Display the price as stored (already calculated for packages)
                                  return `${price.toLocaleString()}₩`;
                                })()}
                              </span>
                            </div>

                            {/* Cart button - full width and centered */}
                            <Button
                              size="sm"
                              className="catalog-card-cart w-full rounded-full border border-[#3c8fb8]/30 bg-white hover:bg-[#3c8fb8] text-[#287397] hover:text-white font-semibold transition-colors"
                              onClick={() => handleAddToCartClick(product)}
                            >
                              <ShoppingCart aria-hidden="true" /><span>{t.addToCart}</span>
                            </Button>

                            {/* Delivery date badge - mobile optimized */}
                            {isDesignPreview ? <div className="catalog-card-delivery" title="Хүргэлтийн мэдээлэл · Жишээ"><Truck aria-hidden="true" /><span>Хүргэлт · Жишээ</span></div> : deliveryDate && (
                              <div
                                className="catalog-card-delivery"
                                title={`${formatDeliveryDate(deliveryDate, language)} ${getDeliveryMessage(language)}`}
                                data-testid={`delivery-badge-${product.id}`}
                              >
                                <Truck aria-hidden="true" />
                                <span>{deliveryDate.getMonth() + 1}/{deliveryDate.getDate()} {getDeliveryMessage(language)}</span>
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
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#3c8fb8] rounded-full animate-spin"></div>
                        {t.loading}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <span className="material-icons text-gray-400 text-3xl">
                      inventory_2
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Бүтээгдэхүүн олдсонгүй
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Таны сонгосон ангилалд одоогоор бүтээгдэхүүн байхгүй байна.
                  </p>
                  <Button
                    onClick={() => setSelectedCategory("all")}
                    className="bg-[#3c8fb8] text-white"
                  >
                    Бүх бүтээгдэхүүн үзэх
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* Reviews Section */}
        {reviewsData.length > 0 && (
          <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Хэрэглэгчдийн сэтгэгдэл
                </h2>
                <p className="text-gray-600 text-sm">Чанар баталгааг амлая</p>
              </div>
              {/* Desktop: Grid layout */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Array.isArray(reviewsData) ? reviewsData : [])
                  .slice(0, 3)
                  .map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-lg p-4 shadow-sm"
                      data-testid={`review-card-${review.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3c8fb8] flex items-center justify-center text-white font-bold flex-shrink-0">
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">
                              {review.customerName}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs line-clamp-3">
                            {review.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {/* Mobile: Horizontal auto-scrolling carousel */}
              <div className="md:hidden overflow-hidden">
                <div className="flex gap-4 animate-scroll-x">
                  {(() => {
                    const safeReviews = Array.isArray(reviewsData)
                      ? reviewsData
                      : [];
                    return [
                      ...safeReviews.slice(0, 3),
                      ...safeReviews.slice(0, 3),
                    ].map((review, index) => (
                      <div
                        key={`${review.id}-${index}`}
                        className="bg-white rounded-lg p-4 shadow-sm flex-shrink-0 w-[280px]"
                        data-testid={`review-card-mobile-${review.id}-${index}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3c8fb8] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {review.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">
                                {review.customerName}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 text-xs line-clamp-3">
                              {review.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </section>
        )}

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
