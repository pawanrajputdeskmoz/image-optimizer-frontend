"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./store/provider";
import Sidebar from "./_components/sidebar";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeClass, setActiveClass] = useState(true);
  return (
    <>

      <section className={`frame-area bg-zinc-50 ${activeClass ? "activeNav" : ""}`}>
        <div className="flex">
          <Sidebar handleOnChange={() => setActiveClass(!activeClass)} />
          <div className="min-h-full flex flex-col flex-1 w-full !p-6">
            <ReduxProvider>{children}</ReduxProvider>
          </div>
        </div>

      </section>
    </>
  );
}
