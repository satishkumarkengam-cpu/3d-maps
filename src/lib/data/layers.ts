import type { LayerDef } from '../types';

// Declarative catalogue of toggleable map layers surfaced in the Layer Manager.
// Additional live-data layers (traffic, transit vehicles, weather radar, air
// quality, etc.) are part of the roadmap and would plug in here as they are
// wired to real APIs — see README "Roadmap".
export const LAYERS: LayerDef[] = [
  {
    id: 'terrain',
    label: 'Photorealistic Terrain',
    group: 'base',
    description: 'Cesium World Terrain elevation with hillshading.',
    defaultOn: true,
    needsToken: true,
  },
  {
    id: 'buildings',
    label: '3D Buildings',
    group: 'base',
    description: 'Global OSM building footprints extruded in 3D.',
    defaultOn: true,
    needsToken: true,
  },
  {
    id: 'municipalities',
    label: 'Municipal Boundaries',
    group: 'base',
    description: 'Region & Fraser Valley community centroids and labels.',
    defaultOn: true,
  },
  {
    id: 'skytrain',
    label: 'SkyTrain Lines',
    group: 'infrastructure',
    description: 'Expo, Millennium & Canada Line routes and stations.',
    defaultOn: true,
  },
  {
    id: 'bridges',
    label: 'Major Bridges',
    group: 'infrastructure',
    description: 'Key Fraser River & Burrard Inlet crossings.',
    defaultOn: false,
  },
  {
    id: 'airports',
    label: 'Airports',
    group: 'infrastructure',
    description: 'YVR, Abbotsford, Boundary Bay, Pitt Meadows.',
    defaultOn: true,
  },
  {
    id: 'ports',
    label: 'Ports & Terminals',
    group: 'infrastructure',
    description: 'Port of Vancouver, Deltaport, Fraser Surrey Docks.',
    defaultOn: false,
  },
  {
    id: 'hospitals',
    label: 'Hospitals',
    group: 'amenities',
    description: 'Acute-care hospitals across the region.',
    defaultOn: false,
  },
  {
    id: 'universities',
    label: 'Universities & Colleges',
    group: 'amenities',
    description: 'UBC, SFU, KPU, BCIT, UFV.',
    defaultOn: false,
  },
  {
    id: 'landmarks',
    label: 'Landmarks & Stadiums',
    group: 'amenities',
    description: 'Iconic attractions and venues.',
    defaultOn: true,
  },
  {
    id: 'parks',
    label: 'Parks',
    group: 'amenities',
    description: 'Major regional and urban parks.',
    defaultOn: false,
  },
];
