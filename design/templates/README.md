# Templates

Go `html/template` references for a Dataverket service: a base layout,
component markup, and htmx patterns.

These are **references to copy from**, not a library to import. `htmx.html`
refers to a `node-list` template that only exists in your service, so parsing
this directory wholesale into a running app will fail at execute time. Take the
fragments you need.

| File | What it covers |
|---|---|
| `layout.html` | Base page: `<head>` load order, colour scheme, skip link, logo swap |
| `components.html` | The `ds-*` markup for buttons, fields, alerts, cards, tables, tags, tabs, breadcrumbs, drawers |
| `htmx.html` | Partial swaps, loading indicators, server-side validation, confirmation, paging |

Every class and attribute is taken from `@digdir/designsystemet-css` 1.23.0.
Do not invent `ds-*` classes - check the
[component documentation](https://designsystemet.no/en/components) first.

## The three attributes

Size, colour and colour scheme are inherited from a container, not set per
component:

```html
<html data-color-scheme="auto" data-size="md">
  ...
  <div data-color="danger">
    <button class="ds-button">Delete</button>   <!-- becomes a danger button -->
  </div>
```

- `data-color-scheme="light | dark | auto"` - `auto` follows the OS
- `data-size="sm | md | lg"`
- `data-color="accent | brand1 | neutral | success | warning | danger | info"`

`accent` is Dataverket navy and is the primary action colour. `brand1` is flag
red and is **identity only** - logo, editorial emphasis. Never a button, never
a status: it sits too close to `danger`.

## Web components

Some components need logic and ship as custom elements from
`@digdir/designsystemet-web`, imported once in the layout:

`<ds-field>` `<ds-tabs>` `<ds-tablist>` `<ds-tab>` `<ds-tabpanel>`
`<ds-pagination>` `<ds-suggestion>` `<ds-breadcrumbs>` `<ds-error-summary>`

`<ds-field>` is the one you will reach for most: it wires `label`,
`[data-field="description"]` and `[data-field="validation"]` to the input with
the right `aria-*` relationships, so you never hand-write `aria-describedby`.

Everything else - buttons, cards, tables, tags, alerts - is plain HTML plus a
class, and works with JavaScript disabled.

## House rules for copy

Taken from the design system; they matter more than they look.

- **Sentence case** everywhere: "Create cluster", not "Create Cluster".
  Acronyms keep their case: API, IP, VM, S3, OIDC, CIDR, mTLS.
- **Identifiers in `.dvk-mono`** - IDs, IPs, CIDRs, hashes, image tags,
  durations.
- **Errors say what broke, where, and what to try.** "Couldn't reach `node-3` -
  last seen 4 m ago", never "Something went wrong".
- **Imperative for actions, indicative for status.** No "Please". No
  exclamation marks. **No emoji in product UI** - status is a tag plus a
  colour.
- **Relative time in lists** ("4 m ago"), absolute on hover
  (`2026-04-12 14:32 UTC`). Binary prefixes for storage (`4 GiB`), decimal for
  network (`100 Mbps`).

## Keep the focus ring

Designsystemet's focus ring is thick and high-contrast on purpose. It is an
accessibility requirement. Do not thin it, recolour it, or remove it.
