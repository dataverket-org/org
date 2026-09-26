# Design system

Dataverket's theme for [Designsystemet](https://designsystemet.no), Digdir's
shared design system. The source for every Dataverket surface with a user
interface.

## What it gives you

- **A UI toolkit for Go and htmx.** Components as CSS classes and web
  components. No React, and no build step in your service.
- **No outbound dependencies at runtime.** Fonts, CSS and JavaScript are served
  from your own binary. A service runs on a closed network, without us.
- **Accessibility inherited.** Universal design, 4.5:1 contrast and the focus
  ring come from Designsystemet.
- **One brand that cannot drift.** The logo, the small-size icon and the logo
  with the name are cut from one script into one set of files.
- **Nothing to install to consume it.** `build/` is committed.

## Try it

Requires podman (or docker) and go-task. Nothing else: no Node, no Python.

```sh
# macOS:  brew install podman go-task && podman machine init && podman machine start
# Linux:  install podman and go-task from your distribution

git clone ssh://git@git.dataverket.org/dataverket/org.git
cd org/design

task              # list the targets
task build        # build the toolchain image, generate, copy the results out
task preview      # serve on http://localhost:8123 and open a browser
```

`task build` takes about 40 seconds the first time. `task preview` runs in the
foreground and shows every Designsystemet component on the Dataverket theme.

## Use it in a service

Copy `build/`, `vendor/` and `dataverket.css` into the service's `static/`
and embed them.

```go
//go:embed static
var static embed.FS

mux.Handle("GET /static/", http.FileServerFS(static))
```

Load in this order:

1. the fonts
2. `designsystemet.css` - declares `@layer ds`
3. `theme.css` - the generated theme, fills in `--ds-*`
4. `dataverket.css` - our patch, declares `@layer dataverket` after `ds`

Layers make precedence independent of file order, but keep the order: anything
unlayered you add later will depend on it.

See [`templates/layout.html`](templates/layout.html) for the head, and
[`templates/`](templates/) for component and htmx patterns.

## What lives here

| File | What it is |
|---|---|
| `designsystemet.config.json` | Theme source. Colours, radius, font. |
| `logo.js` | Logo source. The shapes. |
| `dataverket.css` | Our patch. The four things Designsystemet does not give us. |
| `templates/` | Go `html/template` references for htmx services. |
| `preview.html` | Contact sheet. `task preview`; needs a server, not `file://`. |
| `Dockerfile` | The toolchain and the build. Versions pinned here. |
| `fonts.sh` | Fetches the latin font subsets. |
| `Taskfile.yaml` | Builds the image, copies the results out. |
| `build/` | Generated, committed. Never edit by hand. |
| `vendor/` | Third-party, fetched, not committed. |

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

- `accent` - navy. Primary actions, focus, links. Resolves to `#9facc0` in
  dark, because navy is unreadable against a dark surface.
- `brand1` - flag red. **Identity only**: logo, editorial emphasis. Never a
  button, never a status - it sits too close to `danger`.

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

Our classes take the `dvk-` prefix, not `ds-`. The patch sits in `@layer
dataverket` after `ds`, so it wins without `!important`.

## The logo

| File | What it is |
|---|---|
| `logo-*.svg` | The tower. Holds down to 32 px. |
| `glyph-*.svg` | The tower simplified. **24 px is the first size that takes it.** |
| `lockup-*.svg` | The tower with "Dataverket" beside it. |

The suffix names the **background** the file is for, not the colour of its ink
- `logo-dark.svg` is the white one. `logo.svg`, `glyph.svg` and `lockup.svg`
are the same shapes with `fill="currentColor"`, and carry the class and
`<title>` they need when inlined.

**Inline those and let them take the text colour.** CSS cannot reach inside an
`<img>`, which is also why `fill="currentColor"` does nothing there. The
fixed-colour files are for what cannot be inlined: email, a README image, a
favicon, a plate whose colour you control.

> **Do not drive the logo from `<picture>` with `prefers-color-scheme`.** That
> reports the operating system's setting, not `data-color-scheme`. With a theme
> toggle, a viewer on a dark OS who picks the light theme gets the white logo
> on a white header.

The brand link is two inline SVGs at one height, swapped with `display`.
**`ds-focus` is not optional** - without it the link falls back to the
browser's thin default outline.

```html
<a class="dvk-brand ds-focus" style="--dvk-brand-size: 32px" href="/">
  <svg class="dvk-brand-lockup" ...>   <!-- tower + name, wide -->
  <svg class="dvk-brand-mark" ...>     <!-- tower alone, narrow -->
</a>
```

## Components without React

- **`@digdir/designsystemet-css`** - components as plain classes and data
  attributes. `<button class="ds-button">` needs no JavaScript.
- **`@digdir/designsystemet-web`** - web components for the parts that need
  logic: `<ds-field>`, `<ds-tabs>`, `<ds-pagination>`, `<ds-suggestion>`,
  `<ds-breadcrumbs>`, `<ds-error-summary>`.

Without the JavaScript, buttons, cards, tables, tags and alerts still work;
tabs stop switching, `ds-pagination` renders no page numbers, and `ds-field`
stops wiring `aria-describedby`.

We do not use the React package.
[Why Digdir do not make everything a web component](https://designsystemet.no/en/blog/web-components-and-designsystemet-without-react/).

## Build

The build runs in image layers; `task build` copies the results out with
`podman cp`. Nothing is bind-mounted.

```sh
task check      # fail if the committed build/ is out of sync with the sources
task clean      # remove what the build produced
```

`task preview` mounts the working copy read-only, so editing `preview.html` or
`dataverket.css` needs only a refresh. `logo.js` and the theme go through
`build/`, which it rebuilds. To serve the image itself:

```sh
podman run --rm -p 8123:8123 dataverket-design:1.23.0
```

`DS_VERSION` names the image tag and rebuilds on its own; other version bumps
need `task image:rebuild`. The theme is `build/theme.css`; the CLI's own output
name collides with `dataverket.css`.

## Also read

- [The components](https://designsystemet.no/en/components) - before building
  something of your own.
- `docs/decisions/0001-service-naming.md` in fabrikk
  ([published](https://docs.dataverket.org/decisions/)) - service names are the
  brand, and are spelled the same way in the interface.
