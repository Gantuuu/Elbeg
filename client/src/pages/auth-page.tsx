import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useLanguage } from "@/contexts/language-context";
import { HERO_BACKGROUND } from "@/lib/constants";

// Create local schema extensions for both forms
const loginFormSchema = loginSchema;
const signupFormSchema = signupSchema;

// Component for the Auth page
export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location] = useLocation();
  const { t } = useLanguage();

  // Check URL parameters for tab selection
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const initialTab = tabParam === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow grid lg:grid-cols-2 gap-0">
        {/* Left side: Form section */}
        <div className="flex flex-col justify-center items-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#9b1f24]/10 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-[#9b1f24] data-[state=active]:text-white">{t.signIn}</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[#9b1f24] data-[state=active]:text-white">{t.signUp}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm onSuccess={() => { }} />
              </TabsContent>

              <TabsContent value="signup">
                <SignupForm onSuccess={() => setActiveTab("login")} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right side: Hero section */}
        <div
          className="hidden lg:flex relative flex-col justify-center items-center p-10 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${HERO_BACKGROUND})`
          }}
        >
          <div className="text-center text-white space-y-4 max-w-md">
            <h1 className="text-3xl font-bold">{t.authHeroTitle}</h1>
            <p className="text-xl">
              {t.authHeroDesc}
            </p>
            <ul className="text-left space-y-2 mt-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#9b1f24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {t.directDelivery}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#9b1f24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {t.viewOrderHistory}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#9b1f24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {t.fastPayment}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Login form component
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { loginMutation } = useAuth();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    try {
      await loginMutation.mutateAsync(values);
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.signIn}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.usernameOrEmail}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.usernameOrEmail} className="placeholder:text-gray-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.password}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t.password} className="placeholder:text-gray-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#9b1f24] hover:brightness-105"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ?
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.signingIn}
                </span> :
                t.signIn}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{t.orContinueWith || "Эсвэл"}</span>
              </div>
            </div>

            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-gray-700 font-medium">{t.continueWithGoogle || "Google-ээр нэвтрэх"}</span>
            </a>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          {t.noAccount} <a className="text-primary cursor-pointer hover:underline" onClick={() => document.querySelector('[value="signup"]')?.dispatchEvent(new MouseEvent('click'))}>{t.signUp}</a>
        </p>
      </CardFooter>
    </Card>
  );
}

// Signup form component
function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { registerMutation } = useAuth();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupFormSchema>) {
    try {
      await registerMutation.mutateAsync(values);
      form.reset();
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.signUp}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.username}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.username} className="placeholder:text-gray-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.email} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@mail.mn"
                        className="placeholder:text-gray-400"
                        type="email"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => {
                  const formatPhoneNumber = (value: string) => {
                    // Remove all non-digit characters
                    const digits = value.replace(/\D/g, '');

                    // Apply Korean phone number format (010-0000-0000)
                    if (digits.length <= 3) {
                      return digits;
                    } else if (digits.length <= 7) {
                      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
                    } else {
                      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>{t.phone}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="010-0000-0000"
                          className="placeholder:text-gray-400"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.phoneFormat}
                      </p>
                    </FormItem>
                  );
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.password}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t.password} className="placeholder:text-gray-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.confirmPassword}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t.confirmPassword} className="placeholder:text-gray-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#9b1f24] hover:brightness-105"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ?
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.signingUp}
                </span> :
                t.signUp}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{t.orContinueWith || "Эсвэл"}</span>
              </div>
            </div>

            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-gray-700 font-medium">{t.continueWithGoogle || "Google-ээр бүртгүүлэх"}</span>
            </a>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          {t.alreadyHaveAccount} <a className="text-primary cursor-pointer hover:underline" onClick={() => document.querySelector('[value="login"]')?.dispatchEvent(new MouseEvent('click'))}>{t.signIn}</a>
        </p>
      </CardFooter>
    </Card>
  );
}