import { useEffect, useMemo, useState } from "react";
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
import { getSocket } from "./lib/socket";

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

export type RoomPlayer = {
  socketId: string;
  playerNumber: 1 | 2;
  nickname: string;
  ready: boolean;
  reactionTimeMs: number | null;
};

export type DuelResult = {
  outcome: "win" | "lose";
  reactionTimeMs: number | null;
  multiplayer: boolean;
};

type RoomStatePayload = {
  roomCode: string;
  players: RoomPlayer[];
};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const NICKNAME_ADJECTIVES = [
  "Rocket",
  "Chaos",
  "Disco",
  "Space",
  "Turbo",
  "Lucky",
  "Sneaky",
  "Tiny",
  "Sleepy",
  "Dancing",
  "Grumpy",
  "Confused",
];

const NICKNAME_NOUNS = [
  "Duck",
  "Potato",
  "Banana",
  "Penguin",
  "Frog",
  "Carrot",
  "Whale",
  "Panda",
  "Dragon",
  "Ghost",
  "Cactus",
  "Marshmallow",
];

function generateFunNickname() {
  const adjective = NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const noun = NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
  return `${adjective} ${noun}`;
}

function normalizeNicknameInput(input: string) {
  return input.trim().replace(/\s+/g, " ").slice(0, 24);
}

function getJoinRoomValidationError(input: string) {
  const trimmedRoomCode = input.trim().toUpperCase();

  if (!trimmedRoomCode) {
    return "Please enter a room code.";
  }

  if (!/^[A-Z0-9]{4,6}$/.test(trimmedRoomCode)) {
    return "Enter a valid room code.";
  }

  return null;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [roomCode, setRoomCode] = useState(generateRoomCode());
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [motionPermission, setMotionPermission] = useState<MotionPermissionState>("unknown");
  const [pendingGameplayPage, setPendingGameplayPage] = useState<Page>("ready");
  const [motionReturnPage, setMotionReturnPage] = useState<Page>("home");
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [currentPlayerNumber, setCurrentPlayerNumber] = useState<1 | 2 | null>(null);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [socketAvailable, setSocketAvailable] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [sessionNickname, setSessionNickname] = useState("");
  const [fallbackOpponentNickname] = useState(() => generateFunNickname());
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    height: typeof window === "undefined" ? 720 : window.innerHeight,
  }));
  const socket = useMemo(() => getSocket(), []);
  const isDev = import.meta.env.DEV;
  const isPortrait = viewport.height > viewport.width;
  const isMobileSized = Math.min(viewport.width, viewport.height) < 900;
  const showRotateOverlay = isPortrait && isMobileSized;
  const useSocketReadyFlow = socketAvailable && currentPlayerNumber !== null && roomPlayers.length > 0;

  const goToGameplayStart = (nextPage: Page) => {
    if (motionPermission === "granted") {
      setCurrentPage(nextPage);
      return;
    }

    setPendingGameplayPage(nextPage);
    setMotionReturnPage(currentPage);
    setCurrentPage("motion-setup");
  };

  const resetRoomSession = () => {
    setRoomPlayers([]);
    setCurrentPlayerNumber(null);
    setDuelResult(null);
    setReactionTimeMs(null);
    setRoomError(null);
    setRoomActionLoading(false);
  };

  const resolveSessionNickname = () => {
    const normalizedNickname = normalizeNicknameInput(nicknameInput);

    if (normalizedNickname) {
      setSessionNickname(normalizedNickname);
      return normalizedNickname;
    }

    if (sessionNickname) {
      return sessionNickname;
    }

    const generatedNickname = generateFunNickname();
    setSessionNickname(generatedNickname);
    return generatedNickname;
  };

  const ensureSocketConnection = async () => {
    if (socket.connected) {
      setSocketAvailable(true);
      return true;
    }

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let timeoutId = 0;

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleError);
      };

      const finish = (value: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        setSocketAvailable(value);
        resolve(value);
      };

      const handleConnect = () => {
        console.log("[socket] connected", socket.id);
        finish(true);
      };

      const handleError = (error: Error) => {
        console.log("[socket] connect_error", error.message);
        finish(false);
      };

      timeoutId = window.setTimeout(() => {
        finish(false);
      }, 2000);

      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
      socket.on("connect", handleConnect);
      socket.on("connect_error", handleError);
      socket.connect();
    });
  };

  const handleCreateRoom = async () => {
    const nextRoomCode = roomCode || generateRoomCode();
    const nickname = resolveSessionNickname();
    setRoomCode(nextRoomCode);
    setDuelResult(null);
    setReactionTimeMs(null);
    setRoomError(null);
    setRoomActionLoading(true);

    const connected = await ensureSocketConnection();
    if (!connected) {
      console.log("[socket] createRoom connection failed", nextRoomCode);
      setSocketAvailable(false);
      resetRoomSession();
      setRoomError("Cannot connect to multiplayer server. Please start the server and try again.");
      setRoomActionLoading(false);
      setCurrentPage("home");
      return;
    }

    socket.emit(
      "createRoom",
      { roomCode: nextRoomCode, nickname },
      (result: { ok: boolean; error?: string; room?: RoomStatePayload; playerNumber?: 1 | 2 }) => {
        console.log("[socket] createRoom result", result);
        setRoomActionLoading(false);

        if (!result?.ok || !result.room || !result.playerNumber) {
          setRoomError(result?.error || "Unable to create room.");
          return;
        }

        setRoomCode(result.room.roomCode);
        setCurrentPlayerNumber(result.playerNumber);
        setRoomPlayers(result.room.players);
        setCurrentPage("ready");
      },
    );
  };

  const handleJoinRoom = async (nextRoomCode: string) => {
    const trimmedRoomCode = nextRoomCode.trim().toUpperCase();
    const validationError = getJoinRoomValidationError(trimmedRoomCode);
    const nickname = resolveSessionNickname();
    setDuelResult(null);
    setReactionTimeMs(null);

    if (validationError) {
      setRoomError(validationError);
      setRoomActionLoading(false);
      return;
    }

    setRoomError(null);
    setRoomActionLoading(true);
    setRoomCode(trimmedRoomCode);

    const connected = await ensureSocketConnection();
    if (!connected) {
      console.log("[socket] joinRoom connection failed", trimmedRoomCode);
      setSocketAvailable(false);
      resetRoomSession();
      setRoomError("Cannot connect to multiplayer server. Please start the server and try again.");
      setRoomActionLoading(false);
      setCurrentPage("join");
      return;
    }

    socket.emit(
      "joinRoom",
      { roomCode: trimmedRoomCode, nickname },
      (result: { ok: boolean; error?: string; room?: RoomStatePayload; playerNumber?: 1 | 2 }) => {
        console.log("[socket] joinRoom result", result);
        setRoomActionLoading(false);

        if (!result?.ok || !result.room || !result.playerNumber) {
          const normalizedError =
            result?.error === "Room not found" || result?.error === "Room not found."
              ? "Room not found."
              : result?.error === "Room is full" || result?.error === "Room is full."
                ? "Room is full."
                : result?.error || "Unable to join room.";
          setRoomError(normalizedError);
          return;
        }

        setRoomCode(result.room.roomCode);
        setCurrentPlayerNumber(result.playerNumber);
        setRoomPlayers(result.room.players);
        setCurrentPage("ready");
      },
    );
  };

  const handleSocketReadyToggle = () => {
    if (!socket.connected || !currentPlayerNumber) {
      return;
    }

    const currentPlayer = roomPlayers.find((player) => player.playerNumber === currentPlayerNumber);
    const nextReady = !currentPlayer?.ready;

    socket.emit(
      "playerReady",
      { roomCode, ready: nextReady },
      (result: { ok: boolean; error?: string; room?: RoomStatePayload }) => {
        console.log("[socket] playerReady", result);
        if (!result?.ok) {
          setRoomError(result?.error || "Unable to update ready state.");
        }
      },
    );
  };

  const handleLeaveRoom = () => {
    if (socket.connected && currentPlayerNumber) {
      socket.emit("leaveRoom", { roomCode }, (result: { ok: boolean }) => {
        console.log("[socket] leaveRoom", result);
      });
    }

    resetRoomSession();
    setRoomCode(generateRoomCode());
    setCurrentPage("home");
  };

  const handlePlayAgain = () => {
    setDuelResult(null);
    setReactionTimeMs(null);

    if (useSocketReadyFlow && socket.connected && currentPlayerNumber) {
      socket.emit(
        "playerReady",
        { roomCode, ready: false },
        (result: { ok: boolean; error?: string; room?: RoomStatePayload }) => {
          console.log("[socket] resetForReplay", result);
          if (!result?.ok) {
            setRoomError(result?.error || "Unable to reset the room.");
          }
        },
      );
      setCurrentPage("ready");
      return;
    }

    setCurrentPage("assembly");
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

  useEffect(() => {
    const handleConnect = () => {
      console.log("[socket] connected", socket.id);
      setSocketAvailable(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log("[socket] disconnected", reason);
      setSocketAvailable(false);
    };

    const handleRoomUpdated = (room: RoomStatePayload) => {
      setRoomCode(room.roomCode);
      setRoomPlayers(room.players);
    };

    const handlePlayerJoined = (payload: { room: RoomStatePayload; playerNumber: 1 | 2 }) => {
      console.log("[socket] playerJoined", payload);
      setRoomCode(payload.room.roomCode);
      setRoomPlayers(payload.room.players);
    };

    const handlePlayerLeft = (room: RoomStatePayload) => {
      console.log("[socket] playerLeft", room);
      setRoomCode(room.roomCode);
      setRoomPlayers(room.players);
    };

    const handleBothPlayersReady = (room: RoomStatePayload) => {
      console.log("[socket] bothPlayersReady", room);
      setRoomCode(room.roomCode);
      setRoomPlayers(room.players);
      setDuelResult(null);
      setReactionTimeMs(null);
      setCurrentPage("assembly");
    };

    const handleGameResult = (payload: {
      winnerPlayerNumber: 1 | 2;
      winnerReactionTimeMs: number | null;
      loserPlayerNumber: 1 | 2 | null;
      loserReactionTimeMs: number | null;
      players: RoomPlayer[];
    }) => {
      console.log("[socket] gameResult", payload);
      setRoomPlayers(payload.players);

      if (!currentPlayerNumber) {
        return;
      }

      const didWin = payload.winnerPlayerNumber === currentPlayerNumber;
      const visibleReactionTime = didWin ? payload.winnerReactionTimeMs : payload.winnerReactionTimeMs;

      setDuelResult({
        outcome: didWin ? "win" : "lose",
        reactionTimeMs: visibleReactionTime,
        multiplayer: true,
      });
      setReactionTimeMs(visibleReactionTime);
      setCurrentPage("result");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("roomUpdated", handleRoomUpdated);
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    socket.on("bothPlayersReady", handleBothPlayersReady);
    socket.on("gameResult", handleGameResult);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("roomUpdated", handleRoomUpdated);
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
      socket.off("bothPlayersReady", handleBothPlayersReady);
      socket.off("gameResult", handleGameResult);
    };
  }, [currentPlayerNumber, goToGameplayStart, socket]);

  useEffect(() => {
    if (currentPage === "create" && !socketAvailable && roomPlayers.length === 0 && !currentPlayerNumber) {
      setRoomCode(generateRoomCode());
      setRoomError(null);
    }
  }, [currentPage, currentPlayerNumber, roomPlayers.length, socketAvailable]);

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

          {currentPage === "home" && (
            <HomePage
              setCurrentPage={setCurrentPage}
              onStartGame={handleCreateRoom}
              roomActionLoading={roomActionLoading}
              roomError={roomError}
              nickname={nicknameInput}
              onNicknameChange={setNicknameInput}
            />
          )}
          {currentPage === "create" && (
            <CreateRoomPage
              roomCode={roomCode}
              startGame={setCurrentPage}
              onCreateRoom={handleCreateRoom}
              roomActionLoading={roomActionLoading}
              roomError={roomError}
            />
          )}
          {currentPage === "join" && (
            <JoinRoomPage
              roomCode={roomCode}
              startGame={setCurrentPage}
              onJoinRoom={handleJoinRoom}
              roomActionLoading={roomActionLoading}
              roomError={roomError}
            />
          )}
          {currentPage === "motion-setup" && (
            <MotionSetupPage
              motionPermission={motionPermission}
              pendingGameplayPage={pendingGameplayPage}
              returnPage={motionReturnPage}
              setCurrentPage={setCurrentPage}
              setMotionPermission={setMotionPermission}
            />
          )}
          {currentPage === "ready" && (
            <ReadyRoomPage
              roomCode={roomCode}
              setCurrentPage={setCurrentPage}
              useSocketFlow={useSocketReadyFlow}
              currentPlayerNumber={currentPlayerNumber}
              roomPlayers={roomPlayers}
              onToggleReady={handleSocketReadyToggle}
              onLeaveRoom={handleLeaveRoom}
              motionPermission={motionPermission}
              setMotionPermission={setMotionPermission}
              fallbackCurrentNickname={sessionNickname || normalizeNicknameInput(nicknameInput) || "Rocket Duck"}
              fallbackOpponentNickname={fallbackOpponentNickname}
            />
          )}
          {currentPage === "assembly" && (
            <WeaponAssemblyPage setCurrentPage={setCurrentPage} setReactionTimeMs={setReactionTimeMs} />
          )}
          {currentPage === "weapon-ready" && <WeaponReadyPage setCurrentPage={setCurrentPage} />}
          {currentPage === "fire" && (
            <FirePhasePage
              motionPermission={motionPermission}
              roomCode={roomCode}
              useSocketFlow={useSocketReadyFlow}
              setCurrentPage={setCurrentPage}
              setReactionTimeMs={setReactionTimeMs}
            />
          )}
          {currentPage === "result" && (
            <ResultPage
              duelResult={duelResult}
              onBackHome={handleLeaveRoom}
              onPlayAgain={handlePlayAgain}
              reactionTimeMs={reactionTimeMs}
            />
          )}
          {isDev && currentPage === "layout-editor" && <WeaponLayoutEditor setCurrentPage={setCurrentPage} />}
        </>
      )}
    </div>
  );
}

export default App;
