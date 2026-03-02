"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { AdminBadge } from "./admin-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Heart } from "lucide-react";
import { useState } from "react";

export function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/listings" as const, label: t("listings") },
    { href: "/offer" as const, label: t("offer") },
    { href: "/hotlines" as const, label: t("hotlines") },
    { href: "/resources" as const, label: t("resources") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span>{tc("appName")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <AdminBadge />
          <LanguageSwitcher />
        </nav>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-2">
          <AdminBadge />
          <LanguageSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === "ar" ? "right" : "left"}>
              <SheetTitle className="text-start mb-4">
                {tc("appName")}
              </SheetTitle>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
