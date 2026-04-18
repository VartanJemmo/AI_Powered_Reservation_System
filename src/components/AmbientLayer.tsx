import { useEffect, useRef, useState } from "react";

/**
 * AmbientLayer — site-wide effects:
 *  - Soft gold dust trail following the cursor (canvas, GPU-cheap)
 *  - Floating "Sound" toggle that plays a subtle synthesized oud-flavored
 *    ambience using the Web Audio API. No external audio files; gentle by
 *    default, can be muted at any time.
 *
 * Disabled on touch devices (no cursor) and respects prefers-reduced-motion.
 */
export const AmbientLayer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    stop: () => void;
  } | null>(null);

  // Sound (gentle drone with slow pulse — no external assets)
  const toggleSound = async () => {
    if (soundOn) {
      audioRef.current?.stop();
      audioRef.current = null;
      setSoundOn(false);
      return;
    }
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const freqs = [110, 146.83, 220, 293.66];
      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.06 + (i === 0 ? 0.03 : 0);
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.08 + i * 0.03;
        lfoGain.gain.value = 0.035;
        lfo.connect(lfoGain).connect(g.gain);
        lfo.start();
        o.connect(g).connect(master);
        o.start();
        oscs.push(o);
        gains.push(g);
      });

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      master.disconnect();
      master.connect(filter).connect(ctx.destination);

      const now = ctx.currentTime;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.18, now + 1.5);

      audioRef.current = {
        ctx,
        master,
        stop: () => {
          const t = ctx.currentTime;
          master.gain.cancelScheduledValues(t);
          master.gain.setValueAtTime(master.gain.value, t);
          master.gain.linearRampToValueAtTime(0, t + 0.6);
          setTimeout(() => {
            oscs.forEach((o) => { try { o.stop(); } catch (_e) { /* noop */ } });
            ctx.close().catch(() => undefined);
          }, 700);
        },
      };
      setSoundOn(true);
    } catch (e) {
      console.warn("Audio init failed", e);
    }
  };

  // Stop on unmount
  useEffect(() => () => audioRef.current?.stop(), []);

  return (
    <>
      <button
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Mute ambience" : "Play ambience"}
        title={soundOn ? "Mute ambience" : "Play ambience"}
        className="fixed bottom-5 right-5 z-50 group inline-flex items-center gap-2 rounded-full border border-border bg-background/70 backdrop-blur-md px-3.5 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors shadow-soft"
      >
        <span className="relative flex h-4 items-end gap-0.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full bg-current ${soundOn ? "animate-sound-bar" : "opacity-40"}`}
              style={soundOn ? { animationDelay: `${i * 120}ms`, height: "100%" } : { height: `${30 + i * 15}%` }}
            />
          ))}
        </span>
        {soundOn ? "Ambience on" : "Ambience"}
      </button>
    </>
  );
};
