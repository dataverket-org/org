# Everything design/ generates, and the environment it generates in.
#
# The build happens HERE, in image layers - not by running a container against
# a bind-mounted checkout. That is the portability argument: no `:z` for
# SELinux, no `--user $(id -u)` to stop output being root-owned, no mount
# semantics differing between macOS, Linux and rootless. `task build` runs this
# file and copies the results out with `podman cp`.
#
# It is also why the preview is a real artifact: the last stage carries the
# built site and a server, so `podman run -p 8123:8123 <image>` shows the
# design system to someone who has never cloned the repo.
#
# Rebuild after bumping any ARG:  task image:rebuild

# ---------------------------------------------------------------- tools ---
FROM docker.io/library/node:22-alpine AS tools

# curl and tar fetch the third-party files; busybox already provides awk and sed.
RUN apk add --no-cache curl tar

ARG DS_VERSION=1.23.0
ARG ESBUILD_VERSION=0.24.0
ARG FONTKIT_VERSION=2.0.4
ARG HTTP_SERVER_VERSION=14.1.1
ARG HTMX_VERSION=2.0.4
ARG FONTSOURCE_VERSION=5.3.0

# Designsystemet's CLI, the bundler and the preview server, installed rather
# than fetched per run. One runtime does all of it.
RUN npm install -g --no-fund --no-audit \
      "@digdir/designsystemet@${DS_VERSION}" \
      "esbuild@${ESBUILD_VERSION}" \
      "http-server@${HTTP_SERVER_VERSION}"

# fontkit reads the WOFF2 and cuts the wordmark to outlines. ESM ignores
# NODE_PATH, so logo.mjs reaches it through createRequire, which does not.
RUN mkdir -p /opt/tools && cd /opt/tools \
 && npm init -y >/dev/null \
 && npm install --no-fund --no-audit --silent "fontkit@${FONTKIT_VERSION}"
ENV NODE_PATH=/opt/tools/node_modules

# The web components live here so esbuild has something to bundle. Baking the
# install in is what keeps `npm i` out of the build itself.
RUN mkdir -p /opt/web && cd /opt/web \
 && npm init -y >/dev/null \
 && npm install --no-fund --no-audit --silent \
      "@digdir/designsystemet-web@${DS_VERSION}" \
 && printf 'import "@digdir/designsystemet-web";\n' > entry.js

# ------------------------------------------------------------- generate ---
FROM tools AS generate
WORKDIR /src

# Third-party first: it changes least, so it caches best.
#
# The bundle must be built, not downloaded. Do NOT swap it for jsDelivr's
# `/+esm`: that looks like a single self-contained file, but its imports are
# absolute paths that only resolve on jsdelivr.net. Served from your own origin
# it 404s, the module fails silently, and you get tabs that do not switch and
# an empty pagination control.
RUN mkdir -p vendor \
 && curl -sSfL "https://registry.npmjs.org/@digdir/designsystemet-css/-/designsystemet-css-${DS_VERSION}.tgz" \
    | tar -xzO package/dist/src/index.css > vendor/designsystemet.css \
 && curl -sSfL "https://registry.npmjs.org/htmx.org/-/htmx.org-${HTMX_VERSION}.tgz" \
    | tar -xzO package/dist/htmx.min.js > vendor/htmx.min.js \
 && esbuild /opt/web/entry.js --bundle --format=esm --minify \
      --outfile=/src/vendor/designsystemet-web.js

# Latin subset only, weights 400/500/600 for Inter and 400/500 for JetBrains
# Mono. The awk keeps the latin @font-face rule (the one whose unicode-range
# starts at U+0000) and drops the other subsets; the sed strips the .woff
# fallback we do not ship. Fonts are served from us, not altinncdn.no.
COPY fonts.sh ./
RUN sh fonts.sh "${FONTSOURCE_VERSION}" && rm fonts.sh

# Our own sources last, so editing them does not re-fetch anything above.
COPY designsystemet.config.json ./
RUN designsystemet tokens create --clean \
 && designsystemet tokens build --clean \
 && mkdir -p build \
 && cp design-tokens-build/dataverket.css build/theme.css

COPY logo.mjs ./
RUN node logo.mjs

# ---------------------------------------------------------------- serve ---
FROM tools AS serve
WORKDIR /site
COPY --from=generate /src/build ./build
COPY --from=generate /src/vendor ./vendor
COPY dataverket.css preview.html ./
EXPOSE 8123
CMD ["http-server", "/site", "-p", "8123", "-c-1", "--silent"]
