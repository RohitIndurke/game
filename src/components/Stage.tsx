'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';
import { getAudioManager } from '@/audio/AudioManager';
import { getCategoryColor } from '@/audio/avatarSVG';
import { getTrayIconSVG } from '@/components/SoundTray';
import { useGameStore } from '@/store/useGameStore';

type DragPayload = {
  category: string;
  index: number;
};

const CATEGORY_FRAME_OFFSET: Record<string, number> = {
  beats: 0,
  effects: 2,
  melodies: 4,
  vocals: 6,
};

function parseDragPayload(raw: string): DragPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DragPayload>;
    if (typeof parsed.category === 'string' && typeof parsed.index === 'number') {
      return { category: parsed.category, index: parsed.index };
    }
  } catch {
    return null;
  }

  return null;
}

export default function Stage({ children }: { children?: React.ReactNode }) {
  const channels = useGameStore((state) => state.channels);
  const assignLoop = useGameStore((state) => state.assignLoop);
  const removeLoop = useGameStore((state) => state.removeLoop);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const toggleSolo = useGameStore((state) => state.toggleSolo);
  const selectedSound = useGameStore((state) => state.selectedSound);
  const setSelectedSound = useGameStore((state) => state.setSelectedSound);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const audio = useMemo(() => getAudioManager(), []);

  const assignToSlot = (slotIndex: number, payload: DragPayload) => {
    audio.assignLoop(slotIndex, payload.category, payload.index);
    if (audio.ctx?.state === 'suspended') {
      void audio.ctx.resume().catch(() => undefined);
    }
    assignLoop(slotIndex, payload.category, payload.index);
    setSelectedSound(null);
  };

  const handleDrop = (slotIndex: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setHoveredSlot(null);

    const payload =
      parseDragPayload(event.dataTransfer.getData('application/json')) ??
      parseDragPayload(event.dataTransfer.getData('text/plain'));
    if (!payload) return;

    assignToSlot(slotIndex, payload);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (!selectedSound) return;
    assignToSlot(slotIndex, selectedSound);
  };

  const handleRemove = (slotIndex: number) => {
    audio.removeLoop(slotIndex);
    removeLoop(slotIndex);
  };

  const handleMute = (slotIndex: number) => {
    audio.toggleMute(slotIndex);
    toggleMute(slotIndex);
  };

  const handleSolo = (slotIndex: number) => {
    audio.toggleSolo(slotIndex);
    toggleSolo(slotIndex);
  };

  return (
    <section className="stage-section" aria-label="Beatboxer stage">
      <div className="stage-content-wrapper">
        {children}
        <div className="stage-grid">
        {channels.map((channel) => {
          const assigned = channel.assignedLoop;
          const color = getCategoryColor(assigned?.category ?? null);
          const isActive = Boolean(assigned && !channel.isMuted);
          const advanceFrame = assigned
            ? (CATEGORY_FRAME_OFFSET[assigned.category] + assigned.index) % 8
            : 0;

          return (
            <div
              key={channel.id}
              className={`stage-slot ${hoveredSlot === channel.id ? 'drag-hover' : ''} ${isActive ? 'is-active' : ''}`}
              style={
                {
                  '--slot-accent': color,
                  '--advance-frame': `${(advanceFrame / 7) * 100}%`,
                } as CSSProperties
              }
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                setHoveredSlot(channel.id);
              }}
              onDragLeave={() => setHoveredSlot(null)}
              onDrop={(event) => handleDrop(channel.id, event)}
              onClick={() => handleSlotClick(channel.id)}
            >
              {assigned ? (
                <div className="slot-controls" onClick={(event) => event.stopPropagation()}>
                  <button
                    className={`slot-control-btn mute-btn ${channel.isMuted ? 'active-mute' : ''}`}
                    type="button"
                    title={channel.isMuted ? 'Unmute' : 'Mute'}
                    onClick={() => handleMute(channel.id)}
                  >
                    M
                  </button>
                  <button
                    className={`slot-control-btn solo-btn ${channel.isSoloed ? 'active-solo' : ''}`}
                    type="button"
                    title={channel.isSoloed ? 'Unsolo' : 'Solo'}
                    onClick={() => handleSolo(channel.id)}
                  >
                    S
                  </button>
                  <button
                    className="slot-control-btn delete-btn"
                    type="button"
                    title="Remove loop"
                    onClick={() => handleRemove(channel.id)}
                  >
                    X
                  </button>
                </div>
              ) : null}

              <div className="avatar-container">
                {assigned ? (
                  <>
                    <Image
                      className="default-character"
                      src={
                        assigned.category === 'beats' ? '/defult-red.png' :
                        assigned.category === 'effects' ? '/defult-blue.png' :
                        assigned.category === 'melodies' ? '/defult-green.png' :
                        assigned.category === 'vocals' ? '/defult-purple.png' :
                        '/defult.png'
                      }
                      alt=""
                      width={220}
                      height={320}
                      priority
                      draggable={false}
                    />
                    <div className={`character-accessory accessory-${assigned.category}`} aria-hidden="true">
                      <div
                        className="accessory-icon"
                        dangerouslySetInnerHTML={{
                          __html: getTrayIconSVG(assigned.category, assigned.index, color),
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <Image
                    className="default-character"
                    src="/defult.png"
                    alt=""
                    width={220}
                    height={320}
                    priority
                    draggable={false}
                  />
                )}
                <div className="character-shadow" aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </div>
     </div>
    </section>
  );
}
