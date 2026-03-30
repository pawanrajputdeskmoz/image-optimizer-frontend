"use client";

import Link from "next/link";

export default function Hamburger() {
  return (
    <Link href="/dashboard" className="small text-decoration-none">
      Dashboard
    </Link>
  );
}
