import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Page } from "../App";
import WeaponCanvas from "../components/WeaponCanvas";
import {
  resolveWeaponLayout,
  WEAPON_CANVAS_HEIGHT,
  WEAPON_CANVAS_WIDTH,
  type WeaponLayoutPreset,
  type WeaponPartId,
} from "../components/weaponCanvasConfig";

type Props = {
  setCurrentPage: (page: Page) => void;
  setReactionTimeMs: (value: number | null) => void;
};

type AssemblyStep = "magazine" | "slide" | "complete";

type AssemblyDebugInfo = {
  viewportWidth: number;
  viewportHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasParentWidth: number;
  canvasParentHeight: number;
  scaleX: number;
  scaleY: number;
  screenClasses: string;
  shellClasses: string;
  canvasCardClasses: string;
  canvasClasses: string;
  activeBreakpoints: string[];
};

const MAGAZINE_START = { x: 320, y: 690 };
const SLIDE_START = { x: 1260, y: 250 };
const MAGAZINE_SNAP_DISTANCE = 120;
const SLIDE_SNAP_DISTANCE = 150;

function buildGameplayLayout(
  targetLayout: WeaponLayoutPreset,
  installedParts: WeaponPartId[],
  partPositions: Partial<Record<WeaponPartId, { x: number; y: number }>>,
) {
  return {
    ...targetLayout,
    parts: {
      ...targetLayout.parts,
      weaponFrame: {
        ...targetLayout.parts.weaponFrame,
      },
      weaponMagazine: {
        ...targetLayout.parts.weaponMagazine,
        ...(installedParts.includes("weaponMagazine")
          ? {}
          : (partPositions.weaponMagazine ?? MAGAZINE_START)),
      },
      weaponSlide: {
        ...targetLayout.parts.weaponSlide,
        ...(installedParts.includes("weaponSlide") ? {} : (partPositions.weaponSlide ?? SLIDE_START)),
      },
    },
  };
}

function WeaponAssemblyPage({ setCurrentPage, setReactionTimeMs }: Props) {
  const [debugMode, setDebugMode] = useState(true);
  const [layoutResolution] = useState(() => resolveWeaponLayout());
  const [targetLayout] = useState(() => layoutResolution.layout);
  const [step, setStep] = useState<AssemblyStep>("magazine");
  const [installedParts, setInstalledParts] = useState<WeaponPartId[]>([]);
  const [draggingPartId, setDraggingPartId] = useState<WeaponPartId | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [debugInfo, setDebugInfo] = useState<AssemblyDebugInfo | null>(null);
  const [partPositions, setPartPositions] = useState<Partial<Record<WeaponPartId, { x: number; y: number }>>>({
    weaponMagazine: MAGAZINE_START,
    weaponSlide: SLIDE_START,
  });
  const screenRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);
  const canvasCardRef = useRef<HTMLElement | null>(null);

  const activePartId: WeaponPartId | null =
    step === "magazine" ? "weaponMagazine" : step === "slide" ? "weaponSlide" : null;

  const layout = useMemo(
    () => buildGameplayLayout(targetLayout, installedParts, partPositions),
    [installedParts, partPositions, targetLayout],
  );

  const visiblePartIds = useMemo(() => {
    if (step === "magazine") {
      return ["weaponFrame", "weaponMagazine"] as WeaponPartId[];
    }
    if (step === "slide") {
      return ["weaponFrame", "weaponMagazine", "weaponSlide"] as WeaponPartId[];
    }
    return ["weaponFrame", "weaponMagazine", "weaponSlide"] as WeaponPartId[];
  }, [step]);

  const instruction =
    step === "magazine"
      ? "Drag the magazine close to the grip and it will snap in automatically."
      : step === "slide"
        ? "Slide the top part close to its slot and it will lock into place."
        : "READY TO FIRE";

  useEffect(() => {
    console.log("[WeaponAssembly] layout source", layoutResolution.source);
    console.log("[WeaponAssembly] layout version", targetLayout.layoutVersion);
    console.log("[WeaponAssembly] loaded layout JSON", JSON.stringify(targetLayout, null, 2));
    console.log("[WeaponAssembly] canvas width/height", {
      canvasWidth: targetLayout.canvasWidth,
      canvasHeight: targetLayout.canvasHeight,
    });
  }, [layoutResolution.source, targetLayout]);

  useEffect(() => {
    const updateDebugInfo = () => {
      const screenElement = screenRef.current;
      const shellElement = shellRef.current;
      const canvasCardElement = canvasCardRef.current;
      const canvasElement = canvasCardElement?.querySelector(".weapon-canvas") as HTMLDivElement | null;

      if (!screenElement || !shellElement || !canvasCardElement || !canvasElement) {
        return;
      }

      const canvasRect = canvasElement.getBoundingClientRect();
      const canvasParentRect = canvasCardElement.getBoundingClientRect();

      const nextDebugInfo: AssemblyDebugInfo = {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        canvasWidth: Number(canvasRect.width.toFixed(2)),
        canvasHeight: Number(canvasRect.height.toFixed(2)),
        canvasParentWidth: Number(canvasParentRect.width.toFixed(2)),
        canvasParentHeight: Number(canvasParentRect.height.toFixed(2)),
        scaleX: Number((canvasRect.width / WEAPON_CANVAS_WIDTH).toFixed(4)),
        scaleY: Number((canvasRect.height / WEAPON_CANVAS_HEIGHT).toFixed(4)),
        screenClasses: screenElement.className,
        shellClasses: shellElement.className,
        canvasCardClasses: canvasCardElement.className,
        canvasClasses: canvasElement.className,
        activeBreakpoints: [
          window.matchMedia("(max-width: 900px)").matches ? "max-width:900" : "",
          window.matchMedia("(max-width: 560px)").matches ? "max-width:560" : "",
          window.matchMedia("(orientation: landscape) and (pointer: coarse) and (max-height: 560px)").matches
            ? "landscape-coarse-max-height:560"
            : "",
          window.matchMedia("(orientation: portrait) and (pointer: coarse) and (max-width: 900px)").matches
            ? "portrait-coarse-max-width:900"
            : "",
          window.matchMedia("(pointer: coarse)").matches ? "pointer:coarse" : "pointer:fine",
          window.matchMedia("(orientation: landscape)").matches ? "orientation:landscape" : "orientation:portrait",
        ].filter(Boolean),
      };

      console.log("[WeaponAssembly][size-debug]", nextDebugInfo);
      setDebugInfo(nextDebugInfo);
    };

    updateDebugInfo();
    window.addEventListener("resize", updateDebugInfo);
    window.addEventListener("orientationchange", updateDebugInfo);

    return () => {
      window.removeEventListener("resize", updateDebugInfo);
      window.removeEventListener("orientationchange", updateDebugInfo);
    };
  }, [step, layout, visiblePartIds]);

  useEffect(() => {
    if (step !== "complete") {
      return;
    }

    setReactionTimeMs(null);
    const timeout = window.setTimeout(() => {
      setCurrentPage("fire");
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [setCurrentPage, setReactionTimeMs, step]);

  const updatePartPosition = (partId: WeaponPartId, x: number, y: number) => {
    setPartPositions((current) => ({
      ...current,
      [partId]: {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      },
    }));
  };

  const toLogicalPoint = (event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    const currentTarget = event.currentTarget as HTMLElement;
    const stage =
      (currentTarget.closest(".weapon-canvas-stage") as HTMLDivElement | null) ??
      (currentTarget.querySelector(".weapon-canvas-stage") as HTMLDivElement | null);
    if (!stage) {
      return null;
    }

    const rect = stage.getBoundingClientRect();
    console.log("[WeaponAssembly] canvas scale", {
      rectWidth: rect.width,
      rectHeight: rect.height,
      canvasWidth: WEAPON_CANVAS_WIDTH,
      canvasHeight: WEAPON_CANVAS_HEIGHT,
      scaleX: rect.width / WEAPON_CANVAS_WIDTH,
      scaleY: rect.height / WEAPON_CANVAS_HEIGHT,
    });
    return {
      x: ((event.clientX - rect.left) / rect.width) * WEAPON_CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * WEAPON_CANVAS_HEIGHT,
    };
  };

  const completeStep = (partId: WeaponPartId) => {
    const targetPart = targetLayout.parts[partId];
    updatePartPosition(partId, targetPart.x, targetPart.y);
    setInstalledParts((current) => (current.includes(partId) ? current : [...current, partId]));
    setDraggingPartId(null);

    if (partId === "weaponMagazine") {
      setStep("slide");
      return;
    }

    if (partId === "weaponSlide") {
      setStep("complete");
    }
  };

  const maybeSnapPart = (partId: WeaponPartId, x: number, y: number) => {
    const target = targetLayout.parts[partId];
    const dx = x - target.x;
    const dy = y - target.y;
    const distance = Math.hypot(dx, dy);
    const threshold = partId === "weaponMagazine" ? MAGAZINE_SNAP_DISTANCE : SLIDE_SNAP_DISTANCE;
    const didSnap = distance <= threshold;

    console.log("[WeaponAssembly] snap check", {
      layoutSource: layoutResolution.source,
      layoutVersion: targetLayout.layoutVersion,
      partId,
      draggedLogicalX: Number(x.toFixed(2)),
      draggedLogicalY: Number(y.toFixed(2)),
      targetLogicalX: target.x,
      targetLogicalY: target.y,
      distance: Number(distance.toFixed(2)),
      didSnap,
    });

    if (didSnap) {
      completeStep(partId);
      return true;
    }

    return false;
  };

  const handlePartPointerDown = (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (partId !== activePartId) {
      return;
    }

    const point = toLogicalPoint(event);
    if (!point) {
      return;
    }

    const current = layout.parts[partId];
    setDraggingPartId(partId);
    setDragOffset({
      x: point.x - current.x,
      y: point.y - current.y,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingPartId) {
      return;
    }

    const point = toLogicalPoint(event);
    if (!point) {
      return;
    }

    const nextX = point.x - dragOffset.x;
    const nextY = point.y - dragOffset.y;
    updatePartPosition(draggingPartId, nextX, nextY);
    maybeSnapPart(draggingPartId, nextX, nextY);
  };

  const handleCanvasPointerUp = () => {
    setDraggingPartId(null);
  };

  return (
    <main ref={screenRef} className="screen weapon-mini-screen">
      <section ref={shellRef} className="layout-editor-shell">
        <header className="layout-editor-topbar">
          <div>
            <p className="layout-editor-kicker">Gameplay Assembly</p>
            <h1 className="layout-editor-title">
              {step === "complete" ? "READY TO FIRE" : step === "magazine" ? "INSERT MAGAZINE" : "SLIDE TOP"}
            </h1>
            <p className="layout-editor-subtitle">{instruction}</p>
          </div>

          <div className="layout-editor-actions">
            <label className="layout-editor-toggle" style={{ display: "none" }}>
              <input type="checkbox" checked={debugMode} onChange={(event) => setDebugMode(event.target.checked)} />
              <span>Debug overlay</span>
            </label>
            <button className="button button-cream" onClick={() => setCurrentPage("home")}>
              Back
            </button>
          </div>
        </header>

        <section
          ref={canvasCardRef}
          className="layout-editor-canvas-card"
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
        >
          <WeaponCanvas
            debug={debugMode}
            layout={layout}
            onPartPointerDown={handlePartPointerDown}
            partClassName={step === "complete" ? "is-readonly" : ""}
            selectedPartId={activePartId}
            snapTarget={
              debugMode && activePartId
                ? {
                    partId: activePartId,
                    x: targetLayout.parts[activePartId].x,
                    y: targetLayout.parts[activePartId].y,
                  }
                : null
            }
            visiblePartIds={visiblePartIds}
          />
        </section>

        <div className="layout-editor-card" style={{ display: "none" }}>
          <p className="layout-editor-panel-kicker">Loaded Snap Targets</p>
          <pre className="layout-editor-json">{JSON.stringify(targetLayout, null, 2)}</pre>
        </div>

        {debugInfo ? (
          <div className="assembly-debug-overlay">
            <div>viewport: {debugInfo.viewportWidth} x {debugInfo.viewportHeight}</div>
            <div>canvas: {debugInfo.canvasWidth} x {debugInfo.canvasHeight}</div>
            <div>canvas parent: {debugInfo.canvasParentWidth} x {debugInfo.canvasParentHeight}</div>
            <div>canvas scale: {debugInfo.scaleX} / {debugInfo.scaleY}</div>
            <div>screen classes: {debugInfo.screenClasses}</div>
            <div>shell classes: {debugInfo.shellClasses}</div>
            <div>canvas card classes: {debugInfo.canvasCardClasses}</div>
            <div>canvas classes: {debugInfo.canvasClasses}</div>
            <div>breakpoints: {debugInfo.activeBreakpoints.join(", ") || "none"}</div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default WeaponAssemblyPage;
