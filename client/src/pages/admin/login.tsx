import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { logMobileCookieDebug } from "@/utils/cookieUtils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase"; // Import Supabase client

// Login form schema
const loginFormSchema = z.object({
  email: z.string().email({
    message: "Зөв и-мэйл хаяг оруулна уу", // Correct email validation
  }),
  password: z.string().min(1, {
    message: "Нууц үг оруулна уу",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if redirected from admin panel
  const isRedirected = location.includes("?redirect=true");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      // 1. Supabase Auth Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.session) {
        throw new Error("No session created");
      }

      // 2. Sync Session with Backend
      // Send the access token to the backend to create a secure session cookie
      await apiRequest("POST", "/api/auth/sync-session", {
        access_token: authData.session.access_token,
      });

      toast({
        title: "Амжилттай нэвтэрлээ",
        description: "Админ хэсэгт тавтай морил.",
      });

      // Debug cookies on mobile after login
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log("=== POST-LOGIN MOBILE COOKIE DEBUG ===");
        logMobileCookieDebug();
      }

      // Wait for session to be properly set before redirecting
      setTimeout(async () => {
        try {
          // Verify authentication status before redirecting
          const authCheck = await apiRequest("GET", "/api/admin/check-auth");
          if (authCheck.authenticated) {
            setLocation("/admin");
          } else {
            // If auth check fails, try redirecting anyway after additional delay
            setTimeout(() => {
              setLocation("/admin");
            }, 1000);
          }
        } catch (authError) {
          console.log("Auth check failed, proceeding with redirect:", authError);
          setLocation("/admin");
        }
      }, 1500);

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Нэвтрэх үед алдаа гарлаа",
        description: error.message || "Нэвтрэх нэр эсвэл нууц үг буруу байна.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <span className="material-icons text-3xl mr-2 text-[#0e5841]">admin_panel_settings</span>
              <CardTitle className="text-2xl font-bold text-[#0e5841]">Админ нэвтрэх</CardTitle>
            </div>
            {isRedirected && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm">
                Үйлдэл хийхийн тулд эхлээд нэвтэрнэ үү.
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>И-мэйл</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
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
                      <FormLabel>Нууц үг</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#0e5841] hover:brightness-105 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Нэвтэрч байна...
                    </>
                  ) : (
                    "Нэвтрэх"
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500 mt-4">
                  <Button
                    variant="link"
                    onClick={() => setLocation("/")}
                    className="text-[#0e5841] font-medium"
                  >
                    Нүүр хуудас руу буцах
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
