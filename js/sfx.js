/* ============================================================
   sfx.js - synthesized sound effects, background music and
   Japanese speech. No audio files needed: everything is made
   live with the Web Audio API + the browser's voices.
   ============================================================ */
(function (JP) {
  'use strict';
  const S = function () { return JP.Store.get().settings; };

  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.28; musicBus.connect(master);
      const len = ctx.sampleRate * 0.5;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(f, t, dur, o) {
    o = o || {};
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const peak = o.v || 0.2, a = o.a || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + a + dur + 0.05);
  }
  function noise(t, dur, o) {
    o = o || {};
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.v || 0.15, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
  }
  const semis = function (base, n) { return base * Math.pow(2, n / 12); };

  const FX = {
    tap:   function (t) { tone(760, t, 0.05, { type: 'triangle', v: 0.12 }); },
    pop:   function (t) { tone(420, t, 0.09, { type: 'sine', to: 900, v: 0.18 }); },
    place: function (t) { tone(520, t, 0.04, { type: 'triangle', v: 0.14 }); tone(780, t + 0.03, 0.04, { type: 'triangle', v: 0.08 }); },
    remove: function (t) { tone(520, t, 0.07, { type: 'triangle', to: 300, v: 0.1 }); },
    correct: function (t) {
      [0, 4, 7, 12].forEach(function (n, i) {
        tone(semis(523.25, n), t + i * 0.075, 0.18, { type: 'triangle', v: 0.17 });
        tone(semis(1046.5, n), t + i * 0.075, 0.12, { type: 'sine', v: 0.05 });
      });
    },
    combo: function (t, n) {
      const steps = [0, 2, 4, 7, 9, 12, 14, 16];
      const k = Math.min(steps.length, 3 + (n || 2));
      for (let i = 0; i < k; i++) tone(semis(587.33, steps[i]), t + i * 0.055, 0.14, { type: 'triangle', v: 0.14 });
      tone(semis(587.33, steps[k - 1] + 12), t + k * 0.055, 0.35, { type: 'sine', v: 0.09 });
    },
    wrong: function (t) {
      tone(330, t, 0.16, { type: 'sine', to: 250, v: 0.2 });
      tone(247, t + 0.15, 0.22, { type: 'sine', to: 196, v: 0.2 });
    },
    almost: function (t) { tone(392, t, 0.12, { type: 'triangle', v: 0.16 }); tone(330, t + 0.12, 0.16, { type: 'triangle', v: 0.14 }); },
    flip:  function (t) { noise(t, 0.07, { f: 3000, to: 900, q: 2, v: 0.18 }); },
    match: function (t) { tone(660, t, 0.14, { type: 'triangle', v: 0.17 }); tone(990, t + 0.09, 0.22, { type: 'triangle', v: 0.17 }); tone(1320, t + 0.18, 0.3, { type: 'sine', v: 0.09 }); },
    star:  function (t) { tone(1568, t, 0.25, { type: 'sine', v: 0.14 }); tone(2093, t + 0.07, 0.3, { type: 'sine', v: 0.1 }); },
    whoosh: function (t) { noise(t, 0.28, { f: 400, to: 4000, q: 0.8, v: 0.12 }); },
    sticker: function (t) { tone(880, t, 0.12, { type: 'square', v: 0.07 }); tone(1175, t + 0.08, 0.12, { type: 'square', v: 0.07 }); tone(1760, t + 0.16, 0.3, { type: 'sine', v: 0.12 }); },
    win: function (t) {
      const seq = [0, 4, 7, 12, 7, 12, 16, 19, 24];
      seq.forEach(function (n, i) {
        const d = i < 4 ? 0.11 : 0.13;
        tone(semis(523.25, n), t + i * d, 0.3, { type: 'triangle', v: 0.17 });
        tone(semis(261.63, n), t + i * d, 0.3, { type: 'sine', v: 0.08 });
      });
    },
    levelup: function (t) { [0, 2, 4, 5, 7, 9, 11, 12].forEach(function (n, i) { tone(semis(392, n), t + i * 0.07, 0.2, { type: 'square', v: 0.07 }); }); tone(semis(392, 12), t + 0.6, 0.5, { type: 'triangle', v: 0.14 }); },
    tick:  function (t) { noise(t, 0.03, { f: 5000, q: 3, v: 0.07 }); }
  };

  function play(name, arg) {
    if (!S().sfx) return;
    if (!ensure()) return;
    try { FX[name](ctx.currentTime + 0.01, arg); } catch (e) { /* ignore */ }
  }

  /* ---------- background music (gentle, never the same twice) ---------- */
  const CHORDS = [[0, 4, 7], [9, 0, 4], [5, 9, 0], [7, 11, 2]];          // C  Am  F  G
  const BASS = [130.81, 110.0, 87.31, 98.0];
  const PENT = [0, 2, 4, 7, 9];
  let musicTimer = null, nextTime = 0, step = 0, melodyPos = 5, running = false;

  function musicStep(t) {
    const bar = Math.floor(step / 8) % 4;
    const inBar = step % 8;
    if (inBar === 0 || inBar === 4) tone(BASS[bar], t, 0.45, { type: 'triangle', v: 0.16, bus: musicBus });
    if (inBar % 2 === 0) {
      const ch = CHORDS[bar];
      tone(semis(261.63, ch[(inBar / 2) % 3]) * 2, t, 0.28, { type: 'sine', v: 0.05, bus: musicBus });
    }
    if (Math.random() < 0.55) {
      melodyPos = Math.max(0, Math.min(14, melodyPos + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1)));
      const note = PENT[melodyPos % 5] + 12 * Math.floor(melodyPos / 5);
      tone(semis(523.25, note), t, 0.32, { type: 'triangle', v: 0.075, bus: musicBus });
    }
    if (inBar % 2 === 1) noise(t, 0.03, { f: 7000, q: 2, v: 0.025, bus: musicBus, filter: 'highpass' });
    step++;
  }
  function musicTick() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.35) { musicStep(nextTime); nextTime += 60 / 96 / 2; }
  }
  function startMusic() {
    if (running || !S().music) return;
    if (!ensure()) return;
    running = true; step = 0; nextTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(musicTick, 120);
  }
  function stopMusic() { running = false; if (musicTimer) clearInterval(musicTimer); musicTimer = null; }
  function applyMusicSetting() { if (S().music) startMusic(); else stopMusic(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopMusic(); else if (unlockedOnce) applyMusicSetting(); });

  let unlockedOnce = false;
  function unlock() {
    if (unlockedOnce) return;
    unlockedOnce = true;
    ensure();
    applyMusicSetting();
  }

  /* ---------- speech ---------- */
  let ja = null, forced = false, voicesChecked = false;
  function supported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'; }
  function refreshVoices() {
    if (!supported()) return;
    const list = window.speechSynthesis.getVoices().filter(function (v) { return /^ja/i.test(v.lang) || /japan/i.test(v.name); });
    voicesChecked = true;
    ja = list.find(function (v) { return /kyoko|nanami|haruka|google|o-ren|female/i.test(v.name); }) || list[0] || null;
  }
  if (supported()) {
    refreshVoices();
    if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    else window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
  const Voice = {
    available: function () { return forced || (supported() && !!ja); },
    force: function (v) { forced = v; },
    speak: function (text, o) {
      o = o || {};
      if (!text || !supported() || !S().voice) return;
      if (!ja && !forced) return;   // no Japanese voice: stay silent rather than let an English voice mangle the kana
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ja-JP';
        if (ja) u.voice = ja;
        u.rate = o.rate || S().rate || 0.85;
        u.pitch = 1.08;
        setTimeout(function () { synth.speak(u); }, 40);
      } catch (e) { /* ignore */ }
    },
    stop: function () { try { if (supported()) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  };

  JP.Audio = { play: play, unlock: unlock, applyMusicSetting: applyMusicSetting, ensure: ensure, stopMusic: stopMusic };
  JP.Voice = Voice;
})(globalThis.JP = globalThis.JP || {});
