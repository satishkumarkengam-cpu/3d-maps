'use client';

import { useStore } from '@/lib/store';

const ITEMS: { id: string; icon: string; label: string }[] = [
  { id: 'layers', icon: '▤', label: 'Layers' },
  { id: 'view', icon: '◐', label: 'View & Camera' },
  { id: 'environment', icon: '☀', label: 'Environment' },
  { id: 'simulate', icon: '≈', label: 'Simulation' },
  { id: 'measure', icon: '📐', label: 'Measure' },
  { id: 'places', icon: '⚑', label: 'Places' },
  { id: 'assistant', icon: '✦', label: 'AI Assistant' },
];

export default function Dock() {
  const active = useStore((s) => s.activePanel);
  const setActive = useStore((s) => s.setActivePanel);

  return (
    <div className="dock">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={`dock-btn ${active === it.id ? 'active' : ''}`}
          style={{ position: 'relative' }}
          onClick={() => setActive(active === it.id ? null : it.id)}
          aria-label={it.label}
        >
          <span>{it.icon}</span>
          <span className="tip">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
