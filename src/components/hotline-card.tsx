"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import type { RegionHotline } from "@/types";

interface HotlineCardProps {
  hotline: RegionHotline;
  locale: string;
}

export function HotlineCard({ hotline, locale }: HotlineCardProps) {

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3">
          {locale === "ar" ? hotline.nameAr : hotline.nameEn}
        </h3>
        <div className="flex flex-col gap-2">
          {hotline.numbers.map((num) => (
            <Button
              key={num.number}
              variant="outline"
              className="gap-2 justify-start h-auto py-3"
              asChild
            >
              <a href={`tel:${num.number.replace(/[\s]/g, "")}`}>
                <Phone className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-base font-mono" dir="ltr">
                  {num.number}
                </span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
