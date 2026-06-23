import weaponFrame from "../assets/weapons/weapon-frame.png";
import weaponMagazine from "../assets/weapons/weapon-magazine.png";
import weaponSlide from "../assets/weapons/weapon-slide.png";

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
  canvasWidth: WEAPON_CANVAS_WIDTH,
  canvasHeight: WEAPON_CANVAS_HEIGHT,
  parts: {
    weaponFrame: { x: 800, y: 450, scale: 1.25, rotation: 0, zIndex: 2 },
    weaponMagazine: { x: 820, y: 620, scale: 1.4, rotation: 0, zIndex: 1 },
    weaponSlide: { x: 800, y: 300, scale: 1.33, rotation: 0, zIndex: 3 },
  },
};

export function serializeWeaponLayout(layout: WeaponLayoutPreset) {
  return JSON.stringify(layout, null, 2);
}

export function readSavedWeaponLayout(): WeaponLayoutPreset {
  if (typeof window === "undefined") {
    return DEFAULT_WEAPON_LAYOUT;
  }

  const raw = window.localStorage.getItem(WEAPON_LAYOUT_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_WEAPON_LAYOUT;
  }

  try {
    const parsed = JSON.parse(raw) as WeaponLayoutPreset;
    if (!parsed.canvasWidth || !parsed.canvasHeight || !parsed.parts) {
      return DEFAULT_WEAPON_LAYOUT;
    }
    return parsed;
  } catch {
    return DEFAULT_WEAPON_LAYOUT;
  }
}
