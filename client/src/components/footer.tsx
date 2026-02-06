import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { useLanguage } from "../contexts/language-context";
import { supabase } from "@/lib/supabase";

// Define a type for our footer settings data
interface FooterSettings {
  companyName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  copyright: string;
  logoUrl?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  quickLinks: Array<{
    title: string;
    url: string;
  }>;
}

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  // Fetch footer settings from API
  const { data: footerData, isLoading } = useQuery<FooterSettings>({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('footer_settings')
          .select('*')
          .single();

        if (error) throw error;

        // Map snake_case to camelCase
        return {
          companyName: data.company_name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          logoUrl: data.logo_url,
          socialLinks: data.social_links as any,
          quickLinks: data.quick_links as any,
          copyright: data.copyright_text
        };
      } catch (error) {
        console.error('Error fetching footer settings:', error);
        return {} as FooterSettings;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });



  // If we're still loading, show a placeholder
  if (isLoading) {
    return (
      <footer className="relative overflow-hidden pt-16 pb-8 bg-white text-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="animate-pulse h-24"></div>
        </div>
      </footer>
    );
  }

  // Set default values if data hasn't loaded yet
  const {
    companyName = "Nice Meat махны дэлгүүр",
    description = "Чанартай махны бүтээгдэхүүн",
    address = "청주시 흥덕구 봉명동 1091",
    phone = "010 6884 9193",
    email = "",
    copyright = t.copyright,
    socialLinks = {},
    quickLinks = []
  } = footerData || {};

  // Render social media icons based on available links
  const renderSocialIcons = () => {
    const icons = [];

    if (socialLinks.facebook) {
      icons.push(
        <a key="facebook" href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300 flex items-center justify-center">
          <FaFacebook className="text-xl" />
        </a>
      );
    }

    if (socialLinks.twitter) {
      icons.push(
        <a key="twitter" href={socialLinks.twitter} target="_blank" rel="noopener noreferrer"
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300 flex items-center justify-center">
          <FaTwitter className="text-xl" />
        </a>
      );
    }

    if (socialLinks.instagram) {
      icons.push(
        <a key="instagram" href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300 flex items-center justify-center">
          <FaInstagram className="text-xl" />
        </a>
      );
    }

    if (socialLinks.youtube) {
      icons.push(
        <a key="youtube" href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
          className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300 flex items-center justify-center">
          <FaYoutube className="text-xl" />
        </a>
      );
    }

    // If no social links are provided, return placeholders
    if (icons.length === 0) {
      return (
        <>
          <div className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300">
            <span className="material-icons">facebook</span>
          </div>
          <div className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300">
            <span className="material-icons">insert_comment</span>
          </div>
          <div className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors duration-300">
            <span className="material-icons">photo_camera</span>
          </div>
        </>
      );
    }

    return icons;
  };

  // Quick links section has been removed

  return (
    <footer className="bg-white py-8 px-6 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Contact info */}
        <div className="text-center space-y-3 mb-6">
          {/* Facebook and Phone in one line */}
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <FaFacebook className="text-gray-600 text-sm" />
              <a
                href="https://www.facebook.com/otgonbyambahoy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 text-sm hover:text-blue-600 transition-colors duration-200"
              >
                {t.visitPage}
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <span className="material-icons text-gray-600 text-sm">phone</span>
              <p className="text-gray-600 text-sm">{phone}</p>
            </div>
          </div>

          {/* Address on separate line */}
          <div className="flex items-center justify-center space-x-2">
            <span className="material-icons text-gray-600 text-sm">location_on</span>
            <p className="text-gray-600 text-sm">{address}</p>
          </div>
        </div>

        {/* Legal Links */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Link href="/privacy">
            <span className="text-gray-500 hover:text-gray-700 text-xs transition-colors duration-200">
              Нууцлалын бодлого
            </span>
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms">
            <span className="text-gray-500 hover:text-gray-700 text-xs transition-colors duration-200">
              Үйлчилгээний нөхцөл
            </span>
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-3">
            {t.copyright}
          </p>

          {/* Admin login */}
          <Link href="/admin/login">
            <div className="inline-flex items-center text-gray-500 hover:text-gray-700 text-xs transition-colors duration-200">
              <span className="material-icons text-xs mr-1">admin_panel_settings</span>
              <span>{t.adminLogin}</span>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}
