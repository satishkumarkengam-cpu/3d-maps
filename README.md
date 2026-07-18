# Metro Vancouver 3D Digital Twin

An interactive, web‑based **3D digital twin of the Metro Vancouver region and Fraser Valley**, built with **Next.js + TypeScript + CesiumJS**. It renders a photorealistic globe with terrain and 3D buildings, overlays real infrastructure and amenity data for 19 communities, and provides a glassmorphism control surface for layers, camera modes, environment, simulation, measurement, and a query‑driven assistant.

> **Scope note.** The original brief describes an enterprise, multi‑year platform. This repository is a **production‑quality, runnable foundation** that implements a strong working subset end‑to‑end and is architected so the remaining features slot in cleanly. See **[Roadmap](#roadmap)** for what is real today vs. planned.

## What works today

**Scene & data**
- CesiumJS globe centred on Metro Vancouver with an oblique regional overview camera.
- **Photorealistic terrain** (Cesium World Terrain) and **3D buildings** (Cesium OSM Buildings) when a Cesium Ion token is supplied; graceful open‑data fallback (OpenStreetMap imagery + flat terrain) without one.
- Curated, real‑world datasets for **19 municipalities** (centroids, population, area), **35+ landmarks/infrastructure POIs** (airports, ports, hospitals, universities, bridges, stadiums, parks), and the full **SkyTrain network** (Expo, Millennium, Canada Line + branches) as polylines with stations.

**Interaction**
- **Layer Manager** — grouped, toggleable layers (base, infrastructure, amenities) with per‑layer descriptions.
- **Search** with autocomplete over cities, POIs, SkyTrain stations, and raw `lat, lng` coordinates.
- **Camera modes** — Orbit (auto‑rotate), Free‑Fly, Drone (forward drift), First‑Person (street level).
- **Render modes** — Satellite / Streets / Topographic / Dark.
- **Environment** — dynamic sun & shadows, time‑of‑day slider (Pacific time), and weather approximations (clear/rain/fog/snow via atmospheric fog & brightness).
- **Simulation** — sea‑level‑rise / flood overlay driven by a metres slider.
- **Measure** — distance (multi‑point path, km) and area (polygon, km²).
- **Places & bookmarks** — jump‑to‑community buttons and savable, named camera bookmarks.
- **Click‑to‑inspect** — click any building or feature for an info panel (address, height, estimated floors, category, population/density, coordinates…).
- **AI Assistant** — an offline, rule‑based intent parser wired to real map actions ("show hospitals within 10 km of Surrey", "fly to Vancouver Airport", "flood 4m").
- HUD **compass** (click to reset north) and a live **status bar** (camera/view mode, lat/lng/altitude).
- **Screenshot** export.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, TypeScript (strict) |
| 3D engine | CesiumJS (loaded from CDN, or self‑hosted) |
| State | Zustand |
| Styling | Hand‑rolled CSS (glassmorphism design system) |

Cesium is loaded at runtime from the CDN to keep the build fast and avoid the static‑asset copy pipeline. The React UI drives the scene through a small imperative surface (`TwinViewer` + `ViewerActions`), keeping rendering concerns out of React.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # optional: add a Cesium Ion token
npm run dev                        # http://localhost:3000
```

- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run typecheck` — `tsc --noEmit`

### Cesium Ion token (optional but recommended)

Without a token the app runs in **open‑data mode** (OpenStreetMap imagery, flat terrain, no global 3D buildings). Add a free token from <https://cesium.com/ion/tokens> to `.env.local` to unlock world terrain, OSM Buildings, and Bing/Sentinel imagery:

```
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_token_here
```

### Self‑hosting Cesium (optional)

To avoid the CDN, copy a Cesium build into `public/` and point the app at it:

```bash
npm pack cesium@1.119            # or: npm i cesium
# extract/copy Build/Cesium -> public/cesium
echo "NEXT_PUBLIC_CESIUM_BASE_URL=/cesium" >> .env.local
```

## Project structure

```
src/
  app/                     # Next.js App Router (layout, page, global CSS)
  components/
    CesiumViewer.tsx       # binds the Zustand store to the imperative viewer
    ui/                    # TopBar, Dock, Panels, InfoPanel, HUD, Assistant
  lib/
    cesium/
      loadCesium.ts        # CDN / self‑hosted Cesium loader
      TwinViewer.ts        # all imperative scene logic (layers, camera, sim…)
    data/                  # municipalities, POIs, SkyTrain, layer catalogue
    query.ts               # search + offline NL assistant
    store.ts               # Zustand app state + ViewerActions contract
    types.ts               # shared domain types
```

Adding a new dataset‑backed layer is a three‑step change: add data under `lib/data`, register it in `lib/data/layers.ts`, and render it in `TwinViewer.buildLayers()`. The Layer Manager, store, and toggles pick it up automatically.

## Roadmap

The following brief items are **not yet implemented** and are the natural next increments. Each has a defined seam in the current architecture:

- **Live data** — traffic (Open511/DriveBC), real‑time transit vehicle positions (TransLink GTFS‑RT), weather & air quality, road closures, ferry/flight/marine tracking, earthquakes. These become additional layers + a polling data service.
- **Richer analytics** — real property values, zoning, energy ratings, Walk/Transit Score via open‑data / third‑party APIs (the building info panel already has the slots).
- **More layers** — traffic, population density, crime, property values, schools, restaurants, EV charging, bike & hiking routes, utilities, cell towers (all plug into the Layer Manager).
- **Simulation depth** — clip flood/sea‑level against a DEM; wildfire smoke, earthquake shaking, traffic prediction, urban‑growth scenarios.
- **AI** — replace the offline intent parser with a Claude function‑calling agent over the existing `ViewerActions` surface.
- **Animated transport** — moving SkyTrain/bus/ferry/aircraft/ship entities from live feeds.
- **Premium** — VR/AR, historical time‑lapse, solar/noise analysis, parcels, indoor maps, multi‑user collaboration.

## Data & accuracy

Coordinates, populations, and areas are approximate values suitable for navigation and contextual display, not survey‑grade use. Populations reflect the 2021 Canadian census. Building‑level analytics beyond OSM properties (value, zoning, energy) are illustrative placeholders pending open‑data integration.

## License

Provided as‑is for demonstration and further development.
