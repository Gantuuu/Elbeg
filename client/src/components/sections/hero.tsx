import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";

export function Hero() {
  const [location, setLocation] = useLocation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const { t } = useLanguage();

  // Fetch hero content from the server
  const { data: heroSettings, isLoading } = useQuery<{
    title?: string;
    text?: string;
    imageUrl?: string;
  }>({
    queryKey: ['/api/settings/hero'],
  });

  // Auto scroll animation effect for delivery message
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev < 100 ? prev + 0.3 : -100));
    }, 16);  // ~60fps

    return () => clearInterval(interval);
  }, []);

  // Locally derived content
  const title = heroSettings?.title || t.heroTitle;
  const subtitle = heroSettings?.text || t.heroSubtitle;
  const imageUrl = heroSettings?.imageUrl || "/uploads/1746355234137-26887706.jpg";

  return (
    <section className="bg-[#0e5841] pt-3 pb-4">
      <div className="container mx-auto px-6">
        {/* Scrolling delivery message */}
        <motion.div
          className="mb-6 relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-full py-2 px-4"
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

        {/* Banner image section */}
        <div className="mb-2">
          <div className="relative overflow-hidden rounded-xl">
            <div
              className="w-full aspect-[16/9] bg-center bg-cover rounded-xl"
              style={{
                backgroundImage: `url('${imageUrl}')`,
                backgroundPosition: 'center 35%'
              }}
            >
              {/* Text overlay with moving text */}
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/20 overflow-hidden">
                <motion.h2
                  className="text-2xl md:text-3xl font-bold text-white text-center drop-shadow-lg px-4"
                  animate={{
                    x: [30, -30, 30],
                    transition: {
                      repeat: Infinity,
                      duration: 5,
                      ease: "easeInOut"
                    }
                  }}
                >
                  {subtitle}
                </motion.h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}