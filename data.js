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
  name: "Valentin Z. Nigolian",
  role: "Geometry Processing Research Scientist",
  tagline:
    "Although my main focus is on volumetric mapping for tetrahedral meshes, I'm looking for opportunities to bring my geometry processing and C++ expertise to the world! If you've got a related job, or if you want to collaborate on whatever, drop me a line!",
  location: "Biel/Bienne, Switzerland",
  photo: "images/val_fun.jpg", // swap for a real photo whenever you have one
  cv: "Valentin-Nigolian-CV-2026.pdf",
  links: [
    { label: "Email", url: "mailto:valentin.nigolian@gmail.com" },
    { label: "GitHub", url: "https://github.com/vnigolian" },
    { label: "Google Scholar", url: "https://scholar.google.com/citations?hl=en&user=JMrC0IUAAAAJ" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/valentin-nigolian-a8b473145/" },
  ],
};

// One line each, kept short: what you'd say about yourself in an elevator.
const ABOUT = [
  "After obtaining my PhD in 2024 at the University of Bern's <a href=https://cgg.unibe.ch/>Computer Graphics Group </a> under the supervision of <a href=https://scholar.google.com/citations?user=NwQztEazRfUC&hl=en>David Bommes</a>, I stayed for a 15-months-long postdoc.",
  "Before that, I got a Master's degree from EPFL (2019), which included a 6 months Masters Thesis in Tokyo, under <a href=https://www-ui.is.s.u-tokyo.ac.jp/~takeo/>Takeo Igarashi</a>'s supervision.",
  "I also dipped my toes in the industry world over the course of a one year position as Software Engineer at <a href=https://www.gaitup.com/>GaitUp/Mindmaze</a>, where I was the sole designer of a cross-platform C++ SDK for body movement analysis.",
  "My core strengths include geometry processing algorithms, numerical optimisation, modern C++ (14–23), Linear algebra (Eigen), and some Python and shell-scripting.",
  "I'm also a Blender and Unreal Engine enjoyer, always looking for ways to use these tools to enhance scientific visualisation.",
  "With some time on my hands, I'm building skills in GPU computation/rendering, and looking into AI applications to the geometry processing world.",
  "Aside from research, my hobbies include video games, cooking (for my amazing partner or bigger groups), organising parties, and high-grade rum."
];

// Each paper can carry: title, venue, year, authors, link (project/DOI page),
// pdf (a free full text where one exists — see notes below), image (a
// representative figure), abstract, bibtex, and tags. All URLs here point
// at the papers' own project pages / hosts — nothing is mirrored on this
// site, so there's no file to keep in sync.
const PAPERS = [
  {
    title:
      "Robust Deformation-based 3D Bijective Mapping through Differential Boundary Shape Matching",
    venue: "ACM Transactions on Graphics (SIGGRAPH Asia 2026)",
    year: "2026",
    authors: "Valentin Z. Nigolian, Marcel Campen, David Bommes",
    link: "https://www.algohex.eu/publications/deformation-maps/",
    // Hosted locally — run fetch-assets.sh (or grab it manually, see the
    // README) to populate papers/deformation-maps.pdf from the source URL:
    // https://www.algohex.eu/publications/deformation-maps/boundary-deformation-maps-sga-2026.pdf
    pdf: "papers/deformation-maps.pdf",
    image: "images/papers/deformation-maps-teaser.png",
    abstract:
      "We introduce a novel framework to generate piecewise linear tetrahedral maps, by expressing the map-finding problem as a constrained mesh deformation problem, where constraints satisfaction implies both injectivity and target shape conformity. Deformation is supported by the two core components of our approach: First, an augmentation of the mesh by boundary-incident virtual elements, encoding the target shape in a differential manner via its first and second fundamental form; in contrast to position-driven approaches this prevents optimisation failure due to improper winding. Second, a remeshing scheme maintaining mesh element quality and preventing blocking configurations. A first implementation is empirically shown to have higher robustness and/or higher efficiency than state-of-the-art methods on challenging, yet practically relevant inputs. We illustrate our method's versatility in a range of applications, demonstrating its value as a new item in the algorithmic toolbox for volumetric mapping.",
    bibtex:
      "@article{Nigolian:2026:boundary_deformation_maps,\n  author = {Nigolian, Valentin Z. and Campen, Marcel and Bommes, David},\n  title = {Robust Deformation-based 3D Bijective Mapping through Differential Boundary Shape Matching},\n  journal = {ACM Transactions on Graphics},\n  volume = {45},\n  number = {6},\n  year = {2026},\n  publisher = {ACM},\n  address = {New York, NY, USA},\n  doi = {10.1145/3842573}\n}",
    tags: ["tetrahedral mapping", "mesh morphing"],
  },
  {
    title:
      "A Progressive Embedding Approach to Bijective Tetrahedral Maps driven by Cluster Mesh Topology",
    venue: "ACM Transactions on Graphics (SIGGRAPH Asia 2024)",
    year: "2024",
    authors: "Valentin Z. Nigolian, Marcel Campen, David Bommes",
    link: "https://www.algohex.eu/publications/cluster-mesh-sae/",
    pdf: "papers/cluster-mesh-sae.pdf",
    image: "images/papers/cluster-mesh-sae-teaser.png",
    abstract:
      "We present a novel algorithm to map ball-topology tetrahedral meshes onto star-shaped domains with guarantees regarding bijectivity. Our algorithm is based on the recently introduced idea of Shrink-and-Expand, where images of interior vertices are initially clustered at one point (Shrink-), before being sequentially moved to non-degenerate positions yielding a bijective map (-and-Expand). In this context, we introduce the concept of the cluster mesh, i.e. the unexpanded interior mesh consisting of geometrically degenerate simplices. Using local, per-vertex connectivity information solely from the cluster mesh, we show that a viable expansion sequence guaranteed to produce a bijective map can always be found as long as the mesh is shellable. In addition to robustness guarantees for this ubiquitous class of inputs, other practically relevant benefits include improved parsimony and reduced algorithmic complexity. While inheriting some of the worst-case high run time requirements of the state of the art, significant acceleration for the average case is experimentally demonstrated.",
    bibtex:
      "@article{Nigolian:2024:cluster_mesh_SAE,\n  author = {Nigolian, Valentin Z. and Campen, Marcel and Bommes, David},\n  title = {A Progressive Embedding Approach to Bijective Tetrahedral Maps driven by Cluster Mesh Topology},\n  journal = {ACM Transactions on Graphics},\n  volume = {43},\n  number = {6},\n  year = {2024},\n  publisher = {ACM},\n  address = {New York, NY, USA},\n  doi = {10.1145/3687992}\n}",
    tags: ["tetrahedral mapping", "robust methods"],
  },
  {
    title: "Expansion Cones: A Progressive Volumetric Mapping Framework",
    venue: "ACM Transactions on Graphics (SIGGRAPH 2023)",
    year: "2023",
    authors: "Valentin Z. Nigolian, Marcel Campen, David Bommes",
    link: "https://www.algohex.eu/publications/expansion-cones/",
    // High-res by default per your note — expansion-cones-sg-2023-lowres.pdf
    // is available from the same page if you want to swap to that later.
    pdf: "papers/expansion-cones.pdf",
    image: "images/papers/expansion-cones-teaser.png",
    abstract:
      "Volumetric mapping is a ubiquitous and difficult problem in Geometry Processing and has been the subject of research in numerous and various directions. While several methods show encouraging results, the field still lacks a general approach with guarantees regarding map bijectivity. Through this work, we aim at opening the door to a new family of methods by providing a novel framework based on the concept of progressive expansion. Starting from an initial map of a tetrahedral mesh whose image may contain degeneracies but no inversions, we incrementally adjust vertex images to expand degenerate elements. By restricting movement to so-called expansion cones, it is done in such a way that the number of degenerate elements decreases in a strictly monotonic manner, without ever introducing any inversion. Adaptive local refinement of the mesh is performed to facilitate this process. We describe a prototype algorithm in the realm of this framework for the computation of maps from ball-topology tetrahedral meshes to convex or star-shaped domains. This algorithm is evaluated and compared to state-of-the-art methods, demonstrating its benefits in terms of bijectivity. We also discuss the associated cost in terms of sometimes significant mesh refinement to obtain the necessary degrees of freedom required for establishing a valid mapping. Our conclusions include that while this algorithm is only of limited immediate practical utility due to efficiency concerns, the general framework has the potential to inspire a range of novel methods improving on the efficiency aspect.",
    bibtex:
      "@article{Nigolian:2023:SchrEx,\n  author = {Nigolian, Valentin Z. and Campen, Marcel and Bommes, David},\n  title = {Expansion Cones: A Progressive Volumetric Mapping Framework},\n  journal = {ACM Transactions on Graphics},\n  volume = {42},\n  number = {4},\n  year = {2023},\n  publisher = {ACM},\n  address = {New York, NY, USA},\n  doi = {10.1145/3592421}\n}",
    tags: ["tetrahedral mapping", "robust methods"],
  },
  {
    title: "INVANER: INteractive VAscular Network Editing & Repair",
    venue: "UIST 2019",
    year: "2019",
    authors: "Valentin Z. Nigolian, Takeo Igarashi, Hirofumi Seo",
    link: "https://www-ui.is.s.u-tokyo.ac.jp/~takeo/research/invaner/index.html",
    pdf: "papers/invaner.pdf",
    image: "images/papers/invaner-teaser.jpg",
    abstract:
      "Vascular network reconstruction is an essential aspect of the daily practice of medical doctors working with vascular systems. Accurately representing vascular networks, not only graphically but also in a way that encompasses their structure, can be used to run simulations, plan medical procedures or identify real-life diseases, for example. A vascular network is thus reconstructed from a 3D medical image sequence via segmentation and skeletonization. Many automatic algorithms exist to do so but tend to fail for specific corner cases. On the other hand, manual methods exist as well but are tedious to use and require a lot of time. In this paper, we introduce an interactive vascular network reconstruction system called INVANER that relies on a graph-like representation of the network's structure. A general skeleton is obtained with an automatic method and medical practitioners are allowed to manually repair the local defects where this method fails. Our system uses graph-related tools with local effects and introduces two novel tools, dedicated to solving two common problems arising when automatically extracting the centerlines of vascular structures: so-called \"Kissing Vessels\" and a type of phenomenon we call \"Dotted Vessels.\"",
    bibtex:
      "@inproceedings{Nigolian:2019:INVANER,\n  author = {Nigolian, Valentin Z. and Igarashi, Takeo and Seo, Hirofumi},\n  title = {INVANER: INteractive VAscular Network Editing \\& Repair},\n  booktitle = {Proceedings of the 32nd Annual ACM Symposium on User Interface Software and Technology},\n  series = {UIST '19},\n  year = {2019},\n  pages = {1197--1209},\n  publisher = {ACM},\n  address = {New York, NY, USA},\n  doi = {10.1145/3332165.3347900}\n}",
    tags: ["medical visualisation", "interactive systems"],
  },
  {
    title:
      "Self-reconfigurable Modular Robot Interface Using Virtual Reality: Arrangement of Furniture Made Out of Roombots Modules",
    venue: "IEEE RO-MAN 2017",
    year: "2017",
    authors:
      "Valentin Z. Nigolian, Mehmet Mutlu, Simon Hauser, Alexandre Bernardino, Auke J. Ijspeert",
    link: "https://www.epfl.ch/labs/biorob/students/past/page-128174-en-html/",
    pdf: "papers/roombots-vr.pdf",
    image: "images/papers/roman-teaser.png",
    abstract:
      "Roombots are self-reconfigurable modular robots. They are one of the current projects of BioRob, the Biorobotics Laboratory at EPFL. Its main purpose is to create self-reconfigurable adaptive furniture and has many applications. One of them is to make disabled people more independent by providing a smart interface adapted to their daily physical challenges, allowing them to move their furniture by themselves through the use of Roombots. This project explores new ways to interact with modular robots by using a gesture-based interface with a Virtual Reality (VR) visual feed-back, for a more immersive apprehension of the virtual world. The goal is to enable the user to quickly set up a room using furniture made out of Roombots modules and then finally visualize the Roombots building the desired furnitures.",
    bibtex:
      "@inproceedings{Nigolian:2017:RoombotsVR,\n  author = {Nigolian, Valentin Z. and Mutlu, Mehmet and Hauser, Simon and Bernardino, Alexandre and Ijspeert, Auke J.},\n  title = {Self-reconfigurable Modular Robot Interface Using Virtual Reality: Arrangement of Furniture Made Out of Roombots Modules},\n  booktitle = {2017 26th IEEE International Symposium on Robot and Human Interactive Communication (RO-MAN)},\n  year = {2017},\n  publisher = {IEEE},\n  doi = {10.1109/ROMAN.2017.8172390}\n}",
    tags: ["human-robot interaction", "virtual reality"],
  },
  // Add more papers here — same shape as above.
];

const CODE_PROJECTS = [
  {
    name: "TetSweep (Coming VERY SOON)",
    // Renaming tomorrow? Just change `name` — nothing else references the old one.
    description:
      "A C++ library for generating tetrahedral meshes directly from parametric curves and surfaces, built around a shrink-and-expand boundary-deformation framework.",
    link: "https://github.com/vnigolian/TetSweep",
    tags: ["C++", "tetrahedral meshing"],
    status: "active",
    image: "images/para_helicoidal_ring.png"
  },
  {
    name: "Shrink-and-Expand",
    // Renaming tomorrow? Just change `name` — nothing else references the old one.
    description:
      "Reference C++ implementation of the latest Shrink-and-Expand method (cf. paper above).",
    link: "https://github.com/cgg-bern/cluster-mesh-SAE",
    tags: ["C++", "tetrahedral mapping"],
    status: "active",
    image: "images/papers/cluster-mesh-sae-teaser.png",
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
    role: "Postdoctoral Researcher",
    org: "University of Bern",
    start: "2024",
    end: "2026",
    description:
      "Focused on boundary-deformation-driven tetrahedral mapping, resulting in a SIGGRAPH Asia publication (see above).",
  },
  {
    role: "PhD Student, Geometry Processing",
    org: "University of Bern",
    start: "2020",
    end: "2024",
    description:
      "Doctoral research on robust tetrahedral mapping. I graduated Summa Cum Laude, under the supervision of David Bommes. This work included a two months visit in Tokyo.",
  },
  {
    role: "Software Engineer",
    org: "GaitUp / Mindmaze",
    start: "2019",
    end: "2020",
    description:
      "Sole designer of a C++ cross-platform body movement analysis SDK, deployed on various devices (iOS, Android, Linux, Windows, in-house firmware)."
  },
  {
    role: "Master's Student",
    org: "EPFL",
    start: "2016",
    end: "2019",
    description:
      "Master's thesis work included a six-month research stay at the University of Tokyo, in Takeo Igarashi's User Interface Research Group.",
  },
  // Add more roles here, most recent first.
];
