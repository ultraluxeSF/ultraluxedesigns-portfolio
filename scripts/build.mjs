// Builds index.html and one static page per project from data/projects.json.
// Run: node scripts/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, "data/projects.json"), "utf8"));
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/site.json"), "utf8"));

// Images live in /images once mirrored; until then they load from the current site.
const REMOTE = "https://ultraluxedesigns.com/";
const asset = (p, prefix) =>
  fs.existsSync(path.join(ROOT, decodeURIComponent(p))) ? prefix + p : REMOTE + p;

const LOGO = fs.readFileSync(path.join(ROOT, "assets/logo-inline.svg"), "utf8");
const CATS = { branding: "Branding", ui: "UI/UX", social: "Social media", "3d": "3D" };
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const head = ({ title, description, prefix, image }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#1b1b1d">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}assets/css/style.css">
</head>`;

const header = (prefix, current) => {
  const base = current === "home" ? "" : prefix + "index.html";
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${current === "home" ? "#top" : prefix + "index.html"}" aria-label="Ultraluxe Designs, home">${LOGO}<span class="brand-name">Ultraluxe <span>Designs</span></span></a>
    <nav class="nav" aria-label="Main">
      <a href="${base}#work"${current === "work" ? ' aria-current="page"' : ""}>Work</a>
      <a class="nav-services" href="${base}#services">Services</a>
      <a href="${base}#about">About</a>
      <a href="${base}#contact">Contact</a>
    </nav>
  </div>
</header>`;
};

const contact = (prefix) => `
<section class="contact khaki" id="contact">
  <div class="wrap">
    <p class="ask">Have a brand, product or campaign that needs design? Write to me.</p>
    <a class="mail" href="mailto:${site.email}">${site.email}</a>
    <div class="contact-grid">
      <div>
        <h3>Telegram</h3>
        <a href="${site.telegram.url}">${site.telegram.handle}</a>
      </div>
      <div>
        <h3>Based in</h3>
        <p>${site.location}</p>
      </div>
      <div>
        <h3>Elsewhere</h3>
        <ul>${site.social.map(([n, u]) => `<li><a href="${u}">${n}</a></li>`).join("")}</ul>
      </div>
    </div>
    <footer class="site-footer">
      <span class="footer-brand">${LOGO}<span>© ${new Date().getFullYear()} Ultraluxe Designs</span></span>
      <a href="#top">Back to top</a>
    </footer>
  </div>
</section>
<script src="${prefix}assets/js/main.js" defer></script>
</body>
</html>`;

// ---------------- Home ----------------
function buildHome() {
  const prefix = "";
  const cards = projects
    .map(
      (p) => `
      <article class="card" data-cat="${p.category}">
        <a href="work/${p.slug}/" data-project="${p.slug}">
          <div class="media${p.hover ? " has-hover" : ""}">
            <img class="thumb" data-fade src="${asset(p.thumb, prefix)}" alt="${esc(p.title)}" loading="lazy" decoding="async">${
              p.hover ? `\n            <img class="thumb-hover" src="${asset(p.hover, prefix)}" alt="" loading="lazy" decoding="async">` : ""
            }
          </div>
          <div class="caption"><h3>${esc(p.title)}</h3><span>${CATS[p.category]}${p.year ? ", " + p.year : ""}</span></div>
        </a>
      </article>`
    )
    .join("");
  const data = projects.map((p) => ({
    slug: p.slug, title: p.title, category: CATS[p.category], date: p.date, description: p.description,
    tags: p.tags, links: p.links, images: p.images.map((i) => asset(i, prefix)), dims: p.dims,
  }));

  const rows = projects
    .map(
      (p) => `
        <li class="row" data-cat="${p.category}" data-thumb="${asset(p.thumb, prefix)}">
          <a href="work/${p.slug}/" data-project="${p.slug}"><span>${esc(p.title)}</span><span>${CATS[p.category]}</span><span>${esc(p.tags.slice(0, 2).map((t) => "#" + t).join(" "))}</span><span>${p.year || "—"}</span></a>
        </li>`
    )
    .join("");

  const filters = ["all", ...Object.keys(CATS)]
    .map(
      (c, i) =>
        `<button type="button" data-filter="${c}" aria-pressed="${i === 0}">${c === "all" ? "All" : CATS[c]}</button>`
    )
    .join("");

  const services = site.services
    .map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`)
    .join("");

  const html = `${head({
    title: "Ultraluxe Designs, graphic and UI/UX design in Tashkent",
    description: site.description,
    prefix,
    image: REMOTE + "images/LogoThumbnail.jpg",
  })}
<body id="top">
${header(prefix, "home")}
<main id="main">
  <section class="hero">
    <div class="wrap">
      <h1 aria-label="${esc(site.heroPlain)}">${site.heroLines
        .map((l) => `<span class="reveal-line" aria-hidden="true"><span>${esc(l)}</span></span>`)
        .join("")}</h1>
      <div class="hero-foot">
        <p>${esc(site.intro)}</p>
        <span class="status"><i></i>Taking on new projects</span>
        <a class="scroll" href="#work">See the work</a>
      </div>
    </div>
  </section>

  <section class="section dark works" id="work" data-view="grid">
    <div class="wrap">
      <div class="section-head">
        <h2>Work<sup>${projects.length}</sup></h2>
      </div>
      <div class="controls">
        <div class="filters" role="group" aria-label="Filter by discipline">${filters}</div>
        <div class="views" role="group" aria-label="Layout">
          <button type="button" data-view-btn="grid" aria-pressed="true">Grid</button>
          <button type="button" data-view-btn="index" aria-pressed="false">Index</button>
        </div>
      </div>
      <div class="grid">${cards}
      </div>
      <div class="index">
        <div class="index-head" aria-hidden="true"><span>Project</span><span>Discipline</span><span>Notes</span><span style="text-align:right">Year</span></div>
        <ul>${rows}
        </ul>
      </div>
    </div>
    <div class="preview" aria-hidden="true"><img alt=""></div>
  </section>

  <section class="section" id="services">
    <div class="wrap">
      <div class="section-head"><h2>Services</h2></div>
      <ul class="services-list">${services}</ul>
    </div>
  </section>

  <section class="section dark" id="about">
    <div class="wrap about-grid">
      <figure><img data-fade src="${asset("images/me.webp", prefix)}" alt="Iskandar Norkulov" loading="lazy"></figure>
      <div class="about-text">
        <p class="lead">${esc(site.about[0])}</p>
        <p>${esc(site.about[1])}</p>
        <dl class="facts">
          ${site.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
        </dl>
      </div>
    </div>
  </section>
</main>
<div class="viewer" id="viewer" role="dialog" aria-modal="true" aria-labelledby="viewer-title" hidden>
  <div class="viewer-scroll" data-native-scroll>
    <div class="viewer-inner wrap">
      <aside class="viewer-info">
        <button type="button" class="viewer-close" data-close>Close</button>
        <p class="viewer-cat"></p>
        <h2 id="viewer-title"></h2>
        <p class="viewer-desc"></p>
        <ul class="viewer-tags" aria-label="Tags"></ul>
        <dl class="viewer-meta"></dl>
        <nav class="viewer-nav" aria-label="Projects">
          <button type="button" data-step="-1">Previous</button>
          <button type="button" data-step="1">Next</button>
        </nav>
      </aside>
      <div class="viewer-images"></div>
    </div>
  </div>
</div>
<script type="application/json" id="projects-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
${contact(prefix)}`;
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
}

// ---------------- Project pages ----------------
function buildProjects() {
  const prefix = "../../";
  const order = projects;
  order.forEach((p, i) => {
    const next = order[(i + 1) % order.length];
    const metaRows = [
      ["Discipline", CATS[p.category]],
      p.date ? ["Date", p.date] : null,
    ].filter(Boolean);
    const tagList = p.tags.length
      ? `<ul class="tags">${p.tags.map((t) => `<li>#${esc(t)}</li>`).join("")}</ul>`
      : "";
    const links = p.links.length
      ? `<dt>Links</dt><dd>${p.links.map(([n, u]) => `<a href="${u}">${esc(n)}</a>`).join(", ")}</dd>`
      : "";
    const gallery = p.images
      .map(
        (src, k) =>
          `<img src="${asset(src, prefix)}" width="${p.dims[k][0]}" height="${p.dims[k][1]}" alt="${esc(p.title)}, image ${k + 1} of ${p.images.length}" ${k > 1 ? 'loading="lazy" ' : ""}decoding="async">`
      )
      .join("\n      ");

    const html = `${head({
      title: `${p.title}, ${CATS[p.category]} | Ultraluxe Designs`,
      description: p.description || `${p.title}: ${CATS[p.category]} by Ultraluxe Designs.`,
      prefix,
      image: asset(p.thumb, REMOTE),
    })}
<body id="top">
${header(prefix, "work")}
<main id="main">
  <section class="project-hero">
    <div class="wrap">
      <a class="back" href="${prefix}index.html#work">All work</a>
      <h1>${esc(p.title)}</h1>
      <div class="project-meta">
        <dl>${metaRows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}${links}</dl>
        <div class="summary-wrap">${p.description ? `<p class="summary">${esc(p.description)}</p>` : ""}${tagList}</div>
      </div>
    </div>
  </section>
  <section class="gallery-wrap">
    <div class="wrap gallery">
      ${gallery}
    </div>
  </section>
  <a class="next dark" href="${prefix}work/${next.slug}/">
    <div class="wrap"><small>Next project</small><strong>${esc(next.title)}</strong></div>
  </a>
</main>
${contact(prefix)}`;
    const dir = path.join(ROOT, "work", p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
  });
}

fs.rmSync(path.join(ROOT, "work"), { recursive: true, force: true });
buildHome();
buildProjects();
console.log(`Built index.html and ${projects.length} project pages.`);
