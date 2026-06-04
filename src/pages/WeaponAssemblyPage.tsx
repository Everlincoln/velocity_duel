import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Page } from "../App";

type Props = {
  setCurrentPage: (page: Page) => void;
};

type StepId = "core" | "barrel" | "rail" | "cell" | "charge" | "ready";

type StepConfig = {
  id: StepId;
  title: string;
  instruction: string;
  comic: string;
  hint: string;
};

const steps: StepConfig[] = [
  {
    id: "core",
    title: "Insert Core",
    instruction: "Drag the glowing core into the center chamber.",
    comic: "CLICK!",
    hint: "Soft snap, blue glow, tiny vibration",
  },
  {
    id: "barrel",
    title: "Slide Barrel",
    instruction: "Swipe the barrel left into the nose to lock it in.",
    comic: "SNAP!",
    hint: "Front section twists and sparks",
  },
  {
    id: "rail",
    title: "Lock Side Rail",
    instruction: "Use two fingers on the lock pad. Desktop fallback: double tap.",
    comic: "CLICK!",
    hint: "Metal lock and quick shake",
  },
  {
    id: "cell",
    title: "Insert Energy Cell",
    instruction: "Push the energy cell upward into the lower chamber.",
    comic: "CHUNK!",
    hint: "Energy starts flowing through the blaster",
  },
  {
    id: "charge",
    title: "Charge Weapon",
    instruction: "Pull the charger down hard to power it up.",
    comic: "K-CHAK!!",
    hint: "Big recoil, flash, strong vibration",
  },
  {
    id: "ready",
    title: "Ready to Fire!!",
    instruction: "Blaster primed. Moving straight into the fire phase...",
    comic: "READY!!",
    hint: "No buttons. The duel launches automatically.",
  },
];

function WeaponAssemblyPage({ setCurrentPage }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [screenShake, setScreenShake] = useState(false);
  const [coreDropped, setCoreDropped] = useState(false);
  const [barrelLocked, setBarrelLocked] = useState(false);
  const [railLocked, setRailLocked] = useState(false);
  const [cellLocked, setCellLocked] = useState(false);
  const [chargeLocked, setChargeLocked] = useState(false);
  const [coreDrag, setCoreDrag] = useState({ x: -180, y: 110 });
  const [barrelDrag, setBarrelDrag] = useState(180);
  const [cellDrag, setCellDrag] = useState(140);
  const [chargeDrag, setChargeDrag] = useState(0);
  const [pressingPointers, setPressingPointers] = useState<number[]>([]);

  const railTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentStep = steps[stepIndex];
  const isReadyState = currentStep.id === "ready";
  const buildStepCount = steps.length - 1;
  const activeBuildStep = useMemo(() => Math.min(stepIndex + 1, buildStepCount), [buildStepCount, stepIndex]);
  const progressPips = useMemo(
    () => Array.from({ length: buildStepCount }, (_, index) => index < activeBuildStep),
    [activeBuildStep, buildStepCount],
  );

  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const playTone = (frequency: number, duration: number, type: OscillatorType) => {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  const playMechanicalCue = (id: StepId) => {
    if (id === "core") {
      playTone(820, 0.08, "square");
      playTone(560, 0.12, "triangle");
    }
    if (id === "barrel") {
      playTone(300, 0.1, "sawtooth");
      playTone(640, 0.15, "square");
    }
    if (id === "rail") {
      playTone(700, 0.08, "triangle");
      playTone(900, 0.05, "square");
    }
    if (id === "cell") {
      playTone(240, 0.14, "square");
      playTone(460, 0.18, "triangle");
    }
    if (id === "charge") {
      playTone(180, 0.18, "sawtooth");
      playTone(120, 0.24, "square");
      playTone(800, 0.1, "triangle");
    }
  };

  const triggerStepSuccess = (id: StepId, nextIndex: number) => {
    const step = steps.find((item) => item.id === id);
    setFeedback(step?.comic ?? "");
    setScreenShake(true);
    playMechanicalCue(id);

    if (id === "core") vibrate(25);
    if (id === "barrel") vibrate([20, 30, 30]);
    if (id === "rail") vibrate(30);
    if (id === "cell") vibrate([45, 40, 45]);
    if (id === "charge") vibrate([80, 40, 90, 40, 120]);

    window.setTimeout(() => setScreenShake(false), 260);
    window.setTimeout(() => setFeedback(""), 780);
    window.setTimeout(() => setStepIndex(nextIndex), 560);
  };

  useEffect(() => {
    if (!isReadyState) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentPage("fire");
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isReadyState, setCurrentPage]);

  useEffect(() => {
    return () => {
      if (railTimerRef.current) {
        window.clearTimeout(railTimerRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  const handleCorePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (currentStep.id !== "core") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    setCoreDrag({ x, y });
  };

  const handleCoreRelease = () => {
    if (currentStep.id !== "core" || coreDropped) {
      return;
    }

    const nearCenter = Math.abs(coreDrag.x) < 58 && Math.abs(coreDrag.y) < 58;
    if (!nearCenter) {
      setCoreDrag({ x: -180, y: 110 });
      return;
    }

    setCoreDropped(true);
    setCoreDrag({ x: 0, y: 0 });
    triggerStepSuccess("core", 1);
  };

  const handleBarrelPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (currentStep.id !== "barrel") {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBarrelPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (currentStep.id !== "barrel" || barrelLocked || (event.buttons === 0 && event.pointerType !== "touch")) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, 1 - (event.clientX - rect.left) / rect.width));
    setBarrelDrag(180 - progress * 180);

    if (progress > 0.82) {
      setBarrelLocked(true);
      setBarrelDrag(0);
      triggerStepSuccess("barrel", 2);
    }
  };

  const handleRailPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (currentStep.id !== "rail" || railLocked) {
      return;
    }

    const nextPointers = Array.from(new Set([...pressingPointers, event.pointerId]));
    setPressingPointers(nextPointers);

    if (nextPointers.length >= 2 && railTimerRef.current === null) {
      railTimerRef.current = window.setTimeout(() => {
        setRailLocked(true);
        setPressingPointers([]);
        railTimerRef.current = null;
        triggerStepSuccess("rail", 3);
      }, 260);
    }
  };

  const clearRailPress = (pointerId?: number) => {
    if (railTimerRef.current) {
      window.clearTimeout(railTimerRef.current);
      railTimerRef.current = null;
    }
    setPressingPointers((current) => current.filter((id) => id !== pointerId));
  };

  const handleRailDoubleClick = () => {
    if (currentStep.id !== "rail" || railLocked) {
      return;
    }

    setRailLocked(true);
    triggerStepSuccess("rail", 3);
  };

  const handleCellPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (currentStep.id !== "cell" || cellLocked || (event.buttons === 0 && event.pointerType !== "touch")) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const raw = 1 - (event.clientY - rect.top) / rect.height;
    const progress = Math.max(0, Math.min(1, raw));
    setCellDrag(140 - progress * 140);

    if (progress > 0.78) {
      setCellLocked(true);
      setCellDrag(0);
      triggerStepSuccess("cell", 4);
    }
  };

  const handleChargePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (currentStep.id !== "charge" || chargeLocked || (event.buttons === 0 && event.pointerType !== "touch")) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const raw = (event.clientY - rect.top) / rect.height;
    const progress = Math.max(0, Math.min(1, raw));
    setChargeDrag(progress * 120);

    if (progress > 0.72) {
      setChargeLocked(true);
      setChargeDrag(120);
      triggerStepSuccess("charge", 5);
    }
  };

  return (
    <main className={`screen assembly-screen ${screenShake ? "assembly-screen-shake" : ""}`}>
      <section className="assembly-shell">
        <article className="assembly-stage">
          <div className="assembly-topline">
            <div className="assembly-step-header">
              <span className="assembly-step-coin">{isReadyState ? "6" : activeBuildStep}</span>
              <div className="assembly-step-copy">
                <h1 className="assembly-title">{currentStep.title}</h1>
                <p className="assembly-instruction">{currentStep.instruction}</p>
              </div>
            </div>

            <div className="assembly-pips" aria-label={`Progress ${activeBuildStep} of ${buildStepCount}`}>
              {progressPips.map((isActive, index) => (
                <span
                  key={`${currentStep.id}-pip-${index}`}
                  className={`assembly-pip ${isActive ? "assembly-pip-active" : ""}`}
                />
              ))}
            </div>
          </div>

          <div className={`assembly-arena step-${currentStep.id} ${isReadyState ? "assembly-arena-ready" : ""}`}>
            <div className="assembly-tech-frame" aria-hidden="true" />
            <div className="assembly-feedback" aria-live="polite">
              {feedback}
            </div>

            <div className={`toy-blaster ${coreDropped ? "toy-blaster-core-on" : ""} ${barrelLocked ? "toy-blaster-barrel-on" : ""} ${railLocked ? "toy-blaster-rail-on" : ""} ${cellLocked ? "toy-blaster-cell-on" : ""} ${chargeLocked ? "toy-blaster-charged" : ""}`}>
              <div className="blaster-body" />
              <div className="blaster-core-chamber">
                <div className={`blaster-core-slot ${coreDropped ? "blaster-core-slot-lit" : ""}`} />
              </div>
              <div className={`blaster-barrel-shell ${barrelLocked ? "blaster-barrel-shell-locked" : ""}`} />
              <div className={`blaster-rail-shell ${railLocked ? "blaster-rail-shell-locked" : ""}`} />
              <div className={`blaster-cell-shell ${cellLocked ? "blaster-cell-shell-loaded" : ""}`} />
              <div className={`blaster-charge-shell ${chargeLocked ? "blaster-charge-shell-pulled" : ""}`} />
              <div className="blaster-handle" />
              <div className="blaster-glow" />
            </div>

            {currentStep.id === "core" && (
              <div className="gesture-layer" onPointerMove={handleCorePointerMove} onPointerUp={handleCoreRelease}>
                <div className="gesture-target core-target">DROP CORE</div>
                <div
                  className="gesture-piece core-piece"
                  style={{ transform: `translate(${coreDrag.x}px, ${coreDrag.y}px)` }}
                >
                  ENERGY CORE
                </div>
              </div>
            )}

            {currentStep.id === "barrel" && (
              <div className="gesture-layer">
                <div className="gesture-arrow">SWIPE LEFT</div>
                <div className="swipe-track" onPointerDown={handleBarrelPointerDown} onPointerMove={handleBarrelPointerMove}>
                  <div className="swipe-guide" />
                  <div className="barrel-piece" style={{ transform: `translateX(${barrelDrag}px)` }}>
                    BARREL
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === "rail" && (
              <div className="gesture-layer">
                <div className="gesture-arrow">TWO-FINGER PRESS</div>
                <div
                  className={`press-pad ${pressingPointers.length > 0 ? "press-pad-active" : ""}`}
                  onPointerDown={handleRailPointerDown}
                  onPointerUp={(event) => clearRailPress(event.pointerId)}
                  onPointerCancel={(event) => clearRailPress(event.pointerId)}
                  onDoubleClick={handleRailDoubleClick}
                >
                  LOCK PAD
                </div>
              </div>
            )}

            {currentStep.id === "cell" && (
              <div className="gesture-layer">
                <div className="gesture-arrow">PUSH UP</div>
                <div className="vertical-track" onPointerMove={handleCellPointerMove}>
                  <div className="vertical-guide" />
                  <div className="cell-piece" style={{ transform: `translateY(${cellDrag}px)` }}>
                    ENERGY CELL
                  </div>
                </div>
              </div>
            )}

            {currentStep.id === "charge" && (
              <div className="gesture-layer">
                <div className="gesture-arrow">PULL DOWN HARD</div>
                <div className="charge-track" onPointerMove={handleChargePointerMove}>
                  <div className="charge-guide" />
                  <div className="charge-grip" style={{ transform: `translateY(${chargeDrag}px)` }}>
                    CHARGER
                  </div>
                </div>
              </div>
            )}

            {isReadyState && (
              <div className="ready-fire-callout">
                <div className="ready-fire-burst">READY TO FIRE!!</div>
                <div className="ready-fire-sub">Auto launching into the firing phase...</div>
              </div>
            )}
          </div>

          <div className="assembly-hint-pill">{currentStep.hint}</div>
        </article>
      </section>
    </main>
  );
}

export default WeaponAssemblyPage;
