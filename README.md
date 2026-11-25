# Ultraluxe Designs portfolio

Static portfolio site for [Ultraluxe Designs](https://ultraluxedesigns.com), hosted on GitHub Pages. No framework and no build dependencies: plain HTML, CSS and JavaScript, Golos Text from Google Fonts (Latin and Cyrillic).

## Structure

- `data/projects.json` – every project: title, discipline, date, description, thumbnail and gallery images
- `data/site.json` – contact details, hero text, services, about text, CV
- `data/i18n.json` – Russian and Uzbek translations (interface, texts, CV, project descriptions)
- `data/redirects.json` – old site URLs (`/designs/…`, `/3d/…`, `/smd/…`, `/about`) and where they now lead
- `scripts/build.mjs` – generates every page in English (root), Russian (`/ru/`) and Uzbek (`/uz/`), plus `sitemap.xml`, `robots.txt`, `404.html` and the redirect pages
- `assets/css/style.css`, `assets/js/main.js` – styles, smooth scrolling, cursor, filters

## Editing

1. Change `data/projects.json` or `data/site.json`.
2. Run `node scripts/build.mjs`.
3. Commit and push. GitHub Pages republishes in about a minute.

To add a project, add an object to `projects.json` (newest first) with a unique `slug`, a `category` (`branding`, `ui`, `social` or `3d`), a short `description`, `tags`, a square `thumb`, an optional `hover` image and its gallery `images` with their pixel sizes in `dims`. Clicking a project on the home page opens it in a viewer; each project also has its own page at `work/<slug>/`.

## Images

All images live in `images/`, copied from the old site and converted to WebP (thumbnails up to 900 px wide, gallery images up to 2000 px). Each project has a `thumb` (grid cover, square), an optional `hover` image (shown when the cover is hovered, from the old `onm` folder) and its gallery `images`.

## Cursor

A white circle that turns black over light backgrounds and light parts of images, and white over dark ones. It's only used on devices with a mouse; touch devices keep the native behaviour. Smooth scrolling also only applies to mouse wheels and trackpads, and is off when the visitor's system asks for reduced motion.

## Languages

English pages live at the root, Russian in `/ru/`, Uzbek (Latin script) in `/uz/`. Each page links to its versions in the other languages (switch in the header, `hreflang` in the head).

## Analytics

Google Analytics (G-FDHWKRH7W0), Yandex Metrika (54894073, with Webvisor) and Microsoft Clarity (zjbpoh70qd, session recordings and heatmaps) load only on ultraluxedesigns.com, so test builds on github.io don't affect the stats. `assets/js/analytics.js` sends link clicks, project opens and contact clicks as events.

## Deploying to ultraluxedesigns.com

This repo is the test site. The live site is the `UDV3` branch of `ultraluxeSF/ultraluxe` (custom domain in its `CNAME`). To deploy, build here, then copy everything except `.git`, `README.md` into that branch, keeping its `CNAME`, and push. The previous site (v3) is preserved in the `legacy-v3` branch of `ultraluxe`.
