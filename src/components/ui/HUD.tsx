'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

// Compass + bottom status bar. Polls the viewer's camera on a light interval
// rather than per-frame to keep React re-renders cheap.
export default function HUD() {
  const actions = useStore((s) => s.actions);
  const cameraMode = useStore((s) => s.cameraMode);
  const viewMode = useStore((s) => s.viewMode);
  const [cam, setCam] = useState<{ lng: number; lat: number; height: number } | null>(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    if (!actions) return;
    const id = setInterval(() => {
      const c = actions.getCameraState();
      if (c) setCam(c);
    }, 300);
    return () => clearInterval(id);
  }, [actions]);

  // Heading indicator resets when north is reset; approximate via camera state
  // is not exposed, so we keep the needle pointing north as a static reference.
  useEffect(() => {
    setHeading(0);
  }, [cameraMode]);

  const fmtH = (h: number) => (h >= 1000 ? `${(h / 1000).toFixed(1)} km` : `${Math.round(h)} m`);

  return (
    <>
      <button
        className="compass glass"
        onClick={() => actions?.resetNorth()}
        title="Reset north"
        aria-label="Reset north"
      >
        <span className="n">N</span>
        <span className="needle" style={{ transform: `rotate(${-heading}deg)` }} />
      </button>

      <div className="statusbar glass">
        <span>
          Camera: <b style={{ textTransform: 'capitalize' }}>{cameraMode.replace('-', ' ')}</b>
        </span>
        <span className="sep" />
        <span>
          View: <b style={{ textTransform: 'capitalize' }}>{viewMode}</b>
        </span>
        <span className="sep" />
        {cam ? (
          <>
            <span>
              Lat <b>{cam.lat.toFixed(4)}</b>
            </span>
            <span>
              Lng <b>{cam.lng.toFixed(4)}</b>
            </span>
            <span>
              Alt <b>{fmtH(cam.height)}</b>
            </span>
          </>
        ) : (
          <span>Locating camera…</span>
        )}
      </div>
    </>
  );
}
