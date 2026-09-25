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
| `design-tokens-build/dataverket.css` | The generated theme. **Build artifact** - never edit by hand. Committed so consumers need no build step. |
| `dataverket.css` | Our patch. Everything Dataverket adds on top of Designsystemet, and not one line more. |
| `assets/` | The mark. Four files, two shapes, two colour schemes. |
| `templates/` | Go `html/template` references for htmx services. |
| `preview.html` | Contact sheet that loads the real files. `task preview`. |
| `Taskfile.yaml` | Generation and fetching. |
| `vendor/` | Designsystemet, the fonts and htmx, fetched. Not in git - `task vendor`. |

## Node belongs in a container

Designsystemet's CLI is a Node tool. Nobody should have to install npm to work
on Dataverket, so the CLI runs in a container and the result is committed. Our
services are Go and htmx and never see a `node_modules`.

```sh
task tokens     # regenerate the theme (needs podman or docker)
task vendor     # fetch Designsystemet, the fonts and htmx (curl and tar only)
task check      # fail if the committed theme does not match the config
```

`task tokens` runs rarely - only when `designsystemet.config.json` changes, or
when `DS_VERSION` in `Taskfile.yaml` is bumped. `task check` belongs in CI.

`task vendor` uses no Node at all: it pulls the packages straight from the npm
registry with `curl` and unpacks them with `tar`.

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

Right now there are three things Designsystemet does not give us:

1. **`--dvk-font-mono`** - Designsystemet has no monospace token. Every
   identifier (IDs, IPs, CIDRs, hashes, image tags, durations) is set in
   JetBrains Mono via the `.dvk-mono` class.
2. **`font-feature-settings: "cv05" 1`** on `body` - Designsystemet's own
   recommendation from the setup guide. Gives lowercase `l` a tail so it stops
   looking like `1`. That matters a lot on a screen full of identifiers.
3. **`.dvk-busy`** - dims the region htmx is swapping while the request is in
   flight.

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
ink. So `logo-dark.svg` is the white one. That is the same convention as
`prefers-color-scheme`, which makes `<picture>` read straight through:

```html
<picture>
  <source srcset="/static/logo-dark.svg" media="(prefers-color-scheme: dark)">
  <img src="/static/logo-light.svg" alt="Dataverket" height="32">
</picture>
```

`glyph-*` is the simplified shape: the tower without shoulders or doorway. It
is for small sizes and favicons, where the detail in the full shape turns to
mush. Both shapes share a `viewBox` and the same outer bounds, so they can be
swapped without anything jumping.

`logo.svg` and `glyph.svg` are the same shapes with `fill="currentColor"`.
Inline them in HTML when the mark should inherit the text colour - then you
need neither `<picture>` nor a media query.

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

The order in `<head>` is not optional:

1. the fonts
2. `designsystemet.css` - declares `@layer ds`
3. `dataverket-theme.css` - the generated theme, fills in `--ds-*`
4. `dataverket.css` - our patch, declares `@layer dataverket` after `ds`

See [`templates/layout.html`](templates/layout.html) for the full head, and
[`templates/`](templates/) for component and htmx patterns.

## Components without React

Designsystemet ships two packages we care about:

- **`@digdir/designsystemet-css`** - the components as plain classes and data
  attributes. `<button class="ds-button">` works without a line of JavaScript.
- **`@digdir/designsystemet-web`** - web components for the parts that need
  logic: `<ds-field>`, `<ds-tabs>`, `<ds-pagination>`, `<ds-suggestion>`,
  `<ds-breadcrumbs>`, `<ds-error-summary>`. Framework agnostic, imported once,
  self-registering.

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
