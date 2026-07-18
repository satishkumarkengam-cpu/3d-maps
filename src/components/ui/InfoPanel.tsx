'use client';

import { useStore } from '@/lib/store';

export default function InfoPanel() {
  const selected = useStore((s) => s.selected);
  const setSelected = useStore((s) => s.setSelected);
  if (!selected) return null;

  return (
    <div className="info glass">
      <div className="panel-head">
        <div>
          <span className="cat">{selected.category || 'Feature'}</span>
          <h2 style={{ fontSize: 16 }}>{selected.name}</h2>
        </div>
        <button className="close" onClick={() => setSelected(null)} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="panel-body">
        {selected.facts.map((f, i) => (
          <div className="fact" key={i}>
            <span className="k">{f.label}</span>
            <span className="v">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
