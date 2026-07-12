import type { MixEvent } from '../store/useGameStore';

// Custom Noise Buffer Generator for Web Audio API synthesis
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 2; // 2 seconds of noise
  noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export const THEME_DETAILS: Record<string, { bpm: number; scale: number[]; colors: Record<string, string> }> = {
  synthwave: {
    bpm: 118,
    colors: { beats: '#ff2e63', effects: '#08f7fe', melodies: '#09f7a0', vocals: '#f408fe', bg: '#160a24' },
    scale: [57, 60, 62, 64, 67, 69, 72], // A minor pentatonic (A3, C4, D4, E4, G4, A4, C5)
  },
  chiptune: {
    bpm: 130,
    colors: { beats: '#ff5722', effects: '#00bcd4', melodies: '#8bc34a', vocals: '#e91e63', bg: '#051410' },
    scale: [60, 62, 64, 65, 67, 69, 71, 72], // C major (C4 - C5)
  },
  lofi: {
    bpm: 82,
    colors: { beats: '#ffb7b2', effects: '#b5ead7', melodies: '#e2f0cb', vocals: '#c7ceea', bg: '#120e14' },
    scale: [52, 55, 57, 59, 62, 64, 67], // E minor pentatonic (E3, G3, A3, B3, D4, E4, G4)
  },
};

export interface AudioChannel {
  id: number;
  assignedLoop: { category: string; index: number } | null;
  isMuted: boolean;
  isSoloed: boolean;
  isCueing: boolean;
  gainNode: GainNode | null;
  analyserNode: AnalyserNode | null;
  amplitude: number;
  activeSource: AudioBufferSourceNode | null;
}

export class AudioManager {
  public ctx: AudioContext | null = null;
  public currentThemeKey = 'synthwave';
  public bpm = 118;
  public isRunning = false;
  public channels: AudioChannel[] = [];
  
  private nextStepTime = 0.0;
  public currentStep = 0;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // seconds
  private timerId: ReturnType<typeof setTimeout> | null = null;
  
  private masterVolumeNode: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  
  public isRecording = false;
  public recordingStartTime = 0;
  public recordingEvents: MixEvent[] = [];
  private playbackTimers: ReturnType<typeof setTimeout>[] = [];
  private playbackFinishTimer: ReturnType<typeof setTimeout> | null = null;
  public isPlayingRecording = false;
  
  public onStepCallback: ((step: number) => void) | null = null;
  
  private customBuffers: Record<string, AudioBuffer> = {};
  private loadedCustomSounds = false;
  
  constructor() {
    this.channels = Array.from({ length: 11 }, (_, i) => ({
      id: i,
      assignedLoop: null,
      isMuted: false,
      isSoloed: false,
      isCueing: false,
      gainNode: null,
      analyserNode: null,
      amplitude: 0,
      activeSource: null,
    }));
  }

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.ctx = null;
    
    // Set up standard AudioContext for the procedural loop engine.
    const browserWindow = window as Window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass = browserWindow.AudioContext || browserWindow.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass() as AudioContext;
    this.ctx = ctx;

    this.masterVolumeNode = ctx.createGain();
    this.masterVolumeNode.gain.setValueAtTime(0.7, ctx.currentTime);
    
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1, ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(4, ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(12, ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.08, ctx.currentTime);

    this.masterVolumeNode.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);

    this.channels.forEach(ch => {
      ch.gainNode = ctx.createGain();
      ch.gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      ch.gainNode.connect(this.masterVolumeNode!);

      ch.analyserNode = ctx.createAnalyser();
      ch.analyserNode.fftSize = 64;
      ch.gainNode.connect(ch.analyserNode);
    });

    this.loadCustomAudio();

    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.isRunning = true;
    this.schedulerLoop();
  }

  private async loadCustomAudio() {
    if (this.loadedCustomSounds) return;
    
    const sources = {
      beatboxLoop: "/freesound_community-056670_matt39s-beatbox-loop-100bpm-87492.mp3",
      waterDrop: "/freesound_community-drop-of-water-36948.mp3",
      guitarPluck: "/gitar.wav",
      bassBeat1: "/bassBeat1.wav",
      bassBeat2: "/bassBeat2.wav"
    };
    
    for (const [key, path] of Object.entries(sources)) {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        if (!this.ctx) return;
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.customBuffers[key] = audioBuffer;
      } catch (err) {
        console.warn(`Failed to load custom sound: ${path}`, err);
      }
    }
    this.loadedCustomSounds = true;
  }

  private playCustomBuffer(ch: AudioChannel, bufferKey: string, time: number, originalBPM = 0, loopSteps = 16) {
    const buffer = this.customBuffers[bufferKey];
    if (!buffer || !this.ctx) return false;

    if (this.currentStep % loopSteps !== 0) {
      return true;
    }

    if (ch.activeSource) {
      try { ch.activeSource.stop(time); } catch {}
      ch.activeSource = null;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    if (originalBPM > 0) {
      source.playbackRate.setValueAtTime(this.bpm / originalBPM, time);
    } else {
      source.playbackRate.setValueAtTime(1.0, time);
    }

    source.connect(ch.gainNode!);
    source.start(time);
    ch.activeSource = source;
    return true;
  }

  private triggerCustomOneShot(ch: AudioChannel, bufferKey: string, time: number) {
    const buffer = this.customBuffers[bufferKey];
    if (!buffer || !this.ctx) return false;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ch.gainNode!);
    source.start(time);
    return true;
  }

  public setTheme(themeKey: string) {
    if (!THEME_DETAILS[themeKey]) return;
    this.currentThemeKey = themeKey;
    this.bpm = THEME_DETAILS[themeKey].bpm;
    
    this.channels.forEach(ch => {
      if (ch.assignedLoop) {
        ch.isCueing = false;
      }
    });
  }

  public setMasterVolume(val: number) {
    if (!this.masterVolumeNode || !this.ctx) return;
    this.masterVolumeNode.gain.setValueAtTime(val * 0.9, this.ctx.currentTime);
  }

  private schedulerLoop() {
    if (!this.isRunning || !this.ctx) return;
    
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    this.updateAmplitudes();
    this.timerId = setTimeout(() => this.schedulerLoop(), this.lookahead);
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = secondsPerBeat / 4.0; // 16th notes
    
    this.nextStepTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 64;

    if (this.currentStep % 16 === 0) {
      this.channels.forEach(ch => {
        if (ch.isCueing && ch.assignedLoop) {
          ch.isCueing = false;
        }
      });
    }

    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep);
    }
  }

  private updateAmplitudes() {
    if (!this.ctx) return;
    const dataArray = new Uint8Array(32);
    this.channels.forEach(ch => {
      if (ch.assignedLoop && !ch.isMuted && !ch.isCueing && ch.analyserNode) {
        ch.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        ch.amplitude = sum / 32 / 255.0;
      } else {
        ch.amplitude = ch.amplitude * 0.8;
      }
    });
  }

  public assignLoop(channelIndex: number, category: string, index: number) {
    this.init();
    const ctx = this.ctx;
    
    const channel = this.channels[channelIndex];
    this.channels.forEach((ch) => {
      ch.isSoloed = false;
    });
    channel.assignedLoop = { category, index };
    channel.isCueing = false;
    channel.isMuted = false;

    this.updateGainMatrices();

    const triggerNow = () => {
      if (!this.ctx || !channel.assignedLoop) return;
      this.playSynthesizedSound(
        this.currentThemeKey,
        category,
        index,
        this.currentStep,
        this.ctx.currentTime + 0.02,
        channel,
      );
    };

    if (ctx?.state === 'suspended') {
      void ctx.resume().then(triggerNow).catch(() => undefined);
    } else {
      triggerNow();
    }

    if (this.isRecording) {
      this.logEvent('add', channelIndex, category, index);
    }
  }

  public removeLoop(channelIndex: number) {
    const channel = this.channels[channelIndex];
    if (!channel.assignedLoop) return;
    
    if (this.isRecording) {
      this.logEvent('remove', channelIndex, null, null);
    }

    if (channel.activeSource) {
      try { channel.activeSource.stop(); } catch {}
      channel.activeSource = null;
    }

    channel.assignedLoop = null;
    channel.isCueing = false;
    channel.amplitude = 0;
    
    this.updateGainMatrices();
  }

  public toggleMute(channelIndex: number) {
    const ch = this.channels[channelIndex];
    ch.isMuted = !ch.isMuted;
    
    if (this.isRecording) {
      this.logEvent(ch.isMuted ? 'mute' : 'unmute', channelIndex, null, null);
    }

    this.updateGainMatrices();
  }

  public toggleSolo(channelIndex: number) {
    const ch = this.channels[channelIndex];
    ch.isSoloed = !ch.isSoloed;

    if (this.isRecording) {
      this.logEvent(ch.isSoloed ? 'solo' : 'unsolo', channelIndex, null, null);
    }

    this.updateGainMatrices();
  }

  public updateGainMatrices() {
    const anySoloed = this.channels.some(ch => ch.isSoloed && ch.assignedLoop);
    
    this.channels.forEach(ch => {
      if (!ch.gainNode || !this.ctx) return;
      
      let targetVolume = 1.0;
      
      if (!ch.assignedLoop) {
        targetVolume = 0;
      } else if (ch.isMuted) {
        targetVolume = 0;
      } else if (anySoloed && !ch.isSoloed) {
        targetVolume = 0;
      }

      ch.gainNode.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.04);
    });
  }

  public clearMix() {
    this.channels.forEach((ch, idx) => {
      this.removeLoop(idx);
      ch.isMuted = false;
      ch.isSoloed = false;
    });
    this.updateGainMatrices();
  }

  private scheduleStep(step: number, time: number) {
    this.channels.forEach(ch => {
      if (!ch.assignedLoop || ch.isCueing) return;
      
      const { category, index } = ch.assignedLoop;
      const themeKey = this.currentThemeKey;
      this.playSynthesizedSound(themeKey, category, index, step, time, ch);
    });
  }

  private playSynthesizedSound(theme: string, category: string, index: number, step: number, time: number, ch: AudioChannel) {
    const config = THEME_DETAILS[theme];
    const scale = config.scale;
    const destinationGain = ch.gainNode!;

    // Custom sound file routing
    if (category === 'beats' && index === 0) {
      if (this.playCustomBuffer(ch, 'beatboxLoop', time, 100, 16)) return;
    }
    if (category === 'beats' && index === 1) {
      if (this.playCustomBuffer(ch, 'bassBeat1', time, 0, 32)) return;
    }
    if (category === 'beats' && index === 2) {
      if (this.playCustomBuffer(ch, 'bassBeat2', time, 0, 16)) return;
    }
    if (category === 'melodies' && index === 0) {
      if (this.playCustomBuffer(ch, 'guitarPluck', time, 0, 16)) return;
    }
    if (category === 'effects' && index === 1) {
      const triggerSteps = [12, 28, 44, 60];
      if (triggerSteps.includes(step)) {
        if (this.triggerCustomOneShot(ch, 'waterDrop', time)) return;
      } else if (this.customBuffers['waterDrop']) {
        return;
      }
    }

    // Procedural synthesizers
    if (category === 'beats') {
      this.playBeatSynth(index, step, time, destinationGain);
    } else if (category === 'effects') {
      this.playEffectSynth(index, step, time, destinationGain);
    } else if (category === 'melodies') {
      this.playMelodySynth(theme, index, step, time, destinationGain, scale);
    } else if (category === 'vocals') {
      this.playVocalSynth(index, step, time, destinationGain, scale);
    }
  }

  private playBeatSynth(index: number, step: number, time: number, destGain: GainNode) {
    if (index === 0) {
      const isKick = step % 8 === 0;
      const isHat = step % 8 === 4 || step % 16 === 10;
      if (isKick) this.triggerKick(time, 100, 0.1, destGain);
      if (isHat) this.triggerHihat(time, 0.05, destGain);
    } else if (index === 1) {
      const isKick = step % 16 === 0 || step % 16 === 10 || step % 16 === 14;
      const isSnare = step % 16 === 4 || step % 16 === 12;
      const isHat = step % 4 === 2;
      if (isKick) this.triggerKick(time, 90, 0.12, destGain);
      if (isSnare) this.triggerSnare(time, destGain);
      if (isHat) this.triggerHihat(time, 0.04, destGain);
    } else if (index === 2) {
      const kickPattern = [0, 6, 16, 22, 32, 38, 44, 52];
      const snarePattern = [8, 24, 40, 56];
      const hatPattern = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
                           32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62];
      if (kickPattern.includes(step)) this.triggerKick(time, 85, 0.15, destGain);
      if (snarePattern.includes(step)) this.triggerSnare(time, destGain);
      if (hatPattern.includes(step)) {
        const vel = step % 4 === 0 ? 0.05 : 0.025;
        this.triggerHihat(time, vel, destGain);
      }
    } else if (index === 3) {
      const isKick = step % 4 === 0;
      const isClap = step % 8 === 4;
      const isHat = step % 4 === 2;
      const cowbellPattern = [3, 7, 11, 14, 15, 27, 31, 43, 47, 59, 63];
      if (isKick) this.triggerKick(time, 110, 0.08, destGain);
      if (isClap) this.triggerClap(time, destGain);
      if (isHat) this.triggerHihat(time, 0.06, destGain);
      if (cowbellPattern.includes(step)) this.triggerCowbell(time, 900, destGain);
    } else if (index === 4) {
      const kickPattern = [0, 8, 12, 24, 32, 40, 44, 56];
      const snarePattern = [8, 24, 40, 56];
      let isHat = step % 2 === 0;
      let hatDecay = 0.03;
      if ((step >= 28 && step <= 31) || (step >= 60 && step <= 63)) {
        isHat = true;
        hatDecay = 0.015;
      }
      if (kickPattern.includes(step)) this.triggerKick(time, 70, 0.25, destGain);
      if (snarePattern.includes(step)) this.triggerSnare(time, destGain);
      if (isHat) this.triggerHihat(time, 0.04, destGain, hatDecay);
    }
  }

  private triggerKick(time: number, startFreq = 100, duration = 0.12, destGain: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(destGain);

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + duration);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private triggerSnare(time: number, destGain: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(destGain);

    osc.frequency.setValueAtTime(180, time);
    osc.frequency.linearRampToValueAtTime(100, time + 0.07);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.1);

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = getNoiseBuffer(this.ctx);
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, time);
    noiseFilter.Q.setValueAtTime(1.5, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(destGain);

    noiseNode.start(time);
    noiseNode.stop(time + 0.2);
  }

  private triggerHihat(time: number, volume = 0.05, destGain: GainNode, decay = 0.04) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    source.buffer = getNoiseBuffer(this.ctx);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 1.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destGain);

    source.start(time);
    source.stop(time + decay + 0.05);
  }

  private triggerClap(time: number, destGain: GainNode) {
    if (!this.ctx) return;
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = getNoiseBuffer(this.ctx);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, time);
    filter.Q.setValueAtTime(2.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.6, time + 0.005);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.015);
    gain.gain.linearRampToValueAtTime(0.6, time + 0.02);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.035);
    gain.gain.linearRampToValueAtTime(0.8, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(destGain);

    noiseNode.start(time);
    noiseNode.stop(time + 0.2);
  }

  private triggerCowbell(time: number, freq = 800, destGain: GainNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.485, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }

  private playEffectSynth(index: number, step: number, time: number, destGain: GainNode) {
    if (!this.ctx) return;
    if (index === 0) {
      if (step === 0) {
        const duration = (60.0 / this.bpm) * 12;
        const noise = this.ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(this.ctx);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(3.0, time);
        filter.frequency.setValueAtTime(150, time);
        filter.frequency.exponentialRampToValueAtTime(8000, time + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.18, time + duration - 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destGain);

        noise.start(time);
        noise.stop(time + duration + 0.1);
      }
    } else if (index === 1) {
      const triggerSteps = [12, 28, 44, 60];
      if (triggerSteps.includes(step)) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, time);
        osc.frequency.exponentialRampToValueAtTime(150, time + 0.15);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destGain);

        osc.start(time);
        osc.stop(time + 0.2);
      }
    } else if (index === 2) {
      if (step % 16 === 8) {
        const notes = [60, 63, 67, 70, 72].map(midiToFreq);
        const delayTime = 0.07;
        notes.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'triangle';
          const t = time + idx * delayTime;
          osc.frequency.setValueAtTime(freq, t);

          const gain = this.ctx!.createGain();
          gain.gain.setValueAtTime(0.08 / (idx + 1), t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

          osc.connect(gain);
          gain.connect(destGain);

          osc.start(t);
          osc.stop(t + 0.2);
        });
      }
    } else if (index === 3) {
      const triggerSteps = [4, 18, 36, 50];
      if (triggerSteps.includes(step)) {
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();

        carrier.type = 'sine';
        modulator.type = 'sine';

        carrier.frequency.setValueAtTime(Math.random() * 800 + 400, time);
        modulator.frequency.setValueAtTime(Math.random() * 200 + 50, time);
        modGain.gain.setValueAtTime(300, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.09, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(gain);
        gain.connect(destGain);

        carrier.start(time);
        modulator.start(time);
        carrier.stop(time + 0.1);
        modulator.stop(time + 0.1);
      }
    } else if (index === 4) {
      if (step === 32 || step === 60) {
        this.triggerKick(time, 65, 0.4, destGain);
        const noise = this.ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(this.ctx);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(destGain);

        noise.start(time);
        noise.stop(time + 0.85);
      }
    }
  }

  private playMelodySynth(theme: string, index: number, step: number, time: number, destGain: GainNode, scale: number[]) {
    if (!this.ctx) return;
    if (index === 0) {
      const bassSteps = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60];
      if (bassSteps.includes(step)) {
        let noteIndex = 0;
        if (step >= 16 && step < 32) noteIndex = 1;
        if (step >= 32 && step < 48) noteIndex = 2;
        if (step >= 48) noteIndex = 4;
        
        const midiNote = scale[noteIndex] - 24;
        const freq = midiToFreq(midiNote);

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.35, time + 0.02);
        gain.gain.setValueAtTime(0.35, time + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destGain);

        osc.start(time);
        osc.stop(time + 0.35);
      }
    } else if (index === 1) {
      if (step % 16 === 0) {
        let chordNotes: number[] = [];
        if (theme === 'synthwave') {
          if (step === 0) chordNotes = [57, 60, 64, 69];
          else if (step === 16) chordNotes = [53, 57, 60, 65];
          else if (step === 32) chordNotes = [55, 60, 64, 67];
          else if (step === 48) chordNotes = [55, 59, 62, 67];
        } else if (theme === 'chiptune') {
          if (step === 0) chordNotes = [60, 64, 67, 72];
          else if (step === 16) chordNotes = [59, 62, 67, 71];
          else if (step === 32) chordNotes = [57, 60, 64, 69];
          else if (step === 48) chordNotes = [53, 57, 60, 65];
        } else {
          if (step === 0) chordNotes = [52, 55, 59, 64];
          else if (step === 16) chordNotes = [48, 52, 55, 60];
          else if (step === 32) chordNotes = [50, 55, 59, 62];
          else if (step === 48) chordNotes = [50, 54, 57, 62];
        }

        const duration = (60.0 / this.bpm) * 3.8;

        chordNotes.forEach(note => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(midiToFreq(note), time);

          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(100, time);
          filter.frequency.exponentialRampToValueAtTime(700, time + duration * 0.4);

          const gain = this.ctx!.createGain();
          gain.gain.setValueAtTime(0.001, time);
          gain.gain.linearRampToValueAtTime(0.07, time + duration * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(destGain);

          osc.start(time);
          osc.stop(time + duration + 0.1);
        });
      }
    } else if (index === 2) {
      const pluckPattern = [
        0, 2, 4, 6, 8, 10, 12, 14,
        16, 18, 20, 22, 24, 26, 28, 30,
        32, 34, 36, 38, 40, 42, 44, 46,
        48, 50, 52, 54, 56, 58, 60, 62
      ];
      if (pluckPattern.includes(step)) {
        const noteCycle = [0, 2, 4, 5, 4, 2, 0, 1, 2, 4, 6, 5, 4, 2, 1, 0];
        const cycleIdx = step % 16;
        const midiNote = scale[noteCycle[cycleIdx]] + 12;
        const freq = midiToFreq(midiNote);

        const osc = this.ctx.createOscillator();
        osc.type = theme === 'chiptune' ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.connect(gain);
        gain.connect(destGain);

        osc.start(time);
        osc.stop(time + 0.15);
      }
    } else if (index === 3) {
      const leadSteps = [0, 8, 16, 24, 32, 40, 48, 54];
      if (leadSteps.includes(step)) {
        let noteIndex = 0;
        if (step === 0) noteIndex = 3; 
        if (step === 8) noteIndex = 5; 
        if (step === 16) noteIndex = 6; 
        if (step === 24) noteIndex = 4;
        if (step === 32) noteIndex = 5; 
        if (step === 40) noteIndex = 4; 
        if (step === 48) noteIndex = 3;
        if (step === 54) noteIndex = 2;

        const midiNote = scale[noteIndex] + 12;
        const freq = midiToFreq(midiNote);

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        const vibrato = this.ctx.createOscillator();
        const vibGain = this.ctx.createGain();
        vibrato.frequency.value = 6;
        vibGain.gain.value = freq * 0.015;
        vibrato.connect(vibGain);
        vibGain.connect(osc.frequency);
        
        vibrato.start(time);
        vibrato.stop(time + 0.6);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destGain);

        osc.start(time);
        osc.stop(time + 0.55);
      }
    } else if (index === 4) {
      const syncopatedSteps = [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62];
      if (syncopatedSteps.includes(step)) {
        const noteSelection = [5, 4, 3, 2, 6, 5, 4, 3];
        const selIdx = Math.floor(step / 4) % 8;
        const midiNote = scale[noteSelection[selIdx]] + 12;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(midiToFreq(midiNote), time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(gain);
        gain.connect(destGain);

        osc.start(time);
        osc.stop(time + 0.1);
      }
    }
  }

  private playVocalSynth(index: number, step: number, time: number, destGain: GainNode, scale: number[]) {
    const vowels = {
      A: [730, 1090, 2440],
      O: [570, 840, 2410],
      U: [300, 870, 2240],
      E: [270, 2290, 3010],
      I: [390, 1990, 2540]
    };

    if (index === 0) {
      const humSteps = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60];
      if (humSteps.includes(step)) {
        let rootIdx = 0;
        if (step >= 16 && step < 32) rootIdx = 1;
        if (step >= 32 && step < 48) rootIdx = 2;
        if (step >= 48) rootIdx = 4;
        
        const midiNote = scale[rootIdx] - 12;
        const freq = midiToFreq(midiNote);
        const vowelName: 'O' | 'U' = (step % 8 === 0) ? 'O' : 'U';
        this.triggerFormantVocal(time, freq, vowelName, vowels[vowelName], 0.25, destGain);
      }
    } else if (index === 1) {
      const rapSteps = [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62];
      if (rapSteps.includes(step)) {
        const notePattern = [2, 3, 4, 3, 2, 4, 5, 4];
        const pIdx = Math.floor(step / 2) % 8;
        const midiNote = scale[notePattern[pIdx]] + 12;
        const freq = midiToFreq(midiNote);
        
        const vowelCycle: ('A' | 'E' | 'O')[] = ['A', 'E', 'A', 'O'];
        const vowelSelected = vowelCycle[Math.floor(step / 4) % 4];
        this.triggerFormantVocal(time, freq, vowelSelected, vowels[vowelSelected], 0.12, destGain);
      }
    } else if (index === 2) {
      const roboSteps = [0, 8, 16, 24, 32, 40, 48, 56];
      if (roboSteps.includes(step)) {
        const isKickRobo = step % 16 === 0;
        const freq = isKickRobo ? 80 : 150;
        const vow: 'A' | 'O' = step % 16 === 0 ? 'A' : 'O';
        this.triggerFormantVocal(time, freq, vow, vowels[vow], 0.2, destGain, 'sawtooth');
      }
    } else if (index === 3) {
      if (step % 16 === 0) {
        let noteIdx = 4;
        if (step === 16) noteIdx = 5;
        if (step === 32) noteIdx = 6;
        if (step === 48) noteIdx = 3;
        const freq = midiToFreq(scale[noteIdx] + 12);
        const duration = (60.0 / this.bpm) * 3.6;
        this.triggerFormantChoir(time, freq, vowels.U, vowels.A, duration, destGain);
      }
    } else if (index === 4) {
      const sweepSteps = [4, 12, 20, 28, 36, 44, 52, 60];
      if (sweepSteps.includes(step)) {
        const midiNote = scale[step % 7] + 12;
        const freq = midiToFreq(midiNote);
        this.triggerFormantWah(time, freq, vowels.U, vowels.A, 0.25, destGain);
      }
    }
  }

  private triggerFormantVocal(time: number, freq: number, vowelName: string, formantFreqs: number[], duration: number, destGain: GainNode, oscType = 'sawtooth') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = oscType as OscillatorType;
    osc.frequency.setValueAtTime(freq, time);

    const vocalMix = this.ctx.createGain();
    vocalMix.gain.setValueAtTime(0.0, time);
    vocalMix.gain.linearRampToValueAtTime(0.12, time + 0.02);
    vocalMix.gain.exponentialRampToValueAtTime(0.001, time + duration);

    formantFreqs.map((centreFreq, idx) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(centreFreq, time);
      const qVal = idx === 0 ? 12 : 18;
      filter.Q.setValueAtTime(qVal, time);

      osc.connect(filter);
      filter.connect(vocalMix);
    });

    vocalMix.connect(destGain);
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  private triggerFormantChoir(time: number, freq: number, vowelStart: number[], vowelEnd: number[], duration: number, destGain: GainNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq - 2, time);
    osc2.frequency.setValueAtTime(freq + 2, time);

    const vocalMix = this.ctx.createGain();
    vocalMix.gain.setValueAtTime(0.001, time);
    vocalMix.gain.linearRampToValueAtTime(0.05, time + 0.4);
    vocalMix.gain.linearRampToValueAtTime(0.05, time + duration - 0.5);
    vocalMix.gain.exponentialRampToValueAtTime(0.001, time + duration);

    for (let i = 0; i < 3; i++) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(14, time);

      const fStart = vowelStart[i];
      const fEnd = vowelEnd[i];

      filter.frequency.setValueAtTime(fStart, time);
      filter.frequency.exponentialRampToValueAtTime(fEnd, time + duration * 0.7);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(vocalMix);
    }

    vocalMix.connect(destGain);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.1);
    osc2.stop(time + duration + 0.1);
  }

  private triggerFormantWah(time: number, freq: number, vowelStart: number[], vowelEnd: number[], duration: number, destGain: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const vocalMix = this.ctx.createGain();
    vocalMix.gain.setValueAtTime(0.0, time);
    vocalMix.gain.linearRampToValueAtTime(0.1, time + 0.02);
    vocalMix.gain.exponentialRampToValueAtTime(0.001, time + duration);

    for (let i = 0; i < 3; i++) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(15, time);

      const fStart = vowelStart[i];
      const fEnd = vowelEnd[i];

      filter.frequency.setValueAtTime(fStart, time);
      filter.frequency.linearRampToValueAtTime(fEnd, time + duration * 0.6);
      filter.frequency.linearRampToValueAtTime(fStart, time + duration);

      osc.connect(filter);
      filter.connect(vocalMix);
    }

    vocalMix.connect(destGain);
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  public startRecording() {
    this.init();
    if (!this.ctx) return;
    this.isRecording = true;
    this.recordingStartTime = this.ctx.currentTime;
    this.recordingEvents = [];

    this.channels.forEach((ch, idx) => {
      if (ch.assignedLoop) {
        this.recordingEvents.push({
          time: 0,
          type: 'add',
          channelIndex: idx,
          category: ch.assignedLoop.category,
          index: ch.assignedLoop.index,
        });
        if (ch.isMuted) {
          this.recordingEvents.push({ time: 0, type: 'mute', channelIndex: idx });
        }
        if (ch.isSoloed) {
          this.recordingEvents.push({ time: 0, type: 'solo', channelIndex: idx });
        }
      }
    });
  }

  public stopRecording(): MixEvent[] {
    this.isRecording = false;
    return this.recordingEvents;
  }

  private logEvent(type: string, channelIndex: number, category: string | null, index: number | null) {
    if (!this.ctx) return;
    const timeOffset = this.ctx.currentTime - this.recordingStartTime;
    this.recordingEvents.push({
      time: timeOffset,
      type,
      channelIndex,
      category,
      index,
    });
  }

  public playRecording(events: MixEvent[], onFinished?: () => void) {
    this.init();
    this.isPlayingRecording = true;
    this.clearMix();

    events.forEach(evt => {
      const timeoutMs = evt.time * 1000;
      const timer = setTimeout(() => {
        if (!this.isPlayingRecording) return;
        
        if (evt.type === 'add' && evt.category !== undefined && evt.index !== undefined) {
          this.assignLoop(evt.channelIndex, evt.category!, evt.index!);
        } else if (evt.type === 'remove') {
          this.removeLoop(evt.channelIndex);
        } else if (evt.type === 'mute') {
          this.channels[evt.channelIndex].isMuted = true;
          this.updateGainMatrices();
        } else if (evt.type === 'unmute') {
          this.channels[evt.channelIndex].isMuted = false;
          this.updateGainMatrices();
        } else if (evt.type === 'solo') {
          this.channels[evt.channelIndex].isSoloed = true;
          this.updateGainMatrices();
        } else if (evt.type === 'unsolo') {
          this.channels[evt.channelIndex].isSoloed = false;
          this.updateGainMatrices();
        }
      }, timeoutMs);
      this.playbackTimers.push(timer);
    });

    const totalDuration = events.length > 0 ? events[events.length - 1].time + 2 : 10;
    this.playbackFinishTimer = setTimeout(() => {
      this.stopPlayback();
      if (onFinished) onFinished();
    }, totalDuration * 1000);
  }

  public stopPlayback() {
    this.isPlayingRecording = false;
    this.playbackTimers.forEach((timer) => clearTimeout(timer));
    this.playbackTimers = [];
    if (this.playbackFinishTimer) clearTimeout(this.playbackFinishTimer);
    this.playbackFinishTimer = null;
    this.clearMix();
  }
}

// Export singleton audio manager
let globalAudioManager: AudioManager | null = null;
export const getAudioManager = (): AudioManager => {
  if (typeof window === 'undefined') {
    return new AudioManager();
  }
  if (!globalAudioManager) {
    globalAudioManager = new AudioManager();
  }
  return globalAudioManager;
};
