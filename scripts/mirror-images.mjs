// Downloads every image the site uses from ultraluxedesigns.com into ./images,
// so the portfolio no longer depends on the old server. Then run build.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REMOTE = "https://ultraluxedesigns.com/";
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, "data/projects.json"), "utf8"));

const paths = new Set(["images/me.webp", "images/LogoThumbnail.jpg"]);
for (const p of projects) { paths.add(p.thumb); p.images.forEach((i) => paths.add(i)); }

let ok = 0, skipped = 0, failed = [];
for (const rel of paths) {
  const dest = path.join(ROOT, decodeURIComponent(rel));
  if (fs.existsSync(dest)) { skipped++; continue; }
  try {
    const res = await fetch(REMOTE + rel);
    if (!res.ok) throw new Error(res.status);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++;
  } catch (e) {
    failed.push(`${rel} (${e.message})`);
  }
}
console.log(`Downloaded ${ok}, already present ${skipped}, failed ${failed.length}`);
if (failed.length) console.log(failed.join("\n"));
