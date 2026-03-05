import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LocaleProvider } from "@/components/locale-provider";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = routing.locales.includes(rawLocale as "ar" | "en")
    ? rawLocale
    : routing.defaultLocale;

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <ClerkProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LocaleProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position={locale === "ar" ? "bottom-left" : "bottom-right"} />
        </LocaleProvider>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}
