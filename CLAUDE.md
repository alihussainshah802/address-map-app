# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Search for an address, see it on a map. A client-side-only Vite + React 19 SPA in plain JSX — no TypeScript, no backend, no build step beyond Vite. The entire app is `src/App.jsx` (~160 lines); there is no router, no state library, and no component directory. Keep it that way unless the app actually grows.

**No API keys and no accounts.** Map tiles come from OpenStreetMap and geocoding from Nominatim, both free and keyless. `.env.example` exists only as a placeholder. If you find yourself adding a key, stop and reconsider — the whole point of the current stack is that there isn't one.

## Commands

```bash
pnpm install       # pnpm, not npm — see "Dependencies" below
pnpm dev           # Vite dev server on :5173
pnpm build         # production build
pnpm lint          # oxlint (config in .oxlintrc.json)
```

There is no test suite. `pnpm build` plus `pnpm lint` is the full check.

## Architecture

`App.jsx` holds everything and splits into two concerns that only meet through one piece of state:

- **The map** — `MapContainer` / `TileLayer` / `Marker` from `react-leaflet`.
- **Address search** — a debounced controlled input querying Nominatim through `leaflet-geosearch`'s `OpenStreetMapProvider`.

`selectedPlace` (`{ position: [lat, lng], address }`) is the only thing connecting them. Search sets it; the map reads it.

### Gotchas that will bite you

Each of these was a real bug during the Google Maps → Leaflet migration. They look like style choices but are not.

- **Marker icons must be imported.** Leaflet resolves its default icon with relative URLs, which Vite's asset hashing breaks — you get a working map with an invisible pin and no error. `marker-icon.png`, `marker-icon-2x.png`, and `marker-shadow.png` are imported explicitly and wired into an `L.icon`. Don't "simplify" that away.
- **`leaflet/dist/leaflet.css` must be imported** or the map renders as scrambled tile fragments.
- **Overlays need `z-index: 1000`.** Leaflet's internal panes sit at 400, so any overlay below that disappears under the map. Every absolutely-positioned overlay in `App.css` uses 1000 deliberately.
- **Panning happens inside `MapContainer`.** react-leaflet exposes the map only via context, so `App` cannot call `flyTo`. The `MapFocus` child exists solely to call `useMap()` and fly when `selectedPlace` changes.
- **`skipSearchRef` is load-bearing.** Selecting a result writes its label into the input, which would otherwise re-trigger the search effect and immediately reopen the dropdown the selection just closed. Removing the ref silently reintroduces that.
- **Requests are ordered by `requestIdRef`,** so a slow earlier lookup can't land after a newer one and overwrite fresher results.

### Nominatim usage policy

Automated traffic is capped at roughly one request per second, which is why typing is debounced (`SEARCH_DEBOUNCE_MS`) and short queries are skipped (`MIN_QUERY_LENGTH`). Don't lower either to make search feel snappier — that breaks the policy rather than the code. Attribution for tiles and geocoding is required and is rendered on the map; leave it in place.

Both the public Nominatim and OpenStreetMap tile endpoints are for development-scale traffic. Anything genuinely public needs a self-hosted or commercial provider.

## Dependencies

**pnpm only** (not npm/yarn), exact versions, no ranges. `pnpm-workspace.yaml` enforces this: `minimumReleaseAge: 30240` blocks any release under three weeks old, including transitive ones, and `savePrefix: ''` keeps `pnpm add` writing exact versions. pnpm also blocks dependency lifecycle scripts by default; leave that on.

If a package you need is newer than the window, add that one package to `minimumReleaseAgeExclude` rather than lowering the global value — and say so rather than doing it quietly.

`react-leaflet` is **Hippocratic-2.1**, an ethical-source licence that is *not* OSI-approved. This was a deliberate, informed choice. Leaflet itself is BSD-2 and `leaflet-geosearch` is MIT, so dropping the React wrapper for direct Leaflet calls is the escape hatch if that licence ever becomes a problem.

## Dev container

`.devcontainer/` is gitignored and exists only on the original author's machine — nothing in this repo reconstructs it. It is a container with a default-deny egress firewall, and it installs a locally generated AVG root CA that is meaningless anywhere else. Don't assume it is present, and don't add it to version control.
