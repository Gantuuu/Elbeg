import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, signupSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

const HERO_BACKGROUND = "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=2000&auto=format&fit=crop";

export default function AuthPage() {
  const { user, loginMutation, registerMutation, googleLogin } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  // Extract initial tab from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync state with URL param on mount (or if prop changes)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const onTabChange = (value: string) => {
    setActiveTab(value);

    // Optional: Update URL without full reload (pushState)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', value);
    window.history.pushState({}, '', newUrl);
  };

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      name: "",
      phone: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${HERO_BACKGROUND})`
        }}
      >
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#0e5841]">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-[#0e5841]">{t.authHeroTitle}</CardTitle>
            <CardDescription className="text-base">
              {t.authHeroDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-8">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100/50 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-[#0e5841] data-[state=active]:text-white py-2.5 transition-all">
                  {t.login}
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[#0e5841] data-[state=active]:text-white py-2.5 transition-all">
                  {t.signup}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6 animate-in fade-in duration-500">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">{t.usernameOrEmail}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.usernameOrEmail} className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
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
                          <FormLabel className="text-gray-700 font-medium">{t.password}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder={t.password} className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#0e5841] hover:bg-[#0b4633] py-6 text-lg font-bold shadow-lg shadow-[#0e5841]/10 transition-all active:scale-[0.98]"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? t.loggingIn : t.login}
                    </Button>
                  </form>
                </Form>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400 font-medium">{t.or}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-6 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  onClick={() => googleLogin()}
                >
                  <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-gray-700 font-semibold">{t.continueWithGoogle}</span>
                </Button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  {t.noAccount} <button onClick={() => onTabChange("signup")} className="text-[#0e5841] font-semibold hover:underline bg-transparent border-none p-0 h-auto shadow-none cursor-pointer">{t.signup}</button>
                </p>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 animate-in fade-in duration-500">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">{t.username}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t.username} className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
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
                          <FormLabel className="text-gray-700 font-medium">{t.email} *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="example@mail.mn" className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
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
                          <FormLabel className="text-gray-700 font-medium">{t.phone}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="010-0000-0000" className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
                          </FormControl>
                          <p className="text-xs text-gray-400 mt-1">{t.phoneHint}</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">{t.password}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder={t.password} className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">{t.confirmPassword}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder={t.confirmPassword} className="py-6 border-gray-200 focus:border-[#0e5841]/50 focus:ring-[#0e5841]/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-[#0e5841] hover:bg-[#0b4633] py-6 text-lg font-bold shadow-lg shadow-[#0e5841]/10 transition-all active:scale-[0.98]"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? t.signingUp : t.signup}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-8 pt-4 border-t border-gray-100 italic text-center">
              <p className="text-sm text-gray-500">
                {t.fastPayment}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}