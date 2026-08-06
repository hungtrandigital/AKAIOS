"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PremiumMotion() {
  const pathname = usePathname();
  const enabled = !pathname.startsWith("/admin");
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>(".site-header");
    const hero = document.querySelector<HTMLElement>(".premium-hero");
    const heroMedia = document.querySelector<HTMLElement>(
      ".premium-hero-media",
    );
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-reveal], [data-reveal-stagger]",
      ),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const settleTimers: number[] = [];

    root.classList.add("motion-ready");

    if (reducedMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible", "is-settled"));
      return () => root.classList.remove("motion-ready");
    }

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const target = entry.target as HTMLElement;
                  target.classList.add("is-visible");
                  if (target.hasAttribute("data-reveal-stagger")) {
                    settleTimers.push(window.setTimeout(() => target.classList.add("is-settled"), 1380));
                  }
                  observer?.unobserve(entry.target);
                }
              });
            },
            { rootMargin: "0px 0px -10%", threshold: 0.12 },
          )
        : null;

    revealItems.forEach((item) => {
      if (observer) observer.observe(item);
      else item.classList.add("is-visible", "is-settled");
    });

    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(window.scrollY / maxScroll, 1);
      progressRef.current?.style.setProperty(
        "transform",
        `scaleX(${progress})`,
      );
      header?.classList.toggle("is-scrolled", window.scrollY > 18);
      heroMedia?.style.setProperty(
        "--hero-scroll-y",
        `${Math.min(window.scrollY * 0.065, 42)}px`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!hero || !heroMedia || window.innerWidth <= 860) return;
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
      heroMedia.style.setProperty("--hero-pointer-x", `${x}px`);
      heroMedia.style.setProperty("--hero-pointer-y", `${y}px`);
    };
    const resetPointer = () => {
      heroMedia?.style.setProperty("--hero-pointer-x", "0px");
      heroMedia?.style.setProperty("--hero-pointer-y", "0px");
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    hero?.addEventListener("pointermove", onPointerMove, { passive: true });
    hero?.addEventListener("pointerleave", resetPointer);

    return () => {
      root.classList.remove("motion-ready");
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      hero?.removeEventListener("pointermove", onPointerMove);
      hero?.removeEventListener("pointerleave", resetPointer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled, pathname]);

  return enabled ? (
    <div className="page-progress" ref={progressRef} aria-hidden="true" />
  ) : null;
}
