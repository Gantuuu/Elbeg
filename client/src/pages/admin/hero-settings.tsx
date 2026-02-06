import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Image } from "lucide-react";
import { getFullImageUrl, handleImageError } from "@/lib/image-utils";

// Create form schema
const heroFormSchema = z.object({
  title: z.string().min(1, "Гарчиг оруулна уу"),
  text: z.string().min(1, "Тайлбар оруулна уу"),
  imageUrl: z.string().optional(),
});

type HeroFormValues = z.infer<typeof heroFormSchema>;

export default function HeroSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current hero settings
  const { data: heroSettings, isLoading } = useQuery({
    queryKey: ['/api/settings/hero'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/settings/hero');
      } catch (error) {
        console.error("Error fetching hero settings:", error);
        return {
          title: "Шинэ, Шинэхэн, Чанартай Мах",
          text: "Монголын хамгийн чанартай, шинэ махыг танд хүргэж байна.",
          imageUrl: "https://images.unsplash.com/photo-1551024559-b33e1a0702e5?auto=format&fit=crop&w=1920&h=800&q=80"
        };
      }
    }
  });

  // Set default form values and image preview when data loads
  useEffect(() => {
    if (heroSettings) {
      form.reset({
        title: heroSettings.title,
        text: heroSettings.text,
        imageUrl: heroSettings.imageUrl
      });

      if (heroSettings.imageUrl) {
        setImagePreview(heroSettings.imageUrl);
      }
    }
  }, [heroSettings]);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: {
      title: "",
      text: "",
      imageUrl: ""
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear imageUrl field when uploading a new file
      form.setValue("imageUrl", "");
    }
  };

  const onSubmit = async (data: HeroFormValues) => {
    setIsSubmitting(true);
    try {
      // Create FormData object for file upload
      const formData = new FormData();

      // Add the file if one was selected
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      // Add form data
      formData.append("title", data.title);
      formData.append("text", data.text);

      // Only add imageUrl if no file is selected
      if (!selectedFile && data.imageUrl) {
        formData.append("imageUrl", data.imageUrl);
      }

      // Send request to update hero settings
      const response = await fetch("/api/settings/hero", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})).then(data => data as any);
        console.error("Backend error details:", errorData);
        throw new Error(errorData.error || errorData.message || "Failed to update hero settings");
      }

      const updatedSettings = await response.json();

      // Show success toast
      toast({
        title: "Амжилттай шинэчлэгдлээ",
        description: "Нүүр хуудасны тохиргоо амжилттай хадгалагдлаа",
      });

      // Invalidate hero settings cache
      queryClient.invalidateQueries({ queryKey: ['/api/settings/hero'] });

    } catch (error) {
      console.error("Error updating hero settings:", error);
      toast({
        title: "Алдаа гарлаа",
        description: "Нүүр хуудасны тохиргоо шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex">
      <AdminSidebar />

      <div className="flex-1 overflow-hidden">
        <AdminHeader
          title="Нүүр хуудас зураг"
          description="배너 이미지, 제목 및 텍스트를 변경할 수 있습니다"
          icon={<Image className="h-6 w-6" />}
        />

        <div className="p-6 overflow-auto" style={{ height: "calc(100vh - 70px)" }}>
          <Card>
            <CardHeader>
              <CardTitle>Нүүр хуудасны зураг ба текст (배너 이미지 및 텍스트)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-60">
                  <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Гарчиг (제목)</FormLabel>
                          <FormControl>
                            <Input placeholder="Шинэ, Шинэхэн, Чанартай Мах" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тайлбар (설명)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Монголын хамгийн чанартай, шинэ махыг танд хүргэж байна."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Зурагны URL (이미지 URL)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/image.jpg"
                                  {...field}
                                  disabled={!!selectedFile}
                                />
                              </FormControl>
                              <FormDescription>
                                Зурагны холбоос оруулна уу эсвэл доор файл оруулна уу (이미지 URL을 입력하거나 아래에서 파일 업로드)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Image upload component */}
                        <div className="mt-4">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium">Зураг оруулах (이미지 업로드)</span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="space-y-4">
                              <div
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <div className="flex flex-col items-center justify-center py-2">
                                  <Image className="h-8 w-8 text-gray-400 mb-2" />
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Зураг оруулахын тулд энд дарна уу<br />(이미지 업로드하려면 여기를 클릭하세요)
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    (JPEG, PNG, GIF, WEBP)
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  className="hidden"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                />
                              </div>

                              <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Image className="h-5 w-5" />
                                <span>배너 이미지 추가하기 (Баннер зураг нэмэх)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Image preview */}
                      <div>
                        <div className="text-sm font-medium mb-2">Зурагны урьдчилсан харагдац (이미지 미리보기)</div>
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={getFullImageUrl(imagePreview)}
                              alt="미리보기"
                              className="max-h-80 rounded-md object-cover w-full"
                              onError={(e) => handleImageError(e, imagePreview)}
                            />
                            {selectedFile && (
                              <button
                                type="button"
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                onClick={() => {
                                  setSelectedFile(null);
                                  setImagePreview(heroSettings?.imageUrl || null);
                                  form.setValue("imageUrl", heroSettings?.imageUrl || "");
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-300 rounded-md p-4 h-60 flex items-center justify-center">
                            <span className="text-gray-400">Зураг байхгүй байна (이미지 없음)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && (
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                        )}
                        Хадгалах (저장)
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Preview card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Нүүр хуудасны урьдчилсан харагдац (미리보기)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-80 rounded-md overflow-hidden">
                <div
                  className="absolute inset-0 bg-center bg-cover z-0"
                  style={{
                    backgroundImage: `url('${getFullImageUrl(imagePreview || heroSettings?.imageUrl)}')`,
                    filter: 'brightness(0.85) contrast(1.1)',
                  }}
                  data-testid="hero-background"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 opacity-60 z-10"></div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center z-20">
                  <div className="px-6">
                    <div className="max-w-2xl bg-gradient-to-r from-black/30 to-transparent p-6 rounded-lg backdrop-blur-sm">
                      <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">
                        {form.watch("title") || heroSettings?.title || "Шинэ, Шинэхэн, Чанартай Мах"}
                      </h2>
                      <p className="text-md mb-4 max-w-2xl text-white/90">
                        {form.watch("text") || heroSettings?.text || "Монголын хамгийн чанартай, шинэ махыг танд хүргэж байна."}
                      </p>
                      <button
                        className="bg-[#0e5841] text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"
                        disabled
                      >
                        Дэлгэрэнгүй
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}