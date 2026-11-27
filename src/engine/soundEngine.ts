import { GeneratedSfxSpec, GeneratedTrackSpec } from './types';

export interface LevelTrackConfig {
  level: number;
  title: string;
  bpm: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  lead: number[];
  bass: number[];
  perc: number[];
}

export const LEVEL_TRACKS: Record<number, LevelTrackConfig> = {
  1: {
    level: 1,
    title: 'Dawn Village Breeze',
    bpm: 118,
    leadWave: 'triangle',
    bassWave: 'sine',
    lead: [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66, 261.63, 329.63, 392, 440, 523.25, 440, 392, 329.63],
    bass: [130.81, 0, 130.81, 164.81, 196, 0, 146.83, 164.81, 130.81, 0, 174.61, 0, 196, 0, 146.83, 0],
    perc: [1, 0, 2, 0, 1, 0, 2, 1, 1, 0, 2, 0, 1, 2, 1, 2]
  },
  2: {
    level: 2,
    title: 'Storm Bridge Pulse',
    bpm: 136,
    leadWave: 'square',
    bassWave: 'triangle',
    lead: [220, 261.63, 329.63, 440, 392, 349.23, 329.63, 293.66, 220, 293.66, 349.23, 440, 493.88, 440, 392, 329.63],
    bass: [110, 110, 0, 146.83, 164.81, 0, 130.81, 146.83, 110, 110, 0, 174.61, 196, 0, 164.81, 146.83],
    perc: [1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1]
  },
  3: {
    level: 3,
    title: 'Menara Kala — Three Shadows',
    bpm: 150,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    lead: [196, 207.65, 293.66, 392, 369.99, 311.13, 293.66, 233.08, 196, 261.63, 311.13, 392, 466.16, 415.3, 392, 293.66],
    bass: [98, 98, 130.81, 98, 116.54, 98, 146.83, 130.81, 98, 98, 155.56, 130.81, 146.83, 116.54, 98, 87.31],
    perc: [1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2]
  }
};

class SoundEngineService {
  private ctx: AudioContext | null = null;
  private outBus: AudioNode | null = null;
  private muted = false;
  private bgmEnabled = true;
  private suspended = false;
  private duckUntilMs = 0;
  private activeLevel = 1;
  private customTrack: LevelTrackConfig | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private lastUiHoverMs = 0;

  readonly LEVEL_TRACKS = LEVEL_TRACKS;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      try {
        const dry = this.ctx.createGain();
        dry.gain.value = 1.0;
        dry.connect(this.ctx.destination);
        const delay = this.ctx.createDelay(0.35);
        delay.delayTime.value = 0.095;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.14;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2200;
        dry.connect(delay);
        delay.connect(lp);
        lp.connect(wet);
        wet.connect(this.ctx.destination);
        this.outBus = dry;
      } catch {
        this.outBus = this.ctx.destination;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  getTrackConfig(level: number): LevelTrackConfig {
    return LEVEL_TRACKS[Math.min(3, Math.max(1, level))] ?? LEVEL_TRACKS[1];
  }

  setMuted(value: boolean): void {
    this.muted = value;
    if (value) this.stopTracker();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setBgmEnabled(enabled: boolean): void {
    this.bgmEnabled = enabled;
    if (!enabled) this.stopTracker();
  }

  suspend(): void {
    this.suspended = true;
    this.stopTracker();
  }

  resume(): void {
    this.suspended = false;
  }

  speakText(text: string, langCode = 'id', pitch = 1, rate = 1): void {
    if (this.muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = langCode === 'id' ? 'id-ID' : langCode;
      utter.pitch = Math.min(1.6, Math.max(0.6, pitch));
      utter.rate = Math.min(1.6, Math.max(0.6, rate));
      window.speechSynthesis.speak(utter);
    } catch {
      // Speech synthesis optional on restricted browsers
    }
  }

  startTracker(level: number): void {
    const clamped = Math.min(3, Math.max(1, level));
    const changed = this.activeLevel !== clamped;
    this.activeLevel = clamped;
    this.customTrack = null;
    if (this.muted || !this.bgmEnabled || this.suspended) return;
    if (changed) this.stopTracker();
    if (this.bgmTimer !== null) return;
    this.launchTrackerLoop();
  }

  playCustomTrack(spec: GeneratedTrackSpec): void {
    this.stopTracker();
    this.customTrack = {
      level: 1,
      title: spec.title,
      bpm: spec.bpm,
      leadWave: spec.scale === 'phrygian' ? 'sawtooth' : spec.scale === 'dorian' ? 'square' : 'triangle',
      bassWave: 'triangle',
      lead: spec.leadNotes,
      bass: spec.bassNotes,
      perc: spec.percHits
    };
    if (!this.muted && this.bgmEnabled && !this.suspended) {
      this.launchTrackerLoop();
    }
  }

  stopTracker(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private launchTrackerLoop(): void {
    this.bgmStep = 0;
    const tick = () => {
      if (this.muted || !this.bgmEnabled || this.suspended) {
        this.bgmTimer = null;
        return;
      }
      const track = this.customTrack ?? this.getTrackConfig(this.activeLevel);
      const idx = this.bgmStep % track.lead.length;
      const duck = Date.now() < this.duckUntilMs ? 0.35 : 1;
      const leadFreq = track.lead[idx];
      const bassFreq = track.bass[idx % track.bass.length];
      const percCode = track.perc[idx % track.perc.length];
      this.playMixedStep(leadFreq, track.leadWave, bassFreq, track.bassWave, percCode, duck);
      this.bgmStep = (this.bgmStep + 1) % track.lead.length;
      const stepMs = Math.max(115, Math.floor((60_000 / track.bpm) / 2));
      this.bgmTimer = window.setTimeout(tick, stepMs);
    };
    tick();
  }

  private playMixedStep(
    leadFreq: number,
    leadWave: OscillatorType,
    bassFreq: number,
    bassWave: OscillatorType,
    percCode: number,
    duck: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.16;

    if (leadFreq > 0) {
      this.scheduleOsc(ctx, leadWave, leadFreq, leadFreq, dur, 0.08 * duck, now);
    }
    if (bassFreq > 0) {
      this.scheduleOsc(ctx, bassWave, bassFreq, bassFreq, dur, 0.09 * duck, now);
    }
    if (percCode === 1) {
      this.scheduleOsc(ctx, 'sine', 115, 42, 0.08, 0.1 * duck, now);
    } else if (percCode === 2) {
      this.scheduleOsc(ctx, 'triangle', 980, 460, 0.04, 0.045 * duck, now);
    }
  }

  playCustomSfx(spec: GeneratedSfxSpec): void {
    if (this.muted || this.suspended) return;
    const wave = (['sine', 'square', 'sawtooth', 'triangle'].includes(spec.wave)
      ? spec.wave
      : 'triangle') as OscillatorType;
    this.playTone(
      Math.max(40, spec.freqStart),
      Math.max(35, spec.freqEnd),
      Math.min(0.5, Math.max(0.03, spec.durationSec)),
      wave,
      Math.min(0.35, Math.max(0.05, spec.volume))
    );
  }

  playSfx(kind: string, panOffsetX = 0): void {
    if (this.muted || this.suspended) return;
    const nowMs = Date.now();
    if (kind === 'ui_hover') {
      if (nowMs - this.lastUiHoverMs < 70) return;
      this.lastUiHoverMs = nowMs;
    }
    const isUi = kind.startsWith('ui_');
    if (!isUi && kind !== 'footstep') {
      this.duckUntilMs = nowMs + 240;
    }
    const jitter = isUi ? 1 : 0.92 + Math.random() * 0.16;
    const atten = isUi ? 1 : Math.max(0.35, 1 - Math.min(1, Math.abs(panOffsetX) / 480) * 0.55);
    const pan = isUi ? 0 : Math.min(0.8, Math.max(-0.8, panOffsetX / 360));

    switch (kind) {
      case 'footstep':
        this.playTone(145 * jitter, 82 * jitter, 0.045, 'triangle', 0.09 * atten, pan);
        break;
      case 'land':
        this.playTone(135 * jitter, 58 * jitter, 0.08, 'sine', 0.14 * atten, pan);
        break;
      case 'jump':
        this.playTone(310 * jitter, 560 * jitter, 0.11, 'triangle', 0.18 * atten, pan);
        break;
      case 'dash':
        this.playTone(540 * jitter, 210 * jitter, 0.12, 'triangle', 0.16 * atten, pan);
        break;
      case 'attack':
        this.playTone(420 * jitter, 190 * jitter, 0.09, 'square', 0.14 * atten, pan);
        break;
      case 'hit':
        this.playTone(190 * jitter, 85 * jitter, 0.11, 'sawtooth', 0.2 * atten, pan);
        break;
      case 'parry':
        this.playTone(760 * jitter, 1180 * jitter, 0.16, 'triangle', 0.22 * atten, pan);
        break;
      case 'potion':
        this.playTone(440, 880, 0.14, 'sine', 0.18);
        window.setTimeout(() => this.playTone(660, 1180, 0.13, 'triangle', 0.14), 50);
        break;
      case 'coin':
        this.playTone(680 * jitter, 1020 * jitter, 0.1, 'sine', 0.18 * atten, pan);
        break;
      case 'shard':
        this.playTone(520 * jitter, 1040 * jitter, 0.2, 'triangle', 0.22 * atten, pan);
        break;
      case 'switch':
        this.playTone(380 * jitter, 620 * jitter, 0.14, 'square', 0.16 * atten, pan);
        break;
      case 'gate':
        this.playTone(280 * jitter, 740 * jitter, 0.25, 'triangle', 0.22 * atten, pan);
        break;
      case 'burst':
        this.playTone(220 * jitter, 880 * jitter, 0.24, 'sawtooth', 0.22 * atten, pan);
        break;
      case 'hurt':
        this.playTone(170 * jitter, 75 * jitter, 0.16, 'sawtooth', 0.22 * atten, pan);
        break;
      case 'boss_phase':
        this.playTone(130, 260, 0.24, 'sawtooth', 0.22);
        window.setTimeout(() => this.playTone(196, 392, 0.2, 'square', 0.14), 70);
        break;
      case 'level_clear':
        this.playTone(392, 523.25, 0.13, 'triangle', 0.2);
        window.setTimeout(() => this.playTone(523.25, 659.25, 0.15, 'triangle', 0.2), 90);
        window.setTimeout(() => this.playTone(659.25, 783.99, 0.2, 'triangle', 0.22), 180);
        break;
      case 'victory':
        this.playTone(523.25, 587.33, 0.13, 'triangle', 0.22);
        window.setTimeout(() => this.playTone(659.25, 783.99, 0.14, 'triangle', 0.22), 100);
        window.setTimeout(() => this.playTone(783.99, 1046.5, 0.26, 'triangle', 0.24), 200);
        break;
      case 'gameover':
        this.playTone(293.66, 220, 0.16, 'sawtooth', 0.2);
        window.setTimeout(() => this.playTone(220, 146.83, 0.2, 'sawtooth', 0.2), 130);
        window.setTimeout(() => this.playTone(146.83, 88, 0.28, 'triangle', 0.18), 260);
        break;
      case 'ui_tab':
        this.playTone(480, 680, 0.05, 'triangle', 0.11);
        break;
      case 'ui_toggle':
        this.playTone(420, 620, 0.045, 'sine', 0.11);
        break;
      case 'ui_error':
        this.playTone(210, 140, 0.11, 'square', 0.13);
        break;
      default:
        this.playTone(620, 440, 0.04, 'sine', 0.11);
        break;
    }
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    durationSec: number,
    wave: OscillatorType,
    volume: number,
    pan = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.scheduleOsc(ctx, wave, startFreq, endFreq, durationSec, volume, ctx.currentTime, pan);
  }

  private scheduleOsc(
    ctx: AudioContext,
    wave: OscillatorType,
    startFreq: number,
    endFreq: number,
    durationSec: number,
    volume: number,
    startTime: number,
    pan = 0
  ): void {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(Math.max(20, startFreq), startTime);
      osc.frequency.linearRampToValueAtTime(Math.max(20, endFreq), startTime + durationSec);
      gain.gain.setValueAtTime(Math.max(0.001, volume), startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      const targetOut = this.outBus ?? ctx.destination;
      if (pan !== 0 && typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, startTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(targetOut);
      } else {
        osc.connect(gain);
        gain.connect(targetOut);
      }
      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.01);
    } catch {
      // Safe no-op if audio context is blocked before user gesture
    }
  }
}

export const SoundEngine = new SoundEngineService();
