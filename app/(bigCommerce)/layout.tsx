import type { ReactNode } from "react";

export default function BigCommerceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
