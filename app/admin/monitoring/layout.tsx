"use client";

import type { ReactNode } from "react";
import { getAdminToken } from "@/app/admin/_lib/adminApi";
import { AdminShell } from "@/app/admin/_components/adminUi";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminMonitoringLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/monitoring/login";
  const [ready, setReady] = useState(isLogin);

  useEffect(() => {
    if (isLogin) return;
    if (!getAdminToken()) {
      router.replace("/admin/monitoring/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auth gate after client-side token check
    setReady(true);
  }, [isLogin, router]);

  if (!ready) return null;
  if (isLogin) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
