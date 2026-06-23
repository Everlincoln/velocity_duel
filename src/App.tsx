import { useEffect, useState } from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import MotionSetupPage from "./pages/MotionSetupPage";
import ReadyRoomPage from "./pages/ReadyRoomPage";
import WeaponAssemblyPage from "./pages/WeaponAssemblyPage";
import WeaponReadyPage from "./pages/WeaponReadyPage";
import FirePhasePage from "./pages/FirePhasePage";
import ResultPage from "./pages/ResultPage";
import WeaponLayoutEditor from "./pages/WeaponLayoutEditor";

export type Page =
  | "home"
  | "create"
  | "join"
  | "motion-setup"
  | "ready"
  | "assembly"
  | "weapon-ready"
  | "fire"
  | "result"
  | "layout-editor";

export type MotionPermissionState =
  | "unknown"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [roomCode] = useState("BOP-88");
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [motionPermission, setMotionPermission] = useState<MotionPermissionState>("unknown");
  const [pendingGameplayPage, setPendingGameplayPage] = useState<Page>("ready");
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight,
  }));
  const isDev = import.meta.env.DEV;
  const isPortrait = viewport.height > viewport.width;
  const isMobileSized = Math.min(viewport.width, viewport.height) < 900;
  const showRotateOverlay = isPortrait && isMobileSized;

  const goToGameplayStart = (nextPage: Page) => {
    if (motionPermission === "granted" || motionPermission === "unavailable" || motionPermission === "denied") {
      setCurrentPage(nextPage);
      return;
    }

    setPendingGameplayPage(nextPage);
    setCurrentPage("motion-setup");
  };

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    const orientationApi = screen.orientation;
    if (!orientationApi?.lock) {
      return;
    }

    orientationApi.lock("landscape").catch(() => {
      // Some browsers require fullscreen or a user gesture. We fall back to the rotate overlay.
    });
  }, []);

  return (
    <div className="app-shell">
      {showRotateOverlay ? (
        <div className="rotate-overlay" role="dialog" aria-modal="true" aria-label="Rotate phone to play">
          <div className="rotate-overlay-card">
            <div className="rotate-phone-icon" aria-hidden="true">
              <span className="rotate-phone-device" />
              <span className="rotate-phone-arrow">↻</span>
            </div>
            <h1 className="rotate-overlay-title">Please rotate your phone to play</h1>
            <p className="rotate-overlay-text">Velocity Duel is designed for landscape mode.</p>
          </div>
        </div>
      ) : (
        <>
          {isDev && currentPage !== "layout-editor" ? (
            <button
              className="dev-layout-toggle"
              aria-label="Open weapon layout editor"
              onClick={() => setCurrentPage("layout-editor")}
            >
              Open Layout Editor
            </button>
          ) : null}

          {currentPage === "home" && <HomePage setCurrentPage={setCurrentPage} />}
          {currentPage === "create" && (
            <CreateRoomPage roomCode={roomCode} startGame={goToGameplayStart} />
          )}
          {currentPage === "join" && (
            <JoinRoomPage roomCode={roomCode} setCurrentPage={setCurrentPage} startGame={goToGameplayStart} />
          )}
          {currentPage === "motion-setup" && (
            <MotionSetupPage
              motionPermission={motionPermission}
              pendingGameplayPage={pendingGameplayPage}
              setCurrentPage={setCurrentPage}
              setMotionPermission={setMotionPermission}
            />
          )}
          {currentPage === "ready" && <ReadyRoomPage roomCode={roomCode} setCurrentPage={setCurrentPage} />}
          {currentPage === "assembly" && (
            <WeaponAssemblyPage setCurrentPage={setCurrentPage} setReactionTimeMs={setReactionTimeMs} />
          )}
          {currentPage === "weapon-ready" && <WeaponReadyPage setCurrentPage={setCurrentPage} />}
          {currentPage === "fire" && (
            <FirePhasePage
              motionPermission={motionPermission}
              setCurrentPage={setCurrentPage}
              setReactionTimeMs={setReactionTimeMs}
            />
          )}
          {currentPage === "result" && (
            <ResultPage reactionTimeMs={reactionTimeMs} setCurrentPage={setCurrentPage} />
          )}
          {isDev && currentPage === "layout-editor" && <WeaponLayoutEditor setCurrentPage={setCurrentPage} />}
        </>
      )}
    </div>
  );
}

export default App;
