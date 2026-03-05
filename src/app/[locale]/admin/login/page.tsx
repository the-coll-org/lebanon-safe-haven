"use client";

import { SignIn } from "@clerk/nextjs";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8">
      <SignIn
        routing="hash"
        signUpUrl="/admin/login"
        fallbackRedirectUrl="/admin/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm mx-auto",
            cardBox: "w-full shadow-md rounded-xl",
            formButtonPrimary:
              "bg-primary text-primary-foreground hover:bg-primary/90",
            socialButtonsBlockButton:
              "border-input hover:bg-accent",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
            footerAction: "hidden",
          },
        }}
      />
    </div>
  );
}
