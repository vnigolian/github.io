/**
 * SITE CONTENT
 * ------------
 * This is the only file you should need to touch to add or change content.
 * Every list on the site (papers, projects, awards, experience, hobbies,
 * cats) is rendered from the arrays below by script.js. To add something
 * new, add one object to the relevant array — nothing else needs to change.
 *
 * Dates: use "YYYY" or "YYYY–YYYY" (en dash) or "YYYY–present".
 * Anywhere you see [ADD: ...], replace it with the real value.
 */

const SITE = {
  name: "Valentin Nigolian",
  role: "Digital geometry & geometry processing",
  tagline:
    "I work on volumetric mapping for tetrahedral meshes, and on the C++ that makes geometric algorithms fast enough to use.",
  location: "Biel/Bienne, Switzerland",
  email: "valentin.nigolian@gmail.com",
  cv: "cv.pdf",
  links: [
    { label: "Email", url: "mailto:valentin.nigolian@gmail.com" },
    { label: "GitHub", url: "[ADD: github.com/vnigolian]" },
    { label: "Google Scholar", url: "[ADD: scholar.google.com profile link]" },
    { label: "LinkedIn", url: "[ADD: linkedin.com/in/... ]" },
  ],
};

// One line each, kept short: what you'd say about yourself in an elevator.
const ABOUT = [
  "PhD in digital geometry, University of Bern (2024). Master's from EPFL (2019), including six months in Tokyo on my Master's thesis and two more during my PhD.",
  "One year of industry experience at GaitUp/Mindmaze, where I was sole designer of a cross-platform C++ SDK for body movement analysis.",
  "Core strengths: modern C++ (14–23), 3D geometric algorithms, mesh processing, numerical optimization (Eigen), Python, CI/CD.",
  "Long-term goal: teaching at a Fachhochschule, alongside continued research.",
];

const PAPERS = [
  {
    title: "[ADD: exact paper title]",
    venue: "SIGGRAPH",
    year: "[ADD: year]",
    authors: "[ADD: author list, you bolded or first-author as applicable]",
    link: "[ADD: DOI or project page URL]",
    pdf: "[ADD: pdf path or URL]",
    tags: ["tetrahedral meshing", "volumetric mapping"],
  },
  {
    title: "[ADD: second paper title]",
    venue: "[ADD: venue]",
    year: "[ADD: year]",
    authors: "[ADD: authors]",
    link: "[ADD: link]",
    pdf: "[ADD: pdf path or URL]",
    tags: ["isogeometric analysis"],
  },
  // Add more papers here — same shape as above.
];

const PROJECTS = [
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
    name: "GPU Sandbox",
    description:
      "A portfolio project exploring GPU computing and graphics programming outside the mesh-processing day job.",
    link: "[ADD: repo URL]",
    tags: ["GPU", "graphics"],
    status: "active",
  },
  {
    name: "FSU Surface Registration",
    description:
      "A Python pipeline for registering FSU mesh surfaces, used to set up boundary conditions for downstream simulation.",
    link: "[ADD: repo URL, if public]",
    tags: ["Python", "registration"],
    status: "archived",
  },
  // Add new projects here. `status` is just "active" or "archived" —
  // used only to fade archived items slightly, not to hide them.
];

const AWARDS = [
  {
    title: "[ADD: award/scholarship/prize name]",
    org: "[ADD: awarding body]",
    year: "[ADD: year]",
    description: "[ADD: one line on what it recognized]",
  },
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

const HOBBIES = [
  {
    title: "[ADD: hobby name]",
    description: "[ADD: a few sentences — what it is, why you like it]",
    image: "[ADD: images/hobby-1.jpg]",
  },
  // Add more hobbies here.
];

const CATS = [
  {
    name: "[ADD: cat's name]",
    description: "[ADD: a few sentences about them]",
    image: "[ADD: images/cat-1.jpg]",
    fact: "[ADD: one specific, slightly absurd fact about this cat]",
  },
  // Add more cats here.
];
