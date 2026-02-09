import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { AdminHeader } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Image as ImageIcon, Loader2 } from "lucide-react";

export default function LoginSettingsPage() {
    const { toast } = useToast();
    const [loginImages, setLoginImages] = useState<string>("");
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch login images settings
    const { data: loginImagesData, isLoading } = useQuery<{ images: string[] }>({
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

    // Initialize state once data is loaded
    if (!isInitialized && loginImagesData) {
        setLoginImages(loginImagesData.images.join('\n'));
        setIsInitialized(true);
    }

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const imagesArray = loginImages
            .split('\n')
            .map(url => url.trim())
            .filter(url => url !== "");

        updateLoginImagesMutation.mutate(imagesArray);
    };

    return (
        <AdminLayout>
            <div className="flex-1 overflow-hidden flex flex-col">
                <AdminHeader
                    title="Нэвтрэх хэсгийн зураг"
                    description="Нэвтрэх болон бүртгүүлэх хэсгийн арын дэвсгэр зурагнууд"
                    icon={<ImageIcon className="h-6 w-6" />}
                />

                <div className="p-6 overflow-auto flex-1">
                    <Card className="shadow-md max-w-4xl">
                        <CardHeader>
                            <CardTitle className="text-[#0e5841]">Нэвтрэх хэсгийн зураг</CardTitle>
                            <CardDescription>
                                Cloudflare-т оруулсан зургийнхаа Public link-ийг энд нэг мөрөнд нэгийг бичээрэй.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#0e5841]" />
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="loginImages">Зургийн URL-ууд (Мөр бүрт нэг)</Label>
                                        <textarea
                                            id="loginImages"
                                            className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                                            value={loginImages}
                                            onChange={(e) => setLoginImages(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 italic">
                                            Зураг бүрийг шинэ мөрөнд бичнэ үү.
                                        </p>
                                        <Button
                                            type="submit"
                                            className="bg-[#0e5841] hover:bg-[#084130] min-w-[120px]"
                                            disabled={updateLoginImagesMutation.isPending}
                                        >
                                            {updateLoginImagesMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Хадгалж байна...
                                                </>
                                            ) : "Хадгалах"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Preview Section */}
                    {!isLoading && loginImages.trim() && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4 text-[#0e5841]">Урьдчилсан харагдац</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {loginImages.split('\n').filter(url => url.trim()).map((url, idx) => (
                                    <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden border shadow-sm">
                                        <img
                                            src={url.trim()}
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://placehold.co/600x800?text=Invalid+Image+URL";
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
