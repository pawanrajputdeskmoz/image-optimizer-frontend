"use client";

import Link from "next/link";

export default function UpgradeButton() {
  return (
    <Link href="/upgrade" className="headBtn-link">
      <button type="button" className="custom-btn">
        Upgrade
      </button>
    </Link>
  );
}
