import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getSession();
  const { locale } = await params;

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return <>{children}</>;
}
