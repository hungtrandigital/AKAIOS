"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { translatedPath } from "@/lib/i18n";
import { Brand } from "./Brand";

const navigation = {
  vi: {
    groups: [
      {
        label: "Dịch vụ",
        description: "Theo hình thức triển khai",
        prefix: "/dich-vu",
        items: [
          { href: "/dich-vu/ve-sinh-thuong-xuyen", label: "Vệ sinh thường xuyên" },
          { href: "/dich-vu/ve-sinh-dinh-ky", label: "Vệ sinh định kỳ" },
          { href: "/dich-vu/tong-ve-sinh", label: "Tổng vệ sinh" },
        ],
      },
      {
        label: "Giải pháp",
        description: "Theo loại không gian",
        prefix: "/giai-phap",
        items: [
          { href: "/giai-phap/ve-sinh-chung-cu", label: "Tòa nhà & chung cư" },
          { href: "/giai-phap/ve-sinh-nha-xuong-khu-cong-nghiep", label: "Nhà xưởng & khu công nghiệp" },
          { href: "/giai-phap/ve-sinh-can-ho", label: "Căn hộ" },
        ],
      },
    ],
    links: [
      { href: "/quy-trinh", label: "Quy trình" },
      { href: "/kien-thuc", label: "Kiến thức" },
      { href: "/ve-chung-toi", label: "Về chúng tôi" },
    ],
  },
  en: {
    groups: [
      {
        label: "Services",
        description: "By delivery model",
        prefix: "/en/services",
        items: [
          { href: "/en/services/recurring-cleaning", label: "Recurring cleaning" },
          { href: "/en/services/periodic-cleaning", label: "Periodic cleaning" },
          { href: "/en/services/deep-cleaning", label: "Deep cleaning" },
        ],
      },
      {
        label: "Solutions",
        description: "By space type",
        prefix: "/en/solutions",
        items: [
          { href: "/en/solutions/building-condominium-cleaning", label: "Buildings & condominiums" },
          { href: "/en/solutions/factory-industrial-cleaning", label: "Factories & industrial zones" },
          { href: "/en/solutions/apartment-cleaning", label: "Apartments" },
        ],
      },
    ],
    links: [
      { href: "/en/process", label: "Process" },
      { href: "/en/insights", label: "Insights" },
      { href: "/en/about", label: "About" },
    ],
  },
};

export function SiteHeader() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "vi";
  const links = navigation[locale];
  const quoteHref = locale === "en" ? "/en/contact" : "/lien-he";
  const targetLocale = locale === "en" ? "vi" : "en";
  const fallbackSwitchHref = translatedPath(pathname, targetLocale);
  const switchRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const closeMobileMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };
  const closeDesktopMenus = () => {
    desktopNavRef.current?.querySelectorAll("details[open]").forEach((item) => {
      item.removeAttribute("open");
    });
  };
  useEffect(() => {
    const hreflang = targetLocale === "vi" ? "vi-VN" : "en";
    const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
    switchRef.current?.setAttribute("href", alternate?.href ? new URL(alternate.href).pathname : fallbackSwitchHref);
  }, [fallbackSwitchHref, targetLocale]);

  useEffect(() => {
    closeMobileMenu();
    closeDesktopMenus();
  }, [pathname]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !desktopNavRef.current?.contains(target)) closeDesktopMenus();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand href={locale === "en" ? "/en" : "/"} label={locale === "en" ? "AKAIUNSAN — Home" : "AKAIUNSAN — Trang chủ"} />

        <nav
          className="desktop-nav"
          aria-label={locale === "en" ? "Primary navigation" : "Điều hướng chính"}
          ref={desktopNavRef}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeDesktopMenus();
          }}
        >
          {links.groups.map((group) => (
            <details className="nav-group" key={group.prefix}>
              <summary className={isActive(group.prefix) ? "is-active" : undefined}>
                {group.label}<span className="nav-chevron" aria-hidden="true" />
              </summary>
              <div className="nav-panel">
                <div className="nav-panel-heading">
                  <small>{group.description}</small>
                  <span>{locale === "en" ? "Choose a focused operating path" : "Chọn đúng nhu cầu vận hành"}</span>
                </div>
                {group.items.map((item, index) => (
                  <Link
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={pathname === item.href ? "is-active" : undefined}
                    href={item.href}
                    key={item.href}
                    onClick={closeDesktopMenus}
                  >
                    <small aria-hidden="true">0{index + 1}</small>
                    <strong>{item.label}</strong>
                    <b aria-hidden="true">↗</b>
                  </Link>
                ))}
              </div>
            </details>
          ))}
          {links.links.map((link) => (
            <Link
              aria-current={isActive(link.href) ? "page" : undefined}
              className={isActive(link.href) ? "is-active" : undefined}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          aria-label={targetLocale === "en" ? "Switch to English" : "Chuyển sang tiếng Việt"}
          className="language-switch"
          href={fallbackSwitchHref}
          hrefLang={targetLocale}
          lang={targetLocale}
          ref={switchRef}
          title={targetLocale === "en" ? "English" : "Tiếng Việt"}
        >
          <span aria-hidden="true" className="language-flag-badge">
            <Image
              alt=""
              fill
              sizes="32px"
              src={targetLocale === "en" ? "/images/flags/united-kingdom.png" : "/images/flags/vietnam.png"}
              unoptimized
            />
          </span>
        </Link>
        <Link className="button button-small" href={quoteHref}>{locale === "en" ? "Request a quote" : "Yêu cầu báo giá"}</Link>

        <details className="mobile-menu" ref={menuRef}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMobileMenu();
          }}
        >
          <summary aria-label={locale === "en" ? "Open menu" : "Mở menu"}>
            <span className="menu-toggle-icon" aria-hidden="true"><i /><i /><i /></span>
            <span className="sr-only">Menu</span>
          </summary>
          <nav aria-label={locale === "en" ? "Mobile navigation" : "Điều hướng trên điện thoại"}>
            {links.groups.map((group) => (
              <div className="mobile-nav-group" key={group.prefix}>
                <strong>{group.label}</strong>
                <small>{group.description}</small>
                {group.items.map((item) => (
                  <Link
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={pathname === item.href ? "is-active" : undefined}
                    href={item.href}
                    key={item.href}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="mobile-nav-primary">
              {links.links.map((link) => (
                <Link
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={isActive(link.href) ? "is-active" : undefined}
                  href={link.href}
                  key={link.href}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link href={quoteHref} onClick={closeMobileMenu}>{locale === "en" ? "Request a quote" : "Yêu cầu báo giá"}</Link>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
