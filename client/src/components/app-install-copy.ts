import type { Language } from "@/contexts/language-context";

interface InstallCopy {
  caption: string;
  headline: string;
  action: string;
  close: string;
  title: string;
  description: string;
  done: string;
  install: string;
  installing: string;
  embedded: string;
  openChrome: string;
  copyLink: string;
  copied: string;
  copyFailed: string;
  linkLabel: string;
  iosNote: string;
  ios: string[];
  android: string[];
  macos: string[];
  desktop: string[];
}

export const installCopy: Record<Language, InstallCopy> = {
  mn: {
    caption: "Нүүр дэлгэцэнд нэмбэл",
    headline: "Апп шиг нээгдэнэ",
    action: "Суулгах",
    close: "Суулгах саналыг хаах",
    title: "Арвижих дэлгүүрийг нүүр дэлгэцэнд нэмэх",
    description: "Дэлгүүрээ нүүр дэлгэцээсээ нэг товшилтоор нээгээрэй.",
    done: "Ойлголоо",
    install: "Апп суулгах",
    installing: "Түр хүлээнэ үү…",
    embedded: "Facebook, Instagram зэрэг аппын хөтчөөс үзэж байгаа бол эхлээд энэ хуудсыг Safari эсвэл Chrome-оор нээгээрэй.",
    openChrome: "Chrome-оор нээх",
    copyLink: "Хуулах",
    copied: "Хуулагдлаа",
    copyFailed: "Холбоосыг удаан дарж сонгоод хуулаарай.",
    linkLabel: "Дэлгүүрийн холбоос",
    iosNote: "iPhone / iPad дээр суулгахын тулд Safari-ийн Хуваалцах цэснээс нүүр дэлгэцэнд нэмнэ.",
    ios: [
      "Энэ хуудсыг Safari хөтчөөр нээгээд Хуваалцах (Share) товчийг дарна.",
      "Нүүр дэлгэцэнд нэмэх (Add to Home Screen)-ийг сонгоно. Open as Web App сонголт байвал асаана.",
      "Нэмэх (Add)-ийг дарна. Нүүр дэлгэц дээрх Арвижих дүрсээс дэлгүүрээ нээгээрэй.",
    ],
    android: [
      "Chrome хөтчийн баруун дээд талын ⋮ цэсийг нээнэ.",
      "Апп суулгах (Install app) эсвэл Нүүр дэлгэцэнд нэмэх (Add to Home screen)-ийг сонгоно.",
      "Суулгах / Нэмэх товчийг дарж баталгаажуулна. Цэс харагдахгүй бол хуудсыг Chrome-оор нээгээрэй.",
    ],
    macos: [
      "Энэ хуудсыг Safari хөтчөөр нээнэ.",
      "Файл (File) цэснээс Докт нэмэх (Add to Dock)-ийг сонгоно.",
      "Нэмэх (Add)-ийг дарна. Арвижих дэлгүүрийг Dock дахь дүрсээс нээнэ.",
    ],
    desktop: [
      "Энэ хуудсыг Google Chrome эсвэл Microsoft Edge хөтчөөр нээнэ.",
      "Хаягийн мөр дэх суулгах дүрс, эсвэл хөтчийн цэсний Install / Apps хэсгийг сонгоно.",
      "Суулгах (Install)-ийг дарна. Дараа нь Арвижих дэлгүүрийг компьютерийнхээ аппын цэснээс нээнэ.",
    ],
  },
  en: {
    caption: "Add to your home screen",
    headline: "Open Арвижих like an app",
    action: "Install app",
    close: "Dismiss install suggestion",
    title: "Add Арвижих to your home screen",
    description: "Open your store with one tap from your home screen.",
    done: "Got it",
    install: "Install app",
    installing: "Please wait…",
    embedded: "Browsing inside Facebook, Instagram or another app? Open this page in Safari or Chrome first.",
    openChrome: "Open in Chrome",
    copyLink: "Copy",
    copied: "Copied",
    copyFailed: "Select and copy the address below.",
    linkLabel: "Store link",
    iosNote: "On iPhone / iPad, use Safari’s Share menu to add the app to your home screen.",
    ios: [
      "Open this page in Safari and tap Share.",
      "Choose Add to Home Screen. Enable Open as Web App if shown.",
      "Tap Add, then open the store using the Арвижих icon on your home screen.",
    ],
    android: [
      "Open the ⋮ menu at the top right of Chrome.",
      "Choose Install app or Add to Home screen.",
      "Confirm with Install / Add. If the option is missing, open this page in Chrome.",
    ],
    macos: [
      "Open this page in Safari.",
      "Choose File, then Add to Dock.",
      "Select Add, then launch Арвижих from its Dock icon.",
    ],
    desktop: [
      "Open this page in Google Chrome or Microsoft Edge.",
      "Use the install icon in the address bar or the Install / Apps option in the browser menu.",
      "Select Install, then launch Арвижих from your computer’s app menu.",
    ],
  },
  ru: {
    caption: "Добавьте на главный экран",
    headline: "Открывайте как приложение",
    action: "Установить",
    close: "Скрыть предложение установки",
    title: "Добавьте Арвижих на главный экран",
    description: "Открывайте магазин одним нажатием на главном экране.",
    done: "Понятно",
    install: "Установить",
    installing: "Подождите…",
    embedded: "Если страница открыта внутри Facebook, Instagram или другого приложения, сначала откройте её в Safari или Chrome.",
    openChrome: "Открыть в Chrome",
    copyLink: "Копировать",
    copied: "Скопировано",
    copyFailed: "Выделите и скопируйте адрес ниже.",
    linkLabel: "Ссылка на магазин",
    iosNote: "На iPhone / iPad добавьте приложение на главный экран через меню «Поделиться» в Safari.",
    ios: [
      "Откройте эту страницу в Safari и нажмите «Поделиться» (Share).",
      "Выберите «На экран Домой» (Add to Home Screen). Включите Open as Web App, если этот пункт доступен.",
      "Нажмите «Добавить» (Add). Открывайте магазин через значок Арвижих на главном экране.",
    ],
    android: [
      "Откройте меню ⋮ в правом верхнем углу Chrome.",
      "Выберите «Установить приложение» (Install app) или «Добавить на главный экран» (Add to Home screen).",
      "Нажмите «Установить» / «Добавить». Если пункта нет, откройте страницу в Chrome.",
    ],
    macos: [
      "Откройте эту страницу в Safari.",
      "Выберите «Файл» (File), затем «Добавить в Dock» (Add to Dock).",
      "Нажмите «Добавить» (Add), затем запускайте Арвижих через значок в Dock.",
    ],
    desktop: [
      "Откройте эту страницу в Google Chrome или Microsoft Edge.",
      "Нажмите значок установки в адресной строке или выберите Install / Apps в меню браузера.",
      "Нажмите «Установить» (Install), затем запускайте Арвижих из меню приложений компьютера.",
    ],
  },
};
