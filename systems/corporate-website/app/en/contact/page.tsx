import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact & request a quote",
  description:
    "Request a building or factory survey, or book apartment cleaning with AKAIUNSAN.",
  alternates: alternateLanguages("/lien-he", "/en/contact", "en"),
};

export default function EnglishContactPage() {
  return (
    <main className="contact-page">
      <section className="section">
        <div className="shell contact-split">
          <div data-reveal="hero-copy">
            <span className="eyebrow">Contact AKAIUNSAN</span>
            <h1>Tell us which space needs professional cleaning.</h1>
            <p>
              For buildings and factories, we will confirm the operating context
              before arranging a survey. For apartments, share the size and
              preferred schedule.
            </p>
            <div className="contact-note">
              <strong>Three needs. One accountable contact.</strong>
              <span>Building: survey and operating plan</span>
              <span>Factory: site survey and safety context</span>
              <span>Apartment: fast booking request</span>
            </div>
          </div>
          <div data-reveal>
            <LeadForm locale="en" />
          </div>
        </div>
      </section>
    </main>
  );
}
