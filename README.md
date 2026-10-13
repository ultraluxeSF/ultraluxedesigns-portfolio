# Ultraluxe Designs portfolio

Static portfolio site for [Ultraluxe Designs](https://ultraluxedesigns.com), hosted on GitHub Pages. No framework and no build dependencies: plain HTML, CSS and JavaScript, Poppins from Google Fonts.

## Structure

- `data/projects.json` – every project: title, discipline, date, description, thumbnail and gallery images
- `data/site.json` – contact details, hero text, services, about text
- `scripts/build.mjs` – generates `index.html` and `work/<slug>/index.html` from the data
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
