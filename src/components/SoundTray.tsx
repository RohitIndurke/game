'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { THEME_DETAILS } from '../audio/AudioManager';

export function getTrayIconSVG(cat: string, idx: number, color: string) {
  if (cat === 'beats') {
    if (idx === 0) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M5,15 C5,9 19,9 19,15 L20,18 L4,18 Z" fill="${color}" /><path d="M2,18 L22,18 C22,18 22,20 18,20 L6,20 Z" fill="#111" /></svg>`;
    if (idx === 1) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M6,16 C6,8 18,8 18,16" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" /><rect x="3" y="13" width="4" height="7" rx="2" fill="${color}" /><rect x="17" y="13" width="4" height="7" rx="2" fill="${color}" /><rect x="6" y="15" width="12" height="2" fill="#111" /></svg>`;
    if (idx === 2) return `<svg viewBox="0 0 24 24" class="tray-glyph"><polygon points="4,11 20,11 18,16 6,16" fill="${color}" /><line x1="4" y1="13" x2="20" y2="13" stroke="#111" stroke-width="1.5" /></svg>`;
    if (idx === 3) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M5,10 C5,10 12,5 19,10 L18,14 L6,14 Z" fill="${color}" /><path d="M3,12 L5,16 L7,12 Z" fill="${color}" /></svg>`;
    return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M7,12 C7,6 17,6 17,12 L19,17 L5,17 Z" fill="${color}" /><rect x="9" y="10" width="6" height="4" fill="#111" rx="1" /></svg>`;
  }
  if (cat === 'effects') {
    if (idx === 0) return `<svg viewBox="0 0 24 24" class="tray-glyph"><ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="${color}" stroke-width="2" /><line x1="5" y1="12" x2="19" y2="12" stroke="${color}" stroke-width="1" /></svg>`;
    if (idx === 1) return `<svg viewBox="0 0 24 24" class="tray-glyph"><ellipse cx="12" cy="6" rx="6" ry="2" fill="none" stroke="${color}" stroke-width="1.5" /><ellipse cx="12" cy="10" rx="8" ry="2.5" fill="none" stroke="${color}" stroke-width="1.5" /></svg>`;
    if (idx === 2) return `<svg viewBox="0 0 24 24" class="tray-glyph"><polygon points="5,10 19,10 17,16 7,16" fill="#111" stroke="${color}" stroke-width="1.5" /><circle cx="9" cy="13" r="2" fill="${color}" /><circle cx="15" cy="13" r="2" fill="${color}" /></svg>`;
    if (idx === 3) return `<svg viewBox="0 0 24 24" class="tray-glyph"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.05)" stroke="${color}" stroke-width="2" /><path d="M5,8 C5,8 12,5 19,8" fill="none" stroke="${color}" stroke-width="1" /></svg>`;
    return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M6,13 L18,13 L16,19 L8,19 Z" fill="${color}" /><path d="M11,16 L13,16 M12,14 L12,18" fill="none" stroke="#111" stroke-width="1.5" /></svg>`;
  }
  if (cat === 'melodies') {
    if (idx === 0) return `<svg viewBox="0 0 24 24" class="tray-glyph"><polygon points="5,16 7,8 10,12 12,5 14,12 17,8 19,16" fill="${color}" /><rect x="5" y="15" width="14" height="2" fill="#111" /></svg>`;
    if (idx === 1) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M7,12 C7,6 17,6 17,12 Z" fill="#111" /><ellipse cx="12" cy="12" rx="9" ry="2" fill="#111" stroke="${color}" stroke-width="1.5" /></svg>`;
    if (idx === 2) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M9,13 Q6,4 4,7" fill="none" stroke="${color}" stroke-width="2" /><path d="M15,13 Q18,4 20,7" fill="none" stroke="${color}" stroke-width="2" /><circle cx="4" cy="7" r="2" fill="${color}" /><circle cx="20" cy="7" r="2" fill="${color}" /></svg>`;
    if (idx === 3) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M12,3 C10,3 9,13 9,13 C9,13 15,13 15,13 C15,13 14,3 12,3 Z" fill="${color}" /><path d="M12,3 C11.5,3 11,8 10,8 L14,8 Z" fill="#fff" /></svg>`;
    return `<svg viewBox="0 0 24 24" class="tray-glyph"><circle cx="8" cy="12" r="3" fill="none" stroke="${color}" stroke-width="2" /><circle cx="16" cy="12" r="3" fill="none" stroke="${color}" stroke-width="2" /><line x1="11" y1="12" x2="13" y2="12" stroke="${color}" stroke-width="1.5" /></svg>`;
  }
  // Vocals
  if (idx === 0) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M5,10 C7,7 17,7 19,10 C20,13 17,15 12,13 C7,15 4,13 5,10 Z" fill="${color}" /><circle cx="8" cy="10" r="1.5" fill="#111" /><circle cx="16" cy="10" r="1.5" fill="#111" /></svg>`;
  if (idx === 1) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M7,12 L17,12 L15,18 C15,18 12,20 9,18 Z" fill="#111" stroke="${color}" stroke-width="1.5" /><circle cx="12" cy="15" r="2.5" fill="none" stroke="${color}" stroke-width="1" /></svg>`;
  if (idx === 2) return `<svg viewBox="0 0 24 24" class="tray-glyph"><path d="M5,8 C3,11 2,16 4,19" fill="none" stroke="${color}" stroke-width="2" /><path d="M19,8 C21,11 22,16 20,19" fill="none" stroke="${color}" stroke-width="2" /><path d="M8,11 L16,11 L14,17 L10,17 Z" fill="#111" stroke="${color}" stroke-width="1.5" /><circle cx="12" cy="14" r="2" fill="${color}" /></svg>`;
  if (idx === 3) return `<svg viewBox="0 0 24 24" class="tray-glyph"><line x1="12" y1="21" x2="12" y2="13" stroke="${color}" stroke-width="2" /><circle cx="12" cy="10" r="3" fill="#111" stroke="${color}" stroke-width="1.5" /></svg>`;
  return `<svg viewBox="0 0 24 24" class="tray-glyph"><polygon points="5,11 19,11 17,14 7,14" fill="none" stroke="${color}" stroke-width="2" /><line x1="7" y1="17" x2="9" y2="19" stroke="${color}" stroke-width="1" /><line x1="17" y1="17" x2="15" y2="19" stroke="${color}" stroke-width="1" /></svg>`;
}

export default function SoundTray({ onToggleMenu }: { onToggleMenu?: () => void }) {
  const currentTheme = useGameStore((state) => state.theme);
  const selectedSound = useGameStore((state) => state.selectedSound);
  const setSelectedSound = useGameStore((state) => state.setSelectedSound);
  const themeColors = THEME_DETAILS[currentTheme]?.colors || {
    beats: '#ff2e63',
    effects: '#08f7fe',
    melodies: '#09f7a0',
    vocals: '#f408fe'
  };

  const categories = ['beats', 'effects', 'melodies', 'vocals'];

  type TrayDragEvent =
    | React.DragEvent<HTMLDivElement>
    | DragEvent
    | MouseEvent
    | TouchEvent
    | PointerEvent;

  const handleDragStart = (e: TrayDragEvent, category: string, index: number) => {
    if (!('dataTransfer' in e) || !e.dataTransfer) return;
    const payload = JSON.stringify({ category, index });
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', payload);
    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');
  };

  const handleDragEnd = (e: TrayDragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
  };

  const handlePick = (category: string, index: number) => {
    setSelectedSound(
      selectedSound?.category === category && selectedSound.index === index
        ? null
        : { category, index },
    );
  };

  return (
    <section className="sound-tray-section glass-card z-10" aria-label="Sound tray">
      <div className="tray-outer-wrapper">
        <button
          className="n-menu-btn"
          type="button"
          aria-label="Toggle drawer"
          onClick={onToggleMenu}
        >
          N
        </button>
        <div className="tray-container">
        {categories.map((key) => {
          const color = themeColors[key];
          
          return (
            <div
              key={key}
              className="tray-group"
              style={{ background: `${color}10`, borderColor: `${color}26` }}
            >
              <div className="group-items">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const svgString = getTrayIconSVG(key, idx, color);
                  
                  return (
                    <motion.div
                      key={idx}
                      className="tray-item"
                      data-selected={selectedSound?.category === key && selectedSound.index === idx}
                      draggable={true}
                      role="button"
                      tabIndex={0}
                      data-category={key}
                      data-index={idx}
                      aria-label={`${key} sound ${idx + 1}`}
                      onDragStart={(e) => handleDragStart(e, key, idx)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handlePick(key, idx)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handlePick(key, idx);
                        }
                      }}
                      style={{
                        borderColor: color,
                        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.4), inset 0 0 10px ${color}33`,
                        background: `${color}1c` // Category themed soft background
                      }}
                      whileHover={{ y: -4, scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <div className="item-color-dot" style={{ background: color }} />
                      <div 
                        className="w-full h-full flex items-center justify-center pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: svgString }} 
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
     </div>
    </section>
  );
}
