# LaoZhou Foods — laozhoufoods.com

GitHub repository: [diqpet-oss/laozhoufoods](https://github.com/diqpet-oss/laozhoufoods)

This repository contains the deployable static website at its root. It is not nested under a `site/` folder.

Static, responsive B2B website built from the supplied LaoZhou brand guide, product catalogue, factory footage and social assets.

## Run locally

From this directory:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Pages

- `index.html` — brand-led home page
- `products.html` — four product ranges, flavors and formats
- `craft.html` — process, production and quality story
- `story.html` — brand history and milestones
- `wholesale.html` — trade, distribution and private label
- `contact.html` — form, contact details and trade FAQ
- `thank-you.html` — form success page
- `privacy.html`, `terms.html`, `404.html`

## Deploy

### Netlify — recommended

The included `netlify.toml` sets security headers, cache rules and publishes this folder.

1. Connect the repository containing this `site/` directory to Netlify.
2. Set **Publish directory** to `site` (or run Netlify from inside `site/`).
3. Add `laozhoufoods.com` as the custom domain and follow Netlify's DNS instructions.
4. Add `www.laozhoufoods.com`, set the desired primary domain, and enable the automatically managed HTTPS certificate.

Forms use Netlify Forms. After the first production deploy, confirm both `contact-inquiry` and `trade-inquiry` appear under **Forms** in the Netlify dashboard. Submissions redirect to `/thank-you.html`.

### Cloudflare Pages

Upload or connect the `site/` directory as the project output. The static files work as-is. Netlify form handling does not apply; configure a Forms endpoint or another serverless endpoint before launch.

## Before launch — required owner confirmation

Replace or verify the following with the brand owner. These are intentionally not invented in the site:

- Public inquiry email: `laozhoufood@gmail.com` (confirmed).
- Public WhatsApp: `+86 180 6888 9836`.
- Legal company name, registered address and Chinese company details for the footer/legal pages.
- Certificate names and numbers, validity dates and the exact SKUs covered.
- Ingredient, nutrition and allergen declarations for each export SKU.
- Carton dimensions, gross weight, pallet configuration and MOQ.
- Export Incoterms, lead times, price validity and sample/shipping charges.
- Country-specific labeling and importer-of-record responsibilities.
- Whether any product is eligible for vegan, vegetarian, halal, non-GMO or similar claims.
- Final review of the privacy policy and website terms against the operating entity and target markets.

## Content policy used

The English copy relies on verifiable catalogue and factory-film facts:

- founded in 1986

Search and AI retrieval:

- Canonical URLs use the live `www.laozhoufoods.com` host.
- `sitemap.xml` lists the six main pages plus the buyer FAQ.
- Organization, WebSite, product collection, service, breadcrumb and FAQ structured data explain the business without inventing certifications, prices or stock availability.
- `llms.txt` gives AI retrieval systems a concise, source-linked overview of the company and its products.
- slow-braised flavor and ready-to-eat positioning
- 9-month ambient shelf-life stated in the catalogue
- 15 standardized production steps
- PLC-controlled forming and a modern connected production line
- listed retail and 2 × 2.5 kg bulk formats

The site does **not** claim universal vegan, vegetarian, halal, non-GMO, preservative-free or health-benefit status. Animal-derived broth and flavor directions exist in the range. Destination-market documentation and final product claims must be confirmed per SKU.

## Assets

Source material remains in the parent directory. The published image set is under `assets/images/`. Factory stills were extracted from the native 4K source and are served responsively (768 / 1280 / 1920 / 2560 / 3840 px). Full-resolution delivery stills are stored separately in the parent folder at `4K_FACTORY_STILLS/`. The factory film is compressed for web at `assets/video/laozhou-factory-film.mp4` (approximately 22 MB, lazy-loaded in the player).

The header uses the brand-red logo for strong contrast against the cream navigation. The footer uses the white version against the dark footer.

The home-page hero uses a clean 4K factory crop that excludes the source video's logo overlay and subtitle area. Its 768, 1280, 1920, 2560 and 3840 px versions have been checked with local Vision OCR and contain no detected text.

Fonts are self-hosted in `assets/fonts/`: Cormorant Garamond and Manrope (SIL Open Font License).

## SEO

Included:

- unique titles, descriptions and social cards
- canonical URLs for public pages
- Organization structured data on the home page
- `robots.txt` and `sitemap.xml`
- descriptive image alt text
- no-index rules for the thank-you and 404 pages

After the custom domain is live, verify it in Google Search Console and submit `https://laozhoufoods.com/sitemap.xml`.
