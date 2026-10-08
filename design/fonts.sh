#!/bin/sh
# Fetch the latin and latin-ext subsets of Inter and JetBrains Mono into
# vendor/fonts. latin-ext is what carries Sámi (Č Đ Ŋ Š Ŧ Ž) and most European
# names; without it those letters fall back to another face mid-word.
# Lives in its own file because the awk/sed pipeline is unreadable once it has
# been escaped for YAML or for a Dockerfile RUN line.
set -e
VERSION="$1"
SUBSETS="latin-ext latin"

fetch() {
  pkg="$1"; shift
  tgz=$(mktemp)
  curl -sSfL "https://registry.npmjs.org/@fontsource/$pkg/-/$pkg-$VERSION.tgz" -o "$tgz"
  : > "vendor/fonts/$pkg.css"
  for w in "$@"; do
    for s in $SUBSETS; do
      tar -xzO -f "$tgz" "package/files/$pkg-$s-$w-normal.woff2" \
        > "vendor/fonts/files/$pkg-$s-$w-normal.woff2"
    done
    # Keep the @font-face rules whose src is one of our subsets, drop the rest.
    tar -xzO -f "$tgz" "package/$w.css" \
      | awk '/@font-face/{keep=0; buf=""} {buf=buf $0 "\n"} /src:/{if ($0 ~ /-latin(-ext)?-[0-9]+-normal\.woff2/) keep=1} /^}/{if (keep) printf "%s", buf; keep=0; buf=""}' \
      | sed "s#, url([^)]*\.woff) format('woff')##" \
      >> "vendor/fonts/$pkg.css"
  done
  rm -f "$tgz"
}

mkdir -p vendor/fonts/files
fetch inter 400 500 600
fetch jetbrains-mono 400 500
