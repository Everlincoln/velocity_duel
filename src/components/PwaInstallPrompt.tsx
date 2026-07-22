import { useEffect, useState } from "react";
import { isStandaloneMode } from "../lib/gamePresentation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "velocity-duel-pwa-prompt-dismissed";

function isIosDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp] = useState(
    () =>
      !isStandaloneMode() &&
      window.localStorage.getItem(DISMISSED_KEY) !== "true" &&
      isIosDevice(),
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || window.localStorage.getItem(DISMISSED_KEY) === "true") {
      return;
    }

    let iosTimer = 0;

    if (showIosHelp) {
      iosTimer = window.setTimeout(() => setVisible(true), 1200);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [showIosHelp]);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  if (!visible || (!showIosHelp && !installEvent)) {
    return null;
  }

  return (
    <aside className="pwa-install-prompt" aria-label="Install Velocity Duel">
      <button className="pwa-install-close" type="button" onClick={dismiss} aria-label="Dismiss install prompt">
        ×
      </button>
      <img className="pwa-install-icon" src="/pwa-icon.svg" alt="" aria-hidden="true" />
      <div className="pwa-install-copy">
        <strong>Play fullscreen</strong>
        {showIosHelp ? (
          <span>Tap Safari’s Share button, then “Add to Home Screen”.</span>
        ) : (
          <span>Install Velocity Duel for a fullscreen game experience.</span>
        )}
      </div>
      {installEvent ? (
        <button className="button button-yellow pwa-install-button" type="button" onClick={install}>
          INSTALL
        </button>
      ) : null}
    </aside>
  );
}

export default PwaInstallPrompt;
