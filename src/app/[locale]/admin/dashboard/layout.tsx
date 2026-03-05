import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSession, syncUserWithDatabase } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check Clerk auth first
  const { userId } = await auth();
  if (!userId) {
    redirect(`/${locale}/admin/login`);
  }

  // Try to find existing session, then sync if needed
  let session = await getSession();

  if (!session) {
    session = await syncUserWithDatabase();
  }

  if (!session) {
    // User is authenticated with Clerk but not authorized as admin
    const t = await getTranslations("admin");
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold">{t("accessDenied")}</h1>
          <p className="text-muted-foreground">{t("notWhitelisted")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
