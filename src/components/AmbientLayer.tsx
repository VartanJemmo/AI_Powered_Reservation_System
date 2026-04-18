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

  // Cursor dust
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (reduce || isTouch) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number };
    const particles: Particle[] = [];
    let mouseX = -1000;
    let mouseY = -1000;
    let lastEmit = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const now = performance.now();
      if (now - lastEmit < 18) return; // throttle
      lastEmit = now;
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: mouseX + (Math.random() - 0.5) * 6,
          y: mouseY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.5,
          life: 0,
          max: 60 + Math.random() * 40,
          size: 1 + Math.random() * 2.2,
        });
      }
      if (particles.length > 220) particles.splice(0, particles.length - 220);
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.005;
        const t = p.life / p.max;
        if (t >= 1) { particles.splice(i, 1); continue; }
        const alpha = (1 - t) * 0.55;
        const r = p.size * (1 + t * 1.4);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        g.addColorStop(0, `rgba(240, 215, 140, ${alpha})`);
        g.addColorStop(0.4, `rgba(201, 168, 76, ${alpha * 0.5})`);
        g.addColorStop(1, "rgba(201, 168, 76, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

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

      // A gentle drone built from low oscillators — evokes oud / room ambience
      const freqs = [110, 146.83, 220, 293.66]; // A2, D3, A3, D4
      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.06 + (i === 0 ? 0.03 : 0);
        // slow LFO on amplitude for a breathing feel
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

      // Soft low-pass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      master.disconnect();
      master.connect(filter).connect(ctx.destination);

      // Fade in
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
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] mix-blend-screen"
      />
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
