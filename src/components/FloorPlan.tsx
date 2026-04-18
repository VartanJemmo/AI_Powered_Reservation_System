import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import {
  ALL_TIMES,
  formatDateLong,
  getBookedTables,
  refreshReservations,
  subscribeReservations,
  todayISO,
} from "@/lib/reservations";
import { toast } from "sonner";

const GOLD = "#c9a84c";
const GOLD_GLOW = "#f0d78c";
const WOOD = "#3a2a1f";
const WOOD_DARK = "#2a1d15";
const CREAM = "#e8dcc4";
const FLOOR = "#1a120c";
const RED = "#a8392e";
const GREEN = "#3a8f5e";

type TableData = {
  id: string;
  type: "round" | "rect" | "bar";
  position: [number, number, number];
  seats: number;
  rotation?: number;
};

const TABLES: TableData[] = [
  // Round tables — main dining
  { id: "R1", type: "round", position: [-5, 0, -3], seats: 4 },
  { id: "R2", type: "round", position: [-5, 0, 1], seats: 4 },
  { id: "R3", type: "round", position: [-5, 0, 5], seats: 2 },
  { id: "R4", type: "round", position: [-1.5, 0, -3], seats: 6 },
  { id: "R5", type: "round", position: [-1.5, 0, 5], seats: 4 },
  // Rectangular tables — banquet row
  { id: "T1", type: "rect", position: [2.5, 0, -3], seats: 6 },
  { id: "T2", type: "rect", position: [2.5, 0, 0], seats: 6 },
  { id: "T3", type: "rect", position: [2.5, 0, 3], seats: 8 },
  // Bar high tables
  { id: "B1", type: "bar", position: [6.5, 0, -3], seats: 2 },
  { id: "B2", type: "bar", position: [6.5, 0, -1], seats: 2 },
  { id: "B3", type: "bar", position: [6.5, 0, 1], seats: 2 },
  { id: "B4", type: "bar", position: [6.5, 0, 3], seats: 2 },
];

const Chair = ({ position, rotation = 0, high = false }: { position: [number, number, number]; rotation?: number; high?: boolean }) => {
  const seatY = high ? 0.85 : 0.45;
  const backH = high ? 0.5 : 0.6;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, seatY, 0]} castShadow>
        <boxGeometry args={[0.4, 0.06, 0.4]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, seatY + backH / 2, -0.18]} castShadow>
        <boxGeometry args={[0.4, backH, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      {[-0.16, 0.16].map((x) =>
        [-0.16, 0.16].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, seatY / 2, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, seatY, 8]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
};

const Candle = ({ position }: { position: [number, number, number] }) => {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (flameRef.current) {
      const t = state.clock.elapsedTime;
      flameRef.current.scale.y = 1 + Math.sin(t * 8) * 0.08;
      flameRef.current.scale.x = 1 + Math.cos(t * 6) * 0.05;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
        <meshStandardMaterial color={CREAM} emissive={GOLD_GLOW} emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={GOLD_GLOW} />
      </mesh>
      <pointLight position={[0, 0.22, 0]} color={GOLD_GLOW} intensity={0.6} distance={1.8} decay={2} />
    </group>
  );
};

const Table = ({
  data,
  hovered,
  selected,
  booked,
  onHover,
  onClick,
}: {
  data: TableData;
  hovered: boolean;
  selected: boolean;
  booked: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) => {
  const { type, position, seats, id } = data;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const targetY = (hovered || selected) && !booked ? 0.1 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.12);
    }
  });

  // Status ring color
  const statusColor = booked ? RED : selected ? GOLD : GREEN;
  const ringEmissive = booked ? RED : selected ? GOLD_GLOW : GREEN;
  const topColor = booked ? "#3a1f1a" : selected ? "#5a4220" : WOOD;

  const renderTop = () => {
    if (type === "round") {
      return (
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.65, 0.65, 0.06, 32]} />
          <meshStandardMaterial color={topColor} roughness={0.4} metalness={0.1} />
        </mesh>
      );
    }
    if (type === "rect") {
      return (
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[1, 0.06, 1.8]} />
          <meshStandardMaterial color={topColor} roughness={0.4} metalness={0.1} />
        </mesh>
      );
    }
    return (
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.05, 24]} />
        <meshStandardMaterial color={topColor} roughness={0.3} metalness={0.2} />
      </mesh>
    );
  };

  const renderLeg = () => {
    if (type === "round" || type === "bar") {
      const h = type === "bar" ? 1.1 : 0.74;
      return (
        <>
          <mesh position={[0, h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, h, 12]} />
            <meshStandardMaterial color={WOOD_DARK} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[type === "bar" ? 0.3 : 0.35, type === "bar" ? 0.3 : 0.35, 0.04, 16]} />
            <meshStandardMaterial color={WOOD_DARK} metalness={0.6} roughness={0.4} />
          </mesh>
        </>
      );
    }
    return [-0.4, 0.4].map((x) =>
      [-0.8, 0.8].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.37, z]} castShadow>
          <boxGeometry args={[0.06, 0.74, 0.06]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.5} />
        </mesh>
      ))
    );
  };

  const renderChairs = () => {
    if (type === "round") {
      return Array.from({ length: seats }).map((_, i) => {
        const angle = (i / seats) * Math.PI * 2;
        const r = 1.05;
        return (
          <Chair
            key={i}
            position={[Math.sin(angle) * r, 0, Math.cos(angle) * r]}
            rotation={angle + Math.PI}
          />
        );
      });
    }
    if (type === "rect") {
      const chairs: JSX.Element[] = [];
      const perSide = seats / 2;
      for (let i = 0; i < perSide; i++) {
        const z = -0.6 + (i * 1.2) / Math.max(perSide - 1, 1);
        chairs.push(<Chair key={`l-${i}`} position={[-0.85, 0, z]} rotation={Math.PI / 2} />);
        chairs.push(<Chair key={`r-${i}`} position={[0.85, 0, z]} rotation={-Math.PI / 2} />);
      }
      return chairs;
    }
    return [
      <Chair key="b1" position={[-0.7, 0, 0]} rotation={Math.PI / 2} high />,
      <Chair key="b2" position={[0.7, 0, 0]} rotation={-Math.PI / 2} high />,
    ];
  };

  // Status disc on the floor under the table
  const discRadius = type === "rect" ? 1.2 : 0.85;
  const discY = 0.015;

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(id); document.body.style.cursor = booked ? "not-allowed" : "pointer"; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = "default"; }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
      {/* Floor disc — green available, red booked, gold selected */}
      <mesh position={[0, discY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {type === "rect" ? (
          <planeGeometry args={[1.6, 2.4]} />
        ) : (
          <circleGeometry args={[discRadius, 32]} />
        )}
        <meshStandardMaterial
          color={statusColor}
          emissive={ringEmissive}
          emissiveIntensity={selected ? 0.6 : hovered ? 0.4 : 0.25}
          transparent
          opacity={selected ? 0.55 : 0.32}
        />
      </mesh>

      {renderTop()}
      {renderLeg()}
      {renderChairs()}
      {(type === "round" || type === "rect") && !booked && <Candle position={[0, 0.77, 0]} />}
      {type === "rect" && !booked && <Candle position={[0, 0.77, -0.5]} />}
      {type === "rect" && !booked && <Candle position={[0, 0.77, 0.5]} />}

      {(hovered || selected) && (
        <Html position={[0, type === "bar" ? 1.6 : 1.4, 0]} center distanceFactor={10}>
          <div className={`pointer-events-none rounded-md border backdrop-blur px-3 py-1.5 text-xs whitespace-nowrap ${
            booked ? "border-destructive/60 bg-background/90" : selected ? "border-primary bg-primary/20" : "border-primary/60 bg-background/90"
          }`}>
            <div className="font-display text-primary text-sm">Table {id}</div>
            <div className="text-muted-foreground uppercase tracking-widest text-[10px]">
              {type === "bar" ? "Bar high" : type === "round" ? "Round" : "Banquet"} · {seats} seats
            </div>
            <div className={`uppercase tracking-widest text-[10px] mt-0.5 ${booked ? "text-destructive" : selected ? "text-primary" : "text-emerald-400"}`}>
              {booked ? "Booked" : selected ? "Selected" : "Available"}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const Floor = () => (
  <>
    {/* Main floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 16]} />
      <meshStandardMaterial color={FLOOR} roughness={0.85} />
    </mesh>
    {/* Persian rug under round tables */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.005, 1]}>
      <planeGeometry args={[5.5, 11]} />
      <meshStandardMaterial color="#5a2a1f" roughness={0.9} />
    </mesh>
    {/* Bar floor accent */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.5, 0.005, 0]}>
      <planeGeometry args={[3, 11]} />
      <meshStandardMaterial color="#1f1610" roughness={0.7} metalness={0.2} />
    </mesh>
  </>
);

const Walls = () => (
  <>
    {/* Back wall */}
    <mesh position={[0, 2, -7.9]} receiveShadow>
      <boxGeometry args={[20, 4, 0.2]} />
      <meshStandardMaterial color="#1a130d" roughness={0.9} />
    </mesh>
    {/* Side walls */}
    <mesh position={[-9.9, 2, 0]} receiveShadow>
      <boxGeometry args={[0.2, 4, 16]} />
      <meshStandardMaterial color="#1a130d" roughness={0.9} />
    </mesh>
    <mesh position={[9.9, 2, 0]} receiveShadow>
      <boxGeometry args={[0.2, 4, 16]} />
      <meshStandardMaterial color="#1a130d" roughness={0.9} />
    </mesh>
    {/* Bar counter */}
    <group position={[8.3, 0, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.1, 10]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[0.9, 0.05, 10]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Back-bar shelves with bottles */}
      <mesh position={[0.7, 1.6, 0]}>
        <boxGeometry args={[0.05, 1.6, 9]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.5} />
      </mesh>
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} position={[0.85, 1.4 + (i % 2) * 0.7, -4 + (i * 0.5)]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.35, 8]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#7a3a2a" : i % 3 === 1 ? "#2a4a3a" : GOLD}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      ))}
    </group>
    {/* Decorative arches on back wall */}
    {[-6, -2, 2, 6].map((x) => (
      <mesh key={x} position={[x, 1.8, -7.78]}>
        <boxGeometry args={[1.4, 2.4, 0.05]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} emissive={GOLD} emissiveIntensity={0.05} />
      </mesh>
    ))}
  </>
);

const Chandelier = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <mesh>
      <torusGeometry args={[0.5, 0.04, 8, 24]} />
      <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.2} />
    </mesh>
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.sin(a) * 0.5, -0.1, Math.cos(a) * 0.5]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={GOLD_GLOW} />
        </mesh>
      );
    })}
    <pointLight color={GOLD_GLOW} intensity={1.2} distance={8} decay={2} />
  </group>
);

type SceneProps = {
  hovered: string | null;
  selected: string | null;
  bookedSet: Set<string>;
  setHovered: (id: string | null) => void;
  onPick: (id: string) => void;
};

const Scene = ({ hovered, selected, bookedSet, setHovered, onPick }: SceneProps) => (
  <>
    <ambientLight intensity={0.15} color={GOLD_GLOW} />
    <directionalLight position={[5, 8, 5]} intensity={0.3} color={GOLD_GLOW} castShadow />

    <Chandelier position={[-3, 3.2, 0]} />
    <Chandelier position={[3, 3.2, 0]} />

    <Floor />
    <Walls />

    {TABLES.map((t) => (
      <Table
        key={t.id}
        data={t}
        hovered={hovered === t.id}
        selected={selected === t.id}
        booked={bookedSet.has(t.id)}
        onHover={setHovered}
        onClick={onPick}
      />
    ))}

    <ContactShadows position={[0, 0.01, 0]} opacity={0.6} scale={20} blur={2} far={4} />
    <Environment preset="night" />
  </>
);

function buildDateOptions(days = 14) {
  const out: { iso: string; weekday: string; day: number; month: string }[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    out.push({
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return out;
}

export const FloorPlan = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("19:30");
  const [tick, setTick] = useState(0);

  const dates = useMemo(() => buildDateOptions(14), []);

  // Refresh + subscribe to live reservation changes
  useEffect(() => {
    refreshReservations();
    const unsub = subscribeReservations(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  const bookedSet = useMemo(() => getBookedTables(date, time), [date, time, tick]);
  const selectedTable = TABLES.find((t) => t.id === selected) ?? null;
  const availableCount = TABLES.length - bookedSet.size;

  // Clear selection if it becomes unavailable
  useEffect(() => {
    if (selected && bookedSet.has(selected)) setSelected(null);
  }, [bookedSet, selected]);

  const handlePick = (id: string) => {
    if (bookedSet.has(id)) {
      toast.error(`Table ${id} is booked at ${time}. Try another time or table.`);
      return;
    }
    setSelected(id);
  };

  const reserveSelected = () => {
    if (!selectedTable) {
      toast.info("Pick an available table first");
      return;
    }
    sessionStorage.setItem(
      "mayrig.preselected-table",
      JSON.stringify({ tableId: selectedTable.id, seats: selectedTable.seats, date, time }),
    );
    toast.success(`Table ${selectedTable.id} held — complete your booking`);
    document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="floorplan" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <div className="container-narrow">
        <div className="max-w-2xl">
          <span className="eyebrow"><span className="gold-divider" /> Floor plan</span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Choose your corner</h2>
          <p className="mt-4 text-muted-foreground">
            Pick a date and time, then tap a table on the 3D plan. Green tables are free, red are taken. Your selection holds for the booking step.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary/90">Maximum capacity</div>
            <div className="font-display text-3xl sm:text-4xl text-foreground">140 guests</div>
          </div>
          <div className="flex-1 min-w-[200px] grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="font-display text-xl text-primary">80</div>
              <div className="text-muted-foreground uppercase tracking-widest text-[10px] mt-0.5">Round</div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl text-primary">44</div>
              <div className="text-muted-foreground uppercase tracking-widest text-[10px] mt-0.5">Banquet</div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl text-primary">16</div>
              <div className="text-muted-foreground uppercase tracking-widest text-[10px] mt-0.5">Bar</div>
            </div>
          </div>
        </div>

        {/* Date + time picker */}
        <div className="mt-6 rounded-xl border border-border bg-surface/40 p-4 sm:p-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary/90">Check availability</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-emerald-400">{availableCount}</span> of {TABLES.length} tables free · {formatDateLong(date)} · {time}
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {dates.map((d, i) => {
              const active = d.iso === date;
              return (
                <button
                  key={d.iso}
                  onClick={() => setDate(d.iso)}
                  className={`shrink-0 w-14 sm:w-16 rounded-lg border px-2 py-2 text-center transition-all ${
                    active
                      ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                      : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-widest opacity-80">{d.weekday}</div>
                  <div className="text-base font-display">{d.day}</div>
                  <div className="text-[9px] uppercase tracking-widest opacity-80">{d.month}</div>
                  {i === 0 && (
                    <div className={`mt-0.5 text-[8px] uppercase tracking-widest ${active ? "" : "text-primary"}`}>Today</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-5 sm:grid-cols-9 gap-2">
            {ALL_TIMES.map((t) => {
              const active = time === t;
              return (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`h-10 rounded-lg border text-xs transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: GREEN }} />
              <span className="uppercase tracking-widest text-emerald-400">Available</span>
            </div>
            <p className="mt-2 text-muted-foreground">Tap a table to select it</p>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="uppercase tracking-widest text-primary/90">Selected</span>
            </div>
            <p className="mt-2 text-muted-foreground">{selectedTable ? `Table ${selectedTable.id} · ${selectedTable.seats} seats` : "Nothing selected yet"}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: RED }} />
              <span className="uppercase tracking-widest text-destructive/90">Booked</span>
            </div>
            <p className="mt-2 text-muted-foreground">Try another time slot</p>
          </div>
        </div>

        <div className="mt-6 relative rounded-2xl overflow-hidden border border-border shadow-elev bg-gradient-to-b from-surface to-background">
          <div className="aspect-[16/10] w-full">
            <Canvas shadows camera={{ position: [9, 9, 12], fov: 45 }}>
              <Suspense fallback={null}>
                <Scene
                  hovered={hovered}
                  selected={selected}
                  bookedSet={bookedSet}
                  setHovered={setHovered}
                  onPick={handlePick}
                />
                <OrbitControls
                  enablePan={false}
                  minDistance={8}
                  maxDistance={22}
                  maxPolarAngle={Math.PI / 2.2}
                  minPolarAngle={Math.PI / 6}
                />
              </Suspense>
            </Canvas>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none gap-3 flex-wrap">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/60 backdrop-blur px-2 py-1 rounded">
              Drag · Scroll · Click table
            </div>
            <button
              onClick={reserveSelected}
              disabled={!selectedTable}
              className={`pointer-events-auto rounded-full border px-5 py-2 text-xs uppercase tracking-widest backdrop-blur transition-colors ${
                selectedTable
                  ? "border-primary bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
                  : "border-border bg-background/60 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {selectedTable ? `Reserve Table ${selectedTable.id}` : "Pick a table"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
