import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSession, syncUserWithDatabase } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    redirect(`/${locale}/admin/login`);
  }

  // Check if user exists in our database and sync if needed
  let session = await getSession();
  
  if (!session) {
    // Try to sync user with database
    session = await syncUserWithDatabase();
    
    if (!session) {
      // User is authenticated with Clerk but not in our database
      // and not whitelisted
      redirect(`/${locale}/admin/login`);
    }
  }

  return <>{children}</>;
}
