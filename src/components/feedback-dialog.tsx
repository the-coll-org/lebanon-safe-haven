"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronLeft, ChevronRight, User, Mail } from "lucide-react";

interface FeedbackItem {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  category: string;
  userType: string;
  municipalityName: string | null;
  createdAt: string;
}

interface FeedbackResponse {
  feedback: FeedbackItem[];
  total: number;
  limit: number;
  offset: number;
}

export function FeedbackDialog() {
  const t = useTranslations("admin");
  const tFeedback = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (open) {
      let cancelled = false;
      fetch(`/api/admin/feedback?limit=${limit}&offset=${offset}`)
        .then(async (res) => {
          if (res.ok) {
            const data: FeedbackResponse = await res.json();
            if (!cancelled) {
              setFeedback(data.feedback);
              setTotal(data.total);
            }
          }
        })
        .catch(() => {
          // Silent fail
        });
      return () => { cancelled = true; };
    }
  }, [open, offset]);

  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "bug":
        return "bg-red-100 text-red-800";
      case "feature":
        return "bg-blue-100 text-blue-800";
      case "complaint":
        return "bg-orange-100 text-orange-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <MessageSquare className="h-4 w-4" />
          {t("viewFeedback")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("feedbackTitle")}</DialogTitle>
        </DialogHeader>

        {feedback.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("noFeedback")}</p>
        ) : (
          <>
            <div className="space-y-3">
              {feedback.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(item.category)}>
                          {tFeedback(`categories.${item.category}`)}
                        </Badge>
                        {item.userType === "authenticated" && (
                          <Badge variant="outline">{t("adminUser")}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm mb-3 whitespace-pre-wrap">{item.message}</p>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.name}
                        </span>
                      )}
                      {item.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </span>
                      )}
                      {item.municipalityName && (
                        <span className="flex items-center gap-1">
                          • {item.municipalityName}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                disabled={!hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("prev")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pagination", {
                  start: offset + 1,
                  end: Math.min(offset + limit, total),
                  total,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={!hasNext}
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}