import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import WeaponCanvas from "../components/WeaponCanvas";
import {
  DEFAULT_WEAPON_LAYOUT,
  resolveWeaponLayout,
  serializeWeaponLayout,
  WEAPON_CANVAS_HEIGHT,
  WEAPON_CANVAS_WIDTH,
  WEAPON_LAYOUT_STORAGE_KEY,
  WEAPON_PARTS,
  type WeaponLayoutPreset,
  type WeaponPartId,
} from "../components/weaponCanvasConfig";

type EditorDebugInfo = {
  canvasWidth: number;
  canvasHeight: number;
  canvasParentWidth: number;
  canvasParentHeight: number;
  scaleX: number;
  scaleY: number;
};

function WeaponLayoutEditor() {
  const [selectedPartId, setSelectedPartId] = useState<WeaponPartId>("weaponMagazine");
  const [ghostMode, setGhostMode] = useState(false);
  const [debugMode, setDebugMode] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [layoutResolution] = useState(() => resolveWeaponLayout());
  const [layout, setLayout] = useState<WeaponLayoutPreset>(() => layoutResolution.layout);
  const [savedLayoutJson, setSavedLayoutJson] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [draggingPartId, setDraggingPartId] = useState<WeaponPartId | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nudgeStep, setNudgeStep] = useState(1);
  const [debugInfo, setDebugInfo] = useState<EditorDebugInfo | null>(null);
  const screenRef = useRef<HTMLElement | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);
  const canvasCardRef = useRef<HTMLElement | null>(null);

  const selectedLayout = layout.parts[selectedPartId];
  const selectedPart = useMemo(
    () => WEAPON_PARTS.find((part) => part.id === selectedPartId) ?? WEAPON_PARTS[0],
    [selectedPartId],
  );

  const updatePart = useCallback((partId: WeaponPartId, next: Partial<WeaponLayoutPreset["parts"][WeaponPartId]>) => {
    setLayout((current) => ({
      ...current,
      parts: {
        ...current.parts,
        [partId]: {
          ...current.parts[partId],
          ...next,
        },
      },
    }));
  }, []);

  const nudgeSelectedPart = useCallback((deltaX: number, deltaY: number) => {
    updatePart(selectedPartId, {
      x: Number((selectedLayout.x + deltaX).toFixed(2)),
      y: Number((selectedLayout.y + deltaY).toFixed(2)),
    });
  }, [selectedLayout.x, selectedLayout.y, selectedPartId, updatePart]);

  const toLogicalPoint = (event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    const currentTarget = event.currentTarget as HTMLElement;
    const stage =
      (currentTarget.closest(".weapon-canvas-stage") as HTMLDivElement | null) ??
      (currentTarget.querySelector(".weapon-canvas-stage") as HTMLDivElement | null);
    if (!stage) {
      return null;
    }

    const rect = stage.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WEAPON_CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * WEAPON_CANVAS_HEIGHT,
    };
  };

  const handlePartPointerDown = (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => {
    const point = toLogicalPoint(event);
    if (!point) {
      return;
    }

    const current = layout.parts[partId];
    setSelectedPartId(partId);
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

    updatePart(draggingPartId, {
      x: Number((point.x - dragOffset.x).toFixed(2)),
      y: Number((point.y - dragOffset.y).toFixed(2)),
    });
  };

  const handleCanvasPointerUp = () => {
    setDraggingPartId(null);
  };

  const handleSaveLayout = () => {
    const payload: WeaponLayoutPreset = {
      layoutVersion: DEFAULT_WEAPON_LAYOUT.layoutVersion,
      canvasWidth: WEAPON_CANVAS_WIDTH,
      canvasHeight: WEAPON_CANVAS_HEIGHT,
      parts: {
        weaponFrame: {
          ...layout.parts.weaponFrame,
          x: Number(layout.parts.weaponFrame.x.toFixed(2)),
          y: Number(layout.parts.weaponFrame.y.toFixed(2)),
          scale: Number(layout.parts.weaponFrame.scale.toFixed(3)),
          rotation: Number(layout.parts.weaponFrame.rotation.toFixed(2)),
        },
        weaponMagazine: {
          ...layout.parts.weaponMagazine,
          x: Number(layout.parts.weaponMagazine.x.toFixed(2)),
          y: Number(layout.parts.weaponMagazine.y.toFixed(2)),
          scale: Number(layout.parts.weaponMagazine.scale.toFixed(3)),
          rotation: Number(layout.parts.weaponMagazine.rotation.toFixed(2)),
        },
        weaponSlide: {
          ...layout.parts.weaponSlide,
          x: Number(layout.parts.weaponSlide.x.toFixed(2)),
          y: Number(layout.parts.weaponSlide.y.toFixed(2)),
          scale: Number(layout.parts.weaponSlide.scale.toFixed(3)),
          rotation: Number(layout.parts.weaponSlide.rotation.toFixed(2)),
        },
      },
    };

    const json = serializeWeaponLayout(payload);
    const timestamp = new Date().toLocaleString();
    window.localStorage.setItem(WEAPON_LAYOUT_STORAGE_KEY, json);
    alert("Save Layout clicked");
    console.log("Weapon layout preset:", json);
    setSavedLayoutJson(json);
    setLastSavedAt(timestamp);
    setTestMode(true);
  };

  const resetLayout = () => {
    setLayout(DEFAULT_WEAPON_LAYOUT);
    setSavedLayoutJson("");
    setLastSavedAt("");
    setTestMode(false);
  };

  useEffect(() => {
    console.log("[WeaponLayoutEditor] layout source", layoutResolution.source);
    console.log("[WeaponLayoutEditor] layout version", layout.layoutVersion);
    console.log("[WeaponLayoutEditor] loaded layout JSON", JSON.stringify(layout, null, 2));
    console.log("[WeaponLayoutEditor] canvas width/height", {
      canvasWidth: layout.canvasWidth,
      canvasHeight: layout.canvasHeight,
    });
  }, [layout, layoutResolution.source]);

  useEffect(() => {
    const updateDebugInfo = () => {
      const canvasCardElement = canvasCardRef.current;
      const canvasElement = canvasCardElement?.querySelector(".weapon-canvas") as HTMLDivElement | null;

      if (!canvasCardElement || !canvasElement) {
        return;
      }

      const canvasRect = canvasElement.getBoundingClientRect();
      const canvasParentRect = canvasCardElement.getBoundingClientRect();

      const nextDebugInfo: EditorDebugInfo = {
        canvasWidth: Number(canvasRect.width.toFixed(2)),
        canvasHeight: Number(canvasRect.height.toFixed(2)),
        canvasParentWidth: Number(canvasParentRect.width.toFixed(2)),
        canvasParentHeight: Number(canvasParentRect.height.toFixed(2)),
        scaleX: Number((canvasRect.width / WEAPON_CANVAS_WIDTH).toFixed(4)),
        scaleY: Number((canvasRect.height / WEAPON_CANVAS_HEIGHT).toFixed(4)),
      };

      console.log("[WeaponLayoutEditor][size-debug]", {
        layoutSource: layoutResolution.source,
        layoutVersion: layout.layoutVersion,
        canvasWidth: layout.canvasWidth,
        canvasHeight: layout.canvasHeight,
        weaponFrame: {
          x: layout.parts.weaponFrame.x,
          y: layout.parts.weaponFrame.y,
          scale: layout.parts.weaponFrame.scale,
        },
        weaponMagazine: {
          x: layout.parts.weaponMagazine.x,
          y: layout.parts.weaponMagazine.y,
          scale: layout.parts.weaponMagazine.scale,
        },
        weaponSlide: {
          x: layout.parts.weaponSlide.x,
          y: layout.parts.weaponSlide.y,
          scale: layout.parts.weaponSlide.scale,
        },
        renderedCanvasWidth: nextDebugInfo.canvasWidth,
        renderedCanvasHeight: nextDebugInfo.canvasHeight,
        canvasParentWidth: nextDebugInfo.canvasParentWidth,
        canvasParentHeight: nextDebugInfo.canvasParentHeight,
        canvasScale: `${nextDebugInfo.scaleX} / ${nextDebugInfo.scaleY}`,
        screenClasses: screenRef.current?.className ?? "",
        shellClasses: shellRef.current?.className ?? "",
        canvasCardClasses: canvasCardElement.className,
        canvasClasses: canvasElement.className,
      });

      setDebugInfo(nextDebugInfo);
    };

    updateDebugInfo();
    window.addEventListener("resize", updateDebugInfo);
    window.addEventListener("orientationchange", updateDebugInfo);
    return () => {
      window.removeEventListener("resize", updateDebugInfo);
      window.removeEventListener("orientationchange", updateDebugInfo);
    };
  }, [layout, layoutResolution.source]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (isFormField) {
        return;
      }

      const step = event.shiftKey ? 10 : nudgeStep;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudgeSelectedPart(-step, 0);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nudgeSelectedPart(step, 0);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        nudgeSelectedPart(0, -step);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        nudgeSelectedPart(0, step);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nudgeSelectedPart, nudgeStep]);

  return (
    <main ref={screenRef} className={`screen layout-editor-screen ${previewMode ? "is-preview-mode" : ""}`}>
      <section ref={shellRef} className="layout-editor-shell">
        <header className="layout-editor-topbar">
          <div>
            <p className="layout-editor-kicker">Developer Tool Active</p>
            <h1 className="layout-editor-title">DEV WEAPON LAYOUT EDITOR</h1>
            <p className="layout-editor-subtitle">
              Shared 1600 x 900 weapon canvas. Save from here, then verify the same layout in gameplay test mode.
            </p>
          </div>

          <div className="layout-editor-actions">
            <label className="layout-editor-toggle">
              <input type="checkbox" checked={previewMode} onChange={(event) => setPreviewMode(event.target.checked)} />
              <span>Preview mode</span>
            </label>
            <label className="layout-editor-toggle" style={previewMode ? { display: "none" } : undefined}>
              <input type="checkbox" checked={ghostMode} onChange={(event) => setGhostMode(event.target.checked)} />
              <span>Ghost mode</span>
            </label>
            <label className="layout-editor-toggle" style={previewMode ? { display: "none" } : undefined}>
              <input type="checkbox" checked={debugMode} onChange={(event) => setDebugMode(event.target.checked)} />
              <span>Debug overlay</span>
            </label>
            <label className="layout-editor-toggle" style={previewMode ? { display: "none" } : undefined}>
              <input type="checkbox" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} />
              <span>Test mode</span>
            </label>

            <button className="button button-cream" onClick={resetLayout}>
              Reset
            </button>
            <button className="button button-blue" onClick={handleSaveLayout}>
              Save Layout
            </button>
          </div>
        </header>

        <div className={`layout-editor-grid ${previewMode ? "is-preview-layout" : ""}`}>
          <section
            ref={canvasCardRef}
            className="layout-editor-canvas-card"
            onPointerMove={previewMode ? undefined : handleCanvasPointerMove}
            onPointerUp={previewMode ? undefined : handleCanvasPointerUp}
            onPointerCancel={previewMode ? undefined : handleCanvasPointerUp}
          >
            <WeaponCanvas
              debug={previewMode ? false : debugMode}
              ghostMode={previewMode ? false : ghostMode}
              layout={layout}
              onPartPointerDown={previewMode || testMode ? undefined : handlePartPointerDown}
              onPartSelect={previewMode ? undefined : setSelectedPartId}
              partClassName={previewMode || testMode ? "is-readonly" : ""}
              selectedPartId={previewMode ? null : selectedPartId}
              showLabels={!previewMode}
              snapTarget={previewMode || !debugMode ? null : { partId: selectedPartId, x: selectedLayout.x, y: selectedLayout.y }}
            />
          </section>

          {!previewMode ? (
            <aside className="layout-editor-panel">
            <div className="layout-editor-card layout-editor-selected-card">
              <p className="layout-editor-panel-kicker">Selected Part</p>
              <h2 className="layout-editor-panel-title">{selectedPart.label}</h2>

              <div className="layout-editor-tabs">
                {WEAPON_PARTS.map((part) => (
                  <button
                    key={part.id}
                    className={`layout-editor-tab ${part.id === selectedPartId ? "is-active" : ""}`}
                    onClick={() => setSelectedPartId(part.id)}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="layout-editor-card layout-editor-inspector">
              <div className="layout-editor-inspector-head">
                <p className="layout-editor-panel-kicker">Precision Controls</p>
                <h3 className="layout-editor-inspector-title">{selectedPart.label}</h3>
              </div>

              <label className="layout-editor-field">
                <span>Scale</span>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.01"
                  value={selectedLayout.scale}
                  onChange={(event) => updatePart(selectedPartId, { scale: Number(event.target.value) })}
                />
                <input
                  className="layout-editor-number"
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.01"
                  value={selectedLayout.scale}
                  onChange={(event) => updatePart(selectedPartId, { scale: Number(event.target.value) })}
                />
              </label>

              <label className="layout-editor-field">
                <span>Rotation</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={selectedLayout.rotation}
                  onChange={(event) => updatePart(selectedPartId, { rotation: Number(event.target.value) })}
                />
                <input
                  className="layout-editor-number"
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={selectedLayout.rotation}
                  onChange={(event) => updatePart(selectedPartId, { rotation: Number(event.target.value) })}
                />
              </label>

              <label className="layout-editor-field">
                <span>Z Index</span>
                <input
                  className="layout-editor-number"
                  type="number"
                  min="1"
                  max="9"
                  step="1"
                  value={selectedLayout.zIndex}
                  onChange={(event) => updatePart(selectedPartId, { zIndex: Number(event.target.value) })}
                />
              </label>

              <div className="layout-editor-position-block">
                <div className="layout-editor-coordinates">
                  <label className="layout-editor-field">
                    <span>X Position</span>
                    <input
                      className="layout-editor-number"
                      type="number"
                      step="1"
                      value={selectedLayout.x}
                      onChange={(event) => updatePart(selectedPartId, { x: Number(event.target.value) })}
                    />
                  </label>

                  <label className="layout-editor-field">
                    <span>Y Position</span>
                    <input
                      className="layout-editor-number"
                      type="number"
                      step="1"
                      value={selectedLayout.y}
                      onChange={(event) => updatePart(selectedPartId, { y: Number(event.target.value) })}
                    />
                  </label>
                </div>

                <label className="layout-editor-field">
                  <span>Nudge Step Size</span>
                  <input
                    className="layout-editor-number"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={nudgeStep}
                    onChange={(event) => setNudgeStep(Number(event.target.value) || 1)}
                  />
                </label>

                <div className="layout-editor-nudges">
                  <button className="layout-editor-nudge" onClick={() => nudgeSelectedPart(0, -nudgeStep)}>
                    Up
                  </button>
                  <button className="layout-editor-nudge" onClick={() => nudgeSelectedPart(-nudgeStep, 0)}>
                    Left
                  </button>
                  <button className="layout-editor-nudge" onClick={() => nudgeSelectedPart(nudgeStep, 0)}>
                    Right
                  </button>
                  <button className="layout-editor-nudge" onClick={() => nudgeSelectedPart(0, nudgeStep)}>
                    Down
                  </button>
                </div>
              </div>

              <button className="button button-blue layout-editor-save" onClick={handleSaveLayout}>
                Save Layout
              </button>
            </div>

            <div className="layout-editor-card">
              <p className="layout-editor-panel-kicker">Current Layout JSON</p>
              <pre className="layout-editor-json">{serializeWeaponLayout(layout)}</pre>
            </div>

            <div className="layout-editor-card">
              <p className="layout-editor-panel-kicker">Last Save Debug</p>
              <p className="layout-editor-save-time">
                {lastSavedAt ? `Last saved: ${lastSavedAt}` : "Last saved: not yet"}
              </p>
              <pre className="layout-editor-json">{savedLayoutJson || "Click Save Layout to display the exported JSON here."}</pre>
            </div>
            </aside>
          ) : null}
        </div>

        {debugInfo ? (
          <div className="assembly-debug-overlay">
            <div>layout source: {layoutResolution.source}</div>
            <div>layout version: {layout.layoutVersion}</div>
            <div>canvas logical: {layout.canvasWidth} x {layout.canvasHeight}</div>
            <div>weaponFrame: x {layout.parts.weaponFrame.x}, y {layout.parts.weaponFrame.y}, scale {layout.parts.weaponFrame.scale}</div>
            <div>
              weaponMagazine: x {layout.parts.weaponMagazine.x}, y {layout.parts.weaponMagazine.y}, scale{" "}
              {layout.parts.weaponMagazine.scale}
            </div>
            <div>weaponSlide: x {layout.parts.weaponSlide.x}, y {layout.parts.weaponSlide.y}, scale {layout.parts.weaponSlide.scale}</div>
            <div>canvas: {debugInfo.canvasWidth} x {debugInfo.canvasHeight}</div>
            <div>canvas parent: {debugInfo.canvasParentWidth} x {debugInfo.canvasParentHeight}</div>
            <div>canvas scale: {debugInfo.scaleX} / {debugInfo.scaleY}</div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default WeaponLayoutEditor;
