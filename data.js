/**
 * SITE CONTENT
 * ------------
 * This is the only file you should need to touch to add or change content.
 * Every list on the site (papers, code projects, awards, experience) is
 * rendered from the arrays below by script.js. To add something new, add
 * one object to the relevant array — nothing else needs to change.
 *
 * Dates: use "YYYY" or "YYYY–YYYY" (en dash) or "YYYY–present".
 * Anywhere you see [ADD: ...], replace it with the real value.
 */

const SITE = {
  name: "Valentin Nigolian",
  role: "Geometry Processing Research Scientist",
  tagline:
    "Although my main focus is on volumetric mapping for tetrahedral meshes, I'm looking for opportunities to bring my geometry processing and C++ expertise to the world! If you've got a related job, or if you want to collaborate on whatever, drop me a line!",
  location: "Biel/Bienne, Switzerland",
  photo: "images/black_square.png", // swap for a real photo whenever you have one
  cv: "cv.pdf",
  links: [
    { label: "Email", url: "mailto:valentin.nigolian@gmail.com" },
    { label: "GitHub", url: "https://github.com/vnigolian" },
    { label: "Google Scholar", url: "[ADD: scholar.google.com profile link]" },
    { label: "LinkedIn", url: "[ADD: linkedin.com/in/... ]" },
  ],
};

// One line each, kept short: what you'd say about yourself in an elevator.
const ABOUT = [
  "After obtaining my PhD in 2024 at the University of Bern under the supervision of David Bommes, I stayed for a 15-months-long postdoc in his group.",
  "Before that, I got a Master's degree from EPFL (2019), which included a 6 months Masters Thesis in Tokyo, under Takeo Igarashi's supervision.",
  "I also dipped my toes in the industry world over the course of a one year position as Software Engineer at GaitUp/Mindmaze, where I was the sole designer of a cross-platform C++ SDK for body movement analysis.",
  "My core strengths include geometry processing algorithms,  numerical optimization, modern C++ (14–23), Linear algebra (Eigen), and some Python and shell-scripting.",
  "I'm also a Blender and Unreal Engine enjoyer, always looking for ways to use these tools to enhance scientific visualisation.",
  "While unemployed, I'm focusing on improving my skills in GPU computation/rendering, and looking into AI applications to the geometry processing world."
];

const PAPERS = [
  {
    title: "[ADD: exact paper title]",
    venue: "SIGGRAPH",
    year: "[ADD: year]",
    authors: "[ADD: author list, you bolded or first-author as applicable]",
    // Both are external links (journal/DOI page, publisher or arXiv PDF) —
    // nothing here is hosted on this site, so there's no file to keep in sync.
    link: "[ADD: DOI or project page URL]",
    pdf: "[ADD: external PDF URL, e.g. arXiv or publisher link]",
    tags: ["tetrahedral meshing", "volumetric mapping"],
  },
  {
    title: "[ADD: second paper title]",
    venue: "[ADD: venue]",
    year: "[ADD: year]",
    authors: "[ADD: authors]",
    link: "[ADD: link]",
    pdf: "[ADD: external PDF URL]",
    tags: ["isogeometric analysis"],
  },
  // Add more papers here — same shape as above.
];

const CODE_PROJECTS = [
  {
    name: "TetWeave",
    // Renaming tomorrow? Just change `name` — nothing else references the old one.
    description:
      "A C++ library for generating tetrahedral meshes directly from parametric curves and surfaces, built around a shrink-and-expand boundary-deformation framework.",
    link: "[ADD: repo URL]",
    tags: ["C++", "tetrahedral meshing"],
    status: "active",
  },
  {
    name: "[ADD: project name]",
    description: "[ADD: one or two sentences on what it does]",
    link: "[ADD: repo URL]",
    tags: ["[ADD: tag]"],
    status: "active",
  },
  {
    name: "[ADD: project name]",
    description: "[ADD: one or two sentences on what it does]",
    link: "[ADD: repo URL]",
    tags: ["[ADD: tag]"],
    status: "active",
  },
  // Add new code projects here. `status` is "active" or "archived" —
  // used only to fade archived items slightly, not to hide them.
];

const AWARDS = [
 // {
 //   title: "[ADD: award/scholarship/prize name]",
 //   org: "[ADD: awarding body]",
 //   year: "[ADD: year]",
 //   description: "[ADD: one line on what it recognized]",
 // },
  // Add more awards here.
];

// Sequential — rendered as a timeline. Most recent first.
const EXPERIENCE = [
  {
    role: "[ADD: current role/title, if any]",
    org: "[ADD: organization]",
    start: "[ADD: start year]",
    end: "present",
    description: "[ADD: one or two lines]",
  },
  {
    role: "Postdoctoral Researcher",
    org: "University of Bern",
    start: "2024",
    end: "[ADD: end year, or 'present']",
    description:
      "Continued research on volumetric mapping for tetrahedral meshes, extending the shrink-and-expand framework toward isogeometric analysis and medical simulation applications.",
  },
  {
    role: "PhD Candidate, Digital Geometry",
    org: "University of Bern",
    start: "[ADD: start year]",
    end: "2024",
    description:
      "Doctoral research on digital geometry and geometry processing, including two months at a partner lab in Tokyo.",
  },
  {
    role: "SDK Engineer",
    org: "GaitUp / Mindmaze",
    start: "[ADD: start year]",
    end: "[ADD: end year]",
    description:
      "Sole designer and engineer of a cross-platform body movement analysis SDK in C++.",
  },
  {
    role: "Master's Student",
    org: "EPFL",
    start: "[ADD: start year]",
    end: "2019",
    description:
      "Master's thesis work included a six-month research stay in Tokyo.",
  },
  // Add more roles here, most recent first.
];
