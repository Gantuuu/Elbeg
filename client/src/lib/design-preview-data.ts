import type { Product } from "@shared/schema";

export const previewCategories = ["Үхрийн мах", "Хонины мах", "Гахайн мах", "Тахианы мах", "Бусад хүнс"].map((name, index) => ({ id: -(index + 1), name, isActive: true, order: index }));

const items = [
  { name: "Үхрийн хавирга", category: "Үхрийн мах", price: 19000, image: "beef", description: "1 кг · Хөргөсөн" },
  { name: "Хонины ястай мах", category: "Хонины мах", price: 17000, image: "lamb", description: "1 кг · Ястай" },
  { name: "Гахайн гурван давхар мах", category: "Гахайн мах", price: 15000, image: "pork", description: "1 кг · Хөргөсөн" },
  { name: "Гэрийн бууз", category: "Бусад хүнс", price: 22000, image: "dumplings", description: "1 кг · Хөлдөөсөн" },
  { name: "Бүтэн тахиа", category: "Тахианы мах", price: 12000, image: "chicken", description: "1 ширхэг · Хөргөсөн" },
  { name: "Үхрийн стейк", category: "Үхрийн мах", price: 24000, image: "steak", description: "500 гр · Стейк" },
  { name: "Үхрийн цул мах", category: "Үхрийн мах", price: 18000, image: "beef", description: "1 кг · Ясгүй" },
  { name: "Гахайн махны багц", category: "Гахайн мах", price: 28000, image: "pork", description: "2 кг · Гэр бүлийн багц" },
];

export const previewProducts: Product[] = items.map((item, index) => ({
  id: -(1001 + index),
  name: item.name,
  nameEn: null,
  nameRu: null,
  description: item.description,
  descriptionEn: null,
  descriptionRu: null,
  category: item.category,
  price: item.price,
  imageUrl: `/images/market/${item.image}.jpg`,
  thumbnailUrl: null,
  stock: 20,
  minOrderQuantity: 1,
  storeId: null,
  createdAt: null,
}));
