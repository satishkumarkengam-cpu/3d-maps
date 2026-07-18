'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { askAssistant } from '@/lib/query';
import type { Poi } from '@/lib/types';

interface Msg {
  role: 'user' | 'bot';
  text: string;
  results?: Poi[];
}

const SUGGESTIONS = [
  'Show all hospitals within 10 km of Surrey',
  'Fly to Vancouver Airport',
  'Flood 4m',
  "Where is Grouse Mountain",
  'Show universities',
];

export default function Assistant() {
  const [input, setInput] = useState('');
  const [log, setLog] = useState<Msg[]>([
    {
      role: 'bot',
      text: "Hi! Ask me to fly somewhere, list amenities near a city, or run a simulation. Try one of the suggestions below.",
    },
  ]);
  const actions = useStore((s) => s.actions);
  const setLayer = useStore((s) => s.setLayer);
  const setSeaLevel = useStore((s) => s.setSeaLevelRise);

  const submit = (text: string) => {
    const query = text.trim();
    if (!query) return;
    const res = askAssistant(query);
    setLog((l) => [...l, { role: 'user', text: query }, { role: 'bot', text: res.text, results: res.results }]);
    setInput('');

    // Execute the resolved action against the live scene.
    if (res.action) {
      if (res.action.type === 'flyTo') {
        actions?.flyTo(res.action.lng, res.action.lat, res.action.height, 0, -40);
      } else if (res.action.type === 'showLayer') {
        setLayer(res.action.layer as any, true);
      } else if (res.action.type === 'simulate' && res.action.kind === 'flood') {
        setSeaLevel(res.action.meters);
      }
    }
  };

  return (
    <>
      <div className="assistant-log">
        {log.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div>{m.text}</div>
            {m.results && m.results.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {m.results.map((r) => (
                  <button
                    key={r.id}
                    className="res-item"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                    onClick={() => actions?.focusPoi(r)}
                  >
                    → {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => submit(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="assistant-input">
        <input
          placeholder="Ask anything about the region…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(input)}
        />
        <button className="btn-primary" onClick={() => submit(input)}>
          Ask
        </button>
      </div>
      <p className="hint">
        This assistant runs fully offline with a rule-based intent parser wired to real map actions.
        It&apos;s the integration seam for a Claude-powered function-calling agent over the same
        action surface.
      </p>
    </>
  );
}
