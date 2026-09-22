/**
 * Interactive backdrop: three modes, cycled by the #bg-mode-toggle button.
 * Every page load always starts in "animation" (see the `mode` initializer
 * below) — nothing is remembered across reloads.
 *
 *   "voronoi"  — a live Voronoi diagram. Click anywhere on the backdrop
 *                to drop a new point, or press and drag to lay down a
 *                trail of points (one every few pixels of movement); the
 *                diagram updates instantly either way.
 *   "circles"  — a handful of draggable, roughly-circular point clusters
 *                (each a random number of boundary vertices, 8–20) plus a
 *                scatter of hidden random points (some of them outside
 *                the visible canvas, so the mesh spills past the edge of
 *                the page), all fed into one live Delaunay triangulation.
 *                There's no actual circle drawn — what you see and drag
 *                is the polygon formed by each cluster's own boundary
 *                vertices, interpolated by straight edges. Drag one and
 *                the triangulation follows it in real time. Click empty
 *                backdrop (not on an existing cluster) to drop a new one,
 *                sized and shaped randomly within the same CONFIG
 *                parameters as the initial seed. A "repulse" checkbox
 *                gently pushes overlapping clusters apart every frame —
 *                a different kind of smoothing than Voronoi mode's
 *                "smooth": spacing instead of mesh regularity.
 *   "animation" — a numbered sequence of background images, scrubbed by
 *                scroll position instead of time (see updateAnimationFrame
 *                below). While a frame that's needed hasn't finished
 *                loading (and decoding) yet, this falls back to the same
 *                plain CSS background-image <body> otherwise uses (see
 *                styles.css) — so there's always something reasonable to
 *                show even before/between frames arriving.
 *
 * Uses d3-delaunay (vendor/d3-delaunay.min.js), which must be loaded
 * before this file. Everything here is a single self-contained IIFE so
 * it doesn't leak globals beyond the vendored `d3`.
 *
 * --------------------------------------------------------------------
 * Tunable parameters — see the CONFIG block right below. Also documented
 * in README.md so they don't need spelunking through this file to find.
 * --------------------------------------------------------------------
 */
(function () {
  const CONFIG = {
    // Colors. "Faces" = the flat background fill behind everything else;
    // edges are theme-dependent instead (see edgeColor()/insideEdgeColor()
    // below) so they stay legible over the constant face color in both
    // themes.
    FACE_COLOR: "#2E24FFFF",
    VERTEX_COLOR: "#FF1C69FF", // Voronoi points, and circle-interior faces
    CIRCLE_FIXED_COLOR: "#FF4419FF", // fill/outline for a "fixed" circle's own cut-out
    EDGE_WIDTH: 3,
    EDGE_COLOR_DARK: "#000000", // edge color in dark theme (outside circles)
    EDGE_COLOR_LIGHT: "#ffffff", // edge color in light theme (outside circles)
    // Inside a circle in "circles" mode, the dark/light edge logic is
    // inverted (see insideEdgeColor()), so circle interiors read as a
    // distinct "cut-out" from the rest of the mesh.

    VORONOI_POINT_RADIUS: 5,
    // While the mouse/finger is held down in "voronoi" mode, a new point
    // is added every time it has moved this many pixels since the last
    // one dropped (a plain click with no movement still drops exactly
    // one point, at pointerdown).
    VORONOI_DRAG_MIN_DISTANCE: 50,

    CIRCLE_COUNT: 20, // number of draggable circles in "circles" mode
    CIRCLE_MIN_RADIUS: 36,
    CIRCLE_RADIUS_RANGE: 70, // circle radius = MIN_RADIUS + random()*RANGE
    CIRCLE_MIN_VERTICES: 8, // random boundary-vertex count, inclusive
    CIRCLE_MAX_VERTICES: 12, // random boundary-vertex count, inclusive
    HIDDEN_POINT_DENSITY: 10000, // lower = more hidden Voronoi-basis points
    // Extra points scattered OUTSIDE the canvas (as a fraction of
    // width/height beyond each edge), so the triangulation's outer
    // triangles extend past the visible page instead of stopping in a
    // hard line right at the viewport boundary. The canvas clips
    // anything drawn beyond its own bounds, so these just make the mesh
    // look like it keeps going off-screen.
    OUTER_POINT_MARGIN: 0.25,
    OUTER_POINT_DENSITY: 26000, // same density scale as HIDDEN_POINT_DENSITY

    VORONOI_SEED_DENSITY: 20000, // lower = more initial Voronoi points
    // With "smooth" checked, every animation frame each point moves this
    // fraction of the way toward its own Voronoi cell's centroid (Lloyd's
    // algorithm) — small steps taken every frame read as a smooth,
    // continuous drift converging toward a centroidal Voronoi diagram,
    // rather than jumping straight there.
    LLOYD_STEP: 0.1,
    // With "repulse" checked (circles mode), any two overlapping clusters
    // push apart by this fraction of their overlap depth, every frame —
    // gentle enough to read as settling into place rather than jumping.
    CIRCLE_REPEL_STEP: 0.05,
    // Clusters settle once their center distance reaches this multiple of
    // their summed radii (not exactly 1x) — a small safety margin so they
    // come to rest just clear of true tangency instead of exactly at it,
    // which otherwise let the Delaunay triangulation flip rapidly back and
    // forth right at the boundary between "touching" and "not touching".
    CIRCLE_REPEL_MARGIN: 1.5,
    // A dead zone (px of remaining overlap) below which repulsion stops
    // pushing entirely. Without this, a pair sitting almost exactly at
    // CIRCLE_REPEL_MARGIN's threshold can flicker between "overlapping"
    // and "not" from one animation frame to the next (float rounding, or
    // a third circle nudging them a hair) — each flip re-triangulates
    // with a fractionally different position, which is what was actually
    // causing the residual flicker even after the 1.1x margin.
    CIRCLE_REPEL_EPSILON: 0.5,
    // A circle whose computed movement THIS FRAME (after summing the push
    // from every overlapping neighbor) is smaller than this many pixels
    // just stops outright — it's not moved at all that frame, rather than
    // being nudged its own tiny fraction of a pixel. It's specifically the
    // very-low-speed end of the settling motion that flickers (the
    // triangulation is most degenerate right as a near-regular polygon
    // stops moving), so cutting off movement below this speed removes the
    // flicker without changing where things visibly come to rest.
    CIRCLE_REPEL_MIN_SPEED: 0.05,
    // How far the pointer may move between down and up, in "circles"
    // mode, before a press-on-an-existing-circle counts as a drag instead
    // of a click. Below this, it's a click: toggle that circle "fixed".
    CIRCLE_CLICK_MAX_MOVEMENT: 4,
    // "circles" mode's Delaunay triangulation is only recomputed once
    // every this-many animation frames (1 = every frame, i.e. no
    // throttling) — see cachedCircleTriangles/getCircleTriangles below.
    // Point *positions* are still read fresh every single frame either
    // way, so shapes keep moving smoothly; only the connectivity (which
    // point connects to which) updates less often, which cuts down on how
    // often a near-regular polygon's degenerate triangulation gets a
    // chance to flip. A brand new circle (or one removed) always forces
    // an immediate recompute regardless of this counter, since reusing
    // stale connectivity across a point-count change would index past the
    // end of the point array.
    CIRCLE_RETRIANGULATE_EVERY_N_FRAMES: 10,

    // "animation" mode: a numbered sequence of background images, scrubbed
    // by scroll position instead of time — scrolling from the top of the
    // page to the bottom steps linearly through frame 1 to frame
    // ANIMATION_FRAME_COUNT. Files are expected at
    // `${ANIMATION_FRAME_DIR}${frame number, zero-padded to
    // ANIMATION_FRAME_PAD digits}${ANIMATION_FRAME_EXT}`, e.g.
    // "images/bg-frames/0001.jpg" through "images/bg-frames/0025.jpg" for
    // the defaults below.
    ANIMATION_FRAME_DIR: "images/bg-frames/",
    ANIMATION_FRAME_COUNT: 50,
    ANIMATION_FRAME_PAD: 4,
    ANIMATION_FRAME_EXT: ".jpg",
    // Frames aren't all fetched at once — see preloadAnimationFrames. This
    // many (nearest to wherever the page happens to be scrolled to) start
    // downloading immediately, in one burst; the rest only start once that
    // burst has actually landed. Fetching all of them at once means every
    // frame splits the same bandwidth, so even the handful actually needed
    // right away take longer to arrive than they would alone — this is
    // what caused flickering/incomplete frames the first time someone
    // scrolled, before the whole set had finished loading. A small burst
    // first means those frames land fast and uncontested, "buffering" a
    // stretch of scrollable animation before the rest trickle in behind
    // it for whenever the person scrolls further than that.
    ANIMATION_PRELOAD_BURST_COUNT: 10,
  };

  // Restore a previously-set drag distance, if any (see the "drag" number
  // input in the voronoi-controls panel below).
  {
    const savedDragDistance = parseFloat(localStorage.getItem("voronoiDragDistance"));
    if (Number.isFinite(savedDragDistance) && savedDragDistance > 0) {
      CONFIG.VORONOI_DRAG_MIN_DISTANCE = savedDragDistance;
    }
  }

  const canvas = document.getElementById("bg-canvas");
  const modeBtn = document.getElementById("bg-mode-toggle");
  const voronoiControls = document.getElementById("voronoi-controls");
  const smoothCheckbox = document.getElementById("voronoi-smooth-checkbox");
  const dragDistanceInput = document.getElementById("voronoi-drag-distance");
  const circlesControls = document.getElementById("circles-controls");
  const repulseCheckbox = document.getElementById("circle-repulse-checkbox");
  const layerA = document.getElementById("bg-anim-layer-a");
  const layerB = document.getElementById("bg-anim-layer-b");
  const clickHint = document.getElementById("bg-click-hint");
  if (!canvas || typeof d3 === "undefined") return;
  const ctx = canvas.getContext("2d");

  const MODES = ["voronoi", "circles", "animation"];
  const MODE_ICON = { voronoi: "🔺", circles: "⚪", animation: "🎬" };
  const MODE_LABEL = {
    voronoi: "Live Voronoi diagram — click or drag on the backdrop to add points",
    circles: "Live Delaunay triangulation — click to add a cluster, drag one to move it",
    animation: "Scroll-controlled animation — scroll the page to scrub through it",
  };
  const MODE_CURSOR = { voronoi: "crosshair", circles: "grab", animation: "default" };

  // Every page load always starts in "animation" — no saved preference is
  // read or written for it, so reloading (or opening in a new tab) always
  // lands back here, even after toggling to a particular mode by hand
  // during a previous visit. Toggling during THIS visit still switches
  // modes normally; it just doesn't carry over to the next reload.
  //
  // index.html's <head> sets this same starting mode before first paint
  // too (see window.__initialBgMode there) — that's what lets
  // html[data-bg-mode] in styles.css hide body's static background-image
  // from the very first frame for voronoi/circles, instead of it flashing
  // once before this script even runs. Falling back to "animation" here
  // too in case that inline script is ever missing/blocked.
  let mode = MODES.includes(window.__initialBgMode) ? window.__initialBgMode : "animation";

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  // Voronoi mode state: just a flat list of [x, y] points.
  let voronoiPoints = [];

  // Circles mode state: draggable circles, each carrying its own random
  // boundary-vertex count, plus points that never move — both feed the
  // same Delaunay triangulation. hiddenPoints sit inside the canvas;
  // outerPoints sit outside it (see OUTER_POINT_MARGIN above).
  let circles = [];
  let hiddenPoints = [];
  let outerPoints = [];
  let draggingIndex = -1;

  // Circles mode click-vs-drag disambiguation: pointerdown on an existing
  // circle always starts a potential drag (draggingIndex), but if the
  // pointer barely moves before release, it's treated as a click instead
  // — toggling that circle's "fixed" state (see endDrag below) rather
  // than "dragging" it a negligible distance.
  let clickCandidateIndex = -1;
  let pointerDownX = 0;
  let pointerDownY = 0;

  // Voronoi mode drag-to-add state.
  let voronoiDragging = false;
  let voronoiLastPoint = null;

  // Voronoi mode "smooth" (Lloyd relaxation) state.
  let smoothEnabled = localStorage.getItem("voronoiSmooth") === "1";
  let smoothAnimHandle = null;

  // Circles mode "repulse" (mutual circle repulsion) state.
  let repulseEnabled = localStorage.getItem("circleRepulse") === "1";
  let repulseAnimHandle = null;

  // Circles-mode triangulation throttle — see getCircleTriangles() and
  // CONFIG.CIRCLE_RETRIANGULATE_EVERY_N_FRAMES above.
  let cachedCircleTriangles = null;
  let cachedCirclePointCount = -1;
  let circleFrameCounter = 0;

  // "animation" mode state:
  //  - animationImages[i] tracks each frame's own <img> (which starts and
  //    caches its download the moment preloadAnimationFrames runs) and
  //    whether that download has actually finished — see
  //    preloadAnimationFrames/updateAnimationFrame below.
  //  - animationFramesPreloaded guards against kicking off the preload
  //    more than once.
  //  - animationShownBase/animationShownFrac remember what's currently
  //    actually painted (as opposed to what the scroll position calls
  //    for), so a still-loading frame simply leaves the last successfully
  //    shown one in place rather than flashing to something blank.
  let animationImages = [];
  let animationFramesPreloaded = false;
  let animationShownBase = -1;
  let animationShownFrac = -1;

  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  // Edge color outside any circle: black on the light theme, white on the
  // dark theme (i.e. the edges always read as the "ink" extreme opposite
  // the theme's own tone).
  function edgeColor() {
    return currentTheme() === "light" ? CONFIG.EDGE_COLOR_LIGHT : CONFIG.EDGE_COLOR_DARK;
  }

  // Inside a circle, the same logic is inverted.
  function insideEdgeColor() {
    return currentTheme() === "light" ? CONFIG.EDGE_COLOR_DARK : CONFIG.EDGE_COLOR_LIGHT;
  }

  function randomPoint() {
    return [Math.random() * width, Math.random() * height];
  }

  function seedVoronoi() {
    const count = Math.max(20, Math.round((width * height) / CONFIG.VORONOI_SEED_DENSITY));
    voronoiPoints = Array.from({ length: count }, randomPoint);
  }

  // Path to a given (0-indexed) animation frame's image file.
  function animationFramePath(index) {
    const num = String(index + 1).padStart(CONFIG.ANIMATION_FRAME_PAD, "0");
    return CONFIG.ANIMATION_FRAME_DIR + num + CONFIG.ANIMATION_FRAME_EXT;
  }

  // Kicks off ONE frame's download, exactly once per index (an <img>
  // starts fetching the moment its .src is set, whether or not it's ever
  // inserted into the page, and the browser caches the result — so a
  // later CSS background-image referencing the same URL paints instantly
  // instead of re-fetching). Safe to call more than once for the same
  // index — returns the same settle promise every time, without
  // re-requesting, once animationImages[i] already exists.
  //
  // The returned promise resolves once this frame is either loaded (and
  // decoded — see the onload handler) or has given up trying (onerror) —
  // never rejects, so a single bad/missing frame file can't get stuck and
  // block preloadAnimationFrames' second wave below forever.
  function startFrameLoad(i) {
    if (animationImages[i]) return animationImages[i].settled;
    const entry = { img: new Image(), loaded: false };
    entry.settled = new Promise((resolve) => {
      entry.img.onload = () => {
        // decode() finishes the actual pixel-decoding work before its
        // promise resolves, so painting the image right afterwards is
        // instant. Without this, marking a frame "loaded" straight off
        // `onload` (which only means the bytes finished downloading)
        // could still leave a still-undecoded image assigned as a CSS
        // background-image — and while it decodes, some browsers paint
        // that spot as if there were no background-image at all, letting
        // body's own static backdrop flash through for a frame. That's
        // what caused the random single-frame flickers to the static
        // image while scrolling through freshly-arriving frames.
        entry.img
          .decode()
          .catch(() => {}) // still show it even if decode() itself errors
          .then(() => {
            entry.loaded = true;
            updateAnimationFrame(); // in case frame i is exactly what's now needed
            resolve();
          });
      };
      entry.img.onerror = resolve;
    });
    entry.img.src = animationFramePath(i);
    animationImages[i] = entry;
    return entry.settled;
  }

  // Starts every frame downloading, nearest-to-`priorityIndex` first, but
  // in two waves rather than all at once — see CONFIG.ANIMATION_PRELOAD_
  // BURST_COUNT above for why. The first (small) wave starts immediately;
  // the second only once every frame in the first has either finished
  // loading or given up (see startFrameLoad's `settled` promise), so it
  // never competes with the first wave for bandwidth. Scrolling ahead of
  // both waves still works — see updateAnimationFrame, which calls
  // startFrameLoad directly for whatever frame is actually needed,
  // regardless of this schedule.
  function preloadAnimationFrames(priorityIndex) {
    if (animationFramesPreloaded) return;
    animationFramesPreloaded = true;
    const order = [];
    for (let i = 0; i < CONFIG.ANIMATION_FRAME_COUNT; i++) order.push(i);
    order.sort((a, b) => Math.abs(a - priorityIndex) - Math.abs(b - priorityIndex));
    animationImages = new Array(CONFIG.ANIMATION_FRAME_COUNT);

    const burstCount = Math.min(CONFIG.ANIMATION_PRELOAD_BURST_COUNT, order.length);
    const burst = order.slice(0, burstCount);
    const rest = order.slice(burstCount);

    Promise.all(burst.map(startFrameLoad)).then(() => rest.forEach(startFrameLoad));
  }

  function isAnimationFrameLoaded(index) {
    const entry = animationImages[index];
    return !!entry && entry.loaded;
  }

  // Bumps a not-yet-loaded frame's fetch priority (supported in
  // Chromium/Edge; a no-op property set elsewhere) so that whichever frame
  // the user has actually scrolled to jumps ahead of the hundred others
  // still queued from the initial nearest-to-start preload order. Without
  // this, scrolling fast to a far-off frame before the initial preload
  // queue reaches it left that frame stuck behind everything else.
  function bumpFramePriority(index) {
    // Also covers the case where this frame hasn't even started loading
    // yet — e.g. it's part of the "rest" wave in preloadAnimationFrames,
    // still waiting on the burst wave to finish. startFrameLoad is a
    // no-op if it's already in flight, so this always ends up with an
    // actual in-progress request to bump the priority of.
    startFrameLoad(index);
    const entry = animationImages[index];
    if (entry && !entry.loaded) entry.img.fetchPriority = "high";
  }

  // Picks the frame(s) for the current scroll position — index 0 at the
  // very top of the page, CONFIG.ANIMATION_FRAME_COUNT - 1 at the very
  // bottom, linearly in between, at whatever FRACTIONAL position that
  // works out to (not rounded to the nearest whole frame) — and
  // cross-fades between the two frames straddling it: layer A always
  // shows the lower ("base") frame at full opacity, layer B shows the
  // next one up, faded in by exactly the fractional part. Scrolling from
  // frame 3 to frame 4 this way dissolves smoothly through every point in
  // between rather than jump-cutting, so fewer source frames are needed
  // for the same perceived smoothness.
  //
  // Neither layer is ever pointed at a frame that hasn't finished loading
  // yet — see isAnimationFrameLoaded — so scrolling ahead of the preload
  // simply holds the last fully-loaded combination in place instead of
  // flashing to a blank layer; the moment the needed frame's download
  // completes, its own onload (above) re-calls this and catches up.
  function updateAnimationFrame() {
    if (mode !== "animation") return;
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const fraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    const floatIndex = fraction * (CONFIG.ANIMATION_FRAME_COUNT - 1);
    const base = Math.floor(floatIndex);
    const frac = floatIndex - base;
    const next = Math.min(base + 1, CONFIG.ANIMATION_FRAME_COUNT - 1);

    // Make sure the frames actually needed right now (rather than
    // whichever ones happened to be queued first) get bumped to the front
    // of the browser's own fetch queue.
    bumpFramePriority(base);
    bumpFramePriority(next);

    // If the exact frame for this scroll position hasn't loaded yet, just
    // keep showing whatever's already on screen (do nothing) until it, or
    // a later frame the scrolling has since moved on to, finishes loading
    // — rather than jumping to some other, possibly far-off frame that
    // happens to be loaded already.
    if (base !== animationShownBase && isAnimationFrameLoaded(base)) {
      animationShownBase = base;
      layerA.style.backgroundImage =
        "linear-gradient(var(--backdrop-tint), var(--backdrop-tint)), url(\"" + animationFramePath(base) + "\")";
    }
    const targetFrac = isAnimationFrameLoaded(next) ? frac : 0;
    if (targetFrac !== animationShownFrac) {
      animationShownFrac = targetFrac;
      if (targetFrac > 0) {
        layerB.style.backgroundImage =
          "linear-gradient(var(--backdrop-tint), var(--backdrop-tint)), url(\"" + animationFramePath(next) + "\")";
      }
      layerB.style.opacity = targetFrac;
    }
  }

  // A single random cluster (random radius and boundary-vertex count,
  // within CONFIG's parameters) at a given center — used both to seed the
  // initial set and to drop a new one wherever the backdrop is clicked.
  function makeCircle(x, y) {
    return {
      x,
      y,
      r: CONFIG.CIRCLE_MIN_RADIUS + Math.random() * CONFIG.CIRCLE_RADIUS_RANGE,
      n:
        CONFIG.CIRCLE_MIN_VERTICES +
        Math.floor(Math.random() * (CONFIG.CIRCLE_MAX_VERTICES - CONFIG.CIRCLE_MIN_VERTICES + 1)),
      phase: Math.random() * Math.PI * 2,
      fixed: false, // click-to-toggle: still repulses others, but doesn't move
    };
  }

  function seedCircles() {
    circles = Array.from({ length: CONFIG.CIRCLE_COUNT }, () =>
      makeCircle(Math.random() * width, Math.random() * height)
    );

    const hiddenCount = Math.max(30, Math.round((width * height) / CONFIG.HIDDEN_POINT_DENSITY));
    hiddenPoints = Array.from({ length: hiddenCount }, randomPoint);

    const marginX = width * CONFIG.OUTER_POINT_MARGIN;
    const marginY = height * CONFIG.OUTER_POINT_MARGIN;
    const outerCount = Math.max(20, Math.round((width * height) / CONFIG.OUTER_POINT_DENSITY));
    outerPoints = Array.from({ length: outerCount }, () => [
      -marginX + Math.random() * (width + marginX * 2),
      -marginY + Math.random() * (height + marginY * 2),
    ]).filter(([x, y]) => x < 0 || x > width || y < 0 || y > height);
  }

  function circleBoundary(c) {
    const pts = [];
    for (let i = 0; i < c.n; i++) {
      const a = c.phase + (i / c.n) * Math.PI * 2;
      pts.push([c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r]);
    }
    return pts;
  }

  function allCirclePoints() {
    const pts = hiddenPoints.concat(outerPoints);
    circles.forEach((c) => pts.push(...circleBoundary(c)));
    return pts;
  }

  // Returns the current triangle index list for "circles" mode, only
  // actually recomputing it once every CIRCLE_RETRIANGULATE_EVERY_N_FRAMES
  // calls (see that CONFIG comment) — every other call just reuses the
  // last one. Forces an immediate recompute regardless of the frame
  // counter whenever the point count has changed (a circle added or
  // removed), since stale indices would otherwise point past the end of a
  // shrunk `pts` array, and there's nothing valid to reuse for a grown one
  // anyway.
  function getCircleTriangles(pts) {
    circleFrameCounter++;
    // While a circle is actively being dragged, skip the throttle
    // entirely and recompute every frame — the whole point of the
    // throttle is to cut down on settling-motion flicker, but a manual
    // drag needs the mesh to track the pointer exactly, every frame, the
    // way it always has.
    const dueForRecompute =
      draggingIndex !== -1 || circleFrameCounter % CONFIG.CIRCLE_RETRIANGULATE_EVERY_N_FRAMES === 0;
    const countChanged = pts.length !== cachedCirclePointCount;
    if (cachedCircleTriangles === null || countChanged || dueForRecompute) {
      cachedCircleTriangles = d3.Delaunay.from(pts).triangles;
      cachedCirclePointCount = pts.length;
    }
    return cachedCircleTriangles;
  }

  // Area-weighted centroid of a closed polygon ring (first point repeated
  // as the last, which is exactly what d3's voronoi.cellPolygon returns).
  // Standard shoelace-formula centroid.
  function polygonCentroid(poly) {
    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length - 1; i++) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[i + 1];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
    area *= 0.5;
    if (area === 0) return poly[0]; // degenerate (near-zero-area) cell
    return [cx / (6 * area), cy / (6 * area)];
  }

  // One Lloyd-relaxation step: nudges every point a fraction of the way
  // toward its own Voronoi cell's centroid. Called every animation frame
  // while "smooth" is checked, so the mesh visibly drifts toward a
  // centroidal Voronoi diagram rather than jumping straight there.
  function lloydStep() {
    if (voronoiPoints.length < 3) return;
    const delaunay = d3.Delaunay.from(voronoiPoints);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    voronoiPoints = voronoiPoints.map((p, i) => {
      const cell = voronoi.cellPolygon(i);
      if (!cell) return p;
      const c = polygonCentroid(cell);
      return [p[0] + (c[0] - p[0]) * CONFIG.LLOYD_STEP, p[1] + (c[1] - p[1]) * CONFIG.LLOYD_STEP];
    });
  }

  function smoothTick() {
    if (mode !== "voronoi" || !smoothEnabled) {
      smoothAnimHandle = null;
      return;
    }
    lloydStep();
    draw();
    smoothAnimHandle = requestAnimationFrame(smoothTick);
  }

  function startSmoothingIfNeeded() {
    if (mode === "voronoi" && smoothEnabled && smoothAnimHandle === null) {
      smoothAnimHandle = requestAnimationFrame(smoothTick);
    }
  }

  // One repulsion step for "repulse" (circles mode): any two overlapping
  // clusters push apart along the line between their centers, each by
  // half the overlap depth times CIRCLE_REPEL_STEP. Unlike Voronoi's
  // Lloyd relaxation (which evens out mesh regularity), this is about
  // spacing — clusters settle into non-overlapping positions rather than
  // converging to any particular mesh shape. The circle you're actively
  // dragging, and any circle marked "fixed" (click-to-toggle), are left
  // alone so they don't move — but both still push on everything else.
  function circleRepelStep() {
    if (circles.length < 2) return;
    const step = CONFIG.CIRCLE_REPEL_STEP;
    const push = circles.map(() => [0, 0]);
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        const minDist = (a.r + b.r) * CONFIG.CIRCLE_REPEL_MARGIN;
        if (dist >= minDist - CONFIG.CIRCLE_REPEL_EPSILON) continue;
        if (dist < 1e-6) {
          // Coincident centers: nudge apart in a random direction so they
          // don't stay stuck dividing by zero.
          const angle = Math.random() * Math.PI * 2;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        const overlap = minDist - dist;
        const ux = dx / dist;
        const uy = dy / dist;
        const move = overlap * step * 0.5;
        push[i][0] -= ux * move;
        push[i][1] -= uy * move;
        push[j][0] += ux * move;
        push[j][1] += uy * move;
      }
    }
    circles.forEach((c, i) => {
      if (i === draggingIndex || c.fixed) return;
      // Below CIRCLE_REPEL_MIN_SPEED, stop outright rather than creeping
      // forward a sub-pixel amount — see the comment on that constant.
      if (Math.hypot(push[i][0], push[i][1]) < CONFIG.CIRCLE_REPEL_MIN_SPEED) return;
      c.x += push[i][0];
      c.y += push[i][1];
    });
  }

  function repulseTick() {
    if (mode !== "circles" || !repulseEnabled) {
      repulseAnimHandle = null;
      return;
    }
    circleRepelStep();
    draw();
    repulseAnimHandle = requestAnimationFrame(repulseTick);
  }

  function startRepulsingIfNeeded() {
    if (mode === "circles" && repulseEnabled && repulseAnimHandle === null) {
      repulseAnimHandle = requestAnimationFrame(repulseTick);
    }
  }

  // Adds one closed polygon as its own subpath of an existing Path2D —
  // used to build up the XOR/evenodd clip regions below, one subpath per
  // circle.
  function addPolygonSubpath(path, poly) {
    poly.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
    path.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = CONFIG.FACE_COLOR;
    ctx.fillRect(0, 0, width, height);

    const outsideStroke = edgeColor();

    if (mode === "voronoi") {
      if (voronoiPoints.length >= 3) {
        const delaunay = d3.Delaunay.from(voronoiPoints);
        const voronoi = delaunay.voronoi([0, 0, width, height]);
        ctx.beginPath();
        voronoi.render(ctx);
        ctx.strokeStyle = outsideStroke;
        ctx.lineWidth = CONFIG.EDGE_WIDTH;
        ctx.stroke();
      }
      ctx.fillStyle = CONFIG.VERTEX_COLOR;
      voronoiPoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, CONFIG.VORONOI_POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (mode === "circles") {
      const pts = allCirclePoints();
      const boundaries = circles.map(circleBoundary);

      if (pts.length >= 3) {
        const insideStroke = insideEdgeColor();
        // See getCircleTriangles: connectivity is only recomputed once
        // every CIRCLE_RETRIANGULATE_EVERY_N_FRAMES frames, though point
        // *positions* below are always read fresh from `pts`.
        const triangles = getCircleTriangles(pts);
        const triCount = triangles.length / 3;

        // Rather than deciding each triangle/edge's color from a single
        // sample point (its centroid, or an edge's midpoint) — which lets
        // a triangle or edge that actually straddles a circle's boundary
        // get painted the WRONG color on the far side of that boundary,
        // visibly overlapping/crossing it — every fill and stroke below is
        // drawn in full and then clipped against an exact XOR/evenodd
        // region built from the circle polygons themselves. Since
        // d3-delaunay has no notion of constrained edges at all (the
        // triangulation is always free to draw a triangle that crosses a
        // boundary chord), this is what gets a pixel-exact boundary
        // without needing a real constrained-Delaunay library.
        const insidePath = new Path2D();
        boundaries.forEach((b) => addPolygonSubpath(insidePath, b));

        // A big canvas-sized rect subpath, PLUS every circle subpath, under
        // "evenodd": a point outside all circles crosses only the rect's
        // boundary (1, odd) → clipped in; a point inside an odd number of
        // circles crosses the rect once plus an odd number of circles
        // (even) → clipped out. That's exactly the complement of
        // insidePath above — the region that should read as background,
        // including a doubly-nested circle's own carved-out "hole".
        const exteriorPath = new Path2D();
        exteriorPath.rect(0, 0, width, height);
        boundaries.forEach((b) => addPolygonSubpath(exteriorPath, b));

        const anyFixed = circles.some((c) => c.fixed);
        const fixedPath = anyFixed ? new Path2D() : null;
        if (anyFixed) {
          boundaries.forEach((b, i) => circles[i].fixed && addPolygonSubpath(fixedPath, b));
        }

        // Pass 1: flat-fill the exact inside region — a plain clipped
        // fillRect gives a pixel-perfect boundary directly, no per-triangle
        // approximation needed. The fixed-circles' sub-region is then
        // painted again on top, clipped to BOTH regions at once (two
        // nested clips intersect), so it only shows where a point is both
        // inside overall (odd total count) and inside an odd number of
        // fixed circles specifically.
        ctx.save();
        ctx.clip(insidePath, "evenodd");
        ctx.fillStyle = CONFIG.VERTEX_COLOR;
        ctx.fillRect(0, 0, width, height);
        if (anyFixed) {
          ctx.save();
          ctx.clip(fixedPath, "evenodd");
          ctx.fillStyle = CONFIG.CIRCLE_FIXED_COLOR;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
        ctx.restore();

        // Pass 2: every triangulation edge, deduplicated, as one batched
        // path per color — stroked twice in full (once per region), each
        // time clipped so only the geometrically correct portion of the
        // line actually paints. A single Delaunay edge that happens to
        // cross a circle's boundary now correctly changes color exactly at
        // that crossing instead of being wrongly one flat color along its
        // whole length.
        const seen = new Set();
        const edgePath = new Path2D();
        for (let t = 0; t < triCount; t++) {
          const idx = [triangles[t * 3], triangles[t * 3 + 1], triangles[t * 3 + 2]];
          for (let e = 0; e < 3; e++) {
            const p = idx[e];
            const q = idx[(e + 1) % 3];
            const key = p < q ? p + "_" + q : q + "_" + p;
            if (seen.has(key)) continue;
            seen.add(key);
            const [px, py] = pts[p];
            const [qx, qy] = pts[q];
            edgePath.moveTo(px, py);
            edgePath.lineTo(qx, qy);
          }
        }
        ctx.lineWidth = CONFIG.EDGE_WIDTH;

        ctx.save();
        ctx.clip(exteriorPath, "evenodd");
        ctx.strokeStyle = outsideStroke;
        ctx.stroke(edgePath);
        ctx.restore();

        ctx.save();
        ctx.clip(insidePath, "evenodd");
        ctx.strokeStyle = insideStroke;
        ctx.stroke(edgePath);
        ctx.restore();
      }

      // Pass 3: each circle's own boundary polygon, drawn last (on top of
      // everything above). The organic Delaunay triangulation of the
      // boundary points doesn't reliably keep the exact boundary polygon
      // as its own edges, so without this the boundary was "z-fighting"
      // with whichever nearby triangulation edges happened to land on
      // (almost) the same pixels. Drawing it explicitly afterwards gives
      // every circle a single, clean outline — this IS "the edges
      // interpolating the vertices on the circle", not a true circular
      // arc. A "fixed" circle (click-to-toggle) outlines in
      // CIRCLE_FIXED_COLOR instead, so it's visually obvious which ones
      // won't move under repulsion.
      ctx.lineWidth = CONFIG.EDGE_WIDTH;
      const defaultBoundaryStroke = insideEdgeColor();
      boundaries.forEach((boundary, i) => {
        ctx.strokeStyle = circles[i].fixed ? CONFIG.CIRCLE_FIXED_COLOR : defaultBoundaryStroke;
        ctx.beginPath();
        boundary.forEach(([x, y], j) => (j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.closePath();
        ctx.stroke();
      });
    }
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (mode !== "animation") draw();
  }

  // Three-stage hint, entirely in-memory (not persisted anywhere) — every
  // reload, hard or soft, always starts back at "try":
  //   "try"   — the "try these out!" nudge below the corner buttons.
  //   "click" — swapped in once a mode has actually been picked (the
  //             toggle button, or the theme button, counts as "trying it
  //             out") — "click anywhere on the background!", to the left
  //             of the buttons instead. Only actually shown while the
  //             current mode is "voronoi"/"circles" though (see
  //             updateHintVisibility) — not "animation", which doesn't
  //             respond to clicking the backdrop at all.
  //   "none"  — once the backdrop itself has been clicked at least once
  //             (see the canvas pointerdown handler below), gone for the
  //             rest of this visit.
  let hintStage = "try";

  // Applies hintStage (and the current mode, for the "click" stage) to the
  // actual DOM — called both whenever hintStage advances and whenever the
  // mode changes, since either one can flip whether #bg-click-hint should
  // be showing.
  function updateHintVisibility() {
    const tryHint = document.getElementById("bg-hint");
    if (tryHint) tryHint.classList.toggle("is-hidden", hintStage !== "try");
    if (clickHint) {
      const clickableMode = mode === "voronoi" || mode === "circles";
      clickHint.hidden = !(hintStage === "click" && clickableMode);
    }
  }

  function advanceHintTo(stage) {
    // Only ever moves forward (try -> click -> none), never back.
    const order = ["try", "click", "none"];
    if (order.indexOf(stage) <= order.indexOf(hintStage)) return;
    hintStage = stage;
    updateHintVisibility();
  }

  function applyMode(next, opts) {
    // `userInitiated` controls whether this counts as the person actually
    // picking a mode by hand (vs. the initial, always-"animation" setup
    // call at the bottom of this file) — see advanceHintTo above.
    const userInitiated = !opts || opts.userInitiated !== false;
    mode = MODES.includes(next) ? next : MODES[0];
    if (userInitiated) advanceHintTo("click");
    updateHintVisibility(); // advanceHintTo already covers this when userInitiated, but mode itself may also have just changed

    // Keep the pre-first-paint attribute (see index.html/styles.css) in
    // sync with whatever mode actually ends up active — otherwise
    // switching mode by hand would leave it pointing at a stale mode, and
    // the html[data-bg-mode="voronoi"/"circles"] CSS rule that hides
    // body's background-image would apply (or fail to apply) for the
    // wrong mode, e.g. hiding animation's own loading fallback after
    // toggling away from voronoi.
    document.documentElement.dataset.bgMode = mode;

    if (modeBtn) {
      modeBtn.textContent = MODE_ICON[mode];
      modeBtn.title = MODE_LABEL[mode];
      modeBtn.setAttribute("aria-label", MODE_LABEL[mode]);
    }
    canvas.style.cursor = MODE_CURSOR[mode];

    if (voronoiControls) voronoiControls.hidden = mode !== "voronoi";
    if (circlesControls) circlesControls.hidden = mode !== "circles";

    // "animation" paints through its own two layer elements instead of
    // the canvas or body's CSS background (see updateAnimationFrame) —
    // leaving it hides them again so body's own theme background-image
    // shows through as it normally would, and entering it warms the frame
    // cache (prioritized around wherever the page already happens to be
    // scrolled to) and immediately shows the matching frame(s).
    if (mode !== "animation") {
      layerA.style.display = "none";
      layerB.style.display = "none";
      layerA.style.backgroundImage = "";
      layerB.style.backgroundImage = "";
      layerB.style.opacity = 0;
      animationShownBase = -1;
      animationShownFrac = -1;
    }

    if (mode === "animation") {
      canvas.style.display = "none";
      // Neither layer has anything to show until its first frame loads, so
      // whenever they're blank, body's own theme background-image shows
      // through underneath as the fallback, rather than a flat/blank color.
      layerA.style.display = "block";
      layerB.style.display = "block";
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const fraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const priorityIndex = Math.round(fraction * (CONFIG.ANIMATION_FRAME_COUNT - 1));
      preloadAnimationFrames(priorityIndex);
      updateAnimationFrame();
      return;
    }
    canvas.style.display = "block";
    if (mode === "voronoi" && voronoiPoints.length === 0) seedVoronoi();
    if (mode === "circles" && circles.length === 0) seedCircles();
    draw();
    startSmoothingIfNeeded();
    startRepulsingIfNeeded();
  }

  canvas.addEventListener("pointerdown", (evt) => {
    // The canvas is only ever visible/interactive in "voronoi"/"circles"
    // (see applyMode), so any pointerdown reaching it already means the
    // backdrop itself has been clicked — advance the hint straight to
    // "none" regardless of which of those two modes this is.
    advanceHintTo("none");
    if (mode === "voronoi") {
      // A plain click (no movement before release) still drops exactly
      // one point, right here at pointerdown; pointermove below adds
      // more as the pointer travels, for as long as it's held down.
      voronoiDragging = true;
      voronoiLastPoint = [evt.clientX, evt.clientY];
      voronoiPoints.push(voronoiLastPoint);
      canvas.setPointerCapture(evt.pointerId);
      draw();
      return;
    }
    if (mode !== "circles") return;
    const x = evt.clientX;
    const y = evt.clientY;
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      const dx = x - c.x;
      const dy = y - c.y;
      if (dx * dx + dy * dy <= c.r * c.r) {
        draggingIndex = i;
        clickCandidateIndex = i;
        pointerDownX = x;
        pointerDownY = y;
        canvas.setPointerCapture(evt.pointerId);
        canvas.style.cursor = "grabbing";
        evt.preventDefault();
        return;
      }
    }
    // Clicked empty backdrop, not an existing cluster: drop a brand new
    // one right here (random size/vertex count, same CONFIG parameters as
    // the initial seed) and start dragging it immediately, so a
    // click-and-drag in one motion both places and positions it. (Not a
    // click-to-fix candidate — it didn't hit an existing circle.)
    clickCandidateIndex = -1;
    circles.push(makeCircle(x, y));
    draggingIndex = circles.length - 1;
    canvas.setPointerCapture(evt.pointerId);
    canvas.style.cursor = "grabbing";
    draw();
  });

  canvas.addEventListener("pointermove", (evt) => {
    if (mode === "voronoi") {
      if (!voronoiDragging) return;
      const dx = evt.clientX - voronoiLastPoint[0];
      const dy = evt.clientY - voronoiLastPoint[1];
      const minDist = CONFIG.VORONOI_DRAG_MIN_DISTANCE;
      if (dx * dx + dy * dy >= minDist * minDist) {
        voronoiLastPoint = [evt.clientX, evt.clientY];
        voronoiPoints.push(voronoiLastPoint);
        draw();
      }
      return;
    }
    if (mode !== "circles" || draggingIndex === -1) return;
    circles[draggingIndex].x = evt.clientX;
    circles[draggingIndex].y = evt.clientY;
    draw();
  });

  function endDrag(evt) {
    if (mode === "voronoi") {
      voronoiDragging = false;
      voronoiLastPoint = null;
      if (canvas.hasPointerCapture && canvas.hasPointerCapture(evt.pointerId)) {
        canvas.releasePointerCapture(evt.pointerId);
      }
      return;
    }
    if (draggingIndex === -1) {
      clickCandidateIndex = -1;
      return;
    }
    if (canvas.hasPointerCapture && canvas.hasPointerCapture(evt.pointerId)) {
      canvas.releasePointerCapture(evt.pointerId);
    }
    // A press that hit an existing circle but barely moved before release
    // counts as a click, not a drag: toggle "fixed" instead of "moving"
    // it a negligible distance.
    if (clickCandidateIndex !== -1) {
      const dx = evt.clientX - pointerDownX;
      const dy = evt.clientY - pointerDownY;
      if (dx * dx + dy * dy <= CONFIG.CIRCLE_CLICK_MAX_MOVEMENT * CONFIG.CIRCLE_CLICK_MAX_MOVEMENT) {
        circles[clickCandidateIndex].fixed = !circles[clickCandidateIndex].fixed;
        draw();
      }
    }
    clickCandidateIndex = -1;
    draggingIndex = -1;
    canvas.style.cursor = MODE_CURSOR[mode];
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      applyMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
    });
  }

  if (smoothCheckbox) {
    smoothCheckbox.checked = smoothEnabled;
    smoothCheckbox.addEventListener("change", () => {
      smoothEnabled = smoothCheckbox.checked;
      localStorage.setItem("voronoiSmooth", smoothEnabled ? "1" : "0");
      startSmoothingIfNeeded();
    });
  }

  if (dragDistanceInput) {
    dragDistanceInput.value = CONFIG.VORONOI_DRAG_MIN_DISTANCE;
    dragDistanceInput.addEventListener("change", () => {
      const parsed = parseFloat(dragDistanceInput.value);
      const clamped = Number.isFinite(parsed) ? Math.min(200, Math.max(1, parsed)) : CONFIG.VORONOI_DRAG_MIN_DISTANCE;
      CONFIG.VORONOI_DRAG_MIN_DISTANCE = clamped;
      dragDistanceInput.value = clamped;
      localStorage.setItem("voronoiDragDistance", String(clamped));
    });
  }

  if (repulseCheckbox) {
    repulseCheckbox.checked = repulseEnabled;
    repulseCheckbox.addEventListener("change", () => {
      repulseEnabled = repulseCheckbox.checked;
      localStorage.setItem("circleRepulse", repulseEnabled ? "1" : "0");
      startRepulsingIfNeeded();
    });
  }

  // The theme toggle also counts as "trying it out" for the purposes of
  // the hint, even though it doesn't touch mode.
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", () => advanceHintTo("click"), { once: true });

  // Redraw with the new palette whenever the light/dark theme changes
  // (the theme toggle sets this attribute elsewhere).
  new MutationObserver(() => {
    if (mode !== "animation") draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  window.addEventListener("resize", resizeCanvas);

  // "animation" mode's whole mechanism: scrolling picks the frame (see
  // updateAnimationFrame — a no-op in every other mode). A window resize
  // can also change the page's total scrollable height without the
  // scroll position itself moving, so it needs the same recheck.
  window.addEventListener("scroll", updateAnimationFrame, { passive: true });
  window.addEventListener("resize", updateAnimationFrame);

  resizeCanvas();

  // Start warming the animation frame cache right away, regardless of
  // which mode the page actually starts in — not just once "animation" is
  // entered. preloadAnimationFrames no-ops on every call after its first,
  // so this is free if the page never ends up in "animation" mode at all,
  // but it means that by the time it IS entered (whether that's the
  // random starting mode or a later manual toggle), the first frame or
  // two already has a head start on downloading+decoding instead of
  // starting from zero — shrinking the window where there's nothing to
  // show yet but body's own static background-image.
  {
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const fraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    preloadAnimationFrames(Math.round(fraction * (CONFIG.ANIMATION_FRAME_COUNT - 1)));
  }

  applyMode(mode, { userInitiated: false });
})();
