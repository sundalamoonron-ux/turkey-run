// Turkey Run — SoundEngine: every sound and the music are synthesized
// with the Web Audio API. No audio files, no network: oscillators, noise
// buffers and gain envelopes only.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.started = false;
  }

  // Browsers only allow audio after a user gesture, so the first click or
  // keypress wakes the context; everything before that is a silent no-op.
  ensureContext() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return true;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone({ frequency, endFrequency = null, duration, type = 'sine', volume = 0.3, when = 0, slide = false }) {
    if (!this.context || this.muted) return;
    const startAt = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    if (endFrequency !== null) {
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration);
      else osc.frequency.linearRampToValueAtTime(endFrequency, startAt + duration);
    }
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
  }

  noiseBurst({ duration, volume = 0.25, when = 0, lowpass = 1200 }) {
    if (!this.context || this.muted) return;
    const startAt = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(startAt);
  }

  gobble() {
    // The turkey's own voice: three quick descending blips, plus a soft
    // footstep rustle so the gobble never sounds pasted on.
    this.noiseBurst({ duration: 0.06, volume: 0.05, lowpass: 900 });
    this.tone({ frequency: 420, endFrequency: 260, duration: 0.09, type: 'square', volume: 0.16 });
    this.tone({ frequency: 380, endFrequency: 240, duration: 0.09, type: 'square', volume: 0.16, when: 0.1 });
    this.tone({ frequency: 460, endFrequency: 220, duration: 0.14, type: 'square', volume: 0.18, when: 0.2 });
  }

  chirp() {
    this.tone({ frequency: 880, endFrequency: 1320, duration: 0.1, type: 'sine', volume: 0.22 });
    this.tone({ frequency: 1320, endFrequency: 1760, duration: 0.08, type: 'sine', volume: 0.14, when: 0.07 });
  }

  dashWhoosh() {
    this.noiseBurst({ duration: 0.22, volume: 0.3, lowpass: 2400 });
  }

  thud() {
    this.tone({ frequency: 120, endFrequency: 45, duration: 0.28, type: 'sine', volume: 0.5, slide: true });
    this.noiseBurst({ duration: 0.16, volume: 0.3, lowpass: 500 });
  }

  knifeWhizz() {
    this.noiseBurst({ duration: 0.3, volume: 0.16, lowpass: 4200 });
  }

  sizzle() {
    this.noiseBurst({ duration: 0.5, volume: 0.12, lowpass: 6000 });
  }

  spottedSting() {
    // Two-note alarm when the farmer spots the turkey.
    this.tone({ frequency: 233, duration: 0.16, type: 'sawtooth', volume: 0.2 });
    this.tone({ frequency: 311, duration: 0.24, type: 'sawtooth', volume: 0.22, when: 0.14 });
  }

  caughtFanfare() {
    const notes = [392, 311, 262, 196];
    notes.forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.3, type: 'triangle', volume: 0.25, when: i * 0.22 });
    });
  }

  escapeFanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.26, when: i * 0.16 });
    });
    this.tone({ frequency: 1319, duration: 0.6, type: 'triangle', volume: 0.26, when: 1.0 });
  }

  startMusic() {
    if (!this.ensureContext() || this.musicTimer !== null) return;
    this.started = true;
    // A jaunty autumn loop: plucky melody over a walking bass, 8 steps a bar.
    const melody = [523, 0, 659, 784, 659, 0, 587, 0, 523, 0, 587, 659, 587, 0, 494, 0];
    const bass = [131, 0, 165, 0, 196, 0, 165, 0, 131, 0, 147, 0, 165, 0, 196, 0];
    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.context) return;
      const step = this.musicStep % 16;
      this.musicStep++;
      const mel = melody[step];
      if (mel) this.playMusicNote(mel, 0.22, 'triangle', 0.5);
      const low = bass[step];
      if (low) this.playMusicNote(low, 0.3, 'sine', 0.6);
    }, 210);
  }

  playMusicNote(frequency, duration, type, volume) {
    if (!this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, this.context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start();
    osc.stop(this.context.currentTime + duration + 0.05);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
