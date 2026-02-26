import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/header';
import { AdminLayout } from '@/components/admin/layout';
import { HelpTooltip } from '@/components/admin/help-tooltip';
import { helpIllustrations } from '@/assets/help/index';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define our validation schema
const ruleSchema = z.object({
  min: z.coerce.number().min(0, { message: "0-с их байх ёстой" }),
  max: z.coerce.number().min(0, { message: "0-с их байх ёстой" }),
  fee: z.coerce.number().min(0, { message: "0-с их байх ёстой" }),
});

const shippingRulesSchema = z.object({
  rules: z.array(ruleSchema)
});

type ShippingRulesFormValues = z.infer<typeof shippingRulesSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the current shipping rules
  const { data: shippingRulesData, isLoading } = useQuery({
    queryKey: ['/api/settings/shipping-fee'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings/shipping-fee');
      try {
        if (response && response.value) {
          return JSON.parse(response.value) as { min: number, max: number, fee: number }[];
        }
      } catch (e) {
        console.error("Failed to parse shipping rules", e);
      }
      return [];
    }
  });

  // Set up the form with react-hook-form
  const form = useForm<ShippingRulesFormValues>({
    resolver: zodResolver(shippingRulesSchema),
    defaultValues: {
      rules: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules"
  });

  // Update form when data loads
  useEffect(() => {
    if (shippingRulesData && shippingRulesData.length > 0) {
      form.reset({ rules: shippingRulesData });
    } else if (shippingRulesData && shippingRulesData.length === 0 && fields.length === 0) {
      form.reset({ rules: [{ min: 0, max: 4, fee: 5700 }] });
    }
  }, [shippingRulesData, form, fields.length]);

  // Update shipping rules mutation
  const { mutate: updateShippingRules, isPending } = useMutation({
    mutationFn: async (data: ShippingRulesFormValues) => {
      return apiRequest('PUT', '/api/settings/shipping-fee', { value: JSON.stringify(data.rules) });
    },
    onSuccess: () => {
      toast({
        title: "Хүргэлтийн дүрэм шинэчлэгдлээ",
        description: "Шинэ хүргэлтийн жингийн интервалууд хадгалагдлаа.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/shipping-fee'] });
    },
    onError: () => {
      toast({
        title: "Хүргэлтийн дүрмийг шинэчлэхэд алдаа гарлаа",
        description: "Дахин оролдоно уу.",
        variant: "destructive",
      });
    }
  });

  function onSubmit(data: ShippingRulesFormValues) {
    updateShippingRules(data);
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
                  <strong>Хүргэлтийн төлбөр:</strong> Энэ тохиргоо нь захиалга хийх үед нийт жингээс хамаарч бодогдох хүргэлтийн төлбөрийг тохируулна.
                </p>
              </div>
            }
            illustration={helpIllustrations.categoryManagement}
          />
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Хүргэлтийн төлбөрийн тохиргоо (Жингийн хамаарал)</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              Захиалга хийх үед барааны нийт жингээс хамаарч автоматаар нэмэгдэх хүргэлтийн төлбөрийг тохируулна. Хэрэв сагсан дахь нийт жин интервалд багтахгүй бол хамгийн дээд интервалын төлбөрийг авах болно.
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ min: 0, max: 0, fee: 0 })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Интервал нэмэх
                      </Button>
                    </div>

                    {fields.length === 0 && (
                      <div className="text-center py-4 text-gray-500 border rounded-md">
                        Жингийн интервал тохируулаагүй байна.
                      </div>
                    )}

                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative bg-gray-50/50">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`rules.${index}.min`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Доод жин (кг)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="0.1" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`rules.${index}.max`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Дээд жин (кг)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="0.1" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`rules.${index}.fee`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Төлбөр (₩)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="10" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 mb-0.5"
                          title="Устгах"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

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