# Design system

Built on [Designsystemet](https://designsystemet.no), Digdir's shared design
system, with a Dataverket theme on top. The source for every Dataverket
project with a user interface.

## What lives here

| File | What it is |
|---|---|
| `designsystemet.config.json` | Theme source. Colours, radius, font. |
| `logo.js` | Logo source. The shapes. |
| `dataverket.css` | Our patch. The four things Designsystemet does not give us. |
| `Dockerfile` | The toolchain and the build. Versions pinned here. |
| `fonts.sh` | Fetches the latin font subsets. |
| `Taskfile.yaml` | Builds the image, copies the results out. |
| `templates/` | Go `html/template` references for htmx services. |
| `preview.html` | Contact sheet. `task preview`; needs a server, not `file://`. |
| `build/` | Generated, committed. Never edit by hand. |
| `vendor/` | Third-party, fetched, not committed. |

## Build

Requires podman (or docker) and go-task. Nothing else: no Node, no Python.
The build runs in image layers, and `task build` copies the results out with
`podman cp` - nothing is bind-mounted.

```sh
task            # list the targets
task build      # build the image, copy build/ and vendor/ out of it
task preview    # serve the built site from the image
task check      # fail if the committed build/ is out of sync with the sources
task clean      # remove what the build produced
```

The preview is a shareable artifact:

```sh
podman run --rm -p 8123:8123 dataverket-design:1.23.0
```

From nothing, about 45 seconds. Cached, a `logo.js` edit is about 5 seconds
and a `preview.html` edit about 2. `DS_VERSION` names the image tag and
rebuilds on its own; other version bumps need `task image:rebuild`.

The theme is `build/theme.css`. The CLI's own output name is `dataverket.css`,
which collides with the patch.

## The theme

```json
{
  "colors": { "accent": "#0A2A5E", "brand1": "#BA0C2F", "neutral": "#29384A" },
  "typography": { "fontFamily": "Inter" },
  "borderRadius": 8
}
```

The palette follows the Norwegian flag; the white is carried by the neutral
surfaces.

- `accent` - navy. Primary actions, focus, links.
- `brand1` - flag red. **Identity only**: logo, editorial emphasis. Never a
  button, never a status - it sits too close to `danger`.

`accent` resolves to `#0A2A5E` in light and `#9facc0` in dark: navy is too dark
to read against a dark surface, so it is lightened hard.

Colour scheme is `data-color-scheme="light|dark|auto"` on `<html>`, colour per
subtree is `data-color`, size is `data-size`. None of it needs JavaScript.

## The patch

**If you need a colour, a spacing or a radius, use a `--ds-*` variable.** Never
write a hex value in `dataverket.css`. Before adding a component, check whether
[Designsystemet already has it](https://designsystemet.no/en/components).

Four things it does not give us:

1. **`--dvk-font-mono`** - no monospace token. Identifiers (IDs, IPs, CIDRs,
   hashes, image tags, durations) take `.dvk-mono`.
2. **`font-feature-settings: "cv05" 1`** on `body` - Designsystemet's own
   recommendation. Gives lowercase `l` a tail so it stops looking like `1`.
3. **`.dvk-busy`** - dims the region htmx is swapping.
4. **`.dvk-brand`** - the brand link. See **The logo**.

Our classes take the `dvk-` prefix, not `ds-`. The patch sits in its own layer
after `ds`, so it wins without `!important`:

```css
@layer ds, dataverket;
```

## The logo

Three shapes, each in three variants:

| File | What it is |
|---|---|
| `logo-*.svg` | The tower. |
| `glyph-*.svg` | The tower simplified, for small sizes. |
| `lockup-*.svg` | The tower with "Dataverket" beside it. |

`logo-*` holds down to 32 px. **24 px is the first size that takes `glyph-*`.**
Both share a `viewBox` and outer bounds, so they swap without anything jumping.
The suffix names the **background** the file is for, not the colour of its ink
- `logo-dark.svg` is the white one.

`logo.svg`, `glyph.svg` and `lockup.svg` are the same shapes with
`fill="currentColor"`, and carry the class and `<title>` they need when
inlined. **Inline those and let them take the text colour.**

> **Do not drive the logo from `<picture>` with `prefers-color-scheme`.** That
> reports the *operating system's* setting, not `data-color-scheme`. With a
> theme toggle, a viewer on a dark OS who picks the light theme gets the white
> logo on a white header. The fixed-colour `-light` and `-dark` files are for
> what cannot be inlined: email, a README image, a favicon, a plate whose
> colour you control.

`lockup-*.svg` is **one generated file**, not a logo and a `<span>` arranged by
CSS: `logo.js` cuts "Dataverket" to outlines from Inter, so it needs no webfont
and scales as a unit. The brand link is two inline SVGs at one height, swapped
with `display`:

```html
<a class="dvk-brand ds-focus" style="--dvk-brand-size: 32px" href="/">
  <svg class="dvk-brand-lockup" ...>   <!-- tower + name, wide -->
  <svg class="dvk-brand-mark" ...>     <!-- tower alone, narrow -->
</a>
```

```go
//go:embed static/lockup.svg static/glyph.svg
var marks embed.FS
```

**They must be inlined** - CSS cannot reach inside an `<img>`, which is also
why `fill="currentColor"` does nothing there. **`ds-focus` is not optional**:
without it the link falls back to the browser's thin default outline instead of
Designsystemet's ring.

> A dark-background file looking "small" or missing in a file viewer is white
> ink on white. Use `preview.html`, which shows each one on the right surface.

## How a Go service consumes this

Copy what you need into `static/` and embed it. No outbound dependencies at
runtime - no altinncdn.no, no Google Fonts, no jsDelivr. A Dataverket service
must be runnable by someone else, on a closed network, without us.

```go
//go:embed static
var static embed.FS

mux.Handle("GET /static/", http.FileServerFS(static))
```

Load order:

1. the fonts
2. `designsystemet.css` - declares `@layer ds`
3. `theme.css` - the generated theme, fills in `--ds-*`
4. `dataverket.css` - our patch, declares `@layer dataverket` after `ds`

Layers make precedence independent of file order, but keep the order: anything
unlayered you add later will depend on it.

See [`templates/layout.html`](templates/layout.html) and
[`templates/`](templates/).

## Components without React

- **`@digdir/designsystemet-css`** - components as plain classes and data
  attributes. `<button class="ds-button">` needs no JavaScript.
- **`@digdir/designsystemet-web`** - web components for the parts that need
  logic: `<ds-field>`, `<ds-tabs>`, `<ds-pagination>`, `<ds-suggestion>`,
  `<ds-breadcrumbs>`, `<ds-error-summary>`.

Without the JavaScript, buttons, cards, tables, tags and alerts still work;
tabs stop switching, `ds-pagination` renders no page numbers, and `ds-field`
stops wiring `aria-describedby`. `preview.html` is the fastest way to tell
whether the bundle is loading.

We do not use the React package.
[Why Digdir do not make everything a web component](https://designsystemet.no/en/blog/web-components-and-designsystemet-without-react/).

## Also read

- [The components](https://designsystemet.no/en/components) - before building
  something of your own.
- `docs/decisions/0001-service-naming.md` in fabrikk
  ([published](https://docs.dataverket.org/decisions/)) - service names are the
  brand, and are spelled the same way in the interface.
