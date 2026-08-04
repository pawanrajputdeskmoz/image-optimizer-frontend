"use client";

import ImageOptimizerAppHeader from "@/app/_components/imageOptimizerAppHeader";
import { BookOpen, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

const FAQ_ITEMS = [
  {
    question: "How do I optimize product images?",
    answer:
      "Open the Dashboard, select products or images, then run Optimize. You can preview compression and alt-text changes before applying them to your store.",
  },
  {
    question: "Where do I change filename and alt text rules?",
    answer:
      "Go to Settings to configure filename templates, alt text patterns, compression quality, and optimization mode for your store.",
  },
  {
    question: "What happens when I reach my monthly quota?",
    answer:
      "Optimization pauses once your plan limit is reached. Upgrade your plan from the Upgrade page to continue optimizing images for the month.",
  },
  {
    question: "Can I restore original images?",
    answer:
      "Yes. From the Dashboard you can restore previously optimized images back to their original versions when originals are still available.",
  },
] as const;

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <ImageOptimizerAppHeader
        title="Help"
        subtitle="Guides, FAQs, and support for Image Optimizer."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
            <BookOpen className="h-5 w-5 text-sky-700" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Getting started</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Optimize store images from the Dashboard, then fine-tune filename and alt
            text rules in Settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Dashboard
            </Link>
            <Link
              href="/setting"
              className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Open Settings
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <LifeBuoy className="h-5 w-5 text-emerald-700" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Need more help?</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Email our team and we will help with setup, plans, or optimization issues.
          </p>
          <a
            href="mailto:support@seokart.com"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Mail className="h-4 w-4" />
            support@seokart.com
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-zinc-700" />
          <h2 className="text-base font-semibold text-zinc-900">Frequently asked questions</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {FAQ_ITEMS.map((item) => (
            <li key={item.question} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-semibold text-zinc-900">{item.question}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.answer}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
