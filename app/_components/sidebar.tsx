"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { basePath } from "@/app/lib/basePath";
import Link from "next/link";
import { type ComponentType } from "react";
import {
  LayoutDashboard,
  Settings,
  BadgeDollarSign,
  HelpCircle,
} from "lucide-react";

function SidebarIcon({
  icon: Icon,
}: {
  icon: ComponentType<{ className?: string }>;
}) {
  return <Icon className="h-5 w-5 text-zinc-700" />;
}

export default function Sidebar({
  handleOnChange,
}: {
  handleOnChange?: () => void;
}) {
  const pathname = usePathname();
  const segment = pathname?.split("/").filter(Boolean)[0] ?? "";

  return (
    <>
      <div className="sidebar">
        <nav className="custom-navbar">
          <ul>
            <li className="nav-logo">
              <a href="#">
                <div className="logo-icon">
                  <Image
                    src={`${basePath}/images/logo-icon.svg`}
                    alt=""
                    width={34}
                    height={34}
                  />
                </div>
                <div className="menu-hover-logo align-item-center gap-3">
                  <Image
                    src={`${basePath}/images/logo.svg`}
                    alt="Image Optimizer"
                    width={155}
                    height={34}
                  />
                  <button type="button" onClick={() => handleOnChange?.()}>
                    <Image
                      src={`${basePath}/images/menu-icon.svg`}
                      alt=""
                      width={20}
                      height={18}
                    />
                  </button>
                </div>
              </a>
            </li>

            <li>
              <Link
                prefetch={false}
                href="/dashboard"
                className={segment == "dashboard" ? "active" : ""}
              >
                <div className="nav-icon">
                  <SidebarIcon icon={LayoutDashboard} />
                </div>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            <li>
              <Link
                prefetch={false}
                href="/setting"
                className={segment == "setting" ? "active" : ""}
              >
                <div className="nav-icon">
                  <SidebarIcon icon={Settings} />
                </div>
                <span className="nav-text">Setting</span>
              </Link>
            </li>

            <li className="nav-separator"></li>

            <li>
              <Link
                prefetch={false}
                href="/upgrade"
                className={segment === "upgrade" ? "active" : ""}
              >
                <div className="nav-icon">
                  <SidebarIcon icon={BadgeDollarSign} />
                </div>
                <span className="nav-text">Upgrade</span>
              </Link>
            </li>

            <li>
              <Link
                prefetch={false}
                href="/help"
                className={segment == "help" ? "active" : ""}
              >
                <div className="nav-icon">
                  <SidebarIcon icon={HelpCircle} />
                </div>
                <span className="nav-text">Help</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
