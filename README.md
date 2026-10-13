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

To add a project, add an object to `projects.json` (newest first) with a unique `slug` and `category` set to `branding`, `ui`, `social` or `3d`. Put its images in `images/...` and reference them by that path.

## Images

Images currently load from `ultraluxedesigns.com`. To copy them into this repository, open **Actions → Copy images from the old site → Run workflow**. The build then uses the local copies automatically. Do this **before** pointing the ultraluxedesigns.com domain at GitHub Pages, or the images will break.

Local copies also let the cursor read the actual colours of each image (browsers block that for images on another domain unless the server allows it).

## Cursor

A white circle that turns black over light backgrounds and light parts of images, and white over dark ones. It's only used on devices with a mouse; touch devices keep the native behaviour. Smooth scrolling also only applies to mouse wheels and trackpads, and is off when the visitor's system asks for reduced motion.
