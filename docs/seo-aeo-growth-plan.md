# ServeIQ — SEO + AEO (AI/Answer Engine Optimization) Growth Plan

> **Goal:** make "ServeIQ" the answer — in Google search **and** in every AI answer engine (Google AI Overviews, ChatGPT, Perplexity, Gemini, Copilot) — whenever anyone asks *"which restaurant POS should I use?"* — and dominate the exact-match **"ServeIQ"** brand so no other business trading under that name outranks this system.
>
> Converters / sales funnels are out of scope; this is organic brand + category + answer-engine visibility.

---

## 0. TL;DR — the five-move game

1. **Own the entity.** "ServeIQ" must resolve to *our* product everywhere a search engine or AI looks: one authoritative site, consistent naming, structured data, listings (G2/Capterra/Crunchbase/Product Hunt), GitHub org, docs.
2. **Build the indexable front door.** There is **no public marketing site today** — SEO/AEO is impossible on a login-gated app. Ship a fast marketing site on **serveiq.io** first.
3. **Structure for answers.** Every page answers its question in the first paragraph, then proves it with tables, numbers and schema — the exact pattern AI engines cite.
4. **Turn the product into an SEO surface.** Each restaurant's public QR menu page and every printed receipt footer is distributable real estate. Index and mark it up.
5. **Feed authority and measure.** Reviews, links, community and a free-calculator asset earn rankings and citations; a weekly **AI Answer Monitor** tells us what's working.

---

## 1. Where ServeIQ stands today (grounded audit)

| Surface | Exists today? | Indexable? | Verdict |
|---|---|---|---|
| Marketing / landing site on brand domain | ✗ (serveiq.io only used for email: hello@serveiq.io, support@serveiq.io) | — | **Build first** |
| Waiter app | Angular SPA on Vercel | Login-gated | keep `noindex`; not an SEO surface |
| Admin app (terms/privacy/contact pages live *inside* it) | Angular SPA on Vercel | Login-gated subdomain | move real pages to the marketing site; keep app `noindex` |
| Public QR menu + online ordering + order status | Angular app, per restaurant/table | Dynamic, thin, no schema | **Turn into an SEO surface** |
| Backend API | NestJS on Render (serveiq-backend.onrender.com) | N/A | no public docs → build docs site |
| GitHub org / repos | ServeIQ-Backend, serveIQ | Public | underdescribe the product; rewrite for AEO |
| Reviews (G2, Capterra, Google) | ✗ | n/a | launch + review program |
| Socials, YouTube, Product Hunt, Crunchbase | ✗ (assumed) | n/a | create and keep consistent |

**Implication:** every "ServeIQ" search or AI prompt can currently only surface whichever unrelated ServeIQ entity happened to build a website. That is both a threat (identity hijack) and an opportunity: **the exact-match brand rank is winnable in weeks.**

---

## 2. The competitive set

Two distinct enemies — treat them differently.

### 2a. Exact-name collision ("other ServeIQ businesses")
Unverified entities trade under the name. Strategy = **entity dominance** (Pillar 1) + a **brand SERP monitor** that alerts on any new "ServeIQ" usage so we can respond (disambiguation, out-link, trademark posture).

### 2b. Category incumbents fighting for the same keywords
| Group | Example names (visible in today's SERPs) | ServeIQ attack angle |
|---|---|---|
| Full-stack POS | Toast, Square for Restaurants, Lightspeed, SpotOn, Aloha Cloud, CAKE | Their price, hardware lock-in, US-centric fees |
| Ordering / website-first | Owner.com | No offline-first floor operations workflow |
| Back-office / HR | Restaurant365, Connecteam | Not a table-side operations tool |
| Emerging / low-cost | Petpooja, Restroworks | Weak on per-guest item-level payment |

**ServeIQ differentiators to weaponize (all real, in the codebase):**
- **Per-guest split payment** with item-level, fixed-amount, % and "remainder" allocation — charge each guest exactly for the items they ate; settle guest-by-guest; the tab closes only when the last share is paid.
- **Offline-first:** orders, bills and payments queue locally and sync with idempotency — keeps working through connection drops on the floor.
- **Emerging-market ready:** NGN + multi-currency, transfer/USSD/cash/card settlement, multi-branch, role-based access.
- **Live guest experience:** table-QR ordering, a real-time customer tracking page, table-call for the waiter.
- **Ops guardrails:** discounts with minimum-order thresholds, ingredient stock deduction, rule-based roles.

These become the programmatic **comparison pages** and the **answer-engine proof points** — and quoting them *with numbers* ("settle one tab across 6 guests with 4 payment methods") is exactly what AIs cite.

---

## 3. Pillar 1 — Entity dominance (own the "ServeIQ" brand)

Search engines and AI engines both resolve **named entities** before they rank pages. If our entity is tangled with other ServeIQs', nothing else works.

**Actions (weeks 1–6):**
1. **Canonical truth set.** One description used verbatim everywhere:
   > *"ServeIQ is a cloud restaurant management and point-of-sale (POS) platform with per-guest split payments, offline-first ordering, table-QR menus, and real-time kitchen and guest tracking."*
2. **Single authoritative site** `serveiq.io` (marketing + `/learn` + `/pricing`), with `docs.serveiq.io` for documentation. Every property cross-links to it.
3. **Consistent naming** on: Product Hunt, G2, Capterra, GetApp, Crunchbase, LinkedIn company page, YouTube channel, GitHub org bio, app stores, support email signatures, **printed receipt footers** (add serveiq.io to the PDF receipt), and every public-menu page.
4. **Structured identity** (JSON-LD on serveiq.io): `Organization`, `SoftwareApplication` (`applicationCategory: BusinessApplication`, `operatingSystem`, `aggregateRating` once reviews exist), with an identical `sameAs` array across properties.
5. **Disambiguation `/about`**: name the company, founder(s), product, domain — so answer engines learn *which* ServeIQ is the restaurant POS.
6. **Trademark + handle posture:** monitor "ServeIQ" in trademark registries and social handles monthly; claim brand-handle variants.

---

## 4. Pillar 2 — Marketing site + technical SEO foundation

**Build `serveiq.io` as SSG/ISR (Next.js or Astro; free on Vercel).** Not the Angular SPA pattern — marketing must be fully crawlable, fast, and schema-rich.

**Page architecture (target tree):**
```
/
├─ /                                # positioning + product summary + pricing + reviews
├─ /features/…                      # split payments, offline mode, QR menu, kitchen, reports, roles…
├─ /pricing                         # transparent pricing (AI engines answer with pricing)
├─ /compare/serveiq-vs-toast        # programmatic comparison pages
├─ /compare/serveiq-vs-square
├─ /compare/serveiq-vs-lightspeed
├─ /compare/serveiq-vs-owner-com
├─ /alternatives/                   # "best restaurant POS for small restaurants", "restaurant POS for Africa"
├─ /learn/                          # question/pillar guides (AEO clusters) + FAQ hub
├─ /tools/split-calculator          # free, linkable calculator (see 5c)
├─ m/{restaurant-slug}              # per-restaurant public menu (programmatic)
├─ /about, /contact, /privacy, /terms
└─ docs.serveiq.io                  # documentation subdomain
```

**Technical checklist (week 2):**
- `robots.txt` + XML sitemap + RSS; submit in Google Search Console, Bing Webmaster, Yandex.
- Canonicals; `noindex` on login-gated waiter/admin apps **and** the `serveiq-*.vercel.app` subdomains.
- Static/SSR marketing pages; mobile-first; Core Web Vitals green (LCP < 2.5s, CLS < 0.1).
- JSON-LD per template: `Organization`, `SoftwareApplication`, `WebSite`, `BreadcrumbList`, `FAQPage`, `Product`+`Offer`, `Review` (once live), `Restaurant`+`Menu` on public-menu pages.
- OG/Twitter cards; favicon/brand kit versioned in the repo.
- Google Search Console + GA4 + Bing Webmaster wired on day 1.

---

## 5. Pillar 3 — AEO: get cited by answer engines

AI engines assemble answers from **trusted sources** rather than ranking pages. The playbook:

### 5a. Answer-first content format (every page)
1. Open with a **direct one-sentence answer** to the page's question.
   > *"ServeIQ is a cloud restaurant POS with per-guest split payments, offline-first ordering and live kitchen/guest tracking — priced for independent restaurants."*
2. Follow with **facts as data**: pricing, offline behavior, supported currencies, settlement latency — in tables.
3. Attribute claims to **named, dated sources** (AIs copy claims that are observable and attributable).
4. Add `FAQPage` JSON-LD with real customer questions (highest-probability AEO schema).
5. One H1 / one topic per URL; no keyword stuffing; no unverifiable superlatives.

### 5b. Question clusters to own (guide + FAQ + isolated facts per cluster)
- How do I split a bill between guests at a restaurant? → item-level split (thin competition — first mover).
- What restaurant POS works offline?
- Best QR menu ordering platform / online ordering without delivery commissions.
- Restaurant POS pricing — including Naira.
- Restaurant POS for Africa / Nigeria.
- How to track a customer order in real time.
- Per-feature pages: ServeIQ split payment, ServeIQ offline mode, ServeIQ kitchen display, ServeIQ reports.
- Comparison pages: ServeIQ vs Toast / Square / Lightspeed / Owner.com (features + honest pricing).

### 5c. The free **Restaurant Bill / Deposit Splitter** calculator
A branded, no-login calculator replicating our per-guest split math (item-level, %, remainder). Serves dual duty: earns natural links (classic SEO asset) **and** is cited by AI engines when they answer "how do you split a restaurant bill?" — routing the answer to our tool and feature page.

---

## 6. Pillar 4 — Authority, links and distribution

Links remain the ranking fuel and the strongest citation proxy for AI engines.

1. **Reviews & listings (highest ROI first):** G2, Capterra, GetApp, Product Hunt (launch), Crunchbase, Google Business Profile (per office), Trustpilot. Collect 10–20 initial reviews from real customers; embed `Review` schema with the resulting rating.
2. **Community presence:** r/restaurateur, r/POS, r/smallbusiness, Indie Hackers, LinkedIn, restaurant Facebook groups — answer real questions with substance, link only when it fits.
3. **Content PR:** "free tool" submissions (Product Hunt tools, GitHub trending via the calculator/serverless page), short founder-led case studies with named restaurants + numbers.
4. **Expert/E-E-A-T citations:** public docs with named authors, changelog, uptime/volume statements; respond to HARO/Connectively-style journalist queries on restaurant tech.
5. **Partnership links:** restaurant accountants, POS resellers, restaurant consultants, food bloggers — link exchanges on genuinely relevant pages.
6. **GitHub as an SEO/AEO surface:** rewrite `README.md`s (root + backend + api) to give ServeIQ a precise, keyword-rich but honest description, badges, and links — GitHub content is heavily scraped by AI and ranks on its own.
7. **Receipt + QR distribution:** append `serveiq.io` + scan-to-order link to every printed receipt and QR table card — every paying restaurant distributes our brand.

---

## 7. Measurement — including the **AI Answer Monitor**

### Classic SEO metrics
- Google Search Console: impressions/clicks by query, brand vs category share.
- GA4: traffic to serveiq.io by section; micro-conversion (start-trial / contact / split-calculator use).
- Rankings (light tooling is fine early): brand queries, top 20 category queries, top 20 question queries.
- Crawl health: sitemap errors, CWV, index coverage.

### AI Answer Monitor (weekly, 30 min, half-automatable)
Track whether the top ~20 target questions (from 5b) produce an answer that mentions **ServeIQ** and which source URL it cites:
- Prompt once per tool: ChatGPT (GPT-5/GPT search), Perplexity, Gemini, Copilot, and Google AI Overviews for a fixed question list.
- Record: `{question, tool, mentioned?, cited_url?, date}` in a sheet.
- Weekly delta: mentions +1 = content winning; `cited_url` tells us **which exact page** AI trusts — feed that back into content and schema work.
- Add an automated crawl of "ServeIQ" brand SERP mentions to catch identity-hijack incidents (2a alarm).

### KPI targets (12 months)
| Metric | Today | 6 mo | 12 mo |
|---|---|---|---|
| serveiq.io indexed pages | 0 | 60 | 150+ |
| Brand query visibility (top 3) | unknown (~0) | 100% of positions 1–2 | hold 1–2 |
| Category queries ranking p.1 (top 20) | 0 | 6 | 12+ |
| AI answer mentions of ServeIQ (20-question set) | 0 | 6 | 12+ |
| Referring domains | 0 | 15 | 40+ |
| G2/Capterra reviews | 0 | 10 | 25+ |
| Organic leads/mo | 0 | measurable | 20+ trials |

---

## 8. 90-day roadmap

| Window | Focus | Deliverable | Owner | Success signal |
|---|---|---|---|---|
| Weeks 1–2 | Foundation | serveiq.io skeleton (Next/Astro) + schema + analytics + sitemaps/robots; `noindex` audit of apps; README rewrites | Dev | site live; indexed in GSC |
| Weeks 2–4 | Brand entity | `/`, `/about`, `/pricing`, `/features/*`; JSON-LD; Brand SERP monitor live; trademark/handle scan | Dev + brand | brand query shows serveiq.io p.1 |
| Weeks 4–6 | First AEO cluster | `/learn` question hub + FAQPage schema + split-calculator asset + first 3 guides | Content + dev | AI mentions ≥ 1 |
| Weeks 6–8 | Distribution | G2/Capterra/GetApp listings, Product Hunt launch, first reviews, community posts | Growth | ≥ 5 reviews; ≥ 10 referring domains |
| Weeks 8–12 | Programmatic | public-menu indexing + schema; first 4 "serveiq-vs-*" pages; docs.serveiq.io | Dev | ≥ 40 indexed pages |
| Weeks 12+ | Scale + measure | AI Answer Monitor running weekly; monthly content cadence; iterate on cited pages | All | KPI table on track |

---

## 9. Ongoing playbook (monthly, after week 12)
- Publish 2 editorial pieces + refresh 5 existing pages (answer-first edits based on AI Monitor citations).
- One new "ServeIQ vs …" / alternative page per month.
- Review program: ask a happy customer, place in listings, respond to all reviews fast.
- 1 link-building push (tool/community/PR) per month.
- Re-run entity consistency check (naming/sameAs) quarterly.

---

## 10. Risks & guardrails
- **Identity hijack:** watch brand SERP monitor; if another ServeIQ goes aggressive, respond with disambiguation content + trademark record sooner than later.
- **AI poisoning / over-optimization:** never publish fabricated reviews, fake customer names, or inflated uptime/volume figures. AIs and regulators both punish dishonesty fast — and it erodes the E-E-A-T we are building.
- **Thin programmatic pages:** public-menu pages must carry real menu data + Organization/Menu schema (possibly meta-noindex low-value variants); no auto-generated doorway pages.
- **App-vs-site scope creep:** keep waiter/admin apps locked in `noindex`; don't spend SEO budget on the login-gated surface.
- **Keyword cannibalization:** one URL per topic; consolidate before adding new pages.

---

## 11. First five actions (this week)
1. Create the canonical ServeIQ description (Section 3.1) and paste it into the GitHub org + repo READMEs.
2. Scaffold the serveiq.io marketing site (Next.js or Astro) with `/`, `/features`, `/pricing`, `/about`, `/learn` and JSON-LD; deploy to Vercel.
3. Wire GSC + GA4 + Bing Webmaster; add sitemap/robots; confirm waiter/admin apps are `noindex`.
4. Add `serveiq.io` to the receipt footer and QR table-card copy (print assets).
5. Stand up the AI Answer Monitor sheet (question set from Section 5b) and record the baseline.

---

*Plan drafted for the ServeIQ repo (`docs/seo-aeo-growth-plan.md`). Items marked (assumed)/(unverified) must be confirmed with the founder before execution.*