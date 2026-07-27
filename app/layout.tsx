import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import AppChrome from "./_components/appChrome";
import AppToaster from "./_components/app-toaster";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Image Optimizer",
  description: "Image optimizer dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppToaster />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
