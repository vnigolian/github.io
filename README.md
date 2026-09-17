# vnigolian.github.io

Personal site: papers, projects, awards, experience, hobbies, and cats.
Plain HTML/CSS/JS — no framework, no build step.

## Structure

```
index.html      Main page: hero, about, papers, projects, awards, experience
hobbies.html    Hobbies page
cats.html       Cats page
data.js         ALL content lives here — edit this to add/change things
script.js       Renders data.js into the pages, and draws the hero canvas
styles.css      All styling
cv.pdf          Your CV — not included, see below
images/         Put hobby/cat/project photos here
```

## Adding new content

You should almost never need to touch the HTML files. Open `data.js` and:

- **New paper** → add an object to `PAPERS`.
- **New project, or renaming one (e.g. TetWeave)** → add or edit an object
  in `PROJECTS`. Renaming is just changing the `name` field.
- **New award** → add an object to `AWARDS`.
- **New job/role** → add an object to `EXPERIENCE` (keep most recent first —
  it renders as a timeline, so order matters).
- **New hobby** → add an object to `HOBBIES`, with an image in `images/`.
- **New cat** → add an object to `CATS`, with an image in `images/`.

Each array has a comment above it showing the exact shape expected, and
existing entries to copy from.

## Before you publish

Search the whole project for `[ADD:` — those are placeholders for things
I didn't have confirmed facts for: paper titles/links, exact dates, repo
URLs, your GitHub/Scholar/LinkedIn links, hobby and cat photos.

You'll also need to drop a real `cv.pdf` next to `index.html` — the
"Download CV" button links to that filename but no file was generated for
you.

## Local preview

From inside the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. (Any static server works —
this just avoids `file://` issues with the JS `fetch`-free but still
script-loaded pages.)

## Publish to GitHub Pages

The repository must be named exactly `vnigolian.github.io` — GitHub Pages
then serves it automatically at `https://vnigolian.github.io`, with no
extra configuration.

If you haven't created the repo yet, create an empty one on GitHub named
`vnigolian.github.io`, then from inside this folder:

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
