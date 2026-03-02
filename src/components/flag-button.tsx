"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";

interface FlagButtonProps {
  listingId: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "default" | "icon";
}

export function FlagButton({
  listingId,
  variant = "ghost",
  size = "sm",
}: FlagButtonProps) {
  const tc = useTranslations("common");
  const tf = useTranslations("flag");

  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitted, setFlagSubmitted] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleFlag() {
    await fetch(`/api/listings/${listingId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: flagReason || null }),
    });
    setFlagSubmitted(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="gap-1 text-muted-foreground"
        >
          <Flag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tc("flag")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tf("title")}</DialogTitle>
        </DialogHeader>
        {flagSubmitted ? (
          <p className="text-sm text-muted-foreground py-4">{tf("success")}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{tf("reason")}</Label>
              <Textarea
                placeholder={tf("reasonPlaceholder")}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleFlag} className="w-full">
              {tf("submit")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
