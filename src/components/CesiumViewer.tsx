'use client';

import { useEffect, useRef, useState } from 'react';
import { TwinViewer } from '@/lib/cesium/TwinViewer';
import { useStore } from '@/lib/store';
import { LAYERS } from '@/lib/data/layers';

export default function CesiumViewer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const twinRef = useRef<TwinViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const store = useStore;

  // Initialise once.
  useEffect(() => {
    let cancelled = false;
    const twin = new TwinViewer();
    twinRef.current = twin;

    (async () => {
      try {
        const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
        if (!rootRef.current) return;
        await twin.init(rootRef.current, token);
        if (cancelled) return;

        // Wire selection back into the store.
        twin.onSelect = (f) => store.getState().setSelected(f);

        // Publish imperative actions for UI panels.
        store.getState().setHasToken(twin.tokenAvailable);
        store.getState().setActions({
          flyTo: (lng, lat, height, heading, pitch) => twin.flyTo(lng, lat, height, heading, pitch),
          flyToBbox: (bbox) => twin.flyToBbox(bbox),
          focusPoi: (poi) => twin.focusPoi(poi),
          resetNorth: () => twin.resetNorth(),
          getCameraState: () => twin.getCameraState(),
          screenshot: () => twin.screenshot(),
        });

        // Apply initial layer visibility (buildings/terrain need async setup).
        const layers = store.getState().layers;
        for (const def of LAYERS) {
          await twin.setLayerVisible(def.id, layers[def.id]);
        }
        twin.setTimeOfDay(store.getState().timeOfDay);
        twin.setWeather(store.getState().weather);
        twin.setCameraMode(store.getState().cameraMode);

        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to initialise the 3D scene.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      store.getState().setActions(null);
      twin.destroy();
      twinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to store changes and reflect them into the viewer.
  useEffect(() => {
    const unsub = store.subscribe((state, prev) => {
      const twin = twinRef.current;
      if (!twin || !twin.initialised) return;

      // Layers
      for (const def of LAYERS) {
        if (state.layers[def.id] !== prev.layers[def.id]) {
          void twin.setLayerVisible(def.id, state.layers[def.id]);
        }
      }
      if (state.viewMode !== prev.viewMode) void twin.applyViewMode(state.viewMode);
      if (state.cameraMode !== prev.cameraMode) twin.setCameraMode(state.cameraMode);
      if (state.timeOfDay !== prev.timeOfDay) twin.setTimeOfDay(state.timeOfDay);
      if (state.lighting !== prev.lighting) twin.setLighting(state.lighting);
      if (state.weather !== prev.weather) twin.setWeather(state.weather);
      if (state.seaLevelRise !== prev.seaLevelRise) twin.setSeaLevelRise(state.seaLevelRise);
      if (state.measureMode !== prev.measureMode) twin.setMeasureMode(state.measureMode);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div id="cesium-root" ref={rootRef} />
      {loading && (
        <div className="loading">
          <div className="spinner" />
          <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            Loading Metro Vancouver 3D twin…
          </div>
        </div>
      )}
      {error && (
        <div className="loading">
          <div style={{ maxWidth: 420, textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌐</div>
            <h2 style={{ margin: '0 0 8px' }}>Couldn&apos;t start the 3D scene</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
              This usually means CesiumJS couldn&apos;t load from the CDN, or WebGL is unavailable
              in this browser/session.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
