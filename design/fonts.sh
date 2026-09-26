#!/bin/sh
# Fetch the latin subset of Inter and JetBrains Mono into vendor/fonts.
# Lives in its own file because the awk/sed pipeline is unreadable once it has
# been escaped for YAML or for a Dockerfile RUN line.
set -e
VERSION="$1"

fetch() {
  pkg="$1"; shift
  tgz=$(mktemp)
  curl -sSfL "https://registry.npmjs.org/@fontsource/$pkg/-/$pkg-$VERSION.tgz" -o "$tgz"
  : > "vendor/fonts/$pkg.css"
  for w in "$@"; do
    tar -xzO -f "$tgz" "package/files/$pkg-latin-$w-normal.woff2" \
      > "vendor/fonts/files/$pkg-latin-$w-normal.woff2"
    tar -xzO -f "$tgz" "package/$w.css" \
      | awk '/@font-face/{keep=0; buf=""} {buf=buf $0 "\n"} /unicode-range/{if ($0 ~ /U\+0000/) keep=1} /^}/{if (keep) printf "%s", buf; keep=0; buf=""}' \
      | sed "s#, url([^)]*\.woff) format('woff')##" \
      >> "vendor/fonts/$pkg.css"
  done
  rm -f "$tgz"
}

mkdir -p vendor/fonts/files
fetch inter 400 500 600
fetch jetbrains-mono 400 500
