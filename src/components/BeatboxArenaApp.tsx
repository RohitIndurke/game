'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import ArenaToolbar from '@/components/ArenaToolbar';
import SoundTray from '@/components/SoundTray';
import Stage from '@/components/Stage';
import ActionDrawer from '@/components/ActionDrawer';
import { getAudioManager } from '@/audio/AudioManager';
import { useGameStore } from '@/store/useGameStore';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
});

export default function BeatboxArenaApp() {
  const audio = useMemo(() => getAudioManager(), []);
  const updateChannelAmplitudes = useGameStore((state) => state.updateChannelAmplitudes);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      updateChannelAmplitudes(audio.channels.map((channel) => channel.amplitude));
    }, 80);

    return () => window.clearInterval(timer);
  }, [audio, updateChannelAmplitudes]);

  return (
    <>
      <div className="bg-glows" aria-hidden="true">
        <div className="glow-1" />
        <div className="glow-2" />
      </div>

      <main className="app-container">
        <ArenaToolbar />
        <div className="stage-shell">
          <Stage>
            <PhaserGame />
          </Stage>
        </div>
        <SoundTray onToggleMenu={() => setDrawerOpen(true)} />
      </main>

      <ActionDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
