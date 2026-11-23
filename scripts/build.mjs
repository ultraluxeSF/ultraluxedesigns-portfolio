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
const CATS = { branding: "Branding", social: "Social media", "3d": "3D", ui: "UI/UX" };
// branding and graphic work first, UI/UX last; original order kept within each group
const RANK = { branding: 0, social: 0, "3d": 1, ui: 2 };
projects.sort((a, b) => RANK[a.category] - RANK[b.category]);
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const head = ({ title, description, prefix, image }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#ffffff">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
<link rel="icon" href="${prefix}assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}assets/css/style.css">
</head>`;

const header = (prefix, current) => {
  const base = current === "home" ? "" : prefix + "index.html";
  // on the 404 page links resolve against <base>, so no prefix is needed
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${current === "home" ? "#top" : prefix + "index.html"}" aria-label="Ultraluxe Designs, home">${LOGO}<span class="brand-name">Ultraluxe <span>Designs</span></span></a>
    <nav class="nav" aria-label="Main">
      <a href="${base}#work"${current === "work" ? ' aria-current="page"' : ""}>Work</a>
      <a class="nav-hide-sm" href="${base}#services">Services</a>
      <a class="nav-hide-sm" href="${base}#about">About</a>
      <a class="nav-cta" href="${base}#contact">Start a project</a>
    </nav>
  </div>
</header>`;
};

const contact = (prefix) => `
<section class="contact accent" id="contact">
  <div class="wrap">
    <h2>Got a brand<br>to build?</h2>
    <p class="ask">Tell me about your company and what you need, and we’ll find the right shape for it.</p>
    <div class="contact-actions">
      <a class="btn btn-solid" href="${site.telegram.url}">Message on Telegram</a>
      <a class="btn btn-line" href="mailto:${site.email}">Send an email</a>
    </div>
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
      <span class="footer-links"><a href="${prefix}cv/">My CV</a><a href="#top">Back to top</a></span>
    </footer>
  </div>
</section>
<script src="${prefix}assets/js/main.js" defer></script>
</body>
</html>`;

// Projects split into sections (Inter Nation volumes): a cover index, then the
// sections next to a sticky text rail that highlights the one being viewed.
function sectionsHTML(p, prefix, idPrefix) {
  const img = (src, d, alt, k) =>
    `<img src="${asset(src, prefix)}" width="${d[0]}" height="${d[1]}" alt="${esc(alt)}" ${k > 1 ? 'loading="lazy" ' : ""}decoding="async">`;
  const index = p.sections
    .map(
      (s, i) => `<a href="#${idPrefix}${i + 1}" class="${s.hover ? "has-hover" : ""}">
        <img class="cover" src="${asset(s.cover, prefix)}" alt="" loading="lazy">${
          s.hover ? `<img class="cover-hover" src="${asset(s.hover, prefix)}" alt="" loading="lazy">` : ""
        }
        <span class="cover-label"><strong>${esc(s.title)}</strong><small>${esc(s.date)}</small></span>
      </a>`
    )
    .join("");
  const body = p.sections
    .map(
      (s, i) => `<section class="gallery-section" id="${idPrefix}${i + 1}" data-section="${i}">
        <header class="section-label"><h3>${esc(s.title)}</h3><span>${esc(s.date)}</span></header>
        ${s.images.map((src, k) => img(src, s.dims[k], `${p.title} ${s.title}, image ${k + 1} of ${s.images.length}`, k)).join("")}
      </section>`
    )
    .join("");
  const rail = p.sections
    .map((s, i) => `<li><a href="#${idPrefix}${i + 1}" data-rail="${i}">${esc(s.title)}</a></li>`)
    .join("");
  return `<nav class="sections-index" aria-label="Sections">${index}</nav>
    <div class="sections-body">
      <div class="sections-list">${body}</div>
      <nav class="section-rail" aria-label="Jump to section"><ol>${rail}</ol></nav>
    </div>`;
}

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
            <div class="caption"><h3>${esc(p.title)}</h3><span>${CATS[p.category]}${p.year ? ", " + p.year : ""}</span></div>
          </div>
        </a>
      </article>`
    )
    .join("");
  const data = projects.map((p) => ({
    slug: p.slug, title: p.title, category: CATS[p.category], date: p.date, description: p.description,
    tags: p.tags, links: p.links, images: p.images.map((i) => asset(i, prefix)), dims: p.dims,
    sectionsHtml: p.sections ? sectionsHTML(p, prefix, "viewer-section-") : undefined,
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

  const mainServices = site.services
    .filter((s) => s[2] === "main")
    .map(([t, d]) => `<article class="service-card"><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`)
    .join("");
  const moreServices = site.services
    .filter((s) => s[2] !== "main")
    .map(([t, d]) => `<li class="${t.startsWith("UI") ? "secondary" : ""}"><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`)
    .join("");
  const featured = site.featured
    .map((f) => {
      const p = bySlug[f.slug];
      return `
        <article class="case">
          <a href="work/${p.slug}/" data-project="${p.slug}">
            <div class="case-media">
              <img src="${asset(f.image, prefix)}" alt="${esc(p.title)}" loading="lazy" decoding="async">
              <span class="pill">${CATS[p.category]}</span>
              <span class="case-open">View project</span>
            </div>
            <div class="case-text"><h3>${esc(p.title)}</h3><span>${p.year || ""}</span><p>${esc(f.line)}</p></div>
          </a>
        </article>`;
    })
    .join("");

  const html = `${head({
    title: "Ultraluxe Designs, brand identity and graphic design in Tashkent",
    description: site.description,
    prefix,
    image: REMOTE + "images/LogoThumbnail.jpg",
  })}
<body id="top">
${header(prefix, "home")}
<main id="main">
  <section class="hero">
    <div class="hero-head" aria-hidden="true">
      <img class="head" src="images/head.webp" alt="" width="820" height="1100" fetchpriority="high">
      <span class="hero-badge"><i></i>Taking on new projects</span>
    </div>
    <div class="wrap">
      <h1 aria-label="${esc(site.heroPlain)}">${site.heroLines
        .map((l) => `<span class="reveal-line" aria-hidden="true"><span>${esc(l)}</span></span>`)
        .join("")}</h1>
      <div class="hero-foot">
        <p>${esc(site.intro)}</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="#contact"><span class="dot"></span>Start a project</a>
          <a class="btn btn-line" href="#cases">See selected work</a>
        </div>
      </div>
    </div>
  </section>

  <nav class="marquee" aria-label="Clients">
    <div class="marquee-track">${[0, 1]
      .map(
        (k) => `<ul${k ? ' aria-hidden="true"' : ""}>${site.clients
          .map(
            ([c, slug]) =>
              `<li><a href="work/${slug}/" data-project="${slug}"${k ? ' tabindex="-1"' : ""}>${esc(c)}</a>${LOGO}</li>`
          )
          .join("")}</ul>`
      )
      .join("")}</div>
  </nav>

  <section class="section" id="cases">
    <div class="wrap">
      <div class="section-head">
        <h2>Selected<br>branding</h2>
        <p>Identities, brand books and graphic systems for companies in Uzbekistan and ten other countries.</p>
      </div>
      <div class="cases">${featured}</div>
    </div>
  </section>

  <section class="section mist works" id="work" data-view="grid">
    <div class="wrap">
      <div class="section-head">
        <h2>All work<sup>${projects.length}</sup></h2>
        <p>Branding and graphic design first, then 3D and interface work.</p>
      </div>
      <div class="controls">
        <div class="filters" role="group" aria-label="Filter by discipline">${filters}</div>
        <div class="views" role="group" aria-label="Layout">
          <button type="button" data-view-btn="grid" aria-pressed="true">Grid</button>
          <button type="button" data-view-btn="index" aria-pressed="false">List</button>
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
      <div class="section-head">
        <h2>What I do</h2>
        <p>Most clients come for a brand and stay for the graphics that keep it alive every week.</p>
      </div>
      <div class="services-main">${mainServices}</div>
      <ul class="services-more">${moreServices}</ul>
    </div>
  </section>

  <section class="section mist" id="process">
    <div class="wrap">
      <div class="section-head"><h2>How it works</h2></div>
      <ol class="process">${site.process.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}</ol>
    </div>
  </section>

  <section class="section" id="about">
    <div class="wrap about-grid">
      <figure><img data-fade src="${asset("images/me.webp", prefix)}" alt="Iskandar Norkulov" loading="lazy"></figure>
      <div class="about-text">
        <p class="lead">${esc(site.about[0])}</p>
        <p>${esc(site.about[1])}</p>
        <a class="btn btn-line about-cv" href="cv/">Read my CV</a>
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
  <button type="button" class="to-top" data-to-top aria-label="Scroll to top" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
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
    const imgs = (list, dims, label) =>
      list
        .map(
          (src, k) =>
            `<img src="${asset(src, prefix)}" width="${dims[k][0]}" height="${dims[k][1]}" alt="${esc(label)}, image ${k + 1} of ${list.length}" ${k > 1 ? 'loading="lazy" ' : ""}decoding="async">`
        )
        .join("\n      ");
    const gallery = p.sections
      ? sectionsHTML(p, prefix, "section-")
      : imgs(p.images, p.dims, p.title);

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
  <a class="next mist" href="${prefix}work/${next.slug}/">
    <div class="wrap"><small>Next project</small><strong>${esc(next.title)}</strong></div>
  </a>
</main>
<button type="button" class="to-top" data-to-top aria-label="Scroll to top" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
${contact(prefix)}`;
    const dir = path.join(ROOT, "work", p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
  });
}

// ---------------- CV ----------------
function buildCV() {
  const prefix = "../";
  const cv = site.cv;
  const work = (slug, label) => `<a href="${prefix}work/${slug}/">${esc(label)}</a>`;
  const jobs = cv.jobs
    .map(
      (j) => `
        <li class="cv-row">
          <p class="cv-when">${esc(j.period)}</p>
          <div class="cv-what">
            <h3>${esc(j.company)}</h3>
            <p class="cv-role">${esc(j.role)}</p>
            <p class="cv-tags">${esc(j.tags)}</p>
            <ul class="cv-points">${j.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
            ${j.links.length ? `<p class="cv-links">See the work: ${j.links.map(([l, s]) => work(s, l)).join(", ")}</p>` : ""}
          </div>
        </li>`
    )
    .join("");
  const simple = (rows) =>
    rows
      .map(
        ([t, when, d, slug]) => `
        <li class="cv-row">
          <p class="cv-when">${esc(when)}</p>
          <div class="cv-what"><h3>${esc(t)}</h3><p class="cv-role">${esc(d)}</p>${slug ? `<p class="cv-links">${work(slug, "See the logo")}</p>` : ""}</div>
        </li>`
      )
      .join("");
  const html = `${head({
    title: `${cv.name}, CV | Ultraluxe Designs`,
    description: `CV of ${cv.name}: ${cv.role.toLowerCase()} in Tashkent, Uzbekistan.`,
    prefix,
    image: REMOTE + "images/LogoThumbnail.jpg",
  })}
<body id="top" class="cv-page">
${header(prefix, "cv")}
<main id="main">
  <section class="cv-hero">
    <div class="wrap">
      <a class="back" href="${prefix}index.html#about">Home</a>
      <h1>${esc(cv.name)}</h1>
      <p class="cv-sub">${esc(cv.role)}, Tashkent</p>
      <div class="cv-actions">
        <a class="btn btn-solid" href="mailto:${site.email}"><span class="dot"></span>${site.email}</a>
        <a class="btn btn-line" href="${site.telegram.url}">Telegram ${site.telegram.handle}</a>
        <button class="btn btn-line" type="button" data-print>Save as PDF</button>
      </div>
    </div>
  </section>

  <section class="cv-block">
    <div class="wrap cv-grid">
      <h2>About</h2>
      <div class="cv-body">
        ${cv.bio.map((x, i) => `<p class="${i ? "" : "cv-lead"}">${esc(x)}</p>`).join("")}
        <dl class="cv-stats">
          ${cv.expertise
            .map(([t, since]) => `<div><dt>${esc(t)}</dt><dd><strong data-years-since="${since}"></strong> years</dd></div>`)
            .join("")}
          <div><dt>Clients from</dt><dd><strong>11</strong> countries</dd></div>
        </dl>
      </div>
    </div>
  </section>

  <section class="cv-block">
    <div class="wrap cv-grid">
      <h2>Experience</h2>
      <ol class="cv-list">${jobs}</ol>
    </div>
  </section>

  <section class="cv-block">
    <div class="wrap cv-grid">
      <h2>Awards</h2>
      <ol class="cv-list">${simple(cv.awards.map(([t, w, d, s]) => [t, w, d, s]))}</ol>
    </div>
  </section>

  <section class="cv-block">
    <div class="wrap cv-grid">
      <h2>Education</h2>
      <ol class="cv-list">${simple(cv.education)}</ol>
    </div>
  </section>

  <section class="cv-block">
    <div class="wrap cv-grid">
      <h2>Languages</h2>
      <ul class="cv-langs">${cv.languages.map(([l, v]) => `<li><strong>${esc(l)}</strong><span>${esc(v)}</span></li>`).join("")}</ul>
    </div>
  </section>
</main>
${contact(prefix)}`;
  const dir = path.join(ROOT, "cv");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// ---------------- 404 ----------------
// GitHub Pages serves this file for any missing URL, at any depth, so asset
// paths are resolved at runtime from the site root (works on a project page
// URL like /ultraluxedesigns-portfolio/ and on a custom domain).
function build404() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Ultraluxe Designs</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ffffff">
<script>
  (function () {
    var repo = "/ultraluxedesigns-portfolio/";
    var base = location.pathname.indexOf(repo) === 0 ? repo : "/";
    document.write('<base href="' + base + '">');
  })();
</script>
<link rel="icon" href="assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body id="top" class="page-404">
${header("", "404")}
<main id="main" class="nf">
  <div class="hero-head" aria-hidden="true">
    <img class="head" src="images/head.webp" alt="" width="820" height="1100">
  </div>
  <div class="wrap nf-inner">
    <p class="nf-code">404</p>
    <h1>This page doesn't exist.</h1>
    <p class="nf-text">The link may be old or mistyped. Everything I've made is on the home page.</p>
    <a class="btn btn-solid" href="index.html#work">See all work</a>
  </div>
</main>
${contact("")}`;
  fs.writeFileSync(path.join(ROOT, "404.html"), html);
}

fs.rmSync(path.join(ROOT, "work"), { recursive: true, force: true });
build404();
buildCV();
buildHome();
buildProjects();
console.log(`Built index.html and ${projects.length} project pages.`);
