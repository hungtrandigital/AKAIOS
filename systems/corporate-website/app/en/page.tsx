import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CampaignHero } from "@/components/CampaignHero";
import { LeadForm } from "@/components/LeadForm";
import { StandardsSlider } from "@/components/StandardsSlider";
import { listPublished } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Professional Cleaning Solutions",
  description: "Professional cleaning operations for buildings, condominium projects, factories, industrial zones, and apartments.",
  alternates: alternateLanguages("/", "/en", "en"),
  openGraph: {
    locale: "en_US",
    title: "AKAIUNSAN — Global Standards. Local Care. Consistently Clean.",
    description: "Professional cleaning operations for buildings, factories, and apartments.",
  },
};

export default async function EnglishHome() {
  const [services, solutions, incidents, articles, faqs] = await Promise.all([
    listPublished("service", "en"),
    listPublished("solution", "en"),
    listPublished("incident", "en"),
    listPublished("article", "en"),
    listPublished("faq", "en"),
  ]);
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AKAIUNSAN",
    description: "Professional Cleaning Solutions",
    url: "https://akaiunsan.prismate.vn/en",
    inLanguage: "en",
  };
  const [featuredArticle, ...moreArticles] = articles;
  const solutionPriority = ["building-condominium-cleaning", "factory-industrial-cleaning", "apartment-cleaning"];
  const solutionRank = (slug: string) => {
    const rank = solutionPriority.indexOf(slug);
    return rank === -1 ? solutionPriority.length : rank;
  };
  const orderedSolutions = [...solutions].sort((a, b) => solutionRank(a.slug) - solutionRank(b.slug) || a.sortOrder - b.sortOrder);

  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} type="application/ld+json" />

      <CampaignHero locale="en" />

      <StandardsSlider locale="en" />

      <div className="premium-marquee" aria-label="AKAIUNSAN focus services"><div className="premium-marquee-track"><span>Building care</span><i>•</i><span>Industrial</span><i>•</i><span>Apartment</span><i>•</i><span>Daily operations</span><i>•</i><span>Responsible operations</span><i>•</i><span aria-hidden="true">Building care</span><i aria-hidden="true">•</i><span aria-hidden="true">Industrial</span><i aria-hidden="true">•</i><span aria-hidden="true">Apartment</span><i aria-hidden="true">•</i><span aria-hidden="true">Daily operations</span><i aria-hidden="true">•</i><span aria-hidden="true">Responsible operations</span><i aria-hidden="true">•</i></div></div>

      <section className="premium-solutions" id="solutions">
        <div className="shell">
          <div className="premium-section-heading" data-reveal><div><span className="section-index section-index-light">02 — Solutions by space</span><h2>Every environment needs its own operating design.</h2></div><p>We do not force every requirement into one package. The plan reflects the property, frequency, access, safety, and real operating context.</p></div>
          <div className="solution-canvas" data-reveal-stagger>
            {orderedSolutions.map((item, index) => <Link className={`solution-tile ${index === 0 ? "solution-tile-featured" : ""}`} href={`/en/solutions/${item.slug}`} key={item.id}><Image alt={`Illustration for ${item.title}`} fill sizes={index === 0 ? "(max-width: 860px) 100vw, 60vw" : "(max-width: 860px) 100vw, 40vw"} src={item.image ?? "/images/apartment-cleaning.png"} unoptimized /><span className="solution-tile-shade" aria-hidden="true" /><span className="solution-number">0{index + 1}</span><div><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.summary}</p><b>View the plan <span>→</span></b></div></Link>)}
          </div>
        </div>
      </section>

      <section className="section premium-services" id="services">
        <div className="shell service-layout">
          <div className="section-heading sticky-heading" data-reveal><span className="section-index">03 — Service formats</span><h2>From one intensive visit to a permanent on-site team.</h2><p>Every format begins with an agreed scope, schedule, and acceptance criteria.</p><Link className="line-link" href="/en/contact">Discuss your requirement <span>→</span></Link></div>
          <div className="service-list premium-service-list" data-reveal-stagger>{services.map((item, index) => <Link href={`/en/services/${item.slug}`} key={item.id}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.summary}</p></div><b aria-hidden="true">→</b></Link>)}</div>
        </div>
      </section>

      <section className="incident-section" id="service-recovery">
        <div className="shell">
          <div className="incident-heading" data-reveal><div><span className="section-index">04 — Service recovery</span><h2>When conditions change, response quality reveals the strength of the operation.</h2></div><p>Routine cleaning creates a clean state. A complete incident process protects that state when the site changes.</p></div>
          <div className="incident-board">
            <div className="incident-control" data-reveal><span className="incident-status"><i /> Service control</span><h3>One contact. One response flow. One outcome that can be confirmed.</h3><p>Feedback should not disappear between shifts, chats, and multiple contacts. Every issue needs a priority, an owner, a next action, and a visible status.</p><ul><li><span>Safety & disruption</span><b>Priority first</b></li><li><span>Area quality</span><b>By impact</b></li><li><span>Repeat issues</span><b>Review the cause</b></li></ul></div>
            <ol className="incident-flow" data-reveal-stagger>{incidents.map((incident, index) => <li key={incident.id}><span>0{index + 1}</span><div><small>{incident.eyebrow}</small><h3>{incident.title}</h3><p>{incident.summary}</p></div></li>)}</ol>
          </div>
        </div>
      </section>

      <section className="esg-section" id="esg">
        <div className="esg-monogram" aria-hidden="true">ESG<span>.</span></div>
        <div className="shell esg-inner">
          <div className="esg-intro" data-reveal><span className="section-index">05 — Responsible operations</span><p className="esg-kicker">Clean spaces. Lighter footprint.</p><h2>Cleaner for the space. Lighter for the environment.</h2><p>Professional cleaning can deliver more than a clean surface: responsible resource use, safer work, and more transparent operations.</p><Link className="line-link" href="/en/about">Our responsible-operations direction <span>→</span></Link></div>
          <div className="esg-pillars" data-reveal-stagger>
            <article><span>E</span><div><small>Environment</small><h3>Optimize resources</h3><p>Control water and chemicals, prefer reusable materials, and support waste separation at source.</p></div></article>
            <article><span>S</span><div><small>Social</small><h3>Safety and dignity at work</h3><p>Training, PPE, safe shifts, and a respectful experience for service teams and building users.</p></div></article>
            <article><span>G</span><div><small>Governance</small><h3>Transparent operations</h3><p>SOPs, acceptance criteria, feedback logs, and reporting keep responsibility traceable.</p></div></article>
          </div>
        </div>
      </section>

      <section className="process-band premium-process">
        <div className="shell">
          <div className="premium-section-heading premium-process-heading" data-reveal><div><span className="section-index section-index-light">06 — How to begin</span><h2>Clear enough to stay under control.</h2></div><p>A concise, transparent cycle from initial requirement to delivery and feedback.</p></div>
          <ol className="process-steps premium-process-steps" data-reveal-stagger>{[["01", "Intake", "Confirm the property, areas, and expected outcome."], ["02", "Survey", "Review current condition, operating flows, and safety requirements."], ["03", "Proposal", "Define scope, frequency, people, equipment, and acceptance."], ["04", "Delivery", "Execute, supervise, report, and respond to feedback."]].map(([number, title, copy]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
          <Link className="premium-text-link" href="/en/process">View the detailed process <span>→</span></Link>
        </div>
      </section>

      {featuredArticle ? <section className="section premium-journal"><div className="shell"><div className="premium-section-heading journal-heading" data-reveal><div><span className="section-index">07 — Operational insights</span><h2>Knowledge for better operating decisions.</h2></div><Link className="line-link" href="/en/insights">View all insights <span>→</span></Link></div><div className="journal-grid" data-reveal-stagger><Link className="journal-feature" href={`/en/insights/${featuredArticle.slug}`}><div className="journal-image"><Image alt={`Illustration for ${featuredArticle.title}`} fill sizes="(max-width: 860px) 100vw, 58vw" src={featuredArticle.image ?? "/images/condominium-cleaning.png"} unoptimized /></div><span>{featuredArticle.eyebrow}</span><h3>{featuredArticle.title}</h3><p>{featuredArticle.summary}</p></Link><div className="journal-list">{moreArticles.slice(0, 2).map((article, index) => <Link href={`/en/insights/${article.slug}`} key={article.id}><span>0{index + 2} · {article.eyebrow}</span><h3>{article.title}</h3><p>{article.summary}</p><b>Read insight →</b></Link>)}</div></div></div></section> : null}

      <section className="section premium-faq"><div className="shell faq-layout"><div className="section-heading" data-reveal><span className="section-index">08 — Before we begin</span><h2>Questions worth clarifying from the start.</h2></div><div className="faq-list" data-reveal-stagger>{faqs.map((faq, index) => <details key={faq.id} open={index === 0}><summary>{faq.title}<span>+</span></summary><p>{faq.summary}</p></details>)}</div></div></section>

      <section className="section premium-contact"><div className="shell contact-split"><div data-reveal><span className="section-index section-index-light">Start a conversation</span><h2>Tell us which space needs professional care.</h2><p>Choose building, factory, or apartment. AKAIUNSAN will review the context and prepare the right questions before contacting you.</p></div><div data-reveal><LeadForm locale="en" /></div></div></section>
    </main>
  );
}
