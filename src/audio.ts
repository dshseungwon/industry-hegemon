// 효과음 — WebAudio로 즉석 합성(외부 오디오 파일 없음, 오프라인 원칙 유지).
// 브라우저 정책상 첫 사용자 제스처 전에는 소리가 안 남 → unlockAudio()를 첫 클릭에 호출.
let ctx: AudioContext | null = null;
let muted = (typeof localStorage !== "undefined" && localStorage.getItem("ih_mute") === "1");

function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}
export function unlockAudio() { try { const c = ac(); if (c.state === "suspended") c.resume(); } catch { /* noop */ } }
export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem("ih_mute", muted ? "1" : "0"); } catch { /* noop */ }
  if (!muted) unlockAudio();
  return muted;
}

// 한 음 — 오실레이터 + 게인 엔벨로프(짧은 어택, 지수 감쇠).
function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start); o.stop(start + dur + 0.02);
}
// 주파수 시퀀스(아르페지오)
function seq(c: AudioContext, freqs: number[], gap: number, dur: number, type: OscillatorType, vol: number) {
  let t = c.currentTime;
  for (const f of freqs) { tone(c, f, t, dur, type, vol); t += gap; }
}

// 음이름 → 주파수(대략)
const N: Record<string, number> = {
  C4: 261.6, D4: 293.7, E4: 329.6, G4: 392.0, A4: 440.0,
  C5: 523.3, D5: 587.3, E5: 659.3, G5: 784.0, A5: 880.0, C6: 1046.5,
};

export function sfx(name: string) {
  if (muted) return;
  let c: AudioContext; try { c = ac(); } catch { return; }
  const t = c.currentTime;
  switch (name) {
    case "click":    tone(c, 520, t, 0.06, "triangle", 0.10); break;
    case "select":   tone(c, 660, t, 0.08, "triangle", 0.12); break;
    case "invest":   seq(c, [N.C4, N.E4, N.G4], 0.05, 0.16, "triangle", 0.16); break;
    case "accel":    tone(c, 300, t, 0.18, "sawtooth", 0.10); tone(c, 900, t + 0.02, 0.16, "sine", 0.07); break;
    case "cancel":   seq(c, [N.G4, N.C4], 0.06, 0.14, "sine", 0.12); break;
    case "trend":    seq(c, [N.A4, N.E5], 0.07, 0.2, "sine", 0.10); break;
    case "conquer":  tone(c, N.C5, t, 0.1, "triangle", 0.13); tone(c, N.G5, t + 0.03, 0.12, "sine", 0.08); break;
    case "lost":     seq(c, [N.E4, N.C4], 0.05, 0.16, "sine", 0.10); break;
    case "complete": seq(c, [N.C5, N.E5, N.G5, N.C6], 0.06, 0.28, "triangle", 0.16); break;
    case "win":      seq(c, [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6], 0.1, 0.5, "triangle", 0.18); break;
    case "lose":     seq(c, [N.G4, N.E4, N.C4, 196.0], 0.13, 0.5, "sine", 0.14); break;
  }
}
