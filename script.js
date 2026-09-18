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

function thumb(src) {
  const img = el("img", "entry-thumb");
  img.src = src || "images/black_square.png";
  img.alt = "";
  img.loading = "lazy";
  return img;
}

/* Copies text to the clipboard and briefly swaps the button label to
   confirm it, falling back to a hidden-textarea copy on older browsers. */
function copyText(text, btn) {
  const original = btn.textContent;
  const confirm = () => {
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(confirm, () => fallbackCopy(text, confirm));
  } else {
    fallbackCopy(text, confirm);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done();
  } catch (e) {
    /* clipboard unavailable — silently give up */
  }
  document.body.removeChild(ta);
}

/* ---------------------------------------------------------------------
   Papers — bibliographic list rows. Both links are external (DOI/project
   page, and an external PDF host like arXiv or the publisher) — nothing
   here is hosted on this site. Abstract and BibTeX are collapsed by
   default and toggle open, with a copy button on the BibTeX block.
--------------------------------------------------------------------- */
function renderPapers() {
  const root = document.getElementById("papers-list");
  if (!root) return;
  renderCount("papers-count", PAPERS.length);
  PAPERS.forEach((p) => {
    const row = el("div", "entry");
    const media = el("div", "entry-media");
    media.appendChild(thumb(p.image));
    media.appendChild(el("div", "entry-year mono", p.year));
    row.appendChild(media);

    const main = el("div");
    main.appendChild(el("div", "entry-title", p.title));
    main.appendChild(el("div", "entry-meta", `${p.venue} — ${p.authors}`));

    const links = el("div", "entry-links");
    if (p.link) links.appendChild(externalLink(p.link, "Paper ↗"));
    if (p.pdf) links.appendChild(externalLink(p.pdf, "PDF ↗"));

    let abstractPanel = null;
    let bibtexPanel = null;

    if (p.abstract) {
      const toggle = el("button", "entry-toggle mono", "Abstract");
      toggle.type = "button";
      abstractPanel = el("div", "entry-panel");
      abstractPanel.hidden = true;
      abstractPanel.appendChild(el("p", null, p.abstract));
      toggle.addEventListener("click", () => {
        abstractPanel.hidden = !abstractPanel.hidden;
      });
      links.appendChild(toggle);
    }

    if (p.bibtex) {
      const toggle = el("button", "entry-toggle mono", "BibTeX");
      toggle.type = "button";
      bibtexPanel = el("div", "entry-panel");
      bibtexPanel.hidden = true;
      const pre = el("pre", "entry-bibtex mono");
      pre.textContent = p.bibtex;
      bibtexPanel.appendChild(pre);
      const copyBtn = el("button", "entry-copy mono", "Copy");
      copyBtn.type = "button";
      copyBtn.addEventListener("click", () => copyText(p.bibtex, copyBtn));
      bibtexPanel.appendChild(copyBtn);
      toggle.addEventListener("click", () => {
        bibtexPanel.hidden = !bibtexPanel.hidden;
      });
      links.appendChild(toggle);
    }

    main.appendChild(links);

    if (p.tags && p.tags.length) {
      const tags = el("div", "entry-tags");
      p.tags.forEach((t) => tags.appendChild(el("span", "tag", t)));
      main.appendChild(tags);
    }

    if (abstractPanel) main.appendChild(abstractPanel);
    if (bibtexPanel) main.appendChild(bibtexPanel);

    row.appendChild(main);
    root.appendChild(row);
  });

  sizeThumbColumn(root);
}

/* Sizes a list's thumbnail column to fit its widest actual image, once
   loaded, instead of forcing every thumbnail into the same fixed square.
   Sets a --thumb-col custom property on the list container; .entry reads
   it (falling back to 72px for lists — Code Projects, Awards — that never
   call this). */
function sizeThumbColumn(container) {
  if (!container) return;
  const imgs = Array.from(container.querySelectorAll(".entry-thumb"));
  if (!imgs.length) return;

  const apply = () => {
    const widths = imgs
      .map((img) => img.getBoundingClientRect().width)
      .filter((w) => w > 0);
    if (!widths.length) return;
    container.style.setProperty("--thumb-col", `${Math.ceil(Math.max(...widths))}px`);
  };

  const pending = imgs.filter((img) => !img.complete);
  if (!pending.length) {
    apply();
    return;
  }
  let remaining = pending.length;
  const done = () => {
    remaining -= 1;
    if (remaining <= 0) apply();
  };
  pending.forEach((img) => {
    img.addEventListener("load", done);
    img.addEventListener("error", done);
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
    const media = el("div", "entry-media");
    media.appendChild(thumb());
    media.appendChild(el("div", "entry-year mono", proj.status === "archived" ? "archived" : "active"));
    row.appendChild(media);
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
