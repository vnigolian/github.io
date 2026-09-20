/**
 * Interactive backdrop: three modes, cycled by the #bg-mode-toggle button
 * and remembered in localStorage (same pattern as the theme toggle).
 *
 *   "image"    — the plain CSS background-image on <body> (default).
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

    VORONOI_POINT_RADIUS: 3.5,
    // While the mouse/finger is held down in "voronoi" mode, a new point
    // is added every time it has moved this many pixels since the last
    // one dropped (a plain click with no movement still drops exactly
    // one point, at pointerdown).
    VORONOI_DRAG_MIN_DISTANCE: 5,

    CIRCLE_COUNT: 10, // number of draggable circles in "circles" mode
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
    CIRCLE_RETRIANGULATE_EVERY_N_FRAMES: 20,
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
  if (!canvas || typeof d3 === "undefined") return;
  const ctx = canvas.getContext("2d");

  const MODES = ["image", "voronoi", "circles"];
  const MODE_ICON = { image: "🖼️", voronoi: "🔺", circles: "⚪" };
  const MODE_LABEL = {
    image: "Static backdrop image — click to try a live Voronoi diagram",
    voronoi: "Live Voronoi diagram — click or drag on the backdrop to add points",
    circles: "Live Delaunay triangulation — click to add a cluster, drag one to move it",
  };
  const MODE_CURSOR = { image: "default", voronoi: "crosshair", circles: "grab" };

  let mode = MODES.includes(localStorage.getItem("bgMode")) ? localStorage.getItem("bgMode") : "image";

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
    if (mode !== "image") draw();
  }

  // Bumped from "bgHintDismissed" when the hint's design changed (closer
  // to the buttons, no arrow, blinking) — otherwise anyone who'd already
  // dismissed the old version would never see the new one at all, with
  // no visible cause (looks exactly like a rendering bug).
  const HINT_DISMISSED_KEY = "bgHintDismissedV2";

  function dismissHint() {
    const hint = document.getElementById("bg-hint");
    if (!hint) return;
    hint.classList.add("is-hidden");
    localStorage.setItem(HINT_DISMISSED_KEY, "1");
  }

  function applyMode(next, opts) {
    const persist = !opts || opts.persist !== false;
    mode = MODES.includes(next) ? next : "image";
    if (persist) {
      localStorage.setItem("bgMode", mode);
      dismissHint();
    }

    if (modeBtn) {
      modeBtn.textContent = MODE_ICON[mode];
      modeBtn.title = MODE_LABEL[mode];
      modeBtn.setAttribute("aria-label", MODE_LABEL[mode]);
    }
    canvas.style.cursor = MODE_CURSOR[mode];

    if (voronoiControls) voronoiControls.hidden = mode !== "voronoi";
    if (circlesControls) circlesControls.hidden = mode !== "circles";

    if (mode === "image") {
      canvas.style.display = "none";
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
  // the hint, even though it doesn't touch bgMode.
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", dismissHint, { once: true });

  // Redraw with the new palette whenever the light/dark theme changes
  // (the theme toggle sets this attribute elsewhere).
  new MutationObserver(() => {
    if (mode !== "image") draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  window.addEventListener("resize", resizeCanvas);

  if (localStorage.getItem(HINT_DISMISSED_KEY) === "1") dismissHint();

  resizeCanvas();
  applyMode(mode, { persist: false });
})();
