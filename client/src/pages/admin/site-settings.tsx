import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SiteNameSettings {
  siteName: string;
}

export default function SiteSettingsPage() {
  const { toast } = useToast();
  const [siteName, setSiteName] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch site name settings
  const { data: siteSettings, isLoading } = useQuery<SiteNameSettings>({
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

  // Initialize siteName state once data is loaded
  if (siteSettings && !isInitialized) {
    setSiteName(siteSettings.siteName);
    setIsInitialized(true);
  }

  // Mutation to update site name
  const updateSiteNameMutation = useMutation({
    mutationFn: async (data: { siteName: string }) => {
      const res = await apiRequest('PUT', '/api/settings/site-name', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Амжилттай",
        description: "Сайтын нэр шинэчлэгдлээ",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/site-name'] });
    },
    onError: (error: any) => {
      toast({
        title: "Алдаа гарлаа",
        description: error.message || "Сайтын нэр шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6 text-white bg-gradient-to-r from-[#FF0033] to-[#0000CC] inline-block px-4 py-2 rounded-lg shadow-glow-sm">Сайтын тохиргоо</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="border border-[#FF0033]/20 shadow-md hover:shadow-glow-sm transition-all duration-300">
            <CardHeader className="border-b border-[#FF0033]/10">
              <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0033] to-[#0000CC]">Сайтын нэр</CardTitle>
              <CardDescription>
                Сайтын дээд хэсэгт харагдах нэр
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-[#FF0033] font-medium">Сайтын нэр</Label>
                  <Input
                    id="siteName"
                    placeholder="Жишээ: Гэрийн Мах"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="max-w-md focus:border-[#FF0033] focus:ring-[#0000CC]/20 transition-all duration-300"
                  />
                  <p className="text-sm text-[#0000CC]/70 italic">
                    Энэ нэр нь сайтын дээд хэсэгт логоны оронд харагдах болно
                  </p>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-[#FF0033] to-[#0000CC] text-white hover:shadow-glow transition-all duration-300"
                    disabled={updateSiteNameMutation.isPending}
                  >
                    {updateSiteNameMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Хадгалж байна...
                      </>
                    ) : (
                      <>Хадгалах</>
                    )}
                  </Button>
                  
                  {updateSiteNameMutation.isSuccess && (
                    <div className="flex items-center text-green-500 bg-green-50 px-3 py-1.5 rounded-md border border-green-200 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-[#0000CC]" />
                      <span className="text-green-800 font-medium">Хадгалагдлаа</span>
                    </div>
                  )}
                  
                  {updateSiteNameMutation.isError && (
                    <div className="flex items-center bg-red-50 px-3 py-1.5 rounded-md border border-red-200 shadow-sm">
                      <AlertCircle className="h-5 w-5 mr-2 text-[#FF0033]" />
                      <span className="text-red-800 font-medium">Алдаа гарлаа</span>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}