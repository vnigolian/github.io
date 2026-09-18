#!/usr/bin/env bash
# Downloads the paper PDFs and teaser images referenced by data.js from
# their original hosts, into papers/ and images/papers/. Run this once
# from the repo root (needs normal internet access — this can't run from
# inside a sandboxed environment, only from your own machine or CI).
#
#   bash fetch-assets.sh
#
# Safe to re-run any time (e.g. after swapping the RO-MAN exception once a
# free PDF exists, or after adding a paper of your own).

set -euo pipefail

mkdir -p papers images/papers

fetch() {
  local url="$1"
  local dest="$2"
  echo "Fetching ${dest} ..."
  curl -fL --retry 2 -o "$dest" "$url"
}

# --- Papers (full text) ---------------------------------------------------

fetch "https://www.algohex.eu/publications/deformation-maps/boundary-deformation-maps-sga-2026.pdf" \
      "papers/deformation-maps.pdf"

fetch "https://www.algohex.eu/publications/cluster-mesh-sae/cluster-mesh-sga-2024.pdf" \
      "papers/cluster-mesh-sae.pdf"

# High-res by default. Swap to the low-res version below if you'd rather
# keep the repo lighter:
# https://www.algohex.eu/publications/expansion-cones/expansion-cones-sg-2023-lowres.pdf
fetch "https://www.algohex.eu/publications/expansion-cones/expansion-cones-sg-2023.pdf" \
      "papers/expansion-cones.pdf"

fetch "https://www-ui.is.s.u-tokyo.ac.jp/~takeo/research/invaner/files/INVANER-paper.pdf" \
      "papers/invaner.pdf"

# No free PDF exists for the RO-MAN 2017 paper (IEEE Xplore is paywalled),
# so there's nothing to fetch for it — data.js links straight to the DOI.

# --- Teaser images ---------------------------------------------------------

fetch "https://www.algohex.eu/publications/deformation-maps/teaser@1024_q95.png" \
      "images/papers/deformation-maps-teaser.png"

fetch "https://www.algohex.eu/publications/cluster-mesh-sae/teaser@1024_q95.png" \
      "images/papers/cluster-mesh-sae-teaser.png"

fetch "https://www.algohex.eu/publications/expansion-cones/teaser@1024_q95.png" \
      "images/papers/expansion-cones-teaser.png"

fetch "https://www-ui.is.s.u-tokyo.ac.jp/~takeo/research/invaner/files/teaser.jpg" \
      "images/papers/invaner-teaser.jpg"

fetch "https://www.epfl.ch/files/private/imports/title.png" \
      "images/papers/roman-teaser.png"

echo "Done. Papers in papers/, teaser images in images/papers/."
