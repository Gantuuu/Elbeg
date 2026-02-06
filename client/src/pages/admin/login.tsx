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

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, {
    message: "Нэвтрэх нэр оруулна уу",
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
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/admin/login", data);

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
      // This helps with mobile browsers that may need extra time to handle cookies
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
          // If auth check fails, still try to redirect
          console.log("Auth check failed, proceeding with redirect:", authError);
          setLocation("/admin");
        }
      }, 1500); // 1.5 second delay for mobile compatibility

    } catch (error) {
      toast({
        title: "Нэвтрэх үед алдаа гарлаа",
        description: "Нэвтрэх нэр эсвэл нууц үг буруу байна. Дахин оролдоно уу.",
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
              <span className="material-icons text-3xl mr-2 text-[#9b1f24]">admin_panel_settings</span>
              <CardTitle className="text-2xl font-bold text-[#9b1f24]">Админ нэвтрэх</CardTitle>
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Нэвтрэх нэр</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
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
                  className="w-full bg-[#9b1f24] hover:brightness-105 text-white"
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
                    className="text-[#9b1f24] font-medium"
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
