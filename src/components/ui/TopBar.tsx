'use client';

import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { search, type SearchResult } from '@/lib/query';

export default function TopBar() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const actions = useStore((s) => s.actions);
  const hasToken = useStore((s) => s.hasToken);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo<SearchResult[]>(() => (q ? search(q) : []), [q]);

  const go = (r: SearchResult) => {
    actions?.flyTo(r.lng, r.lat, r.height, 0, -40);
    setQ(r.label);
    setOpen(false);
  };

  return (
    <div className="topbar glass">
      <div className="brand">
        <span className="logo">◎</span>
        <div>
          <div>Metro Vancouver</div>
          <div className="sub">3D Digital Twin</div>
        </div>
      </div>

      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          placeholder="Search city, landmark, station, or lat, lng…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) go(results[0]);
          }}
        />
        {open && results.length > 0 && (
          <div className="search-results glass">
            {results.map((r) => (
              <button
                key={r.id}
                className="search-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r)}
              >
                <span className="label">{r.label}</span>
                <span className="sub">{r.sublabel}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <span className={`badge ${hasToken ? 'ok' : 'warn'}`}>
        {hasToken ? '● Cesium Ion connected' : '○ Open data mode'}
      </span>
    </div>
  );
}
