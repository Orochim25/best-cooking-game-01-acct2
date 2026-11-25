// audio.js — tiny WebAudio synth: no audio files, everything synthesized.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) {
      /* audio is best-effort */
    }
  }

  pickup() { this.tone(520, 0.09, 'sine', 0.16); }
  place() { this.tone(340, 0.08, 'triangle', 0.15); }
  chop() { this.tone(190, 0.07, 'square', 0.12, 0, 90); }
  sizzle() { this.tone(880, 0.25, 'sawtooth', 0.05, 0, 440); }
  ding() { this.tone(880, 0.16, 'sine', 0.18); this.tone(1318, 0.22, 'sine', 0.14, 0.09); }
  serve() {
    this.tone(523, 0.12, 'sine', 0.18);
    this.tone(659, 0.12, 'sine', 0.18, 0.1);
    this.tone(784, 0.2, 'sine', 0.2, 0.2);
  }
  error() { this.tone(160, 0.18, 'square', 0.12, 0, 110); }
  tick() { this.tone(1100, 0.05, 'sine', 0.08); }
  orderIn() { this.tone(660, 0.1, 'triangle', 0.14); this.tone(880, 0.12, 'triangle', 0.12, 0.08); }
  gameOver() {
    this.tone(392, 0.2, 'sine', 0.16);
    this.tone(330, 0.2, 'sine', 0.16, 0.18);
    this.tone(262, 0.34, 'sine', 0.18, 0.36);
  }
}
