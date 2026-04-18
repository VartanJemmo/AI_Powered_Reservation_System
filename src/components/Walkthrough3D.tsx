import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * Walkthrough3D — immersive first-person stroll through Mayrig.
 * WASD / arrows to walk, mouse to look, Shift to glide faster.
 * Touch joystick on mobile.
 */

const ROOM = { w: 36, d: 28, h: 5 };

// ---------- Player controller ----------
const Player = ({ touchDir }: { touchDir: React.MutableRefObject<{ x: number; y: number }> }) => {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 1.65, ROOM.d / 2 - 1.5);
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const k = keys.current;
    const speed = (k["ShiftLeft"] || k["ShiftRight"] ? 6 : 3) * delta;
    const fwd = (k["KeyW"] || k["ArrowUp"] ? 1 : 0) - (k["KeyS"] || k["ArrowDown"] ? 1 : 0);
    const str = (k["KeyD"] || k["ArrowRight"] ? 1 : 0) - (k["KeyA"] || k["ArrowLeft"] ? 1 : 0);

    // Touch joystick
    const tFwd = -touchDir.current.y;
    const tStr = touchDir.current.x;

    direction.current.set(str + tStr, 0, -(fwd + tFwd));
    if (direction.current.lengthSq() > 0) direction.current.normalize();

    // Move relative to camera yaw
    const yaw = new THREE.Euler(0, camera.rotation.y, 0, "YXZ");
    direction.current.applyEuler(yaw);

    velocity.current.lerp(direction.current.multiplyScalar(speed), 0.25);
    camera.position.add(velocity.current);

    // Soft head bob while walking
    const moving = velocity.current.lengthSq() > 0.0001;
    if (moving) {
      camera.position.y = 1.65 + Math.sin(performance.now() * 0.008) * 0.04;
    } else {
      camera.position.y += (1.65 - camera.position.y) * 0.1;
    }

    // Collide with walls (simple clamp)
    const m = 0.6;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ROOM.w / 2 + m, ROOM.w / 2 - m);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ROOM.d / 2 + m, ROOM.d / 2 - m);
  });

  return null;
};

// ---------- Scene props ----------
const Floor = () => (
  <mesh rotation-x={-Math.PI / 2} receiveShadow>
    <planeGeometry args={[ROOM.w, ROOM.d]} />
    <meshStandardMaterial color="#1a0f08" roughness={0.85} metalness={0.05} />
  </mesh>
);

const Ceiling = () => (
  <mesh position={[0, ROOM.h, 0]} rotation-x={Math.PI / 2}>
    <planeGeometry args={[ROOM.w, ROOM.d]} />
    <meshStandardMaterial color="#0a0604" roughness={1} />
  </mesh>
);

const Walls = () => {
  const wallMat = <meshStandardMaterial color="#2b1a10" roughness={0.9} />;
  return (
    <group>
      <mesh position={[0, ROOM.h / 2, -ROOM.d / 2]}>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        {wallMat}
      </mesh>
      <mesh position={[0, ROOM.h / 2, ROOM.d / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        {wallMat}
      </mesh>
      <mesh position={[-ROOM.w / 2, ROOM.h / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        {wallMat}
      </mesh>
      <mesh position={[ROOM.w / 2, ROOM.h / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        {wallMat}
      </mesh>
      {/* Decorative wall arches (warm panels) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-ROOM.w / 2 + 0.02, 1.8, -10 + i * 5]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[2.4, 3]} />
          <meshStandardMaterial
            color="#3a2114"
            emissive="#c9821f"
            emissiveIntensity={0.12}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

const Candle = ({ position }: { position: [number, number, number] }) => {
  const lightRef = useRef<THREE.PointLight>(null!);
  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.9 + Math.sin(performance.now() * 0.012) * 0.25 + Math.random() * 0.08;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.16, 16]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#ffb84a" emissive="#ffae3a" emissiveIntensity={3} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0.25, 0]}
        color="#ffb066"
        intensity={1}
        distance={5.5}
        decay={2}
        castShadow={false}
      />
    </group>
  );
};

const Table = ({
  position,
  rotation = 0,
  shape = "round",
  id,
  seats: seatCount,
  onSelect,
}: {
  position: [number, number, number];
  rotation?: number;
  shape?: "round" | "rect";
  id: string;
  seats: number;
  onSelect: (t: { id: string; seats: number }) => void;
}) => {
  const seats = seatCount;
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = hovered
        ? 0.85
        : 0.35 + Math.sin(performance.now() * 0.004) * 0.15;
    }
  });

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect({ id, seats });
      }}
    >
      {/* Glowing reserve ring on the floor */}
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.35, 1.55, 48]} />
        <meshBasicMaterial color="#c9821f" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Tablecloth */}
      {shape === "round" ? (
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 0.85, 0.05, 32]} />
          <meshStandardMaterial
            color={hovered ? "#fff5dc" : "#f3ead7"}
            emissive={hovered ? "#c9821f" : "#000000"}
            emissiveIntensity={hovered ? 0.25 : 0}
            roughness={0.85}
          />
        </mesh>
      ) : (
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.05, 1.1]} />
          <meshStandardMaterial
            color={hovered ? "#fff5dc" : "#f3ead7"}
            emissive={hovered ? "#c9821f" : "#000000"}
            emissiveIntensity={hovered ? 0.25 : 0}
            roughness={0.85}
          />
        </mesh>
      )}
      {/* Pedestal */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 12]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Candle on top */}
      <Candle position={[0, 0.78, 0]} />
      {/* Floating label */}
      <Html position={[0, 1.6, 0]} center distanceFactor={8} occlude={false}>
        <div
          className={`pointer-events-none select-none whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest font-display transition-all ${
            hovered
              ? "bg-primary text-primary-foreground border-primary shadow-gold scale-110"
              : "bg-background/80 text-primary border-primary/40 backdrop-blur"
          }`}
        >
          {id} · {seats}p · {hovered ? "Reserve →" : "Tap to reserve"}
        </div>
      </Html>
      {/* Wine glass */}
      <mesh position={[shape === "round" ? 0.35 : 0.7, 0.88, 0.2]}>
        <coneGeometry args={[0.06, 0.18, 12, 1, true]} />
        <meshPhysicalMaterial
          color="#5a1a1a"
          transparent
          opacity={0.55}
          roughness={0.05}
          transmission={0.7}
        />
      </mesh>
      {/* Chairs */}
      {Array.from({ length: seats }).map((_, i) => {
        const a = (i / seats) * Math.PI * 2;
        const r = shape === "round" ? 1.25 : 1.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, 0.45, Math.sin(a) * (shape === "round" ? r : 0.85)]}
            castShadow
          >
            <boxGeometry args={[0.45, 0.9, 0.45]} />
            <meshStandardMaterial color="#3a2010" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

const Chandelier = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.05;
  });
  return (
    <group position={position}>
      <mesh position={[0, ROOM.h - 0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial color="#1a0f08" />
      </mesh>
      <group ref={ref} position={[0, ROOM.h - 0.7, 0]}>
        <mesh>
          <torusGeometry args={[0.7, 0.04, 8, 32]} />
          <meshStandardMaterial color="#c9821f" emissive="#c9821f" emissiveIntensity={0.3} metalness={0.8} roughness={0.3} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7]}>
              <mesh>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#ffd089" emissive="#ffb84a" emissiveIntensity={2.2} />
              </mesh>
            </group>
          );
        })}
        <pointLight color="#ffb066" intensity={2.2} distance={14} decay={2} />
      </group>
    </group>
  );
};

const Bar = () => (
  <group position={[ROOM.w / 2 - 2.5, 0, 0]}>
    {/* Counter */}
    <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.4, 1.1, 12]} />
      <meshStandardMaterial color="#2a160a" roughness={0.4} metalness={0.4} />
    </mesh>
    {/* Top */}
    <mesh position={[0, 1.15, 0]} castShadow>
      <boxGeometry args={[1.5, 0.06, 12]} />
      <meshStandardMaterial color="#0d0704" roughness={0.2} metalness={0.6} />
    </mesh>
    {/* Bottle shelf back */}
    <mesh position={[0.6, 1.8, 0]}>
      <boxGeometry args={[0.05, 1.6, 11]} />
      <meshStandardMaterial color="#1a0f08" emissive="#c9821f" emissiveIntensity={0.2} />
    </mesh>
    {/* Bottles */}
    {Array.from({ length: 18 }).map((_, i) => {
      const z = -5.2 + i * 0.6;
      const h = 0.4 + (i % 3) * 0.1;
      return (
        <mesh key={i} position={[0.45, 1.3 + h / 2, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, h, 12]} />
          <meshPhysicalMaterial
            color={i % 2 ? "#5a1a1a" : "#3a2010"}
            transmission={0.4}
            roughness={0.15}
          />
        </mesh>
      );
    })}
    {/* Bar stools */}
    {Array.from({ length: 5 }).map((_, i) => (
      <group key={i} position={[-1.4, 0, -4 + i * 2]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
          <meshStandardMaterial color="#5a1a1a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshStandardMaterial color="#1a0f08" />
        </mesh>
      </group>
    ))}
    <pointLight position={[0, 2.5, 0]} color="#ffae3a" intensity={1.4} distance={9} />
  </group>
);

const Rugs = () => (
  <>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[10, 6]} />
      <meshStandardMaterial color="#5a1a1a" roughness={0.95} />
    </mesh>
    <mesh rotation-x={-Math.PI / 2} position={[-10, 0.01, -6]} receiveShadow>
      <planeGeometry args={[6, 4]} />
      <meshStandardMaterial color="#3a2114" roughness={0.95} />
    </mesh>
  </>
);

const RestaurantScene = () => {
  const tables = useMemo(
    () =>
      [
        { p: [-8, 0, -8] as [number, number, number], s: "round" as const },
        { p: [-8, 0, 0] as [number, number, number], s: "round" as const },
        { p: [-8, 0, 8] as [number, number, number], s: "round" as const },
        { p: [0, 0, -8] as [number, number, number], s: "round" as const },
        { p: [0, 0, 0] as [number, number, number], s: "round" as const },
        { p: [0, 0, 8] as [number, number, number], s: "round" as const },
        { p: [-13, 0, -10] as [number, number, number], s: "rect" as const },
        { p: [-13, 0, 10] as [number, number, number], s: "rect" as const },
      ],
    [],
  );

  return (
    <>
      <fog attach="fog" args={["#0a0604", 6, 30]} />
      <ambientLight intensity={0.18} color="#ffb066" />
      <hemisphereLight args={["#3a2114", "#0a0604", 0.25]} />
      <Floor />
      <Ceiling />
      <Walls />
      <Rugs />
      <Bar />
      {tables.map((t, i) => (
        <Table key={i} position={t.p} shape={t.s} rotation={(i * Math.PI) / 5} />
      ))}
      <Chandelier position={[-4, 0, -4]} />
      <Chandelier position={[-4, 0, 4]} />
      <Chandelier position={[4, 0, 0]} />
    </>
  );
};

// ---------- HUD / controls ----------
const Crosshair = () => (
  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
    <div className="h-1.5 w-1.5 rounded-full bg-primary/80 shadow-[0_0_8px_hsl(var(--primary))]" />
  </div>
);

const Joystick = ({ dirRef }: { dirRef: React.MutableRefObject<{ x: number; y: number }> }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);

  const onStart = (e: React.PointerEvent) => {
    active.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!active.current || !baseRef.current) return;
    const r = baseRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const max = r.width / 2;
    const dist = Math.min(Math.hypot(dx, dy), max);
    const a = Math.atan2(dy, dx);
    const x = Math.cos(a) * dist;
    const y = Math.sin(a) * dist;
    setKnob({ x, y });
    dirRef.current = { x: x / max, y: y / max };
  };
  const onEnd = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    dirRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={onStart}
      onPointerMove={onMove}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      className="absolute bottom-6 left-6 h-28 w-28 rounded-full border border-primary/40 bg-background/40 backdrop-blur-md md:hidden touch-none z-10"
      aria-label="Walk joystick"
    >
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70 shadow-gold"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
};

// ---------- Main exported component ----------
export const Walkthrough3D = () => {
  const [locked, setLocked] = useState(false);
  const touchDir = useRef({ x: 0, y: 0 });
  const controlsRef = useRef<any>(null);

  return (
    <section
      id="walkthrough"
      aria-label="3D restaurant walkthrough"
      className="relative py-20 sm:py-28 bg-gradient-to-b from-background via-surface/40 to-background"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <span className="eyebrow"><span className="gold-divider" /> Step inside</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Walk through Mayrig</h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            Drift between candlelit tables, glide past the bar, and feel the warmth of the room before you arrive.
          </p>
        </div>

        <div className="mt-8 relative w-full h-[70vh] min-h-[480px] max-h-[860px] rounded-2xl overflow-hidden border border-border shadow-elev bg-black">
          <Canvas shadows camera={{ fov: 70, near: 0.1, far: 100 }} dpr={[1, 1.5]}>
            <Suspense fallback={<Html center><span className="text-primary text-xs">Lighting candles…</span></Html>}>
              <RestaurantScene />
              <Player touchDir={touchDir} />
              <PointerLockControls
                ref={controlsRef}
                onLock={() => setLocked(true)}
                onUnlock={() => setLocked(false)}
              />
            </Suspense>
          </Canvas>

          {locked && <Crosshair />}
          <Joystick dirRef={touchDir} />

          {!locked && (
            <button
              onClick={() => controlsRef.current?.lock?.()}
              className="absolute inset-0 z-20 grid place-items-center bg-background/70 backdrop-blur-sm hidden md:grid"
              aria-label="Enter walkthrough"
            >
              <div className="text-center px-6">
                <div className="font-display text-2xl sm:text-3xl gold-text">Enter the room</div>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Click to look around · <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-xs">W A S D</kbd> to walk · <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-xs">Shift</kbd> to glide · <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-xs">Esc</kbd> to release
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-gold">
                  Begin the stroll
                </span>
              </div>
            </button>
          )}

          {/* Mobile hint */}
          <div className="absolute top-3 right-3 md:hidden text-[10px] uppercase tracking-widest text-primary/80 bg-background/60 backdrop-blur px-2 py-1 rounded-full border border-primary/30 z-10">
            Drag to look · Joystick to walk
          </div>
        </div>
      </div>
    </section>
  );
};

export default Walkthrough3D;
