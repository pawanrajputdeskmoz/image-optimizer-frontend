"use client";

type HowitworkProps = {
  page?: string;
};

export default function Howitwork({ page }: HowitworkProps) {
  return (
    <span
      className="ms-2 cursor-help text-zinc-500 text-xs"
      title={`Help: ${page ?? "this page"}`}
    >
      (?)
    </span>
  );
}
