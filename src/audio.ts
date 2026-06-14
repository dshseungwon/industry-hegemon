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
  if (muted) stopBgm(); else { unlockAudio(); startBgm(); }
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
    case "win":      // 승리 팡파르 — 상승 아르페지오 + 저음 받침
      seq(c, [N.C5, N.E5, N.G5, N.C6, N.E5, N.G5, N.C6], 0.11, 0.55, "triangle", 0.18);
      tone(c, N.C4, t, 0.9, "triangle", 0.12); tone(c, N.G4, t + 0.33, 0.7, "triangle", 0.10); break;
    case "lose":     // 패배 — 느린 하강 단조 종지 + 어두운 저음
      seq(c, [N.A4, N.F4 || 349.2, N.D4, N.C4], 0.18, 0.7, "sine", 0.15);
      tone(c, 110.0, t, 1.4, "sine", 0.10); break;
  }
}

// ---- 배경음악: 점유율 상황에 따라 분위기가 바뀌는 앰비언트 패드 루프(오디오 파일 없음) ----
type Chord = { triad: number[]; bass: number };
const Am: Chord = { triad: [220.00, 261.63, 329.63], bass: 110.00 };
const F:  Chord = { triad: [174.61, 220.00, 261.63], bass: 87.31 };
const C:  Chord = { triad: [261.63, 329.63, 392.00], bass: 130.81 };
const G:  Chord = { triad: [196.00, 246.94, 293.66], bass: 98.00 };
const Dm: Chord = { triad: [293.66, 349.23, 440.00], bass: 146.83 };
const E:  Chord = { triad: [329.63, 415.30, 493.88], bass: 164.81 }; // E major — 긴장
type Mood = "calm" | "crisis" | "strong" | "title";
const MOODS: Record<Mood, { prog: Chord[]; dur: number }> = {
  calm:   { prog: [Am, F, C, G], dur: 5.0 },   // vi–IV–I–V, 차분
  crisis: { prog: [Am, F, Dm, E], dur: 2.8 },  // i–VI–iv–V 단조 긴장, 빠르게
  strong: { prog: [C, G, Am, F], dur: 5.2 },   // I–V–vi–IV 밝고 당당
  title:  { prog: [C, Am, F, G], dur: 5.6 },   // I–vi–IV–V 웅장한 타이틀 테마(멜로디 또렷)
};
let mood: Mood = "calm";
export function setBgmMood(m: Mood) { mood = m; }
let bgmGain: GainNode | null = null;
let bgmTimer: number | undefined;
let bgmOn = false;
let progIdx = 0;

function pad(c: AudioContext, freq: number, t0: number, dur: number, peak: number, type: OscillatorType, detune: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.setValueAtTime(detune, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 1.4);                 // 느린 어택
  g.gain.setValueAtTime(peak, t0 + dur - 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.6);    // 부드러운 릴리즈
  o.connect(g).connect(bgmGain!);
  o.start(t0); o.stop(t0 + dur + 0.7);
}
function scheduleChord(c: AudioContext) {
  if (!bgmOn || !bgmGain) return;
  const m = MOODS[mood]; const ch = m.prog[progIdx % m.prog.length]; progIdx++;
  const dur = m.dur; const t0 = c.currentTime + 0.05;
  for (const f of ch.triad) { pad(c, f, t0, dur, 0.045, "sine", -3); pad(c, f, t0, dur, 0.045, "sine", 3); }
  pad(c, ch.bass, t0, dur, 0.06, "triangle", 0);                 // 저음 루트
  // 타이틀 테마만 한 옥타브 위 패드를 얹어 더 밝고 웅장하게 → 인게임(따뜻한 패드)과 또렷이 구분.
  if (mood === "title") { for (const f of ch.triad) pad(c, f * 2, t0, dur, 0.02, "sine", 4); pad(c, ch.bass / 2, t0, dur, 0.04, "sine", 0); }
  bgmTimer = window.setTimeout(() => scheduleChord(c), dur * 1000 - 250); // 살짝 겹쳐 끊김 없이
}
export function startBgm() {
  if (muted || bgmOn) return;
  let c: AudioContext; try { c = ac(); } catch { return; }
  if (c.state === "suspended") c.resume();
  bgmGain = c.createGain(); bgmGain.gain.setValueAtTime(0.0001, c.currentTime);
  bgmGain.gain.linearRampToValueAtTime(0.5, c.currentTime + 2); // 페이드 인
  bgmGain.connect(c.destination);
  bgmOn = true; progIdx = 0; scheduleChord(c);
}
export function stopBgm() {
  bgmOn = false;
  if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = undefined; }
  if (bgmGain) {
    const g = bgmGain; bgmGain = null;
    try { const now = ac().currentTime; g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0.0001, now, 0.4); } catch { /* noop */ }
    window.setTimeout(() => { try { g.disconnect(); } catch { /* noop */ } }, 1600);
  }
}
