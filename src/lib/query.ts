import { MUNICIPALITIES } from './data/municipalities';
import { POINTS_OF_INTEREST } from './data/pointsOfInterest';
import { SKYTRAIN_LINES } from './data/skytrain';
import type { Poi, PoiCategory } from './types';

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  lng: number;
  lat: number;
  height: number;
  kind: 'municipality' | 'poi' | 'station' | 'coordinate';
}

// Great-circle distance in km between two [lng,lat] points.
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const COORD_RE = /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/;

export function search(queryRaw: string, limit = 8): SearchResult[] {
  const query = queryRaw.trim().toLowerCase();
  if (!query) return [];

  // Coordinate pair "lat, lng".
  const coord = queryRaw.match(COORD_RE);
  if (coord) {
    const lat = parseFloat(coord[1]);
    const lng = parseFloat(coord[2]);
    return [
      {
        id: 'coord',
        label: `${lat}, ${lng}`,
        sublabel: 'Coordinate',
        lat,
        lng,
        height: 3000,
        kind: 'coordinate',
      },
    ];
  }

  const results: SearchResult[] = [];

  for (const m of MUNICIPALITIES) {
    if (m.name.toLowerCase().includes(query)) {
      results.push({
        id: m.id,
        label: m.name,
        sublabel: `Municipality · ${m.population.toLocaleString()} people`,
        lng: m.center[0],
        lat: m.center[1],
        height: m.viewHeight,
        kind: 'municipality',
      });
    }
  }

  for (const p of POINTS_OF_INTEREST) {
    if (p.name.toLowerCase().includes(query) || p.category.includes(query)) {
      results.push({
        id: p.id,
        label: p.name,
        sublabel: `${p.category}`,
        lng: p.position[0],
        lat: p.position[1],
        height: 1800,
        kind: 'poi',
      });
    }
  }

  for (const line of SKYTRAIN_LINES) {
    for (const s of line.stations) {
      if (s.name.toLowerCase().includes(query)) {
        results.push({
          id: `${line.id}-${s.name}`,
          label: s.name,
          sublabel: `${line.name} station`,
          lng: s.position[0],
          lat: s.position[1],
          height: 1200,
          kind: 'station',
        });
      }
    }
  }

  return results.slice(0, limit);
}

// ---- Natural-language assistant ------------------------------------------

export interface AssistantResponse {
  text: string;
  results?: Poi[];
  action?:
    | { type: 'flyTo'; lng: number; lat: number; height: number }
    | { type: 'showLayer'; layer: string }
    | { type: 'simulate'; kind: 'flood'; meters: number };
}

const CATEGORY_WORDS: Record<string, PoiCategory> = {
  hospital: 'hospital',
  hospitals: 'hospital',
  university: 'university',
  universities: 'university',
  college: 'university',
  airport: 'airport',
  airports: 'airport',
  port: 'port',
  ports: 'port',
  bridge: 'bridge',
  bridges: 'bridge',
  park: 'park',
  parks: 'park',
  landmark: 'landmark',
  landmarks: 'landmark',
  stadium: 'stadium',
  stadiums: 'stadium',
};

/**
 * A lightweight, fully offline natural-language handler. It maps a set of
 * intent patterns to concrete map actions and dataset queries. This is the
 * seam where a real LLM (with function-calling over these same actions) would
 * be integrated — see README "Roadmap · AI".
 */
export function askAssistant(qRaw: string): AssistantResponse {
  const q = qRaw.toLowerCase().trim();

  // Flood / sea-level rise
  const floodMatch = q.match(/(flood|sea[- ]?level|sea level).*?(\d+(?:\.\d+)?)\s*m/);
  if (/flood|sea[- ]?level|sea level/.test(q)) {
    const meters = floodMatch ? parseFloat(floodMatch[2]) : 3;
    return {
      text: `Simulating a ${meters} m sea-level rise across the region. Low-lying areas of Richmond, Delta and the Fraser floodplain are most exposed.`,
      action: { type: 'simulate', kind: 'flood', meters },
    };
  }

  // "within N km" proximity queries, optionally around a place.
  const radiusMatch = q.match(/within\s+(\d+(?:\.\d+)?)\s*km/);
  const category = Object.keys(CATEGORY_WORDS).find((w) => q.includes(w));
  if (category) {
    const cat = CATEGORY_WORDS[category];
    let anchor: [number, number] | null = null;
    let anchorName = 'downtown Vancouver';
    for (const m of MUNICIPALITIES) {
      if (q.includes(m.name.toLowerCase())) {
        anchor = m.center;
        anchorName = m.name;
        break;
      }
    }
    if (!anchor) anchor = [-123.1207, 49.2827];

    let matches = POINTS_OF_INTEREST.filter((p) => p.category === cat);
    if (radiusMatch) {
      const km = parseFloat(radiusMatch[1]);
      matches = matches
        .filter((p) => haversineKm(anchor!, p.position) <= km)
        .sort((a, b) => haversineKm(anchor!, a.position) - haversineKm(anchor!, b.position));
      return {
        text: `Found ${matches.length} ${category} within ${km} km of ${anchorName}.`,
        results: matches,
        action: { type: 'showLayer', layer: layerForCategory(cat) },
      };
    }
    return {
      text: `Showing ${matches.length} ${category} across the region.`,
      results: matches,
      action: { type: 'showLayer', layer: layerForCategory(cat) },
    };
  }

  // "fly to <place>" / "show <place>" / "where is <place>"
  const flyMatch = q.match(/(?:fly to|go to|show|where is|take me to)\s+(.+)/);
  if (flyMatch) {
    const term = flyMatch[1];
    const r = search(term, 1)[0];
    if (r) {
      return {
        text: `Flying to ${r.label} (${r.sublabel}).`,
        action: { type: 'flyTo', lng: r.lng, lat: r.lat, height: r.height },
      };
    }
  }

  // Traffic / worst-traffic (no live feed yet)
  if (q.includes('traffic')) {
    return {
      text: 'Live traffic is on the roadmap (planned via the Open511 DriveBC feed). Typical congestion hotspots: the Massey Tunnel, Port Mann approaches, and the Cassiar/Ironworkers corridor at rush hour.',
      action: { type: 'flyTo', lng: -122.98, lat: 49.15, height: 20000 },
    };
  }

  // Fallback
  return {
    text: "I can fly you to any city, landmark or station, list amenities (“show hospitals within 10 km of Surrey”), or run a flood simulation (“flood 4m”). Live-data intents (traffic, transit, routing) are stubbed pending API hookup.",
  };
}

function layerForCategory(cat: PoiCategory): string {
  const map: Record<PoiCategory, string> = {
    airport: 'airports',
    port: 'ports',
    hospital: 'hospitals',
    university: 'universities',
    bridge: 'bridges',
    park: 'parks',
    landmark: 'landmarks',
    stadium: 'landmarks',
    'transit-hub': 'skytrain',
  };
  return map[cat];
}
