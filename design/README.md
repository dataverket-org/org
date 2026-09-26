# Design system

Dataverket does not build its own design system. We use
[Designsystemet](https://designsystemet.no) - the Norwegian government's shared
design system, maintained by Digdir - with our own theme on top.

This is a deliberate choice, for the same reason as the rest of the
architecture: *the fewer lines of code, the cheaper the maintenance over time*.
Designsystemet is a
[verified digital public good](https://digitalpublicgoods.net/r/designsystemet),
has universal design and 4.5:1 contrast built in, and is maintained by someone
else. We inherit that work instead of repeating it.

This directory is the source for every Dataverket project with a user
interface: the operator console, the documentation site, and whatever comes
next.

## What lives here

| File | What it is |
|---|---|
| `designsystemet.config.json` | The theme source. The only file you edit to change colours, radius or font. |
| `logo.mjs` | The mark source. Where the shapes live. |
| `dataverket.css` | Our patch. The four things Designsystemet does not give us. |
| `build/` | **Generated, committed.** `theme.css` from the config, the mark SVGs from `logo.mjs`. Never edit by hand - `task tokens`, `task logo`. |
| `templates/` | Go `html/template` references for htmx services. |
| `preview.html` | Contact sheet that loads the real files. `task preview` - it needs a server, not `file://`. |
| `Dockerfile` | The toolchain **and the build**. Every version pinned in one place. |
| `fonts.sh` | Fetches the latin font subsets. Its own file because the awk pipeline is unreadable once escaped into YAML. |
| `Taskfile.yaml` | Builds the image and copies the results out. |
| `vendor/` | Third-party, fetched verbatim. Not in git - `task vendor`. |

Two directories hold output, and the split is the whole filing system:
**`build/` is ours** - generated from the two source files above, and committed
so a consumer needs no toolchain. **`vendor/` is theirs** - fetched verbatim,
never committed. The Designsystemet CLI insists on writing to `design-tokens/`
and `design-tokens-build/`; both are scratch, both are gitignored, and the
theme is copied out of there into `build/theme.css`.

It lands under a different name on purpose: the CLI calls its output
`dataverket.css`, which is also the name of our hand-written patch. Two
different files with one name is a trap worth spending a `cp` on.

## One container, no local tools, no mounts

Every tool this directory needs lives in one image, described by the
`Dockerfile`: Designsystemet's CLI, esbuild, fontkit for the wordmark outlines,
a static server for the preview, and curl and tar for the third-party files.
To work on `design/` you need **podman (or docker) and go-task, and nothing
else** - no Node on your machine, no Python. One runtime does all of it.

**The build runs in image layers, not in a container against a bind mount.**
That is the portability argument: no `:z` for SELinux, no
`--user $(id -u):$(id -g)` to stop output being owned by root, and no mount
semantics differing between macOS, Linux and rootless. `task build` runs the
image build and copies the results out with `podman cp`.

```sh
task            # list the targets
task build      # build the image, copy build/ and vendor/ out of it
task preview    # serve the built site from the image
task check      # fail if the committed build/ is out of sync with the sources
task clean      # remove what the build produced
```

Because the last stage carries the built site and a server, the preview is a
real artifact. Anyone can look at the design system without cloning anything:

```sh
podman run --rm -p 8123:8123 dataverket-design:1.23.0
```

`task preview` is that same command, and it fails immediately if the image is
missing rather than quietly building for half a minute.

Versions are pinned in the `Dockerfile` and `task image` is the only step that
reaches the network. A build from nothing takes about 45 seconds; with layers
cached, editing `logo.mjs` costs about 5 seconds and editing `preview.html`
about 2. `DS_VERSION` names the image tag, so bumping it rebuilds by itself;
the others need `task image:rebuild`.

Two directories come out of the image, and the split is the whole filing
system: **`build/` is ours** - `theme.css` from `designsystemet.config.json`,
the mark SVGs from `logo.mjs` - and it is committed, so a consumer needs no
toolchain at all. **`vendor/` is theirs** - fetched verbatim, never committed.

The theme lands as `theme.css` on purpose: the CLI calls its own output
`dataverket.css`, which is also the name of our hand-written patch. Two
different files with one name is a trap worth spending a copy on.

## The theme

```json
{
  "colors": { "accent": "#0A2A5E", "brand1": "#BA0C2F", "neutral": "#29384A" },
  "typography": { "fontFamily": "Inter" },
  "borderRadius": 8
}
```

The palette follows the Norwegian flag. `accent` is navy and carries primary
actions, focus and links. `brand1` is flag red and is **identity only** - logo,
editorial emphasis. Never a button, never a status: it sits too close to
`danger`. The white of the flag is carried by the neutral surfaces.

The generator derives the full scales from those three. `accent` resolves to
`#0A2A5E` in light mode and `#9facc0` in dark - navy is too dark to read
against a dark surface, so it is lightened hard. That is expected, not a bug.

Colour scheme is set with `data-color-scheme="light|dark|auto"` on `<html>`,
colour per subtree with `data-color`, size with `data-size`. None of it needs
JavaScript.

## The patch

`dataverket.css` is deliberately small. The rule is: **if you need a colour, a
spacing or a radius, use a `--ds-*` variable.** Never write a hex value in that
file. If you are tempted to add a component, check first whether
[Designsystemet already has it](https://designsystemet.no/en/components).

Right now there are four things Designsystemet does not give us:

1. **`--dvk-font-mono`** - Designsystemet has no monospace token. Every
   identifier (IDs, IPs, CIDRs, hashes, image tags, durations) is set in
   JetBrains Mono via the `.dvk-mono` class.
2. **`font-feature-settings: "cv05" 1`** on `body` - Designsystemet's own
   recommendation from the setup guide. Gives lowercase `l` a tail so it stops
   looking like `1`. That matters a lot on a screen full of identifiers.
3. **`.dvk-busy`** - dims the region htmx is swapping while the request is in
   flight.
4. **`.dvk-brand`** - the brand link. Designsystemet has no logo component, and
   a header that arranges the mark and the wordmark by hand drifts between
   projects. Eight lines: two inline SVGs at one height, swapped at a
   breakpoint. See **The lockup** below.

Our own classes take the `dvk-` prefix, not `ds-`, so we do not collide if
Designsystemet ever ships one of its own.

The patch sits in its own layer after `ds`:

```css
@layer ds, dataverket;
```

That way it wins without `!important` and without raising specificity, and
Designsystemet can be upgraded underneath us.

## The mark

Four files, two shapes:

| File | Shape | Background |
|---|---|---|
| `logo-light.svg` | full | light |
| `logo-dark.svg` | full | dark |
| `glyph-light.svg` | simplified | light |
| `glyph-dark.svg` | simplified | dark |

The suffix names the **background** the file is made for, not the colour of its
ink. So `logo-dark.svg` is the white one.

`logo-*` is the full shape and holds down to 32 px. **24 px is the first size
that takes `glyph-*`**: below 32 the shoulders and the doorway close up. Both
shapes share a `viewBox` and the same outer bounds, so they swap without
anything jumping.

### Use the inline mark

`logo.svg` and `glyph.svg` are the same shapes with `fill="currentColor"`.
**Inline one of these and let it take the text colour.** It is the only form
that cannot get the colour wrong, and it is what `templates/layout.html` does.

> **Do not drive the mark from `<picture>` with `prefers-color-scheme`.** That
> media query reports the *operating system's* setting, which is not the same
> thing as `data-color-scheme`. The moment you add a theme toggle, a viewer on
> a dark OS who picks the light theme gets the white mark on a white header and
> the logo disappears. The two fixed-colour files are for the places you cannot
> inline: email, an `<img>` in a README, a favicon, a plate whose colour you
> control.

### The lockup

The mark and the word together are **one generated asset**, not a mark and a
`<span>` arranged by CSS. `logo.mjs` cuts "Dataverket" to outlines
from the Inter file `task vendor` already fetches, so the proportions cannot
drift, there is no webfont dependency, and the whole thing scales as a unit.
That is how designsystemet.no ships its own logo.

The brand link follows theirs too - two inline SVGs at one height, swapped with
`display`:

```html
<a class="dvk-brand ds-focus" style="--dvk-brand-size: 32px" href="/">
  <svg class="dvk-brand-lockup" ...>   <!-- mark + wordmark, wide -->
  <svg class="dvk-brand-mark" ...>     <!-- mark alone, narrow    -->
</a>
```

`build/lockup.svg` and `build/glyph.svg` already carry those classes and a
`<title>`, so a service can embed the files and print them unchanged:

```go
//go:embed static/lockup.svg static/glyph.svg
var marks embed.FS
```

**They must be inlined.** CSS cannot reach inside an `<img>`, which is also why
`fill="currentColor"` does nothing there. The `-light` and `-dark` files exist
for the places you cannot inline: email, a README image, a favicon, a plate
whose colour you control.

`ds-focus` on the link is not optional either - without it the link falls back
to the browser's thin default outline instead of Designsystemet's ring.

> If a dark-background mark looks "small" or missing in a file viewer, that is
> white ink on a white background. Use `preview.html`, which shows each mark on
> the right surface.

## How a Go service consumes this

Copy what you need into the service's `static/`, and bake it into the binary
with `embed`. The service then has no outbound dependencies at runtime - no
altinncdn.no, no Google Fonts, no jsDelivr. That is a requirement, not a
preference: a Dataverket service must be runnable by someone else, on a closed
network, without us.

```go
//go:embed static
var static embed.FS

mux.Handle("GET /static/", http.FileServerFS(static))
```

Load them in this order:

1. the fonts
2. `designsystemet.css` - declares `@layer ds`
3. `theme.css` - the generated theme, fills in `--ds-*`
4. `dataverket.css` - our patch, declares `@layer dataverket` after `ds`

Everything is inside a cascade layer, so precedence does not actually depend on
the file order - `dataverket.css` wins even if the browser sees it first. Keep
the order anyway: it matches the layer order, and anything unlayered you add
later will depend on it.

See [`templates/layout.html`](templates/layout.html) for the full head, and
[`templates/`](templates/) for component and htmx patterns.

## Components without React

Designsystemet ships two packages we care about:

- **`@digdir/designsystemet-css`** - the components as plain classes and data
  attributes. `<button class="ds-button">` works without a line of JavaScript.
- **`@digdir/designsystemet-web`** - web components for the parts that need
  logic: `<ds-field>`, `<ds-tabs>`, `<ds-pagination>`, `<ds-suggestion>`,
  `<ds-breadcrumbs>`, `<ds-error-summary>`. Framework agnostic, imported once,
  self-registering. Bundled by `task bundle`.

Without the JavaScript, most of the system still works - buttons, cards,
tables, tags and alerts are pure CSS. What you lose is the behaviour: tabs stop
switching, `ds-pagination` renders no page numbers, `ds-field` stops wiring
`aria-describedby`. `preview.html` is the fastest way to tell whether the
bundle is loading.

Digdir have
[written about why](https://designsystemet.no/en/blog/web-components-and-designsystemet-without-react/)
they do not turn everything into web components: plain HTML gives
accessibility for free, and web components cost both performance and a
JavaScript dependency. That suits us - htmx and server-rendered HTML are the
same line of thinking.

We do not use the React package.

## If you are writing UI, also read

- [The components](https://designsystemet.no/en/components) - read the page
  before building something of your own.
- `docs/decisions/0001-service-naming.md` in fabrikk
  ([published here](https://docs.dataverket.org/decisions/)) - the service
  names are also the brand, and must be spelled the same way in the interface.
