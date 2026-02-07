import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Mongolia & Meat related images for the background
const IMAGES = [
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/001.png",
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/002.png",
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/003.png",
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/005.png",
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/010.png",
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/001.png", // Repeat
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/002.png", // Repeat
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/003.png", // Repeat
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/005.png", // Repeat
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/010.png", // Repeat
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/001.png", // Repeat
  "https://hwwtcfkiqzpultolyewm.supabase.co/storage/v1/object/public/media/login%20image/002.png", // Repeat
];

// Shuffle/Split images for columns
const COLUMN_1 = IMAGES.slice(0, 4);
const COLUMN_2 = IMAGES.slice(4, 8);
const COLUMN_3 = IMAGES.slice(8, 12);

export default function AuthPage() {
  const { user, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await googleLogin();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Scrolling Background */}
      <div className="absolute inset-0 grid grid-cols-3 gap-6 opacity-40 select-none pointer-events-none -skew-y-6 scale-110 transform-gpu">
        <Column images={COLUMN_1} duration={45} />
        <Column images={COLUMN_2} duration={55} reverse />
        <Column images={COLUMN_3} duration={50} />
      </div>

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto space-y-8 md:space-y-12 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-3 md:space-y-6"
        >
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
            alt="Logo"
            className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-0 hidden" // Placeholder for logo if needed
          />
          <h1 className="text-3xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl">
            Элбэг мах хүнс
          </h1>
          <p className="text-sm md:text-xl text-gray-100 font-medium leading-relaxed drop-shadow-lg max-w-[280px] md:max-w-2xl mx-auto">
            Бүх төрлийн мах махан бүтээгдэхүүнээ <br className="block" />
            <span className="text-[#02C75A] font-bold text-base md:text-2xl">ЭЛБЭГ МАХ ХҮНСЭЭС</span> аваарай
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full"
        >
          <Button
            size="lg"
            className="w-full h-11 md:h-14 text-sm md:text-lg font-bold bg-white text-black hover:bg-gray-100 transition-all rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-gray-400 border-t-black rounded-full animate-spin"></div>
                Уншиж байна...
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google-ээр нэвтрэх (5 секунд)
              </div>
            )}
          </Button>
          <div className="mt-4 text-center">
            <span className="text-gray-300 text-xs md:text-sm">Бүртгэлгүй юу? <span className="text-white font-medium cursor-pointer underline underline-offset-2" onClick={handleGoogleLogin}>Бүртгүүлэх</span></span>
          </div>
        </motion.div>
      </div>

      {/* Only for admin bypass - hidden trigger (DEV ONLY) */}
      {import.meta.env.DEV && (
        <div
          className="absolute bottom-0 right-0 w-10 h-10 cursor-alias z-50 opacity-0"
          onClick={() => window.location.href = '/admin/login'}
          title="Admin Login"
        />
      )}
    </div>
  );
}

const Column = ({ images, duration, reverse = false }: { images: string[], duration: number, reverse?: boolean }) => {
  return (
    <motion.div
      initial={{ y: reverse ? -1000 : 0 }}
      animate={{ y: reverse ? 0 : -1000 }}
      transition={{
        repeat: Infinity,
        repeatType: "loop",
        duration: duration,
        ease: "linear",
      }}
      className="flex flex-col gap-6"
    >
      {/* Loop the images multiple times to creating seamless infinite scroll */}
      {[...images, ...images, ...images, ...images].map((src, index) => (
        <div key={index} className="relative rounded-xl overflow-hidden shadow-2xl w-full aspect-[3/4]">
          <img
            src={src}
            alt="background"
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-500"
          />
        </div>
      ))}
    </motion.div>
  );
};
