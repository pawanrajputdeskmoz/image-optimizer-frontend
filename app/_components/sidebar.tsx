"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import Image from "next/image";
import { basePath } from "@/app/lib/basePath";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar({
  handleOnChange,
}: {
  handleOnChange?: () => void;
}) {
  const segment = useSelectedLayoutSegment() || "dashboard";
  const [urlDropdownOpen, setUrlDropdownOpen] = useState(false);

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
                    width={40}
                    height={40}
                  />
                </div>
                <div className="menu-hover-logo align-item-center gap-3">
                  <Image
                    src={`${basePath}/images/logo.svg`}
                    alt=""
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
                  <Image
                    src={`${basePath}/images/dashboard-icon.svg`}
                    alt=""
                    width={20}
                    height={20}
                  />
                </div>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            <li>
              <Link
                prefetch={false}
                href="/image-optimizer"
                className={segment == "image-optimizer" ? "active" : ""}
              >
                <div className="nav-icon">
                  <Image
                    src={`${basePath}/images/image-optimizer-icon.svg`}
                    alt=""
                    width={20}
                    height={20}
                  />
                </div>
                <span className="nav-text">Image Optimizer</span>
              </Link>
            </li>


            <li>
              <Link
                prefetch={false}
                href="/setting"
                className={segment == "setting" ? "active" : ""}
              >
                <div className="nav-icon">
                  <Image
                    src={`${basePath}/images/setting-icon.svg`}
                    alt=""
                    width={20}
                    height={20}
                  />
                </div>
                <span className="nav-text">Setting</span>
              </Link>
            </li>


            <li>
              <div className="relative">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setUrlDropdownOpen((v) => !v)}
                  aria-expanded={urlDropdownOpen}
                >
                  <div className="nav-icon">
                    <Image
                      src={`${basePath}/images/url-editor-main-icon.svg`}
                      width={20}
                      height={20}
                      alt=""
                    />
                  </div>
                  <span className="nav-text">404 & URL</span>
                </button>

                {urlDropdownOpen ? (
                  <div className="mt-2 flex flex-col rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
                    <Link
                      href="/404-fixer"
                      className={segment == "404-fixer" ? "active" : ""}
                      onClick={() => setUrlDropdownOpen(false)}
                    >
                      <div className="nav-icon">
                        <Image
                          src={`${basePath}/images/404-fixer-icon.svg`}
                          width={20}
                          height={20}
                          alt=""
                        />
                      </div>
                      <span className="nav-text">404 Fixer</span>
                    </Link>

                    <Link
                      href="/url-editor"
                      className={segment == "url-editor" ? "active" : ""}
                      onClick={() => setUrlDropdownOpen(false)}
                    >
                      <div className="nav-icon">
                        <Image
                          src={`${basePath}/images/url-editor-icon.svg`}
                          width={20}
                          height={20}
                          alt=""
                        />
                      </div>
                      <span className="nav-text">URL Editor</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            </li>



            <li className="nav-separator"></li>

            <li>
              <Link
                prefetch={false}
                href="/upgrade?tab=app"
                className={segment == "upgrade?tab=app" ? "active" : ""}
              >
                <div className="nav-icon">
                  <Image
                    src={`${basePath}/images/upgrade-icon.svg`}
                    alt=""
                    width={20}
                    height={20}
                  />
                </div>
                <span className="nav-text">Upgrade</span>
              </Link>
            </li>

            <li>
              <Link
                prefetch={false}
                href="/upgrade?tab=seoServices"
                className={segment == "upgrade?tab=seoServices" ? "active" : ""}
              >
                <div className="nav-icon">
                  <Image
                    src={`${basePath}/images/seo-services-icon.svg`}
                    alt=""
                    width={20}
                    height={20}
                  />
                </div>
                <span className="nav-text">SEO Services</span>
              </Link>
            </li>

            <li>
              <Link
                prefetch={false}
                href="/help"
                className={segment == "help" ? "active" : ""}
              >
                <div className="nav-icon">
                  <Image
                    src={`${basePath}/images/help-icon.svg`}
                    alt=""
                    width={20}
                    height={20}
                  />
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
