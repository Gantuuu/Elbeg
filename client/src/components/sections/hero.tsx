import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, Plus, Truck } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { apiRequest } from "@/lib/queryClient";
import { getFullImageUrl } from "@/lib/image-utils";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface HeroSlide {
  title?: string;
  text?: string;
  imageUrl?: string;
}

interface HeroSettings extends HeroSlide {
  slides?: HeroSlide[];
}

const FALLBACK_IMAGES = ["/images/market/beef.jpg", "/images/market/dumplings.jpg", "/images/market/pork.jpg"];
const CONTROLS = {
  mn: { pause: "Автомат солигдолтыг зогсоох", play: "Автомат солигдолтыг эхлүүлэх", all: "Бүх баннерийг харах", title: "Дэлгүүрийн баннерууд", description: "Үзэхийг хүссэн баннераа сонгоорой.", slide: "Баннер" },
  en: { pause: "Pause slideshow", play: "Play slideshow", all: "View all banners", title: "Explore Арвижих", description: "Choose a banner to view.", slide: "Banner" },
  ru: { pause: "Остановить слайд-шоу", play: "Запустить слайд-шоу", all: "Все баннеры", title: "Баннеры Арвижих", description: "Выберите баннер для просмотра.", slide: "Баннер" },
};

function fallbackImage(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = FALLBACK_IMAGES[0];
}

export function Hero() {
  const { t, language } = useLanguage();
  const labels = CONTROLS[language];
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [isPlaying, setIsPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [hovered, setHovered] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { data: heroData } = useQuery<HeroSettings>({
    queryKey: ["/api/settings/hero"],
    queryFn: () => apiRequest("GET", "/api/settings/hero"),
    staleTime: 60000,
  });
  const slides = useMemo<HeroSlide[]>(() => {
    if (Array.isArray(heroData?.slides) && heroData.slides.length) return heroData.slides;
    if (heroData?.title || heroData?.text || heroData?.imageUrl) return [heroData];
    return [
      { title: t.heroTitle, text: t.heroSubtitle, imageUrl: FALLBACK_IMAGES[0] },
      { title: t.categories.other, text: t.featuredProductsDesc, imageUrl: FALLBACK_IMAGES[1] },
      { title: t.categories.pork, text: t.heroSubtitle, imageUrl: FALLBACK_IMAGES[2] },
    ];
  }, [heroData, t]);
  const hasMultipleSlides = slides.length > 1;
  const autoplayActive = isPlaying && pageVisible && !hovered && !galleryOpen;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    const stopOnDrag = () => setIsPlaying(false);
    onSelect();
    api.on("select", onSelect).on("reInit", onSelect).on("pointerDown", stopOnDrag);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect).off("pointerDown", stopOnDrag);
    };
  }, [api]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      setReducedMotion(media.matches);
      if (media.matches) setIsPlaying(false);
    };
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    media.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      media.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!api || !hasMultipleSlides || !autoplayActive) return;
    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext(reducedMotion);
      else api.scrollTo(0, reducedMotion);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [api, hasMultipleSlides, autoplayActive, reducedMotion, current]);

  return (
    <section className="market-hero" aria-label={t.heroTitle}>
      <div className="delivery-ribbon">
        <Truck size={15} className="delivery-ribbon-icon" aria-hidden="true" />
        <p className="sr-only">{t.delivery.scrolling.split("●")[0].trim()}</p>
        <div className="delivery-ribbon-window" aria-hidden="true">
          <div className="delivery-ribbon-track">
            {[0, 1].map((copy) => (
              <span className="delivery-ribbon-message" key={copy}>
                {t.delivery.scrolling} ● {t.delivery.scrolling} ●
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-stage" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={(event) => {
          // Keyboard focus stops rotation until the visitor explicitly resumes it.
          if (!(event.target as HTMLElement).closest("[data-hero-playback]")) setIsPlaying(false);
        }}
        onKeyDownCapture={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") setIsPlaying(false);
        }}>
        <Carousel setApi={setApi} opts={{ align: "center", loop: hasMultipleSlides, containScroll: false, duration: reducedMotion ? 0 : 25 }} className="hero-carousel" tabIndex={0} aria-label={t.heroTitle}>
          <CarouselContent className="hero-track" aria-live={autoplayActive ? "off" : "polite"}>
            {slides.map((slide, index) => (
              <CarouselItem key={`${index}-${slide.imageUrl}`} className="hero-slide" aria-label={`${labels.slide} ${index + 1} / ${slides.length}`} aria-hidden={index !== current}>
                <a href="#products" className="hero-card" tabIndex={index === current ? 0 : -1}>
                  <img src={slide.imageUrl ? getFullImageUrl(slide.imageUrl) : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt="" className="hero-card-image" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} onError={fallbackImage} />
                  <div className="hero-card-shade" aria-hidden="true" />
                  <div className="hero-card-copy">
                    <span className="hero-card-badge">АРВИЖИХ МАХНЫ ДЭЛГҮҮР</span>
                    {index === 0 ? <h1>{slide.title || t.heroTitle}</h1> : <h2>{slide.title || t.heroTitle}</h2>}
                    {slide.text && <p>{slide.text}</p>}
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>

          {hasMultipleSlides && <div className="hero-controls">
            <button type="button" className="hero-control-button" data-hero-playback aria-label={isPlaying ? labels.pause : labels.play} aria-pressed={isPlaying} onClick={() => setIsPlaying((playing) => !playing)}>
              <span className="hero-control-disc">{isPlaying ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}</span>
            </button>
            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
              <DialogTrigger asChild>
                <button type="button" className="hero-control-button" aria-label={`${labels.all} (${current + 1} / ${slides.length})`}>
                  <span className="hero-counter" aria-hidden="true">{current + 1}<span className="hero-counter-total"> / {slides.length}</span><Plus size={12} /></span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-2xl">
                <DialogHeader className="pr-6"><DialogTitle>{labels.title}</DialogTitle><DialogDescription>{labels.description}</DialogDescription></DialogHeader>
                <div className="hero-gallery">
                  {slides.map((slide, index) => <button key={index} type="button" className="hero-gallery-item" aria-label={`${labels.slide} ${index + 1}: ${slide.title || t.heroTitle}`} aria-current={index === current ? "true" : undefined} onClick={() => {
                    api?.scrollTo(index, reducedMotion);
                    setIsPlaying(false);
                    setGalleryOpen(false);
                  }}>
                    <img src={slide.imageUrl ? getFullImageUrl(slide.imageUrl) : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt="" loading="lazy" onError={fallbackImage} />
                    <span><small>{String(index + 1).padStart(2, "0")}</small>{slide.title || t.heroTitle}</span>
                  </button>)}
                </div>
              </DialogContent>
            </Dialog>
          </div>}
        </Carousel>
      </div>
    </section>
  );
}
