"use client";

import { SignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const t = useTranslations("admin");

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SignIn 
            routing="hash"
            signUpUrl="/admin/login"
            fallbackRedirectUrl="/admin/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                formFieldInput: "border-input",
                formFieldLabel: "text-sm font-medium",
                footerActionLink: "text-primary hover:text-primary/90",
                socialButtonsBlockButton: "border-input hover:bg-accent",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
