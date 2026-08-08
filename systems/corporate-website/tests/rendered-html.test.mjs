import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("ships the corporate homepage instead of the starter preview", async () => {
  const [
    page,
    englishPage,
    layout,
    css,
    leadForm,
    i18n,
    siteHeader,
    premiumMotion,
    navigationExperience,
    processPage,
    contentTemplate,
    brand,
    standardsSlider,
    campaignHero,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/en/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../components/LeadForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/i18n.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/PremiumMotion.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/NavigationExperience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/quy-trinh/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/ContentTemplate.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../components/Brand.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/StandardsSlider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CampaignHero.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /AKAIUNSAN \| Professional Cleaning Solutions/);
  assert.match(page, /<CampaignHero \/>/);
  assert.match(campaignHero, /brand-campaign-background-v6\.png/);
  assert.match(campaignHero, /Dịch vụ vệ sinh & vận hành cơ sở chuyên nghiệp/);
  assert.match(campaignHero, /Chuẩn mực quốc tế/);
  assert.match(campaignHero, /Tận tâm trong từng chi tiết/);
  assert.match(campaignHero, /Sạch chuẩn mỗi ngày/);
  assert.match(campaignHero, /premium-hero-shade/);
  assert.match(campaignHero, /Yêu cầu khảo sát/);
  assert.match(page, /<StandardsSlider \/>/);
  assert.doesNotMatch(page, /premium-principles/);
  assert.doesNotMatch(page, /hero-requirement-section/);
  assert.match(standardsSlider, /Giám sát có trách nhiệm/);
  assert.match(standardsSlider, /Cải tiến có dữ liệu/);
  assert.match(page, /Xử lý sự vụ/);
  assert.match(page, /Kiến thức cho quyết định vận hành/);
  assert.match(
    page,
    /const solutionPriority = \[\s*"ve-sinh-chung-cu",\s*"ve-sinh-nha-xuong-khu-cong-nghiep",\s*"ve-sinh-can-ho"/,
  );
  assert.match(
    leadForm,
    /type LeadType = "building" \| "factory" \| "apartment"/,
  );
  assert.match(leadForm, /locale = "vi"/);
  assert.match(englishPage, /<CampaignHero locale="en" \/>/);
  assert.match(campaignHero, /Global Standards/);
  assert.match(campaignHero, /Local Care/);
  assert.match(campaignHero, /Consistently Clean/);
  assert.match(englishPage, /<StandardsSlider locale="en" \/>/);
  assert.doesNotMatch(englishPage, /premium-hero-brief|premium-principles/);
  assert.match(standardsSlider, /Accountable supervision/);
  assert.match(standardsSlider, /Data-led improvement/);
  assert.match(englishPage, /listPublished\("solution", "en"\)/);
  assert.match(i18n, /"\/kien-thuc": "\/en\/insights"/);
  assert.match(css, /grid-template-columns:\s*repeat\(3, 1fr\)/);
  assert.match(css, /--green:\s*#6c7d22/);
  assert.match(css, /--lime:\s*#c7dc50/);
  assert.match(css, /font-size:\s*clamp\(64px, 5\.1vw, 76px\)/);
  assert.match(css, /\.premium-hero-copy > p \{[^}]*font-size: 20px/);
  assert.match(
    siteHeader,
    /const menuRef = useRef<HTMLDetailsElement>\(null\)/,
  );
  assert.match(siteHeader, /menuRef\.current\.open = false/);
  assert.match(siteHeader, /<details className="mobile-menu" ref=\{menuRef\}/);
  assert.match(siteHeader, /menu-toggle-icon/);
  assert.match(siteHeader, /nav-chevron/);
  assert.match(siteHeader, /flags\/united-kingdom\.png/);
  assert.match(siteHeader, /flags\/vietnam\.png/);
  assert.match(siteHeader, /className="language-switch"/);
  assert.match(siteHeader, /Switch to English/);
  assert.match(siteHeader, /Chuyển sang tiếng Việt/);
  assert.doesNotMatch(siteHeader, /⌄/);
  assert.match(siteHeader, /onClick=\{closeMobileMenu\}/);
  assert.match(siteHeader, /description: "Theo hình thức triển khai"/);
  assert.match(siteHeader, /description: "Theo loại không gian"/);
  assert.match(siteHeader, /aria-current=\{pathname === item\.href \? "page"/);
  assert.match(layout, /<PremiumMotion \/>/);
  assert.match(layout, /<NavigationExperience \/>/);
  assert.match(layout, /Manrope/);
  assert.match(navigationExperience, /route-leaving/);
  assert.match(navigationExperience, /router\.push/);
  assert.match(premiumMotion, /const pathname = usePathname\(\)/);
  assert.match(premiumMotion, /is-settled/);
  assert.match(premiumMotion, /\[enabled, pathname\]/);
  assert.match(contentTemplate, /data-reveal="hero-copy"/);
  assert.match(contentTemplate, /data-reveal="media"/);
  assert.match(css, /\[data-reveal="media"\]/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /--motion-standard:\s*560ms/);
  assert.match(css, /\.process-page-list article:hover \{[^}]*transform: translateX\(7px\)/);
  assert.doesNotMatch(css, /\.process-page-list article:hover \{[^}]*padding-left/);
  assert.equal((processPage.match(/^\s+"0[1-6]",$/gm) ?? []).length, 6);
  assert.match(brand, /src="\/brand-logo\.png"/);
  assert.match(brand, /width=\{1194\}/);
  assert.match(css, /\.brand-logo \{[^}]*height: 64px/);
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*\.brand-logo \{ height: 50px; \}/,
  );
  assert.doesNotMatch(brand, /brand-copy/);
  assert.doesNotMatch(page, /brand-campaign-logo-lockup-v2\.png|brand-campaign-tagline-v3\.png/);
  assert.match(css, /\.standards-slider-stage article\.is-active/);
  assert.doesNotMatch(page, /premium-hero-brief/);
  assert.doesNotMatch(page, /brand-mark|brand-sun|brand-sweep/);
  assert.doesNotMatch(
    `${page}\n${layout}`,
    /codex-preview|react-loading-skeleton|Your site is taking shape/i,
  );
});

test("keeps persistence and hosting capabilities explicit", async () => {
  const [hosting, schema, migration, packageJson, nextConfig, worker, dockerfile, runtimeConfig] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0001_minor_winter_soldier.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../Dockerfile", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.runtime.jsonc", import.meta.url), "utf8"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "MEDIA"/);
  assert.match(schema, /content_items/);
  assert.match(schema, /media_assets/);
  assert.match(schema, /leads/);
  assert.match(schema, /translationKey/);
  assert.match(schema, /locale/);
  assert.match(migration, /translation_key/);
  assert.match(migration, /ALTER TABLE `leads` ADD `locale`/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(nextConfig, /images:\s*\{\s*unoptimized:\s*true/);
  assert.match(worker, /if \(!assets \|\| !images\)/);
  assert.match(worker, /Response\.redirect\(target\.toString\(\), 307\)/);
  assert.match(dockerfile, /npx wrangler dev --config wrangler\.runtime\.jsonc/);
  assert.doesNotMatch(dockerfile, /npm run dev/);
  assert.match(runtimeConfig, /"main": "dist\/server\/index\.js"/);
  assert.match(runtimeConfig, /"directory": "dist\/client"/);
});

test("serves every public Next image without the unavailable local optimizer", async () => {
  const roots = [
    new URL("../app/", import.meta.url),
    new URL("../components/", import.meta.url),
  ];

  for (const root of roots) {
    const entries = await readdir(root, { recursive: true });
    for (const entry of entries.filter((name) => name.endsWith(".tsx"))) {
      const source = await readFile(new URL(entry.replaceAll("\\", "/"), root), "utf8");
      const imageBlocks = source.match(/<Image\b[\s\S]*?\/>/g) ?? [];
      for (const block of imageBlocks) {
        assert.match(block, /\bunoptimized\b/, `${entry} contains an optimized Image`);
      }
    }
  }
});
