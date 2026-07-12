'use client';

import { useState } from 'react';
import { getAudioManager } from '@/audio/AudioManager';
import { useGameStore } from '@/store/useGameStore';

const PACKS = ['beats', 'effects', 'melodies'];

export default function ArenaToolbar() {
  const [activePack, setActivePack] = useState(1);
  const clearMix = useGameStore((state) => state.clearMix);

  const handlePause = () => {
    getAudioManager().clearMix();
    clearMix();
  };

  return (
    <div className="arena-toolbar" aria-label="Arena controls">
      <button className="toolbar-circle toolbar-menu" type="button" aria-label="Menu">
        <span />
        <span />
        <span />
      </button>

      <div className="toolbar-packs" aria-label="Sound packs">
        {PACKS.map((pack, index) => (
          <button
            key={pack}
            className={`toolbar-pack ${activePack === index ? 'active' : ''}`}
            type="button"
            aria-label={`${pack} pack`}
            onClick={() => setActivePack(index)}
          >
            {pack === 'beats' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="7" y="5" width="4" height="14" rx="1.5" />
                <rect x="13" y="3" width="4" height="16" rx="1.5" />
              </svg>
            ) : null}
            {pack === 'effects' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 14 20 8 16 13 20 17z" />
                <path d="M7 15 11 20" />
              </svg>
            ) : null}
            {pack === 'melodies' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 18 12 5 20 18z" />
                <path d="M8 18 12 11 16 18z" />
              </svg>
            ) : null}
          </button>
        ))}
      </div>

      <button className="toolbar-circle toolbar-pause" type="button" aria-label="Clear stage" onClick={handlePause}>
        <span />
        <span />
      </button>
    </div>
  );
}
