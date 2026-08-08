import type { Metadata } from "next";
import Link from "next/link";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Service process",
  description:
    "AKAIUNSAN's process for intake, site survey, proposal, delivery, and quality control.",
  alternates: alternateLanguages("/quy-trinh", "/en/process", "en"),
};
const steps = [
  [
    "01",
    "Receive the requirement",
    "Confirm the property type, priority areas, timing, and expected outcome.",
  ],
  [
    "02",
    "Survey the site",
    "Review current condition, materials, operating flows, access, and safety requirements.",
  ],
  [
    "03",
    "Design the plan",
    "Define work scope, frequency, people, equipment, acceptance, and reporting.",
  ],
  [
    "04",
    "Launch and supervise",
    "Brief the team, execute the plan, inspect the result, and record feedback.",
  ],
  [
    "05",
    "Review and improve",
    "Adjust frequency, checklists, materials, training, or SOPs when operating conditions change.",
  ],
];

export default function EnglishProcessPage() {
  return (
    <main>
      <section className="page-intro">
        <div className="shell" data-reveal="hero-copy">
          <span className="eyebrow">Process & quality</span>
          <h1>
            Define the scope first.
            <br />
            Maintain control throughout.
          </h1>
          <p>
            The process adapts to buildings, factories, and apartments while
            keeping one rule: responsibility must be clear before work begins.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell process-page-list" data-reveal>
          {steps.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="cta-band">
        <div className="shell" data-reveal>
          <h2>Apply the process to your property.</h2>
          <Link className="button button-light" href="/en/contact">
            Request a survey
          </Link>
        </div>
      </section>
    </main>
  );
}
