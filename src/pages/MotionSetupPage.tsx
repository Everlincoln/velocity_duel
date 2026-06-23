import { useEffect, useState } from "react";
import type { MotionPermissionState, Page } from "../App";

type Props = {
  motionPermission: MotionPermissionState;
  pendingGameplayPage: Page;
  setCurrentPage: (page: Page) => void;
  setMotionPermission: (value: MotionPermissionState) => void;
};

type IOSDeviceMotionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

async function requestMotionAccess() {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
    return "unavailable" as MotionPermissionState;
  }

  const motionEvent = DeviceMotionEvent as IOSDeviceMotionEvent;
  if (typeof motionEvent.requestPermission === "function") {
    const permission = await motionEvent.requestPermission();
    return permission === "granted" ? "granted" : "denied";
  }

  return "unavailable" as MotionPermissionState;
}

type MotionSample = {
  count: number;
  magnitude: number;
  maxMagnitude: number;
  x: number;
  y: number;
  z: number;
};

const EMPTY_SAMPLE: MotionSample = {
  count: 0,
  magnitude: 0,
  maxMagnitude: 0,
  x: 0,
  y: 0,
  z: 0,
};

function MotionSetupPage({
  motionPermission,
  pendingGameplayPage,
  setCurrentPage,
  setMotionPermission,
}: Props) {
  const [permissionResult, setPermissionResult] = useState<MotionPermissionState | null>(null);
  const [listenerActive, setListenerActive] = useState(false);
  const [motionSample, setMotionSample] = useState<MotionSample>(EMPTY_SAMPLE);
  const deviceMotionType = typeof window !== "undefined" ? typeof window.DeviceMotionEvent : "undefined";
  const requestPermissionType =
    typeof window !== "undefined" && "DeviceMotionEvent" in window
      ? typeof (DeviceMotionEvent as IOSDeviceMotionEvent).requestPermission
      : "undefined";

  useEffect(() => {
    if (!listenerActive || typeof window === "undefined") {
      return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity ?? event.acceleration;
      const x = acceleration?.x ?? 0;
      const y = acceleration?.y ?? 0;
      const z = acceleration?.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      setMotionSample((current) => ({
        count: current.count + 1,
        x,
        y,
        z,
        magnitude,
        maxMagnitude: Math.max(current.maxMagnitude, magnitude),
      }));
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [listenerActive]);

  const handleContinueWithoutMotion = () => {
    if (motionPermission === "unknown") {
      setMotionPermission("unavailable");
    }
    setCurrentPage(pendingGameplayPage);
  };

  const enableMotion = async () => {
    setMotionPermission("requesting");
    setPermissionResult(null);
    setMotionSample(EMPTY_SAMPLE);

    try {
      const result = await requestMotionAccess();
      setPermissionResult(result);
      setListenerActive(result === "granted" || result === "unavailable");
      setMotionPermission(result === "granted" ? "granted" : result);
    } catch {
      setPermissionResult("denied");
      setListenerActive(false);
      setMotionPermission("denied");
    }
  };

  const helperText =
    permissionResult === "denied" || motionPermission === "denied"
      ? "Motion access was denied. You can still test firing later with the Space key."
      : permissionResult === "unavailable" || motionPermission === "unavailable"
        ? "Motion controls are not available here. Desktop Space key testing will still work."
        : "Enable motion now so shake-to-fire is ready before you reach the firing phase.";

  return (
    <main className="screen">
      <section className="shell stack-gap">
        <article className="card stage-card card-sky center-card">
          <p className="kicker">Enable Motion</p>
          <h2 className="section-title center-title">Turn On Shake Controls</h2>
          <p className="section-text">{helperText}</p>

          <div className="action-row center-actions">
            <button
              className="button button-blue"
              onClick={enableMotion}
              disabled={motionPermission === "requesting"}
            >
              {motionPermission === "requesting" ? "Checking..." : "Enable Motion"}
            </button>
            <button className="button button-cream" onClick={handleContinueWithoutMotion}>
              Continue Without Motion
            </button>
          </div>

          {permissionResult ? (
            <div className="motion-permission-result">
              <strong>Permission result</strong>
              <code>{permissionResult}</code>
            </div>
          ) : null}

          <div className="motion-debug-panel">
            <div className="motion-debug-row">
              <strong>typeof DeviceMotionEvent</strong>
              <code>{deviceMotionType}</code>
            </div>
            <div className="motion-debug-row">
              <strong>typeof DeviceMotionEvent.requestPermission</strong>
              <code>{requestPermissionType}</code>
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

          {permissionResult ? (
            <div className="action-row center-actions">
              <button className="button button-green" onClick={() => setCurrentPage(pendingGameplayPage)}>
                Continue to Game
              </button>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}

export default MotionSetupPage;
