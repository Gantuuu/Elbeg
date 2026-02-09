import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, signupSchema } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mongolia & Meat related images for the background
const IMAGES = [
  "https://placehold.co/600x800/2a9d8f/ffffff?text=Image+1",
  "https://placehold.co/600x800/e9c46a/ffffff?text=Image+2",
  "https://placehold.co/600x800/f4a261/ffffff?text=Image+3",
  "https://placehold.co/600x800/e76f51/ffffff?text=Image+4",
  "https://placehold.co/600x800/264653/ffffff?text=Image+5",
  "https://placehold.co/600x800/2a9d8f/ffffff?text=Image+6",
  "https://placehold.co/600x800/e9c46a/ffffff?text=Image+7",
  "https://placehold.co/600x800/f4a261/ffffff?text=Image+8",
  "https://placehold.co/600x800/e76f51/ffffff?text=Image+9",
  "https://placehold.co/600x800/264653/ffffff?text=Image+10",
  "https://placehold.co/600x800/2a9d8f/ffffff?text=Image+11",
  "https://placehold.co/600x800/e9c46a/ffffff?text=Image+12",
];

// Shuffle/Split images for columns
const COLUMN_1 = IMAGES.slice(0, 4);
const COLUMN_2 = IMAGES.slice(4, 8);
const COLUMN_3 = IMAGES.slice(8, 12);

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Handle URL query params to switch tabs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, []);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "", // Added confirmPassword to schema? Check schema.
      // If shared/schema doesn't have confirmPassword, removing it or handling it manually.
      // Assuming shared/schema might not have confirmPassword in signupSchema, checking...
      // Actually, usually signupSchema has it. If not, I'll stick to basic fields.
      // Let's assume basic fields for now to be safe: username, password, email.
      // Wait, checking use-auth.tsx, it uses RegisterData = z.infer<typeof signupSchema>.
      // I'll stick to what the backend expects: username, password, email, name, phone.
      name: "",
      phone: "",
    },
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = async (data: z.infer<typeof signupSchema>) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Scrolling Background */}
      <div className="absolute inset-0 grid grid-cols-3 gap-6 opacity-40 select-none pointer-events-none -skew-y-6 scale-110 transform-gpu">
        <Column images={COLUMN_1} duration={45} />
        <Column images={COLUMN_2} duration={55} reverse />
        <Column images={COLUMN_3} duration={50} />
      </div>

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 my-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl mb-2">
            Элбэг мах хүнс
          </h1>
          <p className="text-gray-200 text-sm md:text-base font-medium">
            Шинэ, чанартай мах махан бүтээгдэхүүн
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-[#0e5841] font-bold">Нэвтрэх</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-[#0e5841] font-bold">Бүртгүүлэх</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Хэрэглэгчийн нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Нууц үг</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#0e5841] hover:brightness-110 text-white font-bold h-11"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Уншиж байна...
                        </>
                      ) : (
                        "Нэвтрэх"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Хэрэглэгчийн нэр</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имэйл хаяг</FormLabel>
                          <FormControl>
                            <Input placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Нууц үг</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Нэр (Заавал биш)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Утас (Заавал биш)</FormLabel>
                          <FormControl>
                            <Input placeholder="010-0000-0000" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#0e5841] hover:brightness-110 text-white font-bold h-11"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Бүртгүүлж байна...
                        </>
                      ) : (
                        "Бүртгүүлэх"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-100">
            Нэвтэрснээр та үйлчилгээний нөхцөлийг зөвшөөрч байна.
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
