"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const LEAVE_DURATION = 180;
const ENTER_DURATION = 620;

export function NavigationExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const firstRender = useRef(true);
  const navigationTimer = useRef<number | null>(null);
  const enterTimer = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("route-leaving");
    root.removeAttribute("aria-busy");

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    root.classList.remove("route-entering");
    window.requestAnimationFrame(() => {
      root.classList.add("route-entering");
      enterTimer.current = window.setTimeout(() => {
        root.classList.remove("route-entering");
      }, ENTER_DURATION);
    });

    return () => {
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
    };
  }, [pathname]);

  useEffect(() => {
    const onInternalLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.dataset.noTransition === "true"
      ) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;

      const sameDocument =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;
      if (sameDocument) return;

      event.preventDefault();
      event.stopPropagation();

      const root = document.documentElement;
      if (root.classList.contains("route-leaving")) return;

      root.classList.remove("route-entering");
      root.classList.add("route-leaving");
      root.setAttribute("aria-busy", "true");

      navigationTimer.current = window.setTimeout(() => {
        router.push(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      }, LEAVE_DURATION);
    };

    document.addEventListener("click", onInternalLink, true);
    return () => {
      document.removeEventListener("click", onInternalLink, true);
      if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
    };
  }, [router]);

  return <div className="route-progress" aria-hidden="true" />;
}
