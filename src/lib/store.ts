import { create } from 'zustand';
import type { LayerId, Poi } from './types';
import { LAYERS } from './data/layers';

export type CameraMode = 'orbit' | 'free-fly' | 'drone' | 'first-person';
export type ViewMode = 'photorealistic' | 'satellite' | 'streets' | 'dark' | 'terrain';
export type MeasureMode = 'none' | 'distance' | 'area';

export interface SelectedFeature {
  name: string;
  category?: string;
  position: [number, number];
  facts: { label: string; value: string }[];
}

interface AppState {
  // Layer visibility
  layers: Record<LayerId, boolean>;
  toggleLayer: (id: LayerId) => void;
  setLayer: (id: LayerId, on: boolean) => void;

  // Camera & view
  cameraMode: CameraMode;
  setCameraMode: (m: CameraMode) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;

  // Environment / time
  timeOfDay: number; // 0..24 hours (local)
  setTimeOfDay: (h: number) => void;
  lighting: boolean;
  toggleLighting: () => void;
  weather: 'clear' | 'rain' | 'fog' | 'snow';
  setWeather: (w: AppState['weather']) => void;

  // Simulation
  seaLevelRise: number; // meters, 0..10
  setSeaLevelRise: (m: number) => void;

  // Interaction
  measureMode: MeasureMode;
  setMeasureMode: (m: MeasureMode) => void;
  selected: SelectedFeature | null;
  setSelected: (f: SelectedFeature | null) => void;

  // UI panels
  activePanel: string | null;
  setActivePanel: (p: string | null) => void;

  // Token awareness (set once Cesium is initialised)
  hasToken: boolean;
  setHasToken: (v: boolean) => void;

  // Bridge for imperatively driving the Cesium viewer from React UI.
  // Populated by CesiumViewer once ready.
  actions: ViewerActions | null;
  setActions: (a: ViewerActions | null) => void;

  // Bookmarks
  bookmarks: { id: string; name: string; lng: number; lat: number; height: number }[];
  addBookmark: (b: AppState['bookmarks'][number]) => void;
  removeBookmark: (id: string) => void;
}

// Imperative API implemented by the Cesium viewer and consumed by UI panels.
export interface ViewerActions {
  flyTo: (lng: number, lat: number, height: number, headingDeg?: number, pitchDeg?: number) => void;
  flyToBbox: (bbox: [number, number, number, number]) => void;
  focusPoi: (poi: Poi) => void;
  resetNorth: () => void;
  getCameraState: () => { lng: number; lat: number; height: number } | null;
  screenshot: () => void;
}

const defaultLayers = LAYERS.reduce(
  (acc, l) => ({ ...acc, [l.id]: l.defaultOn }),
  {} as Record<LayerId, boolean>,
);

export const useStore = create<AppState>((set) => ({
  layers: defaultLayers,
  toggleLayer: (id) =>
    set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setLayer: (id, on) => set((s) => ({ layers: { ...s.layers, [id]: on } })),

  cameraMode: 'orbit',
  setCameraMode: (m) => set({ cameraMode: m }),
  viewMode: 'photorealistic',
  setViewMode: (m) => set({ viewMode: m }),

  timeOfDay: 13,
  setTimeOfDay: (h) => set({ timeOfDay: h }),
  lighting: true,
  toggleLighting: () => set((s) => ({ lighting: !s.lighting })),
  weather: 'clear',
  setWeather: (w) => set({ weather: w }),

  seaLevelRise: 0,
  setSeaLevelRise: (m) => set({ seaLevelRise: m }),

  measureMode: 'none',
  setMeasureMode: (m) => set({ measureMode: m }),
  selected: null,
  setSelected: (f) => set({ selected: f }),

  activePanel: 'layers',
  setActivePanel: (p) => set({ activePanel: p }),

  hasToken: false,
  setHasToken: (v) => set({ hasToken: v }),

  actions: null,
  setActions: (a) => set({ actions: a }),

  bookmarks: [],
  addBookmark: (b) => set((s) => ({ bookmarks: [...s.bookmarks, b] })),
  removeBookmark: (id) =>
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
}));
