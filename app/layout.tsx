import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChannelSelect from "./_components/channelList";
import ReduxProvider from "./store/provider";
import Sidebar from "./_components/sidebar";
import AppToaster from "./_components/app-toaster";

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
        <AppToaster />
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
      </body>
    </html>
  );
}
