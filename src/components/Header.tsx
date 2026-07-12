'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAudioManager, THEME_DETAILS } from '@/audio/AudioManager';
import type { MixEvent, SavedMix } from '@/store/useGameStore';
import { useGameStore } from '@/store/useGameStore';

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

export default function Header() {
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
  const assignLoop = useGameStore((state) => state.assignLoop);
  const clearMix = useGameStore((state) => state.clearMix);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<MixEvent[]>([]);
  const [mixName, setMixName] = useState('Mix Synthwave 1');
  const [elapsed, setElapsed] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('incredibox_saved_mixes');
    if (!stored) return;

    try {
      setSavedMixes(JSON.parse(stored) as SavedMix[]);
    } catch {
      window.localStorage.removeItem('incredibox_saved_mixes');
    }
  }, [setSavedMixes]);

  useEffect(() => {
    audio.setTheme(theme);
    document.body.classList.remove('theme-synthwave', 'theme-chiptune', 'theme-lofi');
    document.body.classList.add(`theme-${theme}`);
  }, [audio, theme]);

  useEffect(() => {
    audio.setMasterVolume(volume);
  }, [audio, volume]);

  useEffect(() => {
    const bpm = THEME_DETAILS[theme]?.bpm ?? 118;
    const pulseMs = (60_000 / bpm) * 0.5;

    const timer = window.setInterval(() => {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 110);
    }, pulseMs);

    return () => window.clearInterval(timer);
  }, [theme]);

  useEffect(() => {
    if (!isRecording || !audio.ctx) {
      return;
    }

    const timer = window.setInterval(() => {
      if (!audio.ctx) return;
      setElapsed(audio.ctx.currentTime - audio.recordingStartTime);
    }, 250);

    return () => window.clearInterval(timer);
  }, [audio, isRecording]);

  useEffect(() => {
    if (!isAutomixActive) return;

    const runAutomix = () => {
      const state = useGameStore.getState();
      const freeChannels = state.channels.filter((channel) => !channel.assignedLoop);
      if (freeChannels.length === 0) return;

      const categories = ['beats', 'effects', 'melodies', 'vocals'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const index = Math.floor(Math.random() * 5);
      const target = freeChannels[Math.floor(Math.random() * freeChannels.length)];

      audio.assignLoop(target.id, category, index);
      assignLoop(target.id, category, index);
    };

    runAutomix();
    const timer = window.setInterval(runAutomix, 6000);
    return () => window.clearInterval(timer);
  }, [assignLoop, audio, isAutomixActive]);

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
    setDrawerOpen(true);
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
      <motion.header
        className="app-header glass-card"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="brand">
          <h1>
            BEATBOX <span>ARENA</span>
          </h1>
          <p className="tagline">Interactive Sound Lab</p>
        </div>

        <div className="hud-center">
          <div className="control-group">
            <label htmlFor="themeSelect">SOUNDPACK</label>
            <select
              id="themeSelect"
              className="styled-select"
              value={theme}
              onChange={(event) => handleThemeChange(event.target.value)}
            >
              {Object.keys(THEME_DETAILS).map((themeKey) => (
                <option key={themeKey} value={themeKey}>
                  {THEME_NAMES[themeKey] ?? themeKey}
                </option>
              ))}
            </select>
          </div>

          <div className="metronome-container" title="BPM pulse">
            <div className={`pulse-dot ${pulse ? 'pulse-tick' : ''}`} />
          </div>

          <div className="control-group volume-group">
            <label htmlFor="volumeSlider">VOLUME</label>
            <div className="slider-wrapper">
              <svg viewBox="0 0 24 24" className="vol-icon" aria-hidden="true">
                <path d="M3,9 H7 L12,4 V20 L7,15 H3 Z" fill="rgba(255,255,255,0.7)" />
              </svg>
              <input
                id="volumeSlider"
                className="styled-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => handleVolumeChange(Number(event.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="hud-actions">
          <button
            className={`hud-btn ${isAutomixActive ? 'active-mix' : ''}`}
            type="button"
            onClick={() => setAutomixActive(!isAutomixActive)}
          >
            {isAutomixActive ? 'Stop Automix' : 'Automix'}
          </button>
          <button className="hud-btn secondary" type="button" onClick={handleClear}>
            Clear Stage
          </button>
          <button className="hud-btn secondary" type="button" onClick={() => setDrawerOpen(true)}>
            Saved Mixes
          </button>
          <div className="recording-container">
            <button
              className={`hud-btn record-btn ${isRecording ? 'recording' : ''}`}
              type="button"
              onClick={handleRecord}
            >
              {isRecording ? 'Stop' : 'Record'}
            </button>
            {isRecording ? (
              <div className="rec-indicator">
                <span className="rec-dot" />
                <span className="rec-timer">{formatTimer(isRecording ? elapsed : 0)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </motion.header>

      {pendingEvents.length > 0 ? (
        <div className="modal-overlay">
          <motion.div
            className="modal-box glass-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <button className="modal-close" type="button" onClick={() => setPendingEvents([])}>
              x
            </button>
            <h3>Save Composition</h3>
            <p>{pendingEvents.length} recorded actions are ready.</p>
            <input
              className="styled-input"
              maxLength={30}
              value={mixName}
              onChange={(event) => setMixName(event.target.value)}
            />
            <div className="modal-actions">
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
      ) : null}

      {isPlayingRecording ? (
        <div className="modal-overlay">
          <motion.div
            className="modal-box glass-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <button className="modal-close" type="button" onClick={stopPlayback}>
              x
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
      ) : null}

      <aside className={`saved-drawer glass-card ${isDrawerOpen ? '' : 'hidden'}`}>
        <div className="drawer-header">
          <h2>Saved Mixes</h2>
          <button className="drawer-close-btn" type="button" onClick={() => setDrawerOpen(false)}>
            x
          </button>
        </div>
        <div className="saved-drawer-list">
          {savedMixes.length === 0 ? (
            <div className="empty-list-text">No recorded mixes yet.</div>
          ) : (
            savedMixes.map((mix) => (
              <div className="saved-card glass-card" key={mix.id}>
                <div className="saved-info">
                  <div className="saved-name">{mix.name}</div>
                  <div className="saved-theme">
                    {THEME_NAMES[mix.theme] ?? mix.theme} ({mix.events.length} actions)
                  </div>
                </div>
                <div className="saved-actions">
                  <button className="action-btn" type="button" onClick={() => playMix(mix)}>
                    Play
                  </button>
                  <button
                    className="action-btn secondary"
                    type="button"
                    onClick={() => deleteSavedMix(mix.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
