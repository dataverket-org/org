// dataverket.js - the one thing Dataverket adds to htmx.
//
// .dvk-busy (dataverket.css) dims a region while htmx swaps it, but dimming is
// visual only. aria-busy tells a screen reader the region is being replaced,
// so it does not read out half-updated content. htmx does not set it itself.
//
// Listens on document, so load order against htmx.min.js does not matter.

document.addEventListener('htmx:beforeRequest', (e) => {
  e.detail.target?.setAttribute('aria-busy', 'true');
});

// afterRequest fires on success, error and timeout alike. After an outerHTML
// swap the old target is detached and this is a no-op; the new one never had it.
document.addEventListener('htmx:afterRequest', (e) => {
  e.detail.target?.removeAttribute('aria-busy');
});
