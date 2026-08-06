# Implementation Domain Specifications

## Overview

This document contains implementation-specific domain specifications. For high-level domain specs, see [3.1-system-foundation/architecture/domain-specs.md](../3.1-system-foundation/architecture/domain-specs.md).

## Implementation Details

### Domain Implementation
- Corporate content uses a typed `content_items` table for services, solutions, articles, and FAQs.
- Public reads return the approved seed only when D1 is unavailable or not initialized.
- Admin mutations create content revisions before updating existing items.
- Public content and lead intake are isolated from AKAIOS internal payroll/attendance domains.

### Data Models
- D1 tables: `content_items`, `content_revisions`, `media_assets`, `leads`, `site_settings`.
- R2 stores uploaded image bytes; D1 stores media metadata and object keys.
- Unique `(type, slug)` prevents duplicate public routes.
- Lead status/created time and content type/status/order are indexed for admin and public query patterns.

### Service Implementation
- `ensureBootstrap` inserts missing seed records with conflict-ignore behavior.
- Public lead API validates phone/contact data and persists a workflow status.
- Public review Admin APIs require the password-backed HttpOnly session; the direct demo identity is accepted only on loopback hosts.
- Media uploads accept image formats up to 10MB and serve immutable R2 objects through a stable media endpoint.

## Related Documents

- **[Architecture Domain Specs](../3.1-system-foundation/architecture/domain-specs.md)** - High-level domain model
- **[API Contract](api-contract.md)** - API definitions
- **[Product Requirements](../../2-product-foundation/requirements/)** - Source requirements

---

*This document focuses on implementation details rather than abstract domain concepts.*

