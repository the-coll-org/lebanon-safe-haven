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
import { Menu, Shield } from "lucide-react";
import { useState } from "react";

export function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/listings" as const, label: t("listings") },
    { href: "/map" as const, label: t("map") },
    { href: "/offer" as const, label: t("offer") },
    { href: "/news" as const, label: t("news") },
    { href: "/hotlines" as const, label: t("hotlines") },
    { href: "/resources" as const, label: t("resources") },
    { href: "/feedback" as const, label: t("feedback") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground border-b border-secondary/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-base tracking-widest uppercase text-white"
        >
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <span>{tc("appName")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-primary hover:bg-white/10 text-xs tracking-wide uppercase font-medium rounded-none"
              asChild
            >
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
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={locale === "ar" ? "right" : "left"}
              className="bg-secondary text-white border-secondary/80"
            >
              <SheetTitle className="text-start mt-4 mb-6 px-4 text-white uppercase tracking-widest text-sm font-bold">
                {tc("appName")}
              </SheetTitle>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="justify-start text-white/80 hover:text-primary hover:bg-white/10 uppercase text-xs tracking-wide font-medium rounded-none"
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
