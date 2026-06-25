import weaponFrame from "../assets/weapons/weapon-frame.png";
import weaponMagazine from "../assets/weapons/weapon-magazine.png";
import weaponSlide from "../assets/weapons/weapon-slide.png";
import pistolLayoutJson from "../data/weapons/pistol-layout.json";

export const WEAPON_CANVAS_WIDTH = 1600;
export const WEAPON_CANVAS_HEIGHT = 900;
export const WEAPON_LAYOUT_STORAGE_KEY = "velocity-duel-weapon-layout";

export type WeaponPartId = "weaponFrame" | "weaponMagazine" | "weaponSlide";

export type WeaponPartLayout = {
  rotation: number;
  scale: number;
  x: number;
  y: number;
  zIndex: number;
};

export type WeaponLayoutPreset = {
  canvasHeight: number;
  canvasWidth: number;
  layoutVersion: string;
  parts: Record<WeaponPartId, WeaponPartLayout>;
};

export type WeaponPartDefinition = {
  id: WeaponPartId;
  label: string;
  src: string;
  width: number;
};

export const WEAPON_PARTS: WeaponPartDefinition[] = [
  { id: "weaponMagazine", label: "Insert Magazine", src: weaponMagazine, width: 260 },
  { id: "weaponFrame", label: "Weapon Frame", src: weaponFrame, width: 480 },
  { id: "weaponSlide", label: "Slide In Weapon Slide", src: weaponSlide, width: 480 },
];

export const DEFAULT_WEAPON_LAYOUT: WeaponLayoutPreset = {
  layoutVersion: pistolLayoutJson.layoutVersion,
  canvasWidth: pistolLayoutJson.canvasWidth,
  canvasHeight: pistolLayoutJson.canvasHeight,
  parts: {
    weaponFrame: { ...pistolLayoutJson.parts.weaponFrame },
    weaponMagazine: { ...pistolLayoutJson.parts.weaponMagazine },
    weaponSlide: { ...pistolLayoutJson.parts.weaponSlide },
  },
};

export type WeaponLayoutSource = "json" | "localStorage" | "stale-localStorage" | "invalid-localStorage";

export type WeaponLayoutResolution = {
  layout: WeaponLayoutPreset;
  raw: string | null;
  source: WeaponLayoutSource;
};

export function serializeWeaponLayout(layout: WeaponLayoutPreset) {
  return JSON.stringify(layout, null, 2);
}

function isValidWeaponLayout(value: unknown): value is WeaponLayoutPreset {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WeaponLayoutPreset>;
  return Boolean(
    candidate.layoutVersion &&
      candidate.canvasWidth &&
      candidate.canvasHeight &&
      candidate.parts?.weaponFrame &&
      candidate.parts?.weaponMagazine &&
      candidate.parts?.weaponSlide,
  );
}

export function resolveWeaponLayout(): WeaponLayoutResolution {
  if (typeof window === "undefined") {
    return { layout: DEFAULT_WEAPON_LAYOUT, raw: null, source: "json" };
  }

  const raw = window.localStorage.getItem(WEAPON_LAYOUT_STORAGE_KEY);
  if (!raw || !import.meta.env.DEV) {
    return { layout: DEFAULT_WEAPON_LAYOUT, raw, source: "json" };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isValidWeaponLayout(parsed)) {
      window.localStorage.removeItem(WEAPON_LAYOUT_STORAGE_KEY);
      return { layout: DEFAULT_WEAPON_LAYOUT, raw, source: "invalid-localStorage" };
    }

    if (parsed.layoutVersion !== DEFAULT_WEAPON_LAYOUT.layoutVersion) {
      window.localStorage.removeItem(WEAPON_LAYOUT_STORAGE_KEY);
      return { layout: DEFAULT_WEAPON_LAYOUT, raw, source: "stale-localStorage" };
    }

    return { layout: parsed, raw, source: "localStorage" };
  } catch {
    window.localStorage.removeItem(WEAPON_LAYOUT_STORAGE_KEY);
    return { layout: DEFAULT_WEAPON_LAYOUT, raw, source: "invalid-localStorage" };
  }
}

export function readSavedWeaponLayout(): WeaponLayoutPreset {
  return resolveWeaponLayout().layout;
}
