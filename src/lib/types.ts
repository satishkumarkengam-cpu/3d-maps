// Shared domain types for the Metro Vancouver 3D digital twin.

export type LngLat = [number, number]; // [longitude, latitude]

export interface Municipality {
  id: string;
  name: string;
  center: LngLat;
  /** Approximate 2021 census population. */
  population: number;
  /** Land area in km². */
  areaKm2: number;
  /** Suggested camera height (m) when flying to this city. */
  viewHeight: number;
  /** Rough bounding box [west, south, east, north] used for framing. */
  bbox: [number, number, number, number];
  optional?: boolean;
}

export type PoiCategory =
  | 'airport'
  | 'port'
  | 'landmark'
  | 'hospital'
  | 'university'
  | 'bridge'
  | 'park'
  | 'transit-hub'
  | 'stadium';

export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
  position: LngLat;
  /** Optional height above ground in meters (for billboards/labels). */
  elevation?: number;
  description?: string;
}

export interface TransitLine {
  id: string;
  name: string;
  color: string; // CSS hex
  /** Ordered station stops, each an [lng, lat] pair. */
  stations: { name: string; position: LngLat }[];
}

export type LayerId =
  | 'municipalities'
  | 'buildings'
  | 'skytrain'
  | 'airports'
  | 'ports'
  | 'hospitals'
  | 'universities'
  | 'bridges'
  | 'landmarks'
  | 'parks'
  | 'terrain';

export interface LayerDef {
  id: LayerId;
  label: string;
  group: 'base' | 'infrastructure' | 'amenities' | 'analysis';
  description: string;
  defaultOn: boolean;
  /** Whether this layer depends on a Cesium Ion token to look its best. */
  needsToken?: boolean;
}
