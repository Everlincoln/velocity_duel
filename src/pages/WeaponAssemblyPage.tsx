import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Page } from "../App";
import WeaponCanvas from "../components/WeaponCanvas";
import { playGameSound, unlockGameAudio } from "../lib/gameAudio";
import {
  resolveWeaponLayout,
  WEAPON_CANVAS_HEIGHT,
  WEAPON_LAYOUT_STORAGE_KEY,
  WEAPON_CANVAS_WIDTH,
  WEAPON_PARTS,
  type WeaponLayoutPreset,
  type WeaponPartId,
} from "../components/weaponCanvasConfig";

type Props = {
  setCurrentPage: (page: Page) => void;
  setReactionTimeMs: (value: number | null) => void;
};

type AssemblyStep = "magazine" | "slide" | "complete";

type AssemblyDebugInfo = {
  step: AssemblyStep;
  layoutSource: string;
  layoutVersion: string;
  expectedVisiblePartIds: WeaponPartId[];
  actualVisiblePartIds: WeaponPartId[];
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
  userAgent: string;
  devicePixelRatio: number;
  partRenderInfo: Array<{
    partId: WeaponPartId;
    logicalX: number;
    logicalY: number;
    logicalScale: number;
    configuredWidth: number;
    intrinsicWidth: number;
    intrinsicHeight: number;
    renderedWidth: number;
    renderedHeight: number;
    domLeft: number;
    domTop: number;
    domRight: number;
    domBottom: number;
    transformOrigin: string;
  }>;
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
  const activePointerIdRef = useRef<number | null>(null);
  const capturedElementRef = useRef<HTMLButtonElement | null>(null);
  const screenRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);
  const canvasCardRef = useRef<HTMLElement | null>(null);
  const lastLoggedStepRef = useRef<AssemblyStep | null>(null);

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
      const actualVisiblePartIds = Array.from(canvasElement.querySelectorAll("[data-part-id]"))
        .map((element) => element.getAttribute("data-part-id"))
        .filter((partId): partId is WeaponPartId => Boolean(partId));
      const partRenderInfo = WEAPON_PARTS.filter((part) => visiblePartIds.includes(part.id)).map((part) => {
        const partElement = canvasElement.querySelector(`[data-part-id="${part.id}"]`) as HTMLButtonElement | null;
        const imgElement = partElement?.querySelector("img") as HTMLImageElement | null;
        const visibleRect = imgElement?.getBoundingClientRect() ?? partElement?.getBoundingClientRect();
        const computedStyle = partElement ? window.getComputedStyle(partElement) : null;
        const partLayout = layout.parts[part.id];

        return {
          partId: part.id,
          logicalX: partLayout.x,
          logicalY: partLayout.y,
          logicalScale: partLayout.scale,
          configuredWidth: part.width,
          intrinsicWidth: imgElement?.naturalWidth ?? 0,
          intrinsicHeight: imgElement?.naturalHeight ?? 0,
          renderedWidth: Number((visibleRect?.width ?? 0).toFixed(2)),
          renderedHeight: Number((visibleRect?.height ?? 0).toFixed(2)),
          domLeft: Number((visibleRect?.left ?? 0).toFixed(2)),
          domTop: Number((visibleRect?.top ?? 0).toFixed(2)),
          domRight: Number((visibleRect?.right ?? 0).toFixed(2)),
          domBottom: Number((visibleRect?.bottom ?? 0).toFixed(2)),
          transformOrigin: computedStyle?.transformOrigin ?? "",
        };
      });

      const nextDebugInfo: AssemblyDebugInfo = {
        step,
        layoutSource: layoutResolution.source,
        layoutVersion: targetLayout.layoutVersion,
        expectedVisiblePartIds: visiblePartIds,
        actualVisiblePartIds,
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
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
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
        partRenderInfo,
      };

      const expectedVisiblePartIds = visiblePartIds;
      const hasAllExpectedParts = expectedVisiblePartIds.every((partId) => actualVisiblePartIds.includes(partId));

      if (hasAllExpectedParts && lastLoggedStepRef.current !== step) {
        console.log("[WeaponAssembly][size-debug]", {
          ...nextDebugInfo,
        });
        console.log("[WeaponAssembly][layout-compare]", {
          step,
          expectedVisiblePartIds,
          actualVisiblePartIds,
          layoutSource: layoutResolution.source,
          layoutVersion: targetLayout.layoutVersion,
          weaponFrame: {
            x: targetLayout.parts.weaponFrame.x,
            y: targetLayout.parts.weaponFrame.y,
            scale: targetLayout.parts.weaponFrame.scale,
          },
          weaponMagazine: {
            x: targetLayout.parts.weaponMagazine.x,
            y: targetLayout.parts.weaponMagazine.y,
            scale: targetLayout.parts.weaponMagazine.scale,
          },
          weaponSlide: {
            x: targetLayout.parts.weaponSlide.x,
            y: targetLayout.parts.weaponSlide.y,
            scale: targetLayout.parts.weaponSlide.scale,
          },
          userAgent: navigator.userAgent,
          devicePixelRatio: window.devicePixelRatio,
          parts: partRenderInfo.map((part) => ({
            partId: part.partId,
            logicalX: part.logicalX,
            logicalY: part.logicalY,
            logicalScale: part.logicalScale,
            intrinsicWidth: part.intrinsicWidth,
            intrinsicHeight: part.intrinsicHeight,
            renderedWidth: part.renderedWidth,
            renderedHeight: part.renderedHeight,
            boundingRect: {
              left: part.domLeft,
              top: part.domTop,
              right: part.domRight,
              bottom: part.domBottom,
            },
            transformOrigin: part.transformOrigin,
          })),
        });
        lastLoggedStepRef.current = step;
      }
      setDebugInfo(nextDebugInfo);
    };

    updateDebugInfo();
    window.addEventListener("resize", updateDebugInfo);
    window.addEventListener("orientationchange", updateDebugInfo);

    return () => {
      window.removeEventListener("resize", updateDebugInfo);
      window.removeEventListener("orientationchange", updateDebugInfo);
    };
  }, [layout, layoutResolution.source, step, targetLayout, visiblePartIds]);

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
    const capturedElement = capturedElementRef.current;
    const pointerId = activePointerIdRef.current;
    if (capturedElement && pointerId !== null && capturedElement.hasPointerCapture(pointerId)) {
      capturedElement.releasePointerCapture(pointerId);
    }

    const targetPart = targetLayout.parts[partId];
    updatePartPosition(partId, targetPart.x, targetPart.y);
    setInstalledParts((current) => (current.includes(partId) ? current : [...current, partId]));
    setDraggingPartId(null);
    activePointerIdRef.current = null;
    capturedElementRef.current = null;
    if (partId === "weaponMagazine") {
      playGameSound("magazine-click");
    } else if (partId === "weaponSlide") {
      playGameSound("slide-rack");
    }

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
    unlockGameAudio();
    activePointerIdRef.current = event.pointerId;
    capturedElementRef.current = event.currentTarget;
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

  const releaseCapturedPointer = () => {
    const capturedElement = capturedElementRef.current;
    const pointerId = activePointerIdRef.current;

    if (capturedElement && pointerId !== null && capturedElement.hasPointerCapture(pointerId)) {
      capturedElement.releasePointerCapture(pointerId);
    }

    activePointerIdRef.current = null;
    capturedElementRef.current = null;
  };

  const handleCanvasPointerUp = () => {
    releaseCapturedPointer();
    setDraggingPartId(null);
  };

  const handlePartPointerUp = (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (draggingPartId !== partId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerIdRef.current = null;
    capturedElementRef.current = null;
    setDraggingPartId(null);
  };

  const handleClearWeaponLayoutAndReload = () => {
    window.localStorage.removeItem(WEAPON_LAYOUT_STORAGE_KEY);
    window.location.reload();
  };

  const layoutComparePayload = debugInfo
    ? {
        step: debugInfo.step,
        userAgent: debugInfo.userAgent,
        devicePixelRatio: debugInfo.devicePixelRatio,
        layoutSource: debugInfo.layoutSource,
        layoutVersion: debugInfo.layoutVersion,
        expectedVisiblePartIds: debugInfo.expectedVisiblePartIds,
        actualVisiblePartIds: debugInfo.actualVisiblePartIds,
        parts: debugInfo.partRenderInfo.map((part) => ({
          partId: part.partId,
          logicalX: part.logicalX,
          logicalY: part.logicalY,
          logicalScale: part.logicalScale,
          renderedWidth: part.renderedWidth,
          renderedHeight: part.renderedHeight,
          boundingRect: {
            left: part.domLeft,
            top: part.domTop,
            right: part.domRight,
            bottom: part.domBottom,
          },
          transformOrigin: part.transformOrigin,
        })),
      }
    : null;

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
            onPartPointerUp={handlePartPointerUp}
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
          <div className="assembly-debug-overlay" style={{ display: "none" }}>
            <button type="button" className="assembly-debug-button" onClick={handleClearWeaponLayoutAndReload}>
              Clear Weapon localStorage and Reload
            </button>
            <pre className="assembly-debug-json">
              {layoutComparePayload ? JSON.stringify(layoutComparePayload, null, 2) : ""}
            </pre>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default WeaponAssemblyPage;
