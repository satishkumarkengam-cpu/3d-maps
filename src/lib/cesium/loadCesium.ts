// Loads CesiumJS from the official CDN at runtime and resolves the global
// `Cesium` namespace. We load from CDN (rather than bundling the ~10MB package
// through webpack) to keep the build fast and avoid the static-asset copy
// pipeline. The global is typed as `any` because the CDN build's API surface
// is version-specific; runtime feature-detection guards the calls we make.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Cesium = any;

const VERSION = process.env.NEXT_PUBLIC_CESIUM_VERSION || '1.119';
// Prefer a self-hosted Cesium build when NEXT_PUBLIC_CESIUM_BASE_URL is set
// (e.g. "/cesium" served from /public), otherwise fall back to the CDN.
const BASE = (
  process.env.NEXT_PUBLIC_CESIUM_BASE_URL ||
  `https://cdn.jsdelivr.net/npm/cesium@${VERSION}/Build/Cesium`
).replace(/\/$/, '');

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var Cesium: any;
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

let loadPromise: Promise<Cesium> | null = null;

export function loadCesium(): Promise<Cesium> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Cesium can only be loaded in the browser.'));
  }
  if (globalThis.Cesium) return Promise.resolve(globalThis.Cesium);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    window.CESIUM_BASE_URL = `${BASE}/`;

    // Stylesheet for the Cesium widgets.
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${BASE}/Widgets/widgets.css`;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = `${BASE}/Cesium.js`;
    script.async = true;
    script.onload = () => {
      if (globalThis.Cesium) resolve(globalThis.Cesium);
      else reject(new Error('Cesium loaded but global was not found.'));
    };
    script.onerror = () => reject(new Error('Failed to load CesiumJS from CDN.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
