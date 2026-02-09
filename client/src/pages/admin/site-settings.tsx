import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface SiteNameSettings {
  siteName: string;
}

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const [siteName, setSiteName] = useState<string>("");
  const [loginImages, setLoginImages] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch site name settings
  const { data: siteSettings } = useQuery<SiteNameSettings>({
    queryKey: ['/api/settings/site-name'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/site-name', {
          credentials: 'include',
          cache: 'no-cache',
          mode: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch site name settings');
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching site name settings:', error);
        return { siteName: "Гэрийн Мах" }; // Default site name
      }
    }
  });

  // Fetch login images settings
  const { data: loginImagesData, isLoading: isLoadingImages } = useQuery<{ images: string[] }>({
    queryKey: ['/api/settings/login-images'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/login-images', {
          credentials: 'include',
          cache: 'no-cache',
          mode: 'same-origin'
        });
        if (!response.ok) throw new Error('Failed to fetch login images');
        return await response.json();
      } catch (error) {
        console.error('Error fetching login images:', error);
        return { images: [] };
      }
    }
  });

  const isLoading = false; // We handle loading state differently now

  // Initialize state once data is loaded
  if (!isInitialized && siteSettings && loginImagesData) {
    setSiteName(siteSettings.siteName);
    setLoginImages(loginImagesData.images.join('\n'));
    setIsInitialized(true);
  }

  // Mutation to update site name
  const updateSiteNameMutation = useMutation({
    mutationFn: async (data: { siteName: string }) => {
      const res = await apiRequest('PUT', '/api/settings/site-name', data);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Сайтын нэр шинэчлэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/site-name'] });
    }
  });

  // Mutation to update login images
  const updateLoginImagesMutation = useMutation({
    mutationFn: async (images: string[]) => {
      const res = await apiRequest('PUT', '/api/settings/login-images', { images });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Нэвтрэх хэсгийн зураг шинэчлэгдлээ",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/login-images'] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Зураг шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  });

  const handleSubmitSiteName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      toast({
        title: "Алдаа",
        description: "Сайтын нэр хоосон байж болохгүй",
        variant: "destructive",
      });
      return;
    }
    updateSiteNameMutation.mutate({ siteName });
  };

  const handleSubmitLoginImages = (e: React.FormEvent) => {
    e.preventDefault();
    const imagesArray = loginImages
      .split('\n')
      .map(url => url.trim())
      .filter(url => url !== "");

    updateLoginImagesMutation.mutate(imagesArray);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-white bg-gradient-to-r from-[#0e5841] to-[#16a34a] inline-block px-4 py-2 rounded-lg shadow-sm">Сайтын тохиргоо</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-[#0e5841]">Сайтын нэр</CardTitle>
              <CardDescription>
                Сайтын дээд хэсэгт харагдах нэр
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitSiteName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Сайтын нэр</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    className="bg-[#0e5841] hover:bg-[#084130]"
                    disabled={updateSiteNameMutation.isPending}
                  >
                    {updateSiteNameMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                  </Button>

                  {updateSiteNameMutation.isSuccess && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Login Background Images Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-[#0e5841]">Нэвтрэх хэсгийн зураг</CardTitle>
              <CardDescription>Нэвтрэх болон бүртгүүлэх хэсгийн арын дэвсгэр зурагнууд</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitLoginImages} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginImages">Зургийн URL-ууд (Мөр бүрт нэг)</Label>
                  <textarea
                    id="loginImages"
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    value={loginImages}
                    onChange={(e) => setLoginImages(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Cloudflare-т ору울сан зургийнхаа Public link-ийг энд нэг мөрөнд нэгийг бичээрэй.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="bg-[#0e5841] hover:bg-[#084130]"
                  disabled={updateLoginImagesMutation.isPending}
                >
                  {updateLoginImagesMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}