"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/_components/sidebar";
import ReduxProvider from "@/app/store/provider";

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <section className="frame-area bg-[#F1F1F1]">
      <div className="flex">
        <Sidebar />
        <div className="frame-main flex-1">
          <ReduxProvider>{children}</ReduxProvider>
        </div>
      </div>
    </section>
  );
}
