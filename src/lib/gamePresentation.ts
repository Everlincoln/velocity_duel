type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as NavigatorWithStandalone).standalone)
  );
}

export function clearActiveInputFocus() {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
  window.getSelection()?.removeAllRanges();
}

async function lockLandscape() {
  try {
    await screen.orientation?.lock?.("landscape");
  } catch {
    // Orientation locking is optional and is commonly restricted to fullscreen or installed apps.
  }
}

export async function requestGamePresentation() {
  if (isStandaloneMode()) {
    await lockLandscape();
    return;
  }

  const root = document.documentElement as WebkitFullscreenElement;

  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: "hide" });
    } else {
      root.webkitRequestFullscreen?.();
    }
  } catch {
    // iPhone Safari does not provide element fullscreen; the game remains viewport-fitted there.
  }

  await lockLandscape();
}
