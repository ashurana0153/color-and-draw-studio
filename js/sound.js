// Soft, optional sounds. Nothing plays until the person has interacted with the page.
export class Sound {
  constructor() { this.on = true; this.ctx = null; }
  unlock() {
    if (this.ctx || !(window.AudioContext || window.webkitAudioContext)) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  }
  tone(freq, t0, dur = 0.5, vol = 0.07) {
    const c = this.ctx; if (!c || !this.on) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g).connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  }
  pop() { const s = [523.25, 587.33, 659.25, 783.99, 880][Math.floor(Math.random() * 5)]; this.tone(s, 0, 0.55, 0.06); this.tone(s * 2, 0.06, 0.4, 0.025); }
  pick() { this.tone(440, 0, 0.12, 0.02); }
  finish() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, i * 0.14, 0.9, 0.06)); }
}
