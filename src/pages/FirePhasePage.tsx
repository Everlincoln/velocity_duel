import { useEffect, useMemo, useRef, useState } from "react";
import type { MotionPermissionState, Page } from "../App";
import WeaponCanvas from "../components/WeaponCanvas";
import { readSavedWeaponLayout } from "../components/weaponCanvasConfig";

type Props = {
  motionPermission: MotionPermissionState;
  setCurrentPage: (page: Page) => void;
  setReactionTimeMs: (value: number | null) => void;
};

const SHAKE_THRESHOLD = 12;
const ARMING_DELAY_MS = 800;

function playFireSound() {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(220, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(70, context.currentTime + 0.16);

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
  oscillator.onended = () => {
    void context.close();
  };
}

function FirePhasePage({ motionPermission, setCurrentPage, setReactionTimeMs }: Props) {
  const layout = useMemo(() => readSavedWeaponLayout(), []);
  const [isFired, setIsFired] = useState(false);
  const [isRecoiling, setIsRecoiling] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showShake, setShowShake] = useState(false);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasFiredRef = useRef(false);
  const isArmedRef = useRef(false);
  const hasBaselineRef = useRef(false);
  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const recoilTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const resultTimeoutRef = useRef<number | null>(null);
  const armTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("[FirePhase] reset fire state");
    console.log("[FirePhase] mount");
    setReactionTimeMs(null);
    setIsFired(false);
    setIsRecoiling(false);
    setShowFlash(false);
    setShowShake(false);
    setReactionMs(null);
    startTimeRef.current = performance.now();
    hasFiredRef.current = false;
    isArmedRef.current = false;
    hasBaselineRef.current = false;
    lastAccelerationRef.current = { x: 0, y: 0, z: 0 };

    console.log("[FirePhase] arming delay start", { delayMs: ARMING_DELAY_MS });
    armTimeoutRef.current = window.setTimeout(() => {
      isArmedRef.current = true;
      console.log("[FirePhase] armed");
    }, ARMING_DELAY_MS);

    return () => {
      if (armTimeoutRef.current) {
        window.clearTimeout(armTimeoutRef.current);
      }
      if (recoilTimeoutRef.current) {
        window.clearTimeout(recoilTimeoutRef.current);
      }
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      if (resultTimeoutRef.current) {
        window.clearTimeout(resultTimeoutRef.current);
      }
    };
  }, [setReactionTimeMs]);

  useEffect(() => {
    const handleFire = (source: "motion" | "keyboard") => {
      if (hasFiredRef.current) {
        return;
      }

      const elapsed = Math.max(1, Math.round(performance.now() - startTimeRef.current));
      console.log("[FirePhase] fire triggered", { source, elapsedMs: elapsed });
      hasFiredRef.current = true;
      setIsFired(true);
      setReactionMs(elapsed);
      setReactionTimeMs(elapsed);
      setIsRecoiling(true);
      setShowShake(true);
      setShowFlash(true);
      playFireSound();

      if (navigator.vibrate) {
        navigator.vibrate([60, 30, 90]);
      }

      recoilTimeoutRef.current = window.setTimeout(() => setIsRecoiling(false), 220);
      shakeTimeoutRef.current = window.setTimeout(() => setShowShake(false), 320);
      flashTimeoutRef.current = window.setTimeout(() => setShowFlash(false), 180);
      resultTimeoutRef.current = window.setTimeout(() => setCurrentPage("result"), 1100);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleFire("keyboard");
      }
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity ?? event.acceleration;
      const x = acceleration?.x ?? 0;
      const y = acceleration?.y ?? 0;
      const z = acceleration?.z ?? 0;
      const intensity = Math.sqrt(x * x + y * y + z * z);
      const previous = lastAccelerationRef.current;
      const deltaX = x - previous.x;
      const deltaY = y - previous.y;
      const deltaZ = z - previous.z;
      const deltaMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      lastAccelerationRef.current = { x, y, z };

      if (!hasBaselineRef.current) {
        hasBaselineRef.current = true;
        return;
      }

      if (!isArmedRef.current) {
        console.log("[FirePhase] motion ignored during warm-up", {
          magnitude: Number(intensity.toFixed(3)),
          deltaMagnitude: Number(deltaMagnitude.toFixed(3)),
        });
        return;
      }

      if (deltaMagnitude > SHAKE_THRESHOLD) {
        handleFire("motion");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (motionPermission === "granted" || motionPermission === "unavailable") {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      console.log("[FirePhase] cleanup motion listeners");
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [motionPermission, setCurrentPage, setReactionTimeMs]);

  const fallbackMessage =
    motionPermission === "granted"
      ? "Shake your phone, or press Space on desktop."
      : motionPermission === "unavailable"
        ? "No native permission API detected here. Motion values are still being observed if the browser provides them."
        : "Motion is not enabled here. Press Space to test firing on desktop.";

  return (
    <main className={`screen fire-phase-screen ${showShake ? "fire-phase-screen-shake" : ""} ${isFired ? "is-fired" : ""}`}>
      <section className="layout-editor-shell">
        <header className="layout-editor-topbar">
          <div>
            <p className="layout-editor-kicker">Single Player Fire Test</p>
            <h1 className="layout-editor-title">SHAKE TO FIRE</h1>
            <p className="layout-editor-subtitle">
              Shake your phone to blast, or press Space on desktop for this testing build.
            </p>
          </div>
        </header>

        <section className="layout-editor-canvas-card fire-phase-card">
          <WeaponCanvas
            layout={layout}
            partClassName={`is-readonly ${isRecoiling ? "fire-phase-weapon-recoil" : "fire-phase-weapon-idle"}`}
            selectedPartId={null}
            showLabels={false}
            visiblePartIds={["weaponMagazine", "weaponFrame", "weaponSlide"]}
          />

          <div className={`fire-phase-flash ${showFlash ? "is-visible" : ""}`} aria-hidden="true" />

          <div className="fire-phase-overlay">
            <div className="fire-phase-instruction">Shake to Fire</div>
            <div className="fire-phase-fallback">{fallbackMessage}</div>
            {reactionMs ? <div className="fire-phase-reaction">Fired in {reactionMs} ms</div> : null}
          </div>
        </section>
      </section>
    </main>
  );
}

export default FirePhasePage;
