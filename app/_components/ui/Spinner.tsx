"use client";

export default function Spinner({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const border = size === "sm" ? "border-2" : "border-4";

  return (
    <span
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-zinc-300 border-t-zinc-900 ${dim} ${border}`}
    />
  );
}

