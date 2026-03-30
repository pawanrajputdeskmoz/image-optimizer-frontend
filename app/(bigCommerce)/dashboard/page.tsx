"use client";

import InfoCard from "./_components/infoCard";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard data={{ title: "Total Product", value: 10 }} />
        <InfoCard data={{ title: "Total Client", value: 14 }} />
        <InfoCard data={{ title: "Total Category", value: 7 }} />
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="text-lg font-semibold cursor-pointer"
          onClick={() => router.push("/image-optimizer")}
        >
          image optimizer
        </button>
      </div>
    </div>
  );
}