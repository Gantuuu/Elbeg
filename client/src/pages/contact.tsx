import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, ArrowLeft } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Link } from "wouter";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Form validation
      if (!formData.name || !formData.phone || !formData.message) {
        toast({
          title: "Алдаа гарлаа",
          description: "Шаардлагатай талбаруудыг бөглөнө үү.",
          variant: "destructive",
        });
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Амжилттай илгээлээ!",
        description: "Таны мессежийг хүлээн авлаа. Удахгүй хариулах болно.",
        variant: "default",
      });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Алдаа гарлаа",
        description: "Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Утас",
      value: "010 6884 9193",
      description: "Өдөр бүр 09:00 - 22:00",
      href: "tel:010-6884-9193"
    },
    {
      icon: FaFacebookF,
      title: "Facebook",
      value: "Nice Meat махны дэлгүүр",
      description: "Мессенжерээр холбогдоорой",
      href: "https://www.facebook.com/profile.php?id=100063522208909"
    },
    {
      icon: MapPin,
      title: "Хаяг",
      value: "청주시 흥덕구 봉명동 1091",
      description: "Солонгос, Чөнжү хот",
      href: "https://maps.google.com?q=청주시+흥덕구+봉명동+1091"
    },
    {
      icon: Clock,
      title: "Ажлын цаг",
      value: "09:00 - 22:00",
      description: "Долоо хоног",
      href: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section with Back Button */}
      <section className="relative overflow-hidden bg-[#9b1f24] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Back Button */}
          <div className="mb-8">
            <Link href="/">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Буцах
              </motion.button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Холбоо барих
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Асуулт, санал хүсэлт байвал бидэнтэй холбогдоорой. Таны хүсэлтийг анхааралтай сонсох болно.
            </p>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1200 120" fill="none" className="w-full h-auto">
            <path d="M0,120 C150,100 350,0 600,40 C850,80 1050,20 1200,40 L1200,120 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-[#9b1f24] rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-gray-800 font-medium hover:text-[#9b1f24] transition-colors duration-200 block"
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-gray-800 font-medium">{item.value}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}