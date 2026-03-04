import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function UsersLayout({
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

  // Only superadmins can access user management
  if (session.role !== "superadmin") {
    redirect(`/${locale}/admin/dashboard`);
  }

  return <>{children}</>;
}
