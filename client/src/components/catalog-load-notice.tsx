import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

const messages = {
  mn: {
    saved: "Өмнөх барааны жагсаалтыг харуулж байна. Үнэ, үлдэгдлийг шалгахын тулд дахин ачаална уу.",
    unavailable: "Барааны жагсаалтыг ачаалж чадсангүй.",
    retry: "Дахин оролдох",
  },
  ru: {
    saved: "Показан сохранённый каталог. Обновите его, чтобы проверить цены и наличие.",
    unavailable: "Не удалось загрузить каталог.",
    retry: "Повторить",
  },
  en: {
    saved: "Showing a saved catalog. Refresh to check current prices and availability.",
    unavailable: "The catalog could not be loaded.",
    retry: "Try again",
  },
};

export function CatalogLoadNotice({ saved, fetching, onRetry }: {
  saved: boolean; fetching: boolean; onRetry: () => void;
}) {
  const { language } = useLanguage();
  const copy = messages[language];
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
      <span>{saved ? copy.saved : copy.unavailable}</span>
      <Button variant="outline" size="sm" disabled={fetching} onClick={onRetry}>{copy.retry}</Button>
    </div>
  );
}
