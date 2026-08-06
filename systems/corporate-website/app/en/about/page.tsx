import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About AKAIUNSAN",
  description:
    "AKAIUNSAN provides professional cleaning operations for buildings, factories, industrial zones, and apartments.",
  alternates: alternateLanguages("/ve-chung-toi", "/en/about", "en"),
};

export default function EnglishAboutPage() {
  return (
    <main>
      <section className="detail-hero">
        <div className="shell detail-hero-grid">
          <div data-reveal="hero-copy">
            <span className="eyebrow">About AKAIUNSAN</span>
            <h1>
              Professional cleaning built around operating responsibility.
            </h1>
            <p className="lead-copy">
              We bring together people, methods, supervision, and feedback so
              cleaning quality can be understood and controlled.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/en/contact">
                Start a conversation
              </Link>
            </div>
          </div>
          <figure className="detail-image" data-reveal="media">
            <Image
              alt="Professional cleaning team in a shared building area"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 50vw"
              src="/images/condominium-cleaning.png"
              unoptimized
            />
          </figure>
        </div>
      </section>
      <section className="section">
        <div className="shell content-grid">
          <article className="prose" data-reveal>
            <p>
              AKAIUNSAN serves buildings, condominium projects, production
              environments, and apartments. The operating model begins with a
              clear scope and one accountable service contact.
            </p>
            <p>
              Our responsible-operations direction covers controlled resources,
              safe and respectful work, and traceable processes. We use ESG as
              an operating lens rather than a decorative claim.
            </p>
          </article>
          <aside className="scope-card" data-reveal>
            <span className="eyebrow">Our operating promise</span>
            <h2>Clean by standard. Operated with commitment.</h2>
            <ul className="check-list">
              <li>Scope before staffing</li>
              <li>Supervision with ownership</li>
              <li>Acceptance with criteria</li>
              <li>Issues closed with confirmation</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
