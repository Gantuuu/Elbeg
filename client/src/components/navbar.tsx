import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { CartDrawer } from "@/components/cart-drawer";
import { MiniCart } from "@/components/mini-cart";
import { cn } from "@/lib/utils";
import { UserIcon, ShoppingCartIcon, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";

// Site name interface
interface SiteNameSettings {
  value: string;
}

export function Navbar() {
  const [location] = useLocation();
  const { items } = useCart();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch navigation items from API
  const { data: navigationItems = [] } = useQuery({
    queryKey: ['navigation'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('navigation_items')
          .select('*')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('order', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching navigation:', error);
        return [];
      }
    }
  });

  // Fetch site name settings
  const { data: siteSettings } = useQuery<SiteNameSettings>({
    queryKey: ['site-settings', 'site-name'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'site_name')
          .single();

        if (error) throw error;
        return data as SiteNameSettings;
      } catch (error) {
        console.error('Error fetching site name settings:', error);
        return { value: "Nice Meat махны дэлгэри" }; // Default site name
      }
    }
  });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Default nav links as fallback with translations
  const defaultNavLinks = [
    { href: "/", label: t.home, id: "home" },
    { href: "/contact", label: t.contact, id: "contact" },
  ];

  // Use navigation items from API if available, otherwise use default links
  const navLinks = navigationItems.length > 0
    ? navigationItems.map((item: any) => ({
      href: item.url || `/#${item.title.toLowerCase()}`, // Use title as fallback if URL is empty
      label: item.title,
      id: item.id, // Add ID to ensure unique keys
    }))
    : defaultNavLinks;

  return (
    <header className="shadow-sm relative z-10 bg-white">
      {/* Top bar - Red-Blue gradient */}
      <div className="h-1 bg-[#9b1f24]"></div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Site Title */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="flex-shrink-0 flex items-center cursor-pointer">
                  <span className="font-bold text-base md:text-lg text-[#9b1f24] hover:brightness-110 transition-all duration-300 whitespace-nowrap">
                    {t.siteTitle}
                  </span>
                </div>
              </Link>

              {/* Language Switcher Removed */}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link: any) => (
                <Link key={link.id || link.href} href={link.href}>
                  <div
                    className={cn(
                      "px-3 py-2 font-medium cursor-pointer transition-all duration-200 relative group",
                      (location === link.href || (link.href === "/" && location === "/"))
                        ? "text-[#9b1f24] font-bold"
                        : "text-gray-700 hover:text-[#9b1f24]"
                    )}
                  >
                    {link.label}
                    <span className={cn(
                      "absolute bottom-0 left-0 w-0 h-0.5 bg-[#9b1f24] transition-all duration-200 group-hover:w-full",
                      (location === link.href || (link.href === "/" && location === "/")) && "w-full"
                    )}></span>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Desktop: Cart, User Buttons | Mobile: Language Switcher + Menu Button */}
            <div className="flex items-center space-x-1">
              {/* User Button - Desktop only */}
              <Link href={user ? "/my-page" : "/auth"} className="hidden md:block">
                <div className="p-2 rounded-full hover:bg-gray-100 relative mr-1 transition-all duration-200">
                  <UserIcon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    user ? "text-[#9b1f24]" : "text-gray-700 hover:text-[#9b1f24]"
                  )} />
                </div>
              </Link>

              {/* Cart Button with Mini Cart - Desktop only */}
              <div className="relative group hidden md:block">
                <Link href="/cart">
                  <div
                    className="p-2 rounded-full hover:bg-gray-100 relative transition-all duration-200 cursor-pointer"
                    aria-label={t.cart}
                  >
                    <ShoppingCartIcon className="h-5 w-5 text-[#9b1f24] transition-all duration-200" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#9b1f24] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Mini Cart - only visible on hover and if cart has items */}
                <div className="hidden md:group-hover:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-hover:delay-150 group-hover:transition-all">
                  <MiniCart isVisible={cartItemCount > 0} />
                </div>
              </div>

              {/* Mobile: Language Switcher Removed */}

              {/* Mobile: Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <Menu className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden bg-white border-t border-gray-100 shadow-sm transition-all duration-200 overflow-y-auto",
        isMenuOpen ? "max-h-[70vh]" : "max-h-0"
      )}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link: any) => (
            <Link
              key={link.id || `mobile-${link.href}`}
              href={link.href}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 hover:bg-gray-50 border-l-2",
                (location === link.href || (link.href === "/" && location === "/"))
                  ? "text-[#9b1f24] border-[#9b1f24]"
                  : "text-gray-700 hover:text-[#9b1f24] border-transparent hover:border-[#9b1f24]/50"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Cart nav link for mobile */}
          <Link href="/cart">
            <div
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#9b1f24] hover:bg-gray-50 transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-[#9b1f24]/50"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              {t.cart}
              {cartItemCount > 0 && (
                <span className="ml-2 bg-[#9b1f24] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </div>
          </Link>





          {/* User nav link for mobile */}
          <Link href={user ? "/my-page" : "/auth"}>
            <div
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#9b1f24] hover:bg-gray-50 transition-all duration-200 cursor-pointer border-l-2 border-transparent hover:border-[#9b1f24]/50"
              onClick={() => setIsMenuOpen(false)}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              {user ? t.profile : t.login}
            </div>
          </Link>


        </div>
      </div>

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </header>
  );
}