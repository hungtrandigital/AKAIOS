import Image from "next/image";
import Link from "next/link";

export function Brand({
  inverse = false,
  href = "/",
  label = "AKAIUNSAN — Trang chủ",
}: {
  inverse?: boolean;
  href?: string;
  label?: string;
}) {
  return (
    <Link
      className={`brand ${inverse ? "brand-inverse" : ""}`}
      href={href}
      aria-label={label}
    >
      <Image
        alt=""
        className="brand-logo"
        height={737}
        priority
        sizes="(max-width: 760px) 82px, 104px"
        src="/brand-logo.png"
        unoptimized
        width={1194}
      />
    </Link>
  );
}
