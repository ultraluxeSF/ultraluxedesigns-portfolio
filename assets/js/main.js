/* Ultraluxe Designs: smooth scroll, adaptive cursor, work filters */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------
     Smooth scroll (wheel is eased; touch, keys and scrollbar stay native)
  --------------------------------------------------------------- */
  var smooth = (function () {
    if (reduceMotion || !finePointer) return null;
    root.classList.add("has-smooth");

    var current = window.scrollY;
    var target = current;
    var running = false;
    var ownScroll = false;
    var EASE = 0.095;

    function max() { return document.documentElement.scrollHeight - window.innerHeight; }
    function clamp(v) { return Math.max(0, Math.min(max(), v)); }

    function tick() {
      var diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target;
        running = false;
      } else {
        current += diff * EASE;
      }
      ownScroll = true;
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(tick);
    }

    function start() {
      if (!running) { running = true; requestAnimationFrame(tick); }
    }

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.defaultPrevented) return; // pinch-zoom
      e.preventDefault();
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      if (!running) current = window.scrollY;
      target = clamp(target + d);
      start();
    }, { passive: false });

    window.addEventListener("scroll", function () {
      if (ownScroll) { ownScroll = false; return; }
      if (!running) { current = target = window.scrollY; }
    }, { passive: true });

    window.addEventListener("resize", function () { target = clamp(target); });

    return {
      to: function (y) {
        if (!running) current = window.scrollY;
        target = clamp(y);
        start();
      }
    };
  })();

  // In-page anchors use the same easing
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    var el = id === "#" || id === "#top" ? document.body : document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    var y = el.getBoundingClientRect().top + window.scrollY;
    if (smooth) smooth.to(y);
    else window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    if (id !== "#" && id !== "#top") history.replaceState(null, "", id);
  });

  /* ---------------------------------------------------------------
     Image fade-in
  --------------------------------------------------------------- */
  document.querySelectorAll("img[data-fade]").forEach(function (img) {
    function done() { img.classList.add("is-loaded"); }
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener("load", done); img.addEventListener("error", done); }
  });

  /* ---------------------------------------------------------------
     Image brightness sampling for the cursor.
     Each image is reduced to a 24x24 brightness map. Images on another
     domain can only be read if that server allows it (CORS); if not,
     the cursor falls back to an inverting blend over that image.
  --------------------------------------------------------------- */
  var GRID = 24;
  var maps = new WeakMap(); // img -> Float32Array | "blend" | "pending"
  function readMap(source) {
    // a fresh canvas each time: once a canvas reads a cross-origin image it stays locked
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = GRID;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, GRID, GRID);
    var data = ctx.getImageData(0, 0, GRID, GRID).data; // throws if tainted
    var out = new Float32Array(GRID * GRID);
    for (var i = 0; i < out.length; i++) {
      var r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3] / 255;
      // transparent pixels show the page behind; treat as unknown (-1)
      out[i] = a < 0.3 ? -1 : (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
    return out;
  }

  function mapFor(img) {
    var m = maps.get(img);
    if (m) return m;
    if (!img.complete || !img.naturalWidth) return null;
    try {
      m = readMap(img);
      maps.set(img, m);
      return m;
    } catch (err) {
      // Cross-origin: try a CORS-enabled copy once
      maps.set(img, "pending");
      var probe = new Image();
      probe.crossOrigin = "anonymous";
      probe.onload = function () {
        try { maps.set(img, readMap(probe)); }
        catch (e2) { maps.set(img, "blend"); }
      };
      probe.onerror = function () { maps.set(img, "blend"); };
      probe.src = img.currentSrc || img.src;
      return "pending";
    }
  }

  function imageBrightness(img, x, y) {
    var m = mapFor(img);
    if (!m || typeof m === "string") return m === "blend" || m === "pending" ? "blend" : null;
    var r = img.getBoundingClientRect();
    var nw = img.naturalWidth, nh = img.naturalHeight;
    // account for object-fit: cover cropping
    var fit = getComputedStyle(img).objectFit;
    var scale = fit === "cover" ? Math.max(r.width / nw, r.height / nh) : Math.min(r.width / nw, r.height / nh);
    var dw = nw * scale, dh = nh * scale;
    var u = (x - r.left - (r.width - dw) / 2) / dw;
    var v = (y - r.top - (r.height - dh) / 2) / dh;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    var cx = Math.min(GRID - 1, Math.floor(u * GRID));
    var cy = Math.min(GRID - 1, Math.floor(v * GRID));
    var sum = 0, n = 0;
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var gx = cx + dx, gy = cy + dy;
        if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) continue;
        var val = m[gy * GRID + gx];
        if (val >= 0) { sum += val; n++; }
      }
    }
    return n ? sum / n : null;
  }

  function parseColor(str) {
    var m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }

  function backgroundBrightness(el) {
    while (el && el !== document.documentElement) {
      var c = parseColor(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.4) return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
      el = el.parentElement;
    }
    var b = parseColor(getComputedStyle(document.body).backgroundColor);
    return b ? (0.299 * b.r + 0.587 * b.g + 0.114 * b.b) / 255 : 1;
  }

  // Returns a number 0..1, or "blend" when the pixels can't be read
  function brightnessAt(x, y) {
    var stack = document.elementsFromPoint(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (el.tagName === "IMG") {
        var v = imageBrightness(el, x, y);
        if (v !== null) return v;
      }
    }
    return backgroundBrightness(stack[0]);
  }

  /* ---------------------------------------------------------------
     Header text follows the section underneath it
  --------------------------------------------------------------- */
  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var headerQueued = false;
    var updateHeader = function () {
      headerQueued = false;
      siteHeader.style.visibility = "hidden"; // look through the header
      var b = brightnessAt(window.innerWidth / 2, 38);
      if (b === "blend") b = backgroundBrightness(document.elementFromPoint(window.innerWidth / 2, 38));
      siteHeader.style.visibility = "";
      siteHeader.classList.toggle("on-dark", b < 0.55);
    };
    window.addEventListener("scroll", function () {
      if (!headerQueued) { headerQueued = true; requestAnimationFrame(updateHeader); }
    }, { passive: true });
    window.addEventListener("resize", updateHeader);
    updateHeader();
  }

  /* ---------------------------------------------------------------
     Cursor
  --------------------------------------------------------------- */
  if (finePointer) {
    root.classList.add("has-cursor");
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    var mx = -100, my = -100, cx = -100, cy = -100;
    var dirty = true;
    var HOVERABLE = "a, button, [data-cursor-hover]";

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!cursor.classList.contains("is-visible")) { cx = mx; cy = my; cursor.classList.add("is-visible"); }
      dirty = true;
      var h = e.target.closest && e.target.closest(HOVERABLE);
      cursor.classList.toggle("is-hover", !!h);
    }, { passive: true });
    window.addEventListener("scroll", function () { dirty = true; }, { passive: true });
    document.addEventListener("mouseleave", function () { cursor.classList.remove("is-visible"); });
    document.addEventListener("mouseenter", function () { cursor.classList.add("is-visible"); });
    window.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
    window.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });

    var lastCheck = 0;
    (function loop(t) {
      var k = reduceMotion ? 1 : 0.32;
      cx += (mx - cx) * k;
      cy += (my - cy) * k;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";

      // re-evaluate the colour under the pointer ~25 times a second
      if (dirty && t - lastCheck > 40) {
        lastCheck = t;
        dirty = false;
        var b = brightnessAt(mx, my);
        if (b === "blend") {
          cursor.style.mixBlendMode = "difference";
          cursor.classList.remove("on-light");
          dirty = true; // keep checking until pixels become readable
        } else {
          cursor.style.mixBlendMode = "";
          cursor.classList.toggle("on-light", b > 0.55);
        }
      }
      requestAnimationFrame(loop);
    })(0);
  }

  /* ---------------------------------------------------------------
     Works: filters, views, index preview
  --------------------------------------------------------------- */
  var works = document.querySelector(".works");
  if (works) {
    var cards = works.querySelectorAll(".card");
    var rows = works.querySelectorAll(".row");
    var filterButtons = works.querySelectorAll("[data-filter]");
    var viewButtons = works.querySelectorAll("[data-view-btn]");

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        filterButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        [cards, rows].forEach(function (list) {
          list.forEach(function (el) {
            el.classList.toggle("is-hidden", f !== "all" && el.getAttribute("data-cat") !== f);
          });
        });
      });
    });

    function setView(v) {
      works.setAttribute("data-view", v);
      viewButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-view-btn") === v)); });
      try { localStorage.setItem("ul-view", v); } catch (e) {}
    }
    viewButtons.forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view-btn")); });
    });
    try { var saved = localStorage.getItem("ul-view"); if (saved) setView(saved); } catch (e) {}

    // floating preview beside the pointer in the index view
    var preview = document.querySelector(".preview");
    var pimg = preview && preview.querySelector("img");
    if (preview && finePointer) {
      var px = 0, py = 0, tx = 0, ty = 0, on = false;
      rows.forEach(function (row) {
        row.addEventListener("mouseenter", function () {
          var src = row.getAttribute("data-thumb");
          if (pimg.getAttribute("src") !== src) pimg.setAttribute("src", src);
          preview.classList.add("is-on");
          on = true;
        });
        row.addEventListener("mouseleave", function () { preview.classList.remove("is-on"); on = false; });
      });
      window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
      (function follow() {
        px += (tx - px) * 0.14;
        py += (ty - py) * 0.14;
        if (on) {
          var w = preview.offsetWidth, h = preview.offsetHeight;
          var left = px + 40;
          if (left + w > window.innerWidth - 16) left = px - w - 40;
          var top = Math.max(16, Math.min(window.innerHeight - h - 16, py - h / 2));
          preview.style.transform = "translate3d(" + left + "px," + top + "px,0)";
        }
        requestAnimationFrame(follow);
      })();
    }
  }
})();
