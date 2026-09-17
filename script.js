/**
 * Renders content from data.js into the page. Nothing here needs editing
 * to add content — see data.js.
 */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function externalLink(href, label) {
  const a = el("a", null, label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function renderCount(id, count) {
  const node = document.getElementById(id);
  if (node) node.textContent = String(count).padStart(2, "0");
}

/* ---------------------------------------------------------------------
   Papers — bibliographic list rows. Both links are external (DOI/project
   page, and an external PDF host like arXiv or the publisher) — nothing
   here is hosted on this site.
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
    if (p.link) links.appendChild(externalLink(p.link, "Paper ↗"));
    if (p.pdf) links.appendChild(externalLink(p.pdf, "PDF ↗"));
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

/* ---------------------------------------------------------------------
   Code Projects
--------------------------------------------------------------------- */
function renderCodeProjects() {
  const root = document.getElementById("code-projects-list");
  if (!root) return;
  renderCount("code-projects-count", CODE_PROJECTS.length);
  CODE_PROJECTS.forEach((proj) => {
    const row = el("div", `entry${proj.status === "archived" ? " is-archived" : ""}`);
    row.appendChild(el("div", "entry-year mono", proj.status === "archived" ? "archived" : "active"));
    const main = el("div");
    main.appendChild(el("div", "entry-title", proj.name));
    main.appendChild(el("div", "entry-desc", proj.description));
    if (proj.link) {
      const links = el("div", "entry-links");
      links.appendChild(externalLink(proj.link, "Repository ↗"));
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
  hideSectionIfEmpty("awards", AWARDS.length === 0);
}

/* Hides a section (and its sidebar link) entirely when its data array is
   empty, e.g. AWARDS = [] before you have any to list. Comes back on its
   own the moment you add an entry — nothing else to toggle by hand. */
function hideSectionIfEmpty(sectionId, isEmpty) {
  if (!isEmpty) return;
  const section = document.getElementById(sectionId);
  if (section) section.style.display = "none";
  const navLink = document.querySelector(`.nav-list a[href="#${sectionId}"]`);
  if (navLink && navLink.parentElement) navLink.parentElement.style.display = "none";
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
   Site chrome: name/role, profile photo, top contact bar, section nav
--------------------------------------------------------------------- */
function renderChrome() {
  document.querySelectorAll("[data-site-name]").forEach((n) => (n.textContent = SITE.name));
  document.querySelectorAll("[data-site-role]").forEach((n) => (n.textContent = SITE.role));
  document.querySelectorAll("[data-site-tagline]").forEach((n) => (n.textContent = SITE.tagline));

  const photo = document.getElementById("profile-pic");
  if (photo) {
    photo.src = SITE.photo;
    photo.alt = `Photo of ${SITE.name}`;
  }

  const topbar = document.getElementById("topbar");
  if (topbar) {
    SITE.links.forEach((l) => topbar.appendChild(externalLink(l.url, l.label)));
    const cv = el("a", "cv-button", "Download CV");
    cv.href = SITE.cv;
    topbar.appendChild(cv);
  }
}

/* Highlights the sidebar nav item matching whichever section is in view. */
function initScrollSpy() {
  const links = Array.from(document.querySelectorAll(".nav-list a")).filter(
    (a) => a.parentElement && a.parentElement.style.display !== "none"
  );
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const setActive = (id) => {
    links.forEach((a) => {
      if (a.getAttribute("href") === `#${id}`) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
  setActive(sections[0].id); // default to first section on load
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  renderAbout();
  renderPapers();
  renderCodeProjects();
  renderAwards();
  renderExperience();
  initScrollSpy();
});
