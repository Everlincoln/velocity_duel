import { useEffect, useState } from "react";
import type { MotionPermissionState, Page } from "../App";

type Props = {
  motionPermission: MotionPermissionState;
  pendingGameplayPage: Page;
  returnPage: Page;
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

  return "granted" as MotionPermissionState;
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
  returnPage,
  setCurrentPage,
  setMotionPermission,
}: Props) {
  const [permissionResult, setPermissionResult] = useState<MotionPermissionState | null>(null);
  const [listenerActive, setListenerActive] = useState(false);
  const [motionSample, setMotionSample] = useState<MotionSample>(EMPTY_SAMPLE);
  const isTouchDevice =
    typeof window !== "undefined" &&
    (navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)").matches === true);
  const hasMotionApi = typeof window !== "undefined" && "DeviceMotionEvent" in window;
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

  const handleBack = () => {
    setCurrentPage(returnPage);
  };

  const handleContinueWithoutMotion = () => {
    setMotionPermission("unavailable");
    setCurrentPage(pendingGameplayPage);
  };

  const enableMotion = async () => {
    setMotionPermission("requesting");
    setPermissionResult(null);
    setMotionSample(EMPTY_SAMPLE);

    try {
      const result = await requestMotionAccess();
      setPermissionResult(result);
      setListenerActive(result === "granted");
      setMotionPermission(result === "granted" ? "granted" : result);
      if (result === "granted") {
        setCurrentPage(pendingGameplayPage);
      }
    } catch {
      setPermissionResult("denied");
      setListenerActive(false);
      setMotionPermission("denied");
    }
  };

  const helperText =
    isTouchDevice && (permissionResult === "denied" || motionPermission === "denied")
      ? "Motion access is required to play on mobile."
      : isTouchDevice && (permissionResult === "unavailable" || motionPermission === "unavailable")
        ? "Motion access is required to play on mobile."
        : !isTouchDevice && (permissionResult === "denied" || motionPermission === "denied")
          ? "Motion permission was denied. You can try again, or continue on desktop with keyboard testing."
          : !isTouchDevice && !hasMotionApi
            ? "Motion APIs are not available here. You can continue on desktop and use the Space key to test firing."
            : "Enable motion to continue into the game.";

  const primaryLabel =
    motionPermission === "requesting"
      ? "Checking..."
      : permissionResult === "denied" || motionPermission === "denied"
        ? "Try Again"
        : "Enable Motion";

  return (
    <main className="screen motion-setup-screen">
      <section className="shell stack-gap motion-setup-shell">
        <article className="card stage-card card-sky center-card motion-setup-card">
          <p className="kicker">Enable Motion</p>
          <h2 className="section-title center-title">Turn On Shake Controls</h2>
          <p className="section-text">{helperText}</p>

          <div className="action-row center-actions">
            {isTouchDevice || hasMotionApi ? (
              <button
                className="button button-blue"
                onClick={enableMotion}
                disabled={motionPermission === "requesting"}
              >
                {primaryLabel}
              </button>
            ) : null}
            {!isTouchDevice ? (
              <button className="button button-cream" onClick={handleContinueWithoutMotion}>
                Continue Without Motion
              </button>
            ) : null}
            <button className="button button-cream" onClick={handleBack}>
              Back
            </button>
          </div>

          {permissionResult ? (
            <div className="motion-permission-result" style={{ display: "none" }}>
              <strong>Permission result</strong>
              <code>{permissionResult}</code>
            </div>
          ) : null}

          <div className="motion-debug-panel" style={{ display: "none" }}>
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

        </article>
      </section>
    </main>
  );
}

export default MotionSetupPage;
