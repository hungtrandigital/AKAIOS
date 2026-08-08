"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function LanguageDocument() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "vi";
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)}` }} />;
}
