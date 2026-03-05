import { redirect } from "next/navigation";
import { getSession, syncUserWithDatabase } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // getSession already calls auth() internally — one Clerk call
  let session = await getSession();

  if (!session) {
    // User authenticated with Clerk but not yet in our DB — try sync
    session = await syncUserWithDatabase();

    if (!session) {
      redirect(`/${locale}/admin/login`);
    }
  }

  return <>{children}</>;
}
