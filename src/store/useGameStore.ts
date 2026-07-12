import { create } from 'zustand';

export interface ChannelState {
  id: number;
  assignedLoop: { category: string; index: number } | null;
  isMuted: boolean;
  isSoloed: boolean;
  isCueing: boolean;
  amplitude: number;
}

export interface MixEvent {
  time: number;
  type: string; // "add" | "remove" | "mute" | "unmute" | "solo" | "unsolo"
  channelIndex: number;
  category?: string | null;
  index?: number | null;
}

export interface SavedMix {
  id: string;
  name: string;
  theme: string;
  events: MixEvent[];
}

interface GameState {
  theme: string;
  volume: number;
  selectedSound: { category: string; index: number } | null;
  isAutomixActive: boolean;
  isRecording: boolean;
  isPlayingRecording: boolean;
  savedMixes: SavedMix[];
  channels: ChannelState[];
  
  setTheme: (theme: string) => void;
  setVolume: (volume: number) => void;
  setSelectedSound: (sound: { category: string; index: number } | null) => void;
  setAutomixActive: (active: boolean) => void;
  setRecording: (recording: boolean) => void;
  setPlayingRecording: (playing: boolean) => void;
  setSavedMixes: (mixes: SavedMix[]) => void;
  addSavedMix: (mix: SavedMix) => void;
  deleteSavedMix: (id: string) => void;
  
  assignLoop: (channelIndex: number, category: string, index: number) => void;
  removeLoop: (channelIndex: number) => void;
  toggleMute: (channelIndex: number) => void;
  toggleSolo: (channelIndex: number) => void;
  updateChannelAmplitudes: (amplitudes: number[]) => void;
  clearMix: () => void;
}

const initialChannels: ChannelState[] = Array.from({ length: 11 }, (_, i) => ({
  id: i,
  assignedLoop: null,
  isMuted: false,
  isSoloed: false,
  isCueing: false,
  amplitude: 0,
}));

export const useGameStore = create<GameState>((set) => ({
  theme: 'synthwave',
  volume: 0.7,
  selectedSound: null,
  isAutomixActive: false,
  isRecording: false,
  isPlayingRecording: false,
  savedMixes: [],
  channels: initialChannels,

  setTheme: (theme) => set({ theme }),
  setVolume: (volume) => set({ volume }),
  setSelectedSound: (selectedSound) => set({ selectedSound }),
  setAutomixActive: (isAutomixActive) => set({ isAutomixActive }),
  setRecording: (isRecording) => set({ isRecording }),
  setPlayingRecording: (isPlayingRecording) => set({ isPlayingRecording }),
  setSavedMixes: (savedMixes) => set({ savedMixes }),
  addSavedMix: (mix) => set((state) => {
    const updated = [...state.savedMixes, mix];
    if (typeof window !== 'undefined') {
      localStorage.setItem('incredibox_saved_mixes', JSON.stringify(updated));
    }
    return { savedMixes: updated };
  }),
  deleteSavedMix: (id) => set((state) => {
    const updated = state.savedMixes.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('incredibox_saved_mixes', JSON.stringify(updated));
    }
    return { savedMixes: updated };
  }),

  assignLoop: (channelIndex, category, index) => set((state) => {
    const channels = state.channels.map(ch => 
      ch.id === channelIndex
        ? {
            ...ch,
            assignedLoop: { category, index },
            isCueing: false,
            isMuted: false,
            isSoloed: false,
          }
        : { ...ch, isSoloed: false }
    );
    return { channels };
  }),

  removeLoop: (channelIndex) => set((state) => {
    const channels = state.channels.map(ch => 
      ch.id === channelIndex ? { ...ch, assignedLoop: null, isCueing: false, amplitude: 0 } : ch
    );
    return { channels };
  }),

  toggleMute: (channelIndex) => set((state) => {
    const channels = state.channels.map(ch => 
      ch.id === channelIndex ? { ...ch, isMuted: !ch.isMuted } : ch
    );
    return { channels };
  }),

  toggleSolo: (channelIndex) => set((state) => {
    const isTargetSoloed = !state.channels[channelIndex].isSoloed;
    const channels = state.channels.map(ch => 
      ch.id === channelIndex ? { ...ch, isSoloed: isTargetSoloed } : ch
    );
    return { channels };
  }),

  updateChannelAmplitudes: (amplitudes) => set((state) => {
    const channels = state.channels.map((ch, idx) => ({
      ...ch,
      amplitude: amplitudes[idx] !== undefined ? amplitudes[idx] : ch.amplitude,
    }));
    return { channels };
  }),

  clearMix: () => set({
    channels: initialChannels.map(ch => ({ ...ch })),
  }),
}));
