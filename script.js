/**
 * Renders content from data.js into whichever page loaded it, and drives
 * the hero mesh-morph canvas. Nothing here needs editing to add content —
 * see data.js.
 */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function renderCount(id, count) {
  const node = document.getElementById(id);
  if (node) node.textContent = String(count).padStart(2, "0");
}

/* ---------------------------------------------------------------------
   Papers, Projects, Awards — bibliographic list rows
--------------------------------------------------------------------- */
function renderPapers() {
  const root = document.getElementById("papers-list");
  if (!root) return;
  renderCount("papers-count", PAPERS.length);
  PAPERS.forEach((p) => {
    const row = el("div", "entry");
    row.appendChild(el("div", "entry-year mono", p.year));
    const main = el("div");
    main.appendChild(el("div", "entry-title", p.title));
    main.appendChild(el("div", "entry-meta", `${p.venue} — ${p.authors}`));
    const links = el("div", "entry-links");
    if (p.link) links.appendChild(el("a", null, `<a href="${p.link}">Paper</a>`).firstElementChild);
    if (p.pdf) links.appendChild(el("a", null, `<a href="${p.pdf}">PDF</a>`).firstElementChild);
    main.appendChild(links);
    if (p.tags && p.tags.length) {
      const tags = el("div", "entry-tags");
      p.tags.forEach((t) => tags.appendChild(el("span", "tag", t)));
      main.appendChild(tags);
    }
    row.appendChild(main);
    root.appendChild(row);
  });
}

function renderProjects() {
  const root = document.getElementById("projects-list");
  if (!root) return;
  renderCount("projects-count", PROJECTS.length);
  PROJECTS.forEach((proj) => {
    const row = el("div", `entry${proj.status === "archived" ? " is-archived" : ""}`);
    row.appendChild(el("div", "entry-year mono", proj.status === "archived" ? "archived" : "active"));
    const main = el("div");
    main.appendChild(el("div", "entry-title", proj.name));
    main.appendChild(el("div", "entry-desc", proj.description));
    if (proj.link) {
      const links = el("div", "entry-links");
      links.appendChild(el("a", null, `<a href="${proj.link}">Repository</a>`).firstElementChild);
      main.appendChild(links);
    }
    if (proj.tags && proj.tags.length) {
      const tags = el("div", "entry-tags");
      proj.tags.forEach((t) => tags.appendChild(el("span", "tag", t)));
      main.appendChild(tags);
    }
    row.appendChild(main);
    root.appendChild(row);
  });
}

function renderAwards() {
  const root = document.getElementById("awards-list");
  if (!root) return;
  renderCount("awards-count", AWARDS.length);
  AWARDS.forEach((a) => {
    const row = el("div", "entry");
    row.appendChild(el("div", "entry-year mono", a.year));
    const main = el("div");
    main.appendChild(el("div", "entry-title", a.title));
    main.appendChild(el("div", "entry-meta", a.org));
    if (a.description) main.appendChild(el("div", "entry-desc", a.description));
    row.appendChild(main);
    root.appendChild(row);
  });
}

function renderAbout() {
  const root = document.getElementById("about-list");
  if (!root) return;
  ABOUT.forEach((line) => root.appendChild(el("li", null, line)));
}

/* ---------------------------------------------------------------------
   Experience — timeline (genuinely sequential, so it earns the treatment)
--------------------------------------------------------------------- */
function renderExperience() {
  const root = document.getElementById("experience-timeline");
  if (!root) return;
  EXPERIENCE.forEach((e) => {
    const item = el("div", "timeline-item");
    item.appendChild(el("div", "timeline-dates", `${e.start}–${e.end}`));
    item.appendChild(el("div", "timeline-role", e.role));
    item.appendChild(el("div", "timeline-org", e.org));
    if (e.description) item.appendChild(el("p", "entry-desc", e.description));
    root.appendChild(item);
  });
}

/* ---------------------------------------------------------------------
   Hobbies / Cats — photo cards
--------------------------------------------------------------------- */
function renderCardGrid(containerId, items, { withFact } = {}) {
  const root = document.getElementById(containerId);
  if (!root) return;
  if (!items.length) {
    root.appendChild(el("div", "empty-note", "Nothing here yet — add an entry in data.js."));
    return;
  }
  items.forEach((item) => {
    const card = el("div", "card");
    const img = el("img");
    img.src = item.image;
    img.alt = item.name || item.title || "";
    img.loading = "lazy";
    card.appendChild(img);
    const body = el("div", "card-body");
    body.appendChild(el("div", "card-title", item.name || item.title));
    body.appendChild(el("p", null, item.description));
    if (withFact && item.fact) body.appendChild(el("div", "card-fact", item.fact));
    card.appendChild(body);
    root.appendChild(card);
  });
}

/* ---------------------------------------------------------------------
   Site chrome: sidebar name/role, links, CV button, active nav
--------------------------------------------------------------------- */
function renderChrome() {
  document.querySelectorAll("[data-site-name]").forEach((n) => (n.textContent = SITE.name));
  document.querySelectorAll("[data-site-role]").forEach((n) => (n.textContent = SITE.role));

  const linksRoot = document.getElementById("sidebar-links");
  if (linksRoot) {
    SITE.links.forEach((l) => {
      const a = el("a", null, l.label);
      a.href = l.url;
      linksRoot.appendChild(el("li")).appendChild(a);
    });
  }

  const cvBtn = document.getElementById("cv-button");
  if (cvBtn) cvBtn.href = SITE.cv;

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-list a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });
}

/* ---------------------------------------------------------------------
   Hero canvas: a wireframe mesh morphing between two shapes.
   A small, honest demo of the actual research area — not stock imagery.
--------------------------------------------------------------------- */
function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.clientWidth || 180;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Two vertex sets of equal length: a rough icosahedron-like ring (shape A)
  // and a cube-like ring (shape B), projected to 2D grid coordinates.
  const N = 10;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;

  function ring(sides, phase, radiusScale) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = phase + (i / N) * Math.PI * 2;
      const wobble = 1 + 0.18 * Math.sin(sides * a);
      pts.push({
        x: cx + Math.cos(a) * r * radiusScale * wobble,
        y: cy + Math.sin(a) * r * radiusScale * wobble,
      });
    }
    return pts;
  }

  const shapeA = ring(3, 0, 1);
  const shapeB = ring(4, Math.PI / N, 0.82);

  // Edges: connect each vertex to its neighbors and to a couple of
  // across-ring vertices, so it reads as a mesh rather than a polygon.
  const edges = [];
  for (let i = 0; i < N; i++) {
    edges.push([i, (i + 1) % N]);
    edges.push([i, (i + 3) % N]);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function draw(t) {
    ctx.clearRect(0, 0, size, size);
    const points = shapeA.map((p, i) => ({
      x: lerp(p.x, shapeB[i].x, t),
      y: lerp(p.y, shapeB[i].y, t),
    }));

    ctx.strokeStyle = "#2648D6";
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    edges.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[j].x, points[j].y);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#17181C";
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (reduceMotion) {
    draw(0.5); // freeze on a single mid-morph frame
    return;
  }

  const period = 4200; // ms for a full there-and-back cycle
  function frame(now) {
    const phase = (now % period) / period; // 0..1
    const t = (1 - Math.cos(phase * Math.PI * 2)) / 2; // smooth ease there-and-back
    draw(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  renderAbout();
  renderPapers();
  renderProjects();
  renderAwards();
  renderExperience();
  renderCardGrid("hobbies-grid", typeof HOBBIES !== "undefined" ? HOBBIES : []);
  renderCardGrid("cats-grid", typeof CATS !== "undefined" ? CATS : [], { withFact: true });
  initHeroCanvas();
});
