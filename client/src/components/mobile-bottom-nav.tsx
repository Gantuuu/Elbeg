import { useLocation } from "wouter";
import { Home, ShoppingCart, User, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

interface MobileBottomNavProps {
  cartItemCount?: number;
  onMenuToggle?: () => void;
}

export function MobileBottomNav({ cartItemCount = 0, onMenuToggle }: MobileBottomNavProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Also call the passed onMenuToggle if available
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Don't show on admin pages
  const isAdminPage = location.startsWith('/admin');

  if (!isMobile || isAdminPage) return null;

  const navItems = [
    {
      icon: Home,
      label: t.home,
      path: "/",
      onClick: () => setLocation("/")
    },
    {
      icon: ShoppingCart,
      label: t.cart,
      path: "/cart",
      onClick: () => setLocation("/cart"),
      badge: cartItemCount > 0 ? cartItemCount : undefined
    },
    {
      icon: User,
      label: t.myPage,
      path: "/my-page",
      onClick: () => setLocation("/my-page")
    }
  ];

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50 max-h-[70vh] overflow-y-auto">
            <div className="px-4 pt-4 pb-3 space-y-1">
              {/* Contact Link */}
              <button
                onClick={() => {
                  setLocation("/contact");
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#0e5841] hover:bg-gray-50 transition-all duration-200 border-l-2 border-transparent hover:border-[#0e5841]/50"
              >
                {t.contact}
              </button>

              {/* Language Switcher */}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  {language === 'mn' ? 'Хэл сонгох' : language === 'ru' ? 'Выбор языка' : 'Language'}
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-center items-center py-3 px-6 w-full">
          <div className="flex justify-evenly items-center w-full">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path === "#menu" && isMobileMenuOpen);

              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`group flex flex-col items-center justify-center py-2 px-6 rounded-xl transition-all duration-300 ease-out relative min-w-0 transform active:scale-95 hover:scale-105 ${isActive
                    ? "text-white bg-[#0e5841] shadow-lg shadow-[#0e5841]/30"
                    : "text-gray-600 hover:text-white hover:bg-[#0e5841]/80 hover:shadow-md hover:shadow-[#0e5841]/20"
                    }`}
                >
                  <div className="relative mb-1 transition-transform duration-300 group-active:scale-110">
                    <Icon size={22} className="transition-all duration-300" />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-[#0e5841] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight whitespace-nowrap transition-all duration-300">{item.label}</span>

                  {isActive && (
                    <div className="absolute -bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full opacity-80 animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}