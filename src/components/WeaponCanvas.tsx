import type { PointerEvent as ReactPointerEvent } from "react";
import { WEAPON_PARTS, type WeaponLayoutPreset, type WeaponPartId } from "./weaponCanvasConfig";

type WeaponCanvasProps = {
  debug?: boolean;
  ghostMode?: boolean;
  layout: WeaponLayoutPreset;
  onPartPointerDown?: (partId: WeaponPartId, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPartSelect?: (partId: WeaponPartId) => void;
  partClassName?: string;
  selectedPartId?: WeaponPartId | null;
  showLabels?: boolean;
  snapTarget?: { partId: WeaponPartId; x: number; y: number } | null;
  visiblePartIds?: WeaponPartId[];
};

function WeaponCanvas({
  debug = false,
  ghostMode = false,
  layout,
  onPartPointerDown,
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

        {WEAPON_PARTS.filter((part) => !visiblePartIds || visiblePartIds.includes(part.id)).map((part) => {
          const partLayout = layout.parts[part.id];
          const isSelected = selectedPartId === part.id;
          const isSnapTarget = snapTarget?.partId === part.id;

          return (
            <button
              key={part.id}
              type="button"
              className={`weapon-canvas-part ${partClassName} ${isSelected ? "is-selected" : ""} ${ghostMode ? "is-ghost" : ""}`}
              style={{
                left: `${(partLayout.x / layout.canvasWidth) * 100}%`,
                top: `${(partLayout.y / layout.canvasHeight) * 100}%`,
                width: `${(part.width / layout.canvasWidth) * 100}%`,
                zIndex: partLayout.zIndex,
                transform: `translate(-50%, -50%) rotate(${partLayout.rotation}deg) scale(${partLayout.scale})`,
              }}
              onClick={() => onPartSelect?.(part.id)}
              onPointerDown={(event) => onPartPointerDown?.(part.id, event)}
            >
              <img src={part.src} alt={part.label} />
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
        })}

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
