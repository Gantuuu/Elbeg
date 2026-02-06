import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { formatPrice, getCategoryColor } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { motion } from "framer-motion";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const numericId = parseInt(id);
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();

  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery<Product>({
    queryKey: [`products`, numericId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', numericId)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !isNaN(numericId),
  });

  // 모든 제품 데이터를 가져옵니다
  const {
    data: allProducts = [],
    isLoading: isAllProductsLoading,
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!product,
  });

  // 선택된 카테고리 또는 현재 제품의 카테고리에 따라 제품을 필터링합니다
  const filteredProducts = allProducts.filter(p => {
    if (selectedCategory) {
      return p.category === selectedCategory && p.id !== numericId;
    }
    return p.category === product?.category && p.id !== numericId;
  }).slice(0, 4);

  // 제품이 로드되면 기본적으로 해당 제품의 카테고리를 선택합니다
  useEffect(() => {
    if (product && !selectedCategory) {
      setSelectedCategory(product.category);
    }
  }, [product, selectedCategory]);

  // 상품 ID가 변경될 때마다 수량을 1로 초기화합니다
  useEffect(() => {
    setQuantity(1);
  }, [numericId]);

  // 사용 가능한 모든 카테고리를 가져옵니다
  // 중복 제거를 위해 객체를 사용합니다
  const categoryMap: Record<string, boolean> = {};
  allProducts.forEach(p => {
    if (p.category) {
      categoryMap[p.category] = true;
    }
  });
  const categories = Object.keys(categoryMap);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity));
  };

  const handleAddToCart = () => {
    if (!product) return;

    try {
      addItem({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price.toString()),
        quantity,
        imageUrl: product.imageUrl,
      });

      // 트렌디한 토스트 메시지
      toast({
        title: "🛒 Сагсанд нэмлээ",
        description: `${quantity}× ${product.name}`,
        variant: "default",
        className: "animate-bounceInUp" // 애니메이션 추가
      });
    } catch (error) {
      toast({
        title: "❌ Алдаа гарлаа",
        description: "Сагсанд нэмэх үед алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  if (isProductLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Бүтээгдэхүүн олдсонгүй</h2>
            <p className="text-gray-500 mb-6">Энэхүү бүтээгдэхүүн байхгүй байна эсвэл устгагдсан байна.</p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              Нүүр хуудас руу буцах
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryColors = getCategoryColor(product.category);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Product Detail Section - Mobile Optimized */}
      <section className="py-6">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Product Image - Smaller and Optimized */}
            <div className="relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>

            {/* Product Info - Compact */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
                <div>
                  <p className="text-lg font-bold text-[#0e5841]">
                    {formatPrice(parseFloat(product.price.toString()) * quantity)}
                  </p>
                  <p className="text-[10px] text-gray-500 text-right">
                    {quantity} × {formatPrice(parseFloat(product.price.toString()))}
                  </p>
                </div>
              </div>

              <div className="py-3 mb-3 text-sm text-gray-600">
                <p className="text-gray-700 text-sm whitespace-pre-line">{product.description}</p>
              </div>

              {/* Quantity Selector - Smaller */}
              <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-lg">
                <span className="text-sm">Тоо хэмжээ (кг):</span>
                <div className="flex items-center">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-full"
                    disabled={quantity <= 1}
                  >
                    <span className="text-gray-600 text-sm">-</span>
                  </button>
                  <span className="px-3 text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-[#0e5841] rounded-full"
                  >
                    <span className="text-white text-sm">+</span>
                  </button>
                </div>
              </div>

              {/* Add to Cart Button - Trendy Style */}
              <Button
                className="w-full bg-[#0e5841] text-white py-2.5 px-4 rounded-full flex items-center justify-center transition-all hover:shadow-md text-sm"
                onClick={handleAddToCart}
              >
                <span className="material-icons text-sm mr-1.5">shopping_cart</span>
                Сагсанд нэмэх
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Mobile Optimized */}
      <section className="py-6 bg-neutral">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-lg font-bold mb-4 text-[#0e5841]">Ангилал бүтээгдэхүүн</h2>

          {/* Category Pills - Smaller */}
          <div className="mb-4">
            <div className="flex overflow-x-auto pb-2 -mx-2 px-2 space-x-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`min-w-[80px] px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCategory === category
                    ? "bg-[#0e5841] text-white"
                    : "bg-gray-100/80 text-gray-700"
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="font-bold">{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products By Category - Smaller Cards */}
          {isAllProductsLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">Энэ ангилалд бүтээгдэхүүн олдсонгүй</p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex space-x-3 min-w-min px-1 pb-1"
                style={{ paddingRight: "16px" }}
              >
                {filteredProducts.map((filteredProduct) => (
                  <div
                    key={filteredProduct.id}
                    className="flex-shrink-0 w-[120px]"
                    onClick={() => setLocation(`/products/${filteredProduct.id}`)}
                  >
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-24 overflow-hidden relative">
                        <img
                          src={filteredProduct.imageUrl}
                          alt={filteredProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="font-bold text-xs truncate">{filteredProduct.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-bold text-[10px] text-[#0e5841]">
                            {parseFloat(filteredProduct.price.toString()).toLocaleString()}₩
                          </span>
                          <button className="bg-[#0e5841] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          )}


        </div>
      </section>

      <Footer />
    </div>
  );
}
