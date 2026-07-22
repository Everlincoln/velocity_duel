import { useEffect, useState } from "react";
import { isStandaloneMode } from "../lib/gamePresentation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "velocity-duel-pwa-prompt-dismissed";

function isMobileDevice() {
  return (
    /Android|iPad|iPhone|iPod|Mobile|Tablet/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualInstallHelp] = useState(
    () =>
      !isStandaloneMode() &&
      window.localStorage.getItem(DISMISSED_KEY) !== "true" &&
      isMobileDevice(),
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || window.localStorage.getItem(DISMISSED_KEY) === "true") {
      return;
    }

    let manualHelpTimer = 0;

    if (showManualInstallHelp) {
      manualHelpTimer = window.setTimeout(() => setVisible(true), 1200);
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
      window.clearTimeout(manualHelpTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [showManualInstallHelp]);

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

  if (!visible || (!showManualInstallHelp && !installEvent)) {
    return null;
  }

  return (
    <aside className="pwa-install-prompt" aria-label="Install Velocity Duel">
      <button className="pwa-install-close" type="button" onClick={dismiss} aria-label="Dismiss install prompt">
        ×
      </button>
      <img className="pwa-install-icon" src="/pwa-icon.svg" alt="" aria-hidden="true" />
      <div className="pwa-install-copy">
        <strong>Install for fullscreen</strong>
        {installEvent ? (
          <span>Install Velocity Duel for a fullscreen game experience.</span>
        ) : (
          <span>Open your browser menu or Share options, then choose “Install app” or “Add to Home Screen”.</span>
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
