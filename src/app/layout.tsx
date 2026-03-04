import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Safe Haven | ملاذ آمن",
  description:
    "Connecting displaced people with available shelter. نربط النازحين بأماكن الإيواء المتاحة.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoArabic.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
