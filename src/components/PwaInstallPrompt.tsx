import { useEffect, useState } from "react";
import { isStandaloneMode } from "../lib/gamePresentation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_AT_KEY = "velocity-duel-pwa-prompt-dismissed-at";
const REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

function canAutomaticallyRemind() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY));
  return !Number.isFinite(dismissedAt) || Date.now() - dismissedAt >= REMINDER_DELAY_MS;
}

function isMobileDevice() {
  return (
    /Android|iPad|iPhone|iPod|Mobile|Tablet/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualInstallHelp] = useState(() => !isStandaloneMode() && isMobileDevice());
  const [allowAutomaticPrompt] = useState(canAutomaticallyRemind);
  const [installed, setInstalled] = useState(isStandaloneMode);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (installed) {
      return;
    }

    let manualHelpTimer = 0;

    if (showManualInstallHelp && allowAutomaticPrompt) {
      manualHelpTimer = window.setTimeout(() => setVisible(true), 1200);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (allowAutomaticPrompt) {
        setVisible(true);
      }
    };

    const handleInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(manualHelpTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [allowAutomaticPrompt, installed, showManualInstallHelp]);

  const continueInBrowser = () => {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setVisible(false);
    } else {
      continueInBrowser();
    }
    setInstallEvent(null);
  };

  if (installed || (!showManualInstallHelp && !installEvent)) {
    return null;
  }

  if (!visible) {
    return (
      <button className="pwa-install-reopen" type="button" onClick={() => setVisible(true)}>
        <img src="/pwa-icon.svg" alt="" aria-hidden="true" />
        <span>FULLSCREEN APP</span>
      </button>
    );
  }

  return (
    <aside className="pwa-install-prompt" aria-label="Install Velocity Duel" aria-live="polite">
      <button
        className="pwa-install-close"
        type="button"
        onClick={continueInBrowser}
        aria-label="Continue in browser"
      >
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
      <div className="pwa-install-actions">
        {installEvent ? (
          <button className="button button-yellow pwa-install-button" type="button" onClick={install}>
            INSTALL
          </button>
        ) : null}
        <button className="pwa-continue-button" type="button" onClick={continueInBrowser}>
          CONTINUE IN BROWSER
        </button>
      </div>
    </aside>
  );
}

export default PwaInstallPrompt;
