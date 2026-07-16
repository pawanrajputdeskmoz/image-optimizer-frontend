"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ChannelSelect from "@/app/_components/channelList";
import Sidebar from "@/app/_components/sidebar";
import ReduxProvider from "@/app/store/provider";

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <section className="frame-area bg-zinc-50">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-full w-full flex-1 flex-col !p-6">
          <div className="relative z-20 mb-4 flex shrink-0 justify-end">
            <ChannelSelect />
          </div>
          <ReduxProvider>{children}</ReduxProvider>
        </div>
      </div>
    </section>
  );
}
