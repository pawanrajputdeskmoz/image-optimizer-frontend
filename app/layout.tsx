import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./store/provider";
import Sidebar from "./_components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Image Optimizer",
  description: "Image optimizer dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <section className="frame-area bg-zinc-50">
          <div className="flex">
            <Sidebar />
            <div className="min-h-full flex flex-col flex-1 w-full !p-6">
              <ReduxProvider>{children}</ReduxProvider>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
