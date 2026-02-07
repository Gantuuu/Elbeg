import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { apiRequest } from "@/lib/queryClient";
import { getFullImageUrl } from "@/lib/image-utils";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function Hero() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { t } = useLanguage();
  const [api, setApi] = useState<CarouselApi>();

  // Fetch hero content
  const { data: heroData, isLoading } = useQuery<any>({
    queryKey: ['/api/settings/hero'],
    queryFn: () => apiRequest('GET', '/api/settings/hero'),
    staleTime: 60000,
  });

  // Auto scroll animation for delivery message
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev < 100 ? prev + 0.3 : -100));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Custom Autoplay with API
  useEffect(() => {
    if (!api) {
      return
    }

    const autoPlayInterval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0); // Loop back to start if needed, though 'loop: true' prop handles this usually
      }
    }, 5000);

    return () => clearInterval(autoPlayInterval);
  }, [api]);


  // Prepare slides data
  const slides = React.useMemo(() => {
    if (!heroData) return [];

    // New format
    if (heroData.slides && Array.isArray(heroData.slides) && heroData.slides.length > 0) {
      return heroData.slides;
    }

    // Legacy format or default
    return [{
      title: heroData.title || t.heroTitle,
      text: heroData.text || t.heroSubtitle,
      imageUrl: heroData.imageUrl
    }];
  }, [heroData, t]);

  return (
    <section className="bg-[#0e5841] pt-3 pb-8">
      <div className="container mx-auto px-0 md:px-6">
        {/* Scrolling delivery message */}
        <div className="px-4 md:px-0">
          <motion.div
            className="mb-4 relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-full py-2 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="whitespace-nowrap text-white font-medium"
              style={{ transform: `translateX(${-scrollPosition}%)` }}
            >
              {t.delivery.scrolling}
            </div>
          </motion.div>
        </div>

        {/* Carousel */}
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {slides.map((slide: any, index: number) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-[90%] md:basis-[95%] lg:basis-full">
                <div className="relative overflow-hidden rounded-xl shadow-lg">
                  <div
                    className="w-full aspect-[16/9] md:aspect-[21/9] bg-center bg-cover rounded-xl transition-all duration-500"
                    style={{
                      backgroundImage: `url('${getFullImageUrl(slide.imageUrl)}')`,
                      backgroundPosition: 'center 35%' // Adjusted for better face visibility
                    }}
                  >
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:from-black/40 md:via-black/10 md:to-transparent" />

                    {/* Text content */}
                    <div className="absolute inset-0 flex flex-col justify-end md:justify-center items-center pb-8 md:pb-0 p-4">
                      <div className="text-center max-w-3xl">
                        <motion.h2
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-2"
                        >
                          {slide.title}
                        </motion.h2>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-white/90 text-sm md:text-lg font-medium drop-shadow-md hidden md:block"
                        >
                          {slide.text}
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="hidden md:block">
            <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 border-none text-white" />
            <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 border-none text-white" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}