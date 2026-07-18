'use client';

import { useState } from 'react';
import { useStore, type CameraMode, type ViewMode } from '@/lib/store';
import { LAYERS } from '@/lib/data/layers';
import { MUNICIPALITIES } from '@/lib/data/municipalities';
import type { LayerDef, LayerId } from '@/lib/types';
import Assistant from './Assistant';

function PanelFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="panel glass">
      <div className="panel-head">
        <h2>{title}</h2>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button className={`switch ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} />;
}

/* ---------------- Layers ---------------- */
function LayersPanel() {
  const layers = useStore((s) => s.layers);
  const toggle = useStore((s) => s.toggleLayer);
  const hasToken = useStore((s) => s.hasToken);

  const groups: { key: LayerDef['group']; title: string }[] = [
    { key: 'base', title: 'Base & Terrain' },
    { key: 'infrastructure', title: 'Infrastructure' },
    { key: 'amenities', title: 'Amenities' },
  ];

  return (
    <>
      {groups.map((g) => (
        <div key={g.key}>
          <div className="group-title">{g.title}</div>
          {LAYERS.filter((l) => l.group === g.key).map((l) => (
            <div className="toggle-row" key={l.id}>
              <div className="meta">
                <div className="name">
                  {l.label}
                  {l.needsToken && !hasToken && (
                    <span className="badge warn" style={{ marginLeft: 6, fontSize: 10 }}>
                      needs token
                    </span>
                  )}
                </div>
                <div className="desc">{l.description}</div>
              </div>
              <Toggle on={layers[l.id as LayerId]} onClick={() => toggle(l.id as LayerId)} />
            </div>
          ))}
        </div>
      ))}
      <p className="hint">
        More layers (traffic, transit vehicles, air quality, crime, property values, bike & hiking
        routes…) are on the roadmap and plug into this same manager once wired to their data
        sources.
      </p>
    </>
  );
}

/* ---------------- View & Camera ---------------- */
const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'photorealistic', label: 'Satellite' },
  { id: 'streets', label: 'Streets' },
  { id: 'terrain', label: 'Topographic' },
  { id: 'dark', label: 'Dark' },
];
const CAMERA_MODES: { id: CameraMode; label: string }[] = [
  { id: 'orbit', label: 'Orbit' },
  { id: 'free-fly', label: 'Free Fly' },
  { id: 'drone', label: 'Drone' },
  { id: 'first-person', label: 'First-Person' },
];

function ViewPanel() {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const actions = useStore((s) => s.actions);

  return (
    <>
      <div className="group-title">Render mode</div>
      <div className="chips">
        {VIEW_MODES.map((m) => (
          <button
            key={m.id}
            className={`chip ${viewMode === m.id ? 'active' : ''}`}
            onClick={() => setViewMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="group-title">Camera mode</div>
      <div className="chips">
        {CAMERA_MODES.map((m) => (
          <button
            key={m.id}
            className={`chip ${cameraMode === m.id ? 'active' : ''}`}
            onClick={() => setCameraMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="group-title">Actions</div>
      <div className="chips">
        <button className="chip" onClick={() => actions?.resetNorth()}>
          ↑ Reset North
        </button>
        <button className="chip" onClick={() => actions?.screenshot()}>
          ◉ Screenshot
        </button>
      </div>
      <p className="hint">
        Orbit auto-rotates the scene, Drone drifts forward, First-Person drops to street level. Use
        the mouse to pan, zoom, and tilt in every mode.
      </p>
    </>
  );
}

/* ---------------- Environment ---------------- */
function EnvironmentPanel() {
  const timeOfDay = useStore((s) => s.timeOfDay);
  const setTimeOfDay = useStore((s) => s.setTimeOfDay);
  const lighting = useStore((s) => s.lighting);
  const toggleLighting = useStore((s) => s.toggleLighting);
  const weather = useStore((s) => s.weather);
  const setWeather = useStore((s) => s.setWeather);

  const hh = Math.floor(timeOfDay);
  const mm = Math.round((timeOfDay - hh) * 60);
  const timeLabel = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

  return (
    <>
      <div className="toggle-row" style={{ padding: '9px 0' }}>
        <div className="meta">
          <div className="name">Dynamic sun &amp; shadows</div>
          <div className="desc">Globe lighting follows the time of day.</div>
        </div>
        <Toggle on={lighting} onClick={toggleLighting} />
      </div>

      <div className="field">
        <label>
          <span>Time of day</span>
          <b>{timeLabel}</b>
        </label>
        <input
          type="range"
          min={0}
          max={24}
          step={0.25}
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
        />
      </div>

      <div className="group-title">Weather</div>
      <div className="chips">
        {(['clear', 'rain', 'fog', 'snow'] as const).map((w) => (
          <button
            key={w}
            className={`chip ${weather === w ? 'active' : ''}`}
            onClick={() => setWeather(w)}
          >
            {w[0].toUpperCase() + w.slice(1)}
          </button>
        ))}
      </div>
      <p className="hint">
        Weather is approximated through atmospheric fog &amp; brightness. Volumetric clouds and
        precipitation particles are on the roadmap.
      </p>
    </>
  );
}

/* ---------------- Simulation ---------------- */
function SimulatePanel() {
  const seaLevel = useStore((s) => s.seaLevelRise);
  const setSeaLevel = useStore((s) => s.setSeaLevelRise);
  const actions = useStore((s) => s.actions);

  return (
    <>
      <div className="group-title">Sea-level rise / flood</div>
      <div className="field">
        <label>
          <span>Water level above datum</span>
          <b>{seaLevel.toFixed(1)} m</b>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={seaLevel}
          onChange={(e) => setSeaLevel(parseFloat(e.target.value))}
        />
      </div>
      <div className="chips">
        <button className="chip" onClick={() => actions?.flyToBbox([-123.23, 49.1, -123.02, 49.21])}>
          View Richmond
        </button>
        <button className="chip" onClick={() => actions?.flyToBbox([-123.15, 49.0, -122.9, 49.16])}>
          View Delta
        </button>
        <button className="chip" onClick={() => setSeaLevel(0)}>
          Reset
        </button>
      </div>
      <p className="hint">
        A translucent water plane is extruded to the selected height across the region — an
        illustrative flood overlay. A production model would clip the surface against a digital
        elevation model (DEM) so only genuinely low-lying land is inundated. Other scenarios
        (wildfire smoke, earthquake shaking, population growth) share this simulation framework.
      </p>
    </>
  );
}

/* ---------------- Measure ---------------- */
function MeasurePanel() {
  const mode = useStore((s) => s.measureMode);
  const setMode = useStore((s) => s.setMeasureMode);

  return (
    <>
      <div className="group-title">Measurement tools</div>
      <div className="chips">
        <button
          className={`chip ${mode === 'distance' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'distance' ? 'none' : 'distance')}
        >
          Distance
        </button>
        <button
          className={`chip ${mode === 'area' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'area' ? 'none' : 'area')}
        >
          Area
        </button>
        <button className={`chip ${mode === 'none' ? 'active' : ''}`} onClick={() => setMode('none')}>
          Off
        </button>
      </div>
      <p className="hint">
        {mode === 'distance'
          ? 'Click points on the map to build a path; the running length is shown in km.'
          : mode === 'area'
          ? 'Click at least three points to enclose an area; the total is shown in km².'
          : 'Pick Distance or Area, then click on the map to measure. Selecting a tool clears the previous measurement.'}
      </p>
    </>
  );
}

/* ---------------- Places / bookmarks ---------------- */
function PlacesPanel() {
  const actions = useStore((s) => s.actions);
  const bookmarks = useStore((s) => s.bookmarks);
  const addBookmark = useStore((s) => s.addBookmark);
  const removeBookmark = useStore((s) => s.removeBookmark);
  const [name, setName] = useState('');

  const saveCurrent = () => {
    const cam = actions?.getCameraState();
    if (!cam) return;
    addBookmark({
      id: `bm-${Date.now()}`,
      name: name.trim() || `View ${bookmarks.length + 1}`,
      lng: cam.lng,
      lat: cam.lat,
      height: cam.height,
    });
    setName('');
  };

  return (
    <>
      <div className="group-title">Jump to a community</div>
      <div className="chips">
        {MUNICIPALITIES.map((m) => (
          <button
            key={m.id}
            className="chip"
            onClick={() => actions?.flyToBbox(m.bbox)}
            title={`${m.population.toLocaleString()} people`}
          >
            {m.name}
            {m.optional ? ' *' : ''}
          </button>
        ))}
      </div>

      <div className="group-title">Camera bookmarks</div>
      <div className="assistant-input" style={{ marginBottom: 10 }}>
        <input
          placeholder="Name this view…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveCurrent()}
        />
        <button className="btn-primary" onClick={saveCurrent}>
          Save
        </button>
      </div>
      {bookmarks.length === 0 && (
        <p className="hint">Frame a view you like, name it, and save it to return anytime.</p>
      )}
      {bookmarks.map((b) => (
        <div className="toggle-row" key={b.id}>
          <button
            className="meta"
            style={{ background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left' }}
            onClick={() => actions?.flyTo(b.lng, b.lat, b.height)}
          >
            <div className="name">{b.name}</div>
            <div className="desc">
              {b.lat.toFixed(3)}, {b.lng.toFixed(3)} · {Math.round(b.height)} m
            </div>
          </button>
          <button
            className="close"
            style={{ fontSize: 14 }}
            onClick={() => removeBookmark(b.id)}
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
    </>
  );
}

/* ---------------- Router ---------------- */
export default function Panels() {
  const active = useStore((s) => s.activePanel);
  const setActive = useStore((s) => s.setActivePanel);
  if (!active) return null;

  const close = () => setActive(null);
  const map: Record<string, { title: string; body: React.ReactNode }> = {
    layers: { title: 'Layer Manager', body: <LayersPanel /> },
    view: { title: 'View & Camera', body: <ViewPanel /> },
    environment: { title: 'Environment', body: <EnvironmentPanel /> },
    simulate: { title: 'Simulation', body: <SimulatePanel /> },
    measure: { title: 'Measure', body: <MeasurePanel /> },
    places: { title: 'Places & Bookmarks', body: <PlacesPanel /> },
    assistant: { title: 'AI Assistant', body: <Assistant /> },
  };
  const entry = map[active];
  if (!entry) return null;

  return (
    <PanelFrame title={entry.title} onClose={close}>
      {entry.body}
    </PanelFrame>
  );
}
