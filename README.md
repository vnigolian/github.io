# vnigolian.github.io

Personal site: a single page with your papers, code projects, awards, and
experience. Plain HTML/CSS/JS — no framework, no build step.

## Structure

```
index.html      The whole site — sections: About, Papers, Code Projects,
                 Awards & Funding, Experience
data.js         ALL content lives here — edit this to add/change things
script.js       Renders data.js into the page
styles.css      All styling
fetch-assets.sh Downloads the paper PDFs/teaser images into papers/ and
                 images/papers/ — run this once, see below
papers/         Paper PDFs (populated by fetch-assets.sh)
cv.pdf          Your CV — not included, see below
images/         black_square.png (profile picture placeholder), papers/
                 (teaser images, populated by fetch-assets.sh), and
                 anything else you add
```

The left sidebar links to sections on this one page (`#about`, `#papers`,
etc.), not separate pages — it highlights whichever section is currently in
view as you scroll.

## Fetching the paper PDFs and images

`data.js` points each paper's `pdf` and `image` at local files under
`papers/` and `images/papers/`, but those files aren't in this zip — I
can't reach the hosts they come from (algohex.eu, EPFL, U-Tokyo) from the
sandbox this was built in. Run this once from the repo root, from a
machine with normal internet access:

```bash
bash fetch-assets.sh
```

It downloads each PDF and teaser image straight from its original source
into the right place — nothing to rename or move afterward. Re-run it any
time (e.g. once the SIGGRAPH Asia 2026 paper's PDF becomes public, or
after you add a paper of your own with the same pattern). The one
exception is the RO-MAN 2017 paper, which has no free PDF anywhere — its
`pdf` field in `data.js` stays pointed at the paywalled DOI.

## Adding new content

You should almost never need to touch `index.html`. Open `data.js` and:

- **New paper** → add an object to `PAPERS`. `link` is the paper's project
  or DOI page; `pdf` can be either a local path under `papers/` (add the
  matching download line to `fetch-assets.sh`) or an external URL if
  there's no free PDF (see the RO-MAN entry for the pattern). Optional
  fields: `image` (a representative figure — same local-or-external
  choice as `pdf`), `abstract` and `bibtex` (both render as collapsed
  dropdowns under the paper's links, with a copy button on the BibTeX
  block). Leave any of the three out and that part simply doesn't render
  for that paper.
- **New code project, or renaming one (e.g. TetWeave)** → add or edit an
  object in `CODE_PROJECTS`. Renaming is just changing the `name` field.
- **New award** → add an object to `AWARDS`. It's currently `[]`, and the
  whole "Awards & Funding" section (heading, sidebar link, everything)
  automatically hides itself whenever that array is empty — nothing else
  to toggle. It reappears on its own the moment you add an entry.
- **New job/role** → add an object to `EXPERIENCE` (keep most recent first
  — it renders as a timeline, so order matters).

Each array has a comment above it showing the exact shape expected, and
existing entries to copy from.

## Before you publish

Search the whole project for `[ADD:` — those are placeholders for things
I didn't have confirmed facts for: paper titles/links, exact dates, repo
URLs, and your GitHub/Scholar/LinkedIn links.

Two files to swap in yourself:

- `cv.pdf`, next to `index.html` — the "Download CV" button links to that
  filename but no file was generated for you.
- `images/black_square.png` — a solid black square standing in for your
  profile picture. Drop a real photo in `images/` and point `SITE.photo`
  in `data.js` at it (same square-ish crop works best, since the frame
  is a fixed square box).

## Local preview

From inside the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Publish to GitHub Pages

The repository must be named exactly `vnigolian.github.io` if you want it
served at the bare root URL `https://vnigolian.github.io` — GitHub requires
that exact repo name for a personal/user site, with no extra configuration
needed. (You can use any repo name instead and enable Pages manually in
Settings → Pages, but then the site lives at
`https://vnigolian.github.io/your-repo-name/` instead of the root — every
path in this site is relative, so it works fine either way.)

If you haven't created the repo yet, create an empty one on GitHub, then
from inside this folder:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin git@github.com:vnigolian/vnigolian.github.io.git
git push -u origin main
```

For subsequent updates:

```bash
git add .
git commit -m "Update content"
git push
```

The site is usually live within a minute of the push. If it's your first
time enabling Pages for this repo, check **Settings → Pages** on GitHub —
it should already show the source as the `main` branch, but confirm it if
the site doesn't appear right away.
