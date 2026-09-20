# vnigolian.github.io

## TODOS
* add a "cool stuff" section, with e.g. the NOBUENOSS

## Site content

`data.js` is the only file you should need to edit to change page content —
see the comment at its top. It now includes an `OTHER_PROJECTS` array
(same shape as `CODE_PROJECTS`: `name`, `description`, `link`, `tags`,
`status`, `image`), rendered into its own "Other Projects" section in
`index.html`, for things that aren't primarily a codebase. It's empty by
default and the section hides itself automatically until you add an entry
(same pattern as `AWARDS`).

## Interactive backdrop

`background-live.js` draws the Voronoi / Delaunay-circles backdrop modes
(toggled with the button next to the light/dark switch). All of its tunable
knobs live in the `CONFIG` object at the top of that file:

| Parameter | Meaning |
|---|---|
| `FACE_COLOR` | Flat background fill behind the mesh, both modes (constant, not theme-dependent) |
| `VERTEX_COLOR` | Color of the Voronoi points, and of triangle faces that fall inside a circle in "circles" mode |
| `EDGE_WIDTH` | Stroke width (px) of every Voronoi/Delaunay edge |
| `EDGE_COLOR_DARK` | Edge color outside any circle, dark theme |
| `EDGE_COLOR_LIGHT` | Edge color outside any circle, light theme |
| `VORONOI_POINT_RADIUS` | Radius (px) of the dots marking Voronoi points |
| `VORONOI_DRAG_MIN_DISTANCE` | While the mouse/finger is held down in "voronoi" mode, a new point drops every time it has moved this many pixels since the last one (a plain click with no movement still drops exactly one point) |
| `CIRCLE_COUNT` | Number of draggable point clusters in "circles" mode |
| `CIRCLE_MIN_RADIUS` / `CIRCLE_RADIUS_RANGE` | Each cluster's boundary radius = `MIN_RADIUS + random() * RANGE` |
| `CIRCLE_MIN_VERTICES` / `CIRCLE_MAX_VERTICES` | Random number of boundary vertices per cluster (inclusive range) |
| `HIDDEN_POINT_DENSITY` | Lower = more hidden Voronoi-basis points scattered inside the canvas in "circles" mode |
| `OUTER_POINT_MARGIN` | Fraction of width/height beyond each edge where extra points are scattered, so the mesh's outer triangles spill past the visible page instead of stopping in a hard line at the viewport edge |
| `OUTER_POINT_DENSITY` | Same density scale as `HIDDEN_POINT_DENSITY`, for the outside-canvas points |
| `VORONOI_SEED_DENSITY` | Lower = more points in the initial (pre-click) Voronoi diagram |
| `LLOYD_STEP` | With the "smooth" checkbox on, the fraction of the way each point moves toward its own Voronoi cell's centroid, every animation frame |
| `CIRCLE_REPEL_STEP` | With the "repulse" checkbox on, the fraction of their overlap depth that any two overlapping clusters push apart by, every animation frame |
| `CIRCLE_REPEL_MARGIN` | Clusters settle once their centers are this multiple of their summed radii apart (1.1 = a small gap beyond exact tangency), so the triangulation doesn't flicker back and forth right at the boundary |
| `CIRCLE_REPEL_EPSILON` | Repulsion dead zone (px of remaining overlap): below this, a pair stops pushing entirely rather than continuing to nudge right at the `CIRCLE_REPEL_MARGIN` threshold, which is what caused the last bit of residual flicker |
| `CIRCLE_CLICK_MAX_MOVEMENT` | Max pointer movement (px), in "circles" mode, for a press-and-release on an existing circle to still count as a click (toggling "fixed") rather than a drag |
| `CIRCLE_FIXED_COLOR` | Fill/outline color for a "fixed" circle's own cut-out, in place of `VERTEX_COLOR` |

## Local preview

From inside the project folder:

```bash
python3 -m http.server 8000
```
