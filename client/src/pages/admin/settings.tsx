import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/header';
import { AdminLayout } from '@/components/admin/layout';
import { HelpTooltip } from '@/components/admin/help-tooltip';
import { helpIllustrations } from '@/assets/help/index';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define our validation schema
const shippingFeeSchema = z.object({
  value: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Тоо оруулна уу",
    })
    .refine(val => Number(val) >= 0, {
      message: "Хүргэлтийн төлбөр 0-с их байх ёстой",
    }),
});

type ShippingFeeFormValues = z.infer<typeof shippingFeeSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch the current shipping fee
  const { data: shippingFeeData, isLoading } = useQuery({
    queryKey: ['/api/settings/shipping-fee'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings/shipping-fee');
      return response as { value: string };
    }
  });
  
  // Set up the form with react-hook-form
  const form = useForm<ShippingFeeFormValues>({
    resolver: zodResolver(shippingFeeSchema),
    defaultValues: {
      value: "",
    },
    values: {
      value: shippingFeeData?.value || "",
    },
  });
  
  // Update shipping fee mutation
  const { mutate: updateShippingFee, isPending } = useMutation({
    mutationFn: async (data: ShippingFeeFormValues) => {
      return apiRequest('PUT', '/api/settings/shipping-fee', data);
    },
    onSuccess: () => {
      toast({
        title: "Хүргэлтийн төлбөр шинэчлэгдлээ",
        description: "Шинэ хүргэлтийн төлбөрийн мэдээлэл хадгалагдлаа.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/shipping-fee'] });
    },
    onError: () => {
      toast({
        title: "Хүргэлтийн төлбөрийг шинэчлэхэд алдаа гарлаа",
        description: "Дахин оролдоно уу.",
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: ShippingFeeFormValues) {
    updateShippingFee(data);
  }
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <AdminHeader title="Системийн тохиргоо" />
          <HelpTooltip
            content={
              <div className="space-y-4">
                <p>
                  Энэ хэсэгт та веб дэлгүүрийн ерөнхий тохиргоог хийх боломжтой.
                </p>
                <p>
                  <strong>Хүргэлтийн төлбөр:</strong> Энэ тохиргоо нь захиалга хийх үед нэмэгдэх хүргэлтийн төлбөрийг тохируулна.
                </p>
              </div>
            }
            illustration={helpIllustrations.categoryManagement}
          />
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Хүргэлтийн төлбөрийн тохиргоо</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              Захиалга хийх үед автоматаар нэмэгдэх хүргэлтийн төлбөрийг тохируулна.
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Хүргэлтийн төлбөр (₩)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="100" />
                        </FormControl>
                        <div className="text-sm text-gray-500 mt-1">
                          Одоогийн хүргэлтийн төлбөр: {shippingFeeData ? formatPrice(Number(shippingFeeData.value)) : "Тохируулаагүй"}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Хадгалж байна...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Хадгалах
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}