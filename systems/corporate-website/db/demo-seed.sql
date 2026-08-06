-- Local/staging-only records. Never execute this file against production.
INSERT OR IGNORE INTO leads (
  id, lead_type, locale, name, phone, email, location, property_type, area, frequency, message, status
) VALUES
  ('demo-lead-apartment', 'apartment', 'vi', 'Khách hàng demo', '0900000000', '', 'Khu vực demo', 'Căn hộ 2 phòng ngủ', '75 m²', 'Hằng tuần', 'Dữ liệu minh họa cho luồng đặt lịch.', 'new'),
  ('demo-lead-factory', 'factory', 'en', 'Factory demo', '0900000001', 'demo@example.test', 'Industrial zone demo', 'Factory', '5,000 m²', 'Daily / by shift', 'Bilingual survey-flow demonstration data.', 'contacted');

UPDATE leads SET lead_type = 'factory', locale = 'en', name = 'Factory demo', location = 'Industrial zone demo', property_type = 'Factory', area = '5,000 m²', frequency = 'Daily / by shift', message = 'Bilingual survey-flow demonstration data.' WHERE id = 'demo-lead-factory';

INSERT OR IGNORE INTO content_items (
  id, type, locale, translation_key, slug, title, eyebrow, summary, body, meta, status, seo_title, seo_description, sort_order
) VALUES (
  'demo-draft-article', 'article', 'vi', 'demo-draft-article', 'bai-viet-nhap-demo', 'Bài viết nháp demo', 'Chỉ staging',
  'Bản ghi này dùng để kiểm tra luồng biên tập và không được xuất bản.',
  'Nội dung nháp dành cho môi trường demo.', '{}', 'draft', '', '', 99
);

UPDATE content_items SET locale = 'vi', translation_key = 'demo-draft-article' WHERE id = 'demo-draft-article';

-- Keep the dedicated local demo aligned with the approved contextual image set.
-- This intentionally changes media references only; authored CMS copy remains untouched.
UPDATE content_items
SET image = CASE
  WHEN id IN ('service-recurring', 'en-service-recurring', 'solution-condominium', 'en-solution-condominium') THEN '/images/brand-category-condominium-v1.png'
  WHEN id IN ('service-periodic', 'en-service-periodic', 'solution-factory', 'en-solution-factory') THEN '/images/brand-category-industrial-v1.png'
  WHEN id IN ('service-deep-clean', 'en-service-deep-clean', 'solution-apartment', 'en-solution-apartment') THEN '/images/brand-category-apartment-v1.png'
  WHEN id IN ('article-cost', 'en-article-cost') THEN '/images/brand-insight-pricing-scope-v1.png'
  WHEN id IN ('article-checklist', 'en-article-checklist') THEN '/images/brand-insight-provider-checklist-v1.png'
  WHEN id IN ('article-inhouse', 'en-article-inhouse') THEN '/images/brand-insight-workforce-model-v1.png'
  WHEN id IN ('article-incident-response', 'en-article-incident-response') THEN '/images/brand-insight-incident-response-v1.png'
  ELSE image
END
WHERE id IN (
  'service-recurring', 'en-service-recurring', 'service-periodic', 'en-service-periodic', 'service-deep-clean', 'en-service-deep-clean',
  'solution-condominium', 'en-solution-condominium', 'solution-factory', 'en-solution-factory', 'solution-apartment', 'en-solution-apartment',
  'article-cost', 'en-article-cost', 'article-checklist', 'en-article-checklist', 'article-inhouse', 'en-article-inhouse',
  'article-incident-response', 'en-article-incident-response'
);

UPDATE media_assets
SET public_path = CASE
  WHEN id = 'media-condominium' THEN '/images/brand-category-condominium-v1.png'
  WHEN id = 'media-factory' THEN '/images/brand-category-industrial-v1.png'
  WHEN id = 'media-apartment' THEN '/images/brand-category-apartment-v1.png'
  ELSE public_path
END,
source_reference = 'OpenAI ImageGen, 2026-08-06 — approved contextual demo set',
is_placeholder = 0,
updated_at = CURRENT_TIMESTAMP
WHERE id IN ('media-condominium', 'media-factory', 'media-apartment');
