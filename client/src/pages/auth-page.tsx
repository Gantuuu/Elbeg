import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useLanguage } from "@/contexts/language-context";
import { HERO_BACKGROUND } from "@/lib/constants";

export default function AuthPage() {
  const { user, googleLogin } = useAuth();
  const { t } = useLanguage();

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${HERO_BACKGROUND})`
        }}
      >
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#9b1f24]">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-[#9b1f24]">{t.authHeroTitle}</CardTitle>
            <CardDescription className="text-base">
              {t.authHeroDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 pb-8">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 py-7 text-lg hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-[#9b1f24]/30"
                onClick={async () => {
                  await googleLogin();
                }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-gray-700 font-semibold">{t.continueWithGoogle}</span>
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-100 italic text-center">
              <p className="text-sm text-gray-500">
                {t.fastPayment}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}