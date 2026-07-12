'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAudioManager, THEME_DETAILS } from '../audio/AudioManager';
import { useGameStore, type SavedMix, type MixEvent } from '../store/useGameStore';

const THEME_NAMES: Record<string, string> = {
  synthwave: 'Cyber Synthwave',
  chiptune: '8-Bit Chiptune',
  lofi: 'Lofi Dreamscape',
};

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActionDrawer({ isOpen, onClose }: ActionDrawerProps) {
  const audio = useMemo(() => getAudioManager(), []);
  
  const theme = useGameStore((state) => state.theme);
  const volume = useGameStore((state) => state.volume);
  const isRecording = useGameStore((state) => state.isRecording);
  const isPlayingRecording = useGameStore((state) => state.isPlayingRecording);
  const isAutomixActive = useGameStore((state) => state.isAutomixActive);
  const savedMixes = useGameStore((state) => state.savedMixes);
  
  const setTheme = useGameStore((state) => state.setTheme);
  const setVolume = useGameStore((state) => state.setVolume);
  const setRecording = useGameStore((state) => state.setRecording);
  const setPlayingRecording = useGameStore((state) => state.setPlayingRecording);
  const setSavedMixes = useGameStore((state) => state.setSavedMixes);
  const addSavedMix = useGameStore((state) => state.addSavedMix);
  const deleteSavedMix = useGameStore((state) => state.deleteSavedMix);
  const setAutomixActive = useGameStore((state) => state.setAutomixActive);
  const clearMix = useGameStore((state) => state.clearMix);

  const [pendingEvents, setPendingEvents] = useState<MixEvent[]>([]);
  const [mixName, setMixName] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Load saved mixes from localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem('incredibox_saved_mixes');
    if (!stored) return;
    try {
      setSavedMixes(JSON.parse(stored) as SavedMix[]);
    } catch {
      window.localStorage.removeItem('incredibox_saved_mixes');
    }
  }, [setSavedMixes]);

  // Sync theme
  useEffect(() => {
    audio.setTheme(theme);
    document.body.classList.remove('theme-synthwave', 'theme-chiptune', 'theme-lofi');
    document.body.classList.add(`theme-${theme}`);
  }, [audio, theme]);

  // Sync volume
  useEffect(() => {
    audio.setMasterVolume(volume);
  }, [audio, volume]);

  // Recording Timer
  useEffect(() => {
    if (!isRecording || !audio.ctx) return;
    const timer = window.setInterval(() => {
      if (!audio.ctx) return;
      setElapsed(audio.ctx.currentTime - audio.recordingStartTime);
    }, 250);
    return () => window.clearInterval(timer);
  }, [audio, isRecording]);

  const handleThemeChange = (nextTheme: string) => {
    audio.setTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleVolumeChange = (nextVolume: number) => {
    audio.setMasterVolume(nextVolume);
    setVolume(nextVolume);
  };

  const handleClear = () => {
    audio.clearMix();
    clearMix();
    setAutomixActive(false);
  };

  const handleRecord = () => {
    if (isRecording) {
      const events = audio.stopRecording();
      setPendingEvents(events);
      setMixName(`Mix ${THEME_NAMES[theme] ?? theme} ${savedMixes.length + 1}`);
      setRecording(false);
      return;
    }
    audio.startRecording();
    setPendingEvents([]);
    setElapsed(0);
    setRecording(true);
  };

  const savePendingMix = () => {
    if (pendingEvents.length === 0) return;
    addSavedMix({
      id: Date.now().toString(),
      name: mixName.trim() || `Mix ${savedMixes.length + 1}`,
      theme,
      events: pendingEvents,
    });
    setPendingEvents([]);
  };

  const playMix = (mix: SavedMix) => {
    handleThemeChange(mix.theme);
    audio.playRecording(mix.events, () => setPlayingRecording(false));
    setPlayingRecording(true);
  };

  const stopPlayback = () => {
    audio.stopPlayback();
    clearMix();
    setPlayingRecording(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 999,
              }}
            />

            {/* Sidebar drawer panel */}
            <motion.aside
              className="saved-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ display: 'flex', zIndex: 1000 }}
            >
              <div className="drawer-header">
                <h2>BEATBOX LAB</h2>
                <button className="drawer-close-btn" type="button" onClick={onClose}>
                  &times;
                </button>
              </div>

              <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflowY: 'auto' }}>
                
                {/* Section: Soundpack selector */}
                <div className="menu-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Soundpack</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {Object.keys(THEME_DETAILS).map((themeKey) => (
                      <button
                        key={themeKey}
                        className={`action-btn ${theme === themeKey ? '' : 'secondary'}`}
                        type="button"
                        onClick={() => handleThemeChange(themeKey)}
                        style={{ fontSize: '10px', padding: '8px 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                      >
                        {THEME_NAMES[themeKey]?.split(' ')[1] || themeKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Master Volume */}
                <div className="menu-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Master Volume</h3>
                  <div className="slider-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '12px' }}>🔈</span>
                    <input
                      className="styled-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(event) => handleVolumeChange(Number(event.target.value))}
                    />
                    <span style={{ fontSize: '12px' }}>🔊</span>
                  </div>
                </div>

                {/* Section: Quick Actions */}
                <div className="menu-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Quick Actions</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`action-btn ${isAutomixActive ? '' : 'secondary'}`}
                      type="button"
                      onClick={() => setAutomixActive(!isAutomixActive)}
                      style={{ flex: 1 }}
                    >
                      {isAutomixActive ? 'Stop Automix' : 'Automix'}
                    </button>
                    <button className="action-btn secondary" type="button" onClick={handleClear} style={{ flex: 1 }}>
                      Clear Stage
                    </button>
                  </div>
                </div>

                {/* Section: Recording Studio */}
                <div className="menu-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255, 46, 99, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(255, 46, 99, 0.15)' }}>
                  <h3 style={{ fontSize: '11px', color: '#ff2e63', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Recording Studio</h3>
                  <div className="recording-container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      className={`action-btn ${isRecording ? 'recording' : 'secondary'}`}
                      type="button"
                      onClick={handleRecord}
                      style={{
                        backgroundColor: isRecording ? '#ff2e63' : undefined,
                        borderColor: '#ff2e63',
                        color: isRecording ? '#fff' : '#ff2e63',
                        flex: 1,
                      }}
                    >
                      {isRecording ? 'Stop' : 'Record Mix'}
                    </button>
                    {isRecording && (
                      <div className="rec-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="rec-dot" style={{ backgroundColor: '#ff2e63', borderRadius: '50%', width: 8, height: 8 }} />
                        <span className="rec-timer" style={{ color: '#ff2e63', fontFamily: 'monospace', fontWeight: 700 }}>{formatTimer(elapsed)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Saved Mixes list */}
                <div className="menu-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h3 style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Saved Mixes</h3>
                  <div className="saved-drawer-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: '25vh' }}>
                    {savedMixes.length === 0 ? (
                      <div className="empty-list-text" style={{ fontSize: '11px', color: '#666', textAlign: 'center', padding: '12px 0' }}>No recorded mixes yet.</div>
                    ) : (
                      savedMixes.map((mix) => (
                        <div className="saved-card" key={mix.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="saved-info" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div className="saved-name" style={{ fontSize: '12px', fontWeight: 600 }}>{mix.name}</div>
                            <div className="saved-theme" style={{ fontSize: '9px', color: '#666' }}>
                              {THEME_NAMES[mix.theme] || mix.theme}
                            </div>
                          </div>
                          <div className="saved-actions" style={{ display: 'flex', gap: 4 }}>
                            <button className="action-btn" type="button" onClick={() => playMix(mix)} style={{ padding: '4px 8px', fontSize: '10px' }}>
                              Play
                            </button>
                            <button
                              className="action-btn secondary"
                              type="button"
                              onClick={() => deleteSavedMix(mix.id)}
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Save Modal */}
      <AnimatePresence>
        {pendingEvents.length > 0 && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div
              className="modal-box glass-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <button className="modal-close" type="button" onClick={() => setPendingEvents([])}>
                &times;
              </button>
              <h3>Save Composition</h3>
              <p>{pendingEvents.length} recorded actions are ready.</p>
              <input
                className="styled-input"
                maxLength={30}
                value={mixName}
                onChange={(event) => setMixName(event.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button className="action-btn" type="button" onClick={savePendingMix}>
                  Save Mix
                </button>
                <button
                  className="action-btn secondary"
                  type="button"
                  onClick={() => {
                    audio.playRecording(pendingEvents, () => setPlayingRecording(false));
                    setPlayingRecording(true);
                  }}
                >
                  Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Playing Modal */}
      <AnimatePresence>
        {isPlayingRecording && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div
              className="modal-box glass-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <button className="modal-close" type="button" onClick={stopPlayback}>
                &times;
              </button>
              <h3>Playing Recorded Mix</h3>
              <div className="playback-visualizer-box">
                <div className="wave-bar bar-1" />
                <div className="wave-bar bar-2" />
                <div className="wave-bar bar-3" />
                <div className="wave-bar bar-4" />
                <div className="wave-bar bar-5" />
              </div>
              <button className="action-btn secondary" type="button" onClick={stopPlayback}>
                Stop Playback
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
