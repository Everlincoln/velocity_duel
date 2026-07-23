import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useDrag } from "@use-gesture/react";
import { WEAPON_PARTS, type WeaponLayoutPreset, type WeaponPartId } from "./weaponCanvasConfig";

export type PartGesturePoint = {
  clientX: number;
  clientY: number;
};

type WeaponCanvasProps = {
  debug?: boolean;
  ghostMode?: boolean;
  layout: WeaponLayoutPreset;
  onPartPointerDown?: (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPartLostPointerCapture?: (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPartPointerMove?: (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPartPointerUp?: (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPartGestureStart?: (partId: WeaponPartId, point: PartGesturePoint, element: HTMLButtonElement) => void;
  onPartGestureMove?: (partId: WeaponPartId, point: PartGesturePoint) => void;
  onPartGestureEnd?: (partId: WeaponPartId, canceled: boolean) => void;
  onPartSelect?: (partId: WeaponPartId) => void;
  partClassName?: string;
  selectedPartId?: WeaponPartId | null;
  showLabels?: boolean;
  snapTarget?: { partId: WeaponPartId; x: number; y: number } | null;
  visiblePartIds?: WeaponPartId[];
};

type WeaponCanvasPartProps = {
  debug: boolean;
  ghostMode: boolean;
  layout: WeaponLayoutPreset;
  onPartGestureEnd?: WeaponCanvasProps["onPartGestureEnd"];
  onPartGestureMove?: WeaponCanvasProps["onPartGestureMove"];
  onPartGestureStart?: WeaponCanvasProps["onPartGestureStart"];
  onPartLostPointerCapture?: WeaponCanvasProps["onPartLostPointerCapture"];
  onPartPointerDown?: WeaponCanvasProps["onPartPointerDown"];
  onPartPointerMove?: WeaponCanvasProps["onPartPointerMove"];
  onPartPointerUp?: WeaponCanvasProps["onPartPointerUp"];
  onPartSelect?: WeaponCanvasProps["onPartSelect"];
  part: (typeof WEAPON_PARTS)[number];
  partClassName: string;
  selectedPartId: WeaponPartId | null;
  showLabels: boolean;
  snapTarget: WeaponCanvasProps["snapTarget"];
};

function WeaponCanvasPart({
  debug,
  ghostMode,
  layout,
  onPartGestureEnd,
  onPartGestureMove,
  onPartGestureStart,
  onPartLostPointerCapture,
  onPartPointerDown,
  onPartPointerMove,
  onPartPointerUp,
  onPartSelect,
  part,
  partClassName,
  selectedPartId,
  showLabels,
  snapTarget,
}: WeaponCanvasPartProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const gestureEnabled = Boolean(onPartGestureStart && onPartGestureMove && onPartGestureEnd);
  const bindDrag = useDrag(
    ({ canceled, first, last, xy: [clientX, clientY] }) => {
      const point = { clientX, clientY };

      if (first && buttonRef.current) {
        onPartGestureStart?.(part.id, point, buttonRef.current);
      }

      if (!first || last) {
        onPartGestureMove?.(part.id, point);
      }

      if (last) {
        onPartGestureEnd?.(part.id, canceled);
      }
    },
    {
      enabled: gestureEnabled,
      eventOptions: { passive: false },
      pointer: { capture: false },
      preventDefault: true,
    },
  );
  const partLayout = layout.parts[part.id];
  const isSelected = selectedPartId === part.id;
  const isSnapTarget = snapTarget?.partId === part.id;
  const dragBindings = gestureEnabled ? bindDrag() : {};

  return (
    <button
      ref={buttonRef}
      type="button"
      data-part-id={part.id}
      className={`weapon-canvas-part ${partClassName} ${isSelected ? "is-selected" : ""} ${ghostMode ? "is-ghost" : ""}`}
      style={{
        left: `${(partLayout.x / layout.canvasWidth) * 100}%`,
        top: `${(partLayout.y / layout.canvasHeight) * 100}%`,
        width: `${(part.width / layout.canvasWidth) * 100}%`,
        zIndex: isSelected ? Math.max(partLayout.zIndex, 50) : partLayout.zIndex,
        transform: `translate(-50%, -50%) rotate(${partLayout.rotation}deg) scale(${partLayout.scale})`,
      }}
      onClick={() => onPartSelect?.(part.id)}
      onPointerDown={(event) => onPartPointerDown?.(part.id, event)}
      onLostPointerCapture={(event) => onPartLostPointerCapture?.(part.id, event)}
      onPointerMove={(event) => onPartPointerMove?.(part.id, event)}
      onPointerUp={(event) => onPartPointerUp?.(part.id, event)}
      onPointerCancel={(event) => onPartPointerUp?.(part.id, event)}
      onContextMenu={(event) => (onPartPointerDown || gestureEnabled) && event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      {...dragBindings}
    >
      <img src={part.src} alt={part.label} draggable={false} />
      {showLabels ? <span className="weapon-canvas-part-label">{part.label}</span> : null}
      {debug ? (
        <>
          <span className="weapon-canvas-origin" aria-hidden="true" />
          <span className="weapon-canvas-box" aria-hidden="true" />
        </>
      ) : null}
      {debug && isSnapTarget ? <span className="weapon-canvas-snap-marker" aria-hidden="true" /> : null}
    </button>
  );
}

function WeaponCanvas({
  debug = false,
  ghostMode = false,
  layout,
  onPartPointerDown,
  onPartLostPointerCapture,
  onPartPointerMove,
  onPartPointerUp,
  onPartGestureStart,
  onPartGestureMove,
  onPartGestureEnd,
  onPartSelect,
  partClassName = "",
  selectedPartId = null,
  showLabels = true,
  snapTarget = null,
  visiblePartIds,
}: WeaponCanvasProps) {
  return (
    <div
      className={`weapon-canvas ${debug ? "weapon-canvas-debug" : ""}`}
      style={{ aspectRatio: `${layout.canvasWidth} / ${layout.canvasHeight}` }}
    >
      <div className="weapon-canvas-stage">
        <div className="weapon-canvas-boundary" aria-hidden="true" />
        <div className="weapon-canvas-center" aria-hidden="true" />

        {WEAPON_PARTS.filter((part) => !visiblePartIds || visiblePartIds.includes(part.id)).map((part) => (
          <WeaponCanvasPart
            key={part.id}
            debug={debug}
            ghostMode={ghostMode}
            layout={layout}
            onPartGestureEnd={onPartGestureEnd}
            onPartGestureMove={onPartGestureMove}
            onPartGestureStart={onPartGestureStart}
            onPartLostPointerCapture={onPartLostPointerCapture}
            onPartPointerDown={onPartPointerDown}
            onPartPointerMove={onPartPointerMove}
            onPartPointerUp={onPartPointerUp}
            onPartSelect={onPartSelect}
            part={part}
            partClassName={partClassName}
            selectedPartId={selectedPartId}
            showLabels={showLabels}
            snapTarget={snapTarget}
          />
        ))}

        {debug && snapTarget ? (
          <div
            className="weapon-canvas-target"
            style={{
              left: `${(snapTarget.x / layout.canvasWidth) * 100}%`,
              top: `${(snapTarget.y / layout.canvasHeight) * 100}%`,
            }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}

export default WeaponCanvas;
