import type { Metadata } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LanguageDocument } from "@/components/LanguageDocument";
import { PremiumMotion } from "@/components/PremiumMotion";
import { NavigationExperience } from "@/components/NavigationExperience";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-brand",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "akaiunsan.prismate.vn";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;
  return {
    metadataBase: new URL(origin),
    title: {
      default: "AKAIUNSAN | Professional Cleaning Solutions",
      template: "%s | AKAIUNSAN",
    },
    description:
      "Giải pháp vệ sinh chuyên nghiệp cho tòa nhà, dự án chung cư, nhà xưởng, khu công nghiệp và căn hộ.",
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "AKAIUNSAN",
      title: "AKAIUNSAN — Nâng chuẩn sạch. Vững nhịp vận hành.",
      description:
        "Giải pháp vệ sinh cho tòa nhà, dự án chung cư, nhà xưởng, khu công nghiệp và căn hộ.",
      images: [
        {
          url: socialImage,
          width: 1734,
          height: 907,
          alt: "AKAIUNSAN — Nâng chuẩn sạch. Vững nhịp vận hành.",
        },
      ],
    },
    twitter: { card: "summary_large_image", images: [socialImage] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnam.variable} ${manrope.variable}`}>
        <LanguageDocument />
        <PremiumMotion />
        <NavigationExperience />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
