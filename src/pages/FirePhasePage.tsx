import { useEffect, useMemo, useRef, useState } from "react";
import type { MotionPermissionState, Page } from "../App";
import WeaponCanvas from "../components/WeaponCanvas";
import { readSavedWeaponLayout } from "../components/weaponCanvasConfig";

type Props = {
  motionPermission: MotionPermissionState;
  setCurrentPage: (page: Page) => void;
  setReactionTimeMs: (value: number | null) => void;
};

type MotionSample = {
  count: number;
  magnitude: number;
  maxMagnitude: number;
  x: number;
  y: number;
  z: number;
};

const SHAKE_THRESHOLD = 12;
const EMPTY_SAMPLE: MotionSample = {
  count: 0,
  magnitude: 0,
  maxMagnitude: 0,
  x: 0,
  y: 0,
  z: 0,
};

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
  const [motionSample, setMotionSample] = useState<MotionSample>(EMPTY_SAMPLE);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setReactionTimeMs(null);
    startTimeRef.current = performance.now();
  }, [setReactionTimeMs]);

  useEffect(() => {
    if (isFired) {
      return;
    }

    const handleFire = () => {
      if (isFired) {
        return;
      }

      const elapsed = Math.max(1, Math.round(performance.now() - startTimeRef.current));
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

      window.setTimeout(() => setIsRecoiling(false), 220);
      window.setTimeout(() => setShowShake(false), 320);
      window.setTimeout(() => setShowFlash(false), 180);
      window.setTimeout(() => setCurrentPage("result"), 1100);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleFire();
      }
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity ?? event.acceleration;
      const x = acceleration?.x ?? 0;
      const y = acceleration?.y ?? 0;
      const z = acceleration?.z ?? 0;
      const intensity = Math.sqrt(x * x + y * y + z * z);

      setMotionSample((current) => ({
        count: current.count + 1,
        x,
        y,
        z,
        magnitude: intensity,
        maxMagnitude: Math.max(current.maxMagnitude, intensity),
      }));

      if (intensity > SHAKE_THRESHOLD) {
        handleFire();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (motionPermission === "granted" || motionPermission === "unavailable") {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isFired, motionPermission, setCurrentPage, setReactionTimeMs]);

  const fallbackMessage =
    motionPermission === "granted"
      ? "Shake your phone, or press Space on desktop."
      : motionPermission === "unavailable"
        ? "No native permission API detected here. Motion values are still being observed if the browser provides them."
        : "Motion is not enabled here. Press Space to test firing on desktop.";

  return (
    <main className={`screen fire-phase-screen ${showShake ? "fire-phase-screen-shake" : ""}`}>
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

        <div className="layout-editor-card" style={{ display: "none" }}>
          <p className="layout-editor-panel-kicker">Motion Debug</p>
          <div className="motion-debug-panel">
            <div className="motion-debug-row">
              <strong>threshold</strong>
              <code>{SHAKE_THRESHOLD}</code>
            </div>
            <div className="motion-debug-row">
              <strong>event count</strong>
              <code>{motionSample.count}</code>
            </div>
            <div className="motion-debug-row">
              <strong>x</strong>
              <code>{motionSample.x.toFixed(3)}</code>
            </div>
            <div className="motion-debug-row">
              <strong>y</strong>
              <code>{motionSample.y.toFixed(3)}</code>
            </div>
            <div className="motion-debug-row">
              <strong>z</strong>
              <code>{motionSample.z.toFixed(3)}</code>
            </div>
            <div className="motion-debug-row">
              <strong>magnitude</strong>
              <code>{motionSample.magnitude.toFixed(3)}</code>
            </div>
            <div className="motion-debug-row">
              <strong>max magnitude</strong>
              <code>{motionSample.maxMagnitude.toFixed(3)}</code>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default FirePhasePage;
