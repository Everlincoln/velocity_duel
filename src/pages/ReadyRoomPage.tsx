import { useEffect, useMemo, useState } from "react";
import type { MotionPermissionState, Page, RoomPlayer } from "../App";
import player1 from "../assets/characters/player1.png";
import player2 from "../assets/characters/player2.png";

type Props = {
  roomCode: string;
  setCurrentPage: (page: Page) => void;
  useSocketFlow?: boolean;
  currentPlayerNumber?: 1 | 2 | null;
  roomPlayers?: RoomPlayer[];
  onToggleReady?: () => void;
  onLeaveRoom?: () => void;
  motionPermission: MotionPermissionState;
  setMotionPermission: (value: MotionPermissionState) => void;
  fallbackCurrentNickname?: string;
  fallbackOpponentNickname?: string;
};

type IOSDeviceMotionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

async function requestMotionAccess() {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
    return "unavailable" as MotionPermissionState;
  }

  const motionEvent = DeviceMotionEvent as IOSDeviceMotionEvent;
  if (typeof motionEvent.requestPermission === "function") {
    const permission = await motionEvent.requestPermission();
    return permission === "granted" ? "granted" : "denied";
  }

  return "granted" as MotionPermissionState;
}

function ReadyRoomPage({
  roomCode,
  setCurrentPage,
  useSocketFlow = false,
  currentPlayerNumber = null,
  roomPlayers = [],
  onToggleReady,
  onLeaveRoom,
  motionPermission,
  setMotionPermission,
  fallbackCurrentNickname = "Rocket Duck",
  fallbackOpponentNickname = "Chaos Banana",
}: Props) {
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "copied" | "failed">("idle");
  const isTouchDevice =
    typeof window !== "undefined" &&
    (navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)").matches === true);

  const socketPlayer1 = useMemo(
    () => roomPlayers.find((player) => player.playerNumber === 1),
    [roomPlayers],
  );
  const socketPlayer2 = useMemo(
    () => roomPlayers.find((player) => player.playerNumber === 2),
    [roomPlayers],
  );

  const requestPermissionAndReady = async (playerNumber: 1 | 2) => {
    const triggerReady = () => {
      setPermissionMessage(null);

      if (useSocketFlow) {
        if (currentPlayerNumber === playerNumber) {
          onToggleReady?.();
        }
        return;
      }

      if (playerNumber === 1) {
        const nextPlayer1Ready = !player1Ready;
        const nextBothReady = nextPlayer1Ready && player2Ready;
        setPlayer1Ready(nextPlayer1Ready);
        setCountdown(nextBothReady ? 3 : null);
        return;
      }

      const nextPlayer2Ready = !player2Ready;
      const nextBothReady = player1Ready && nextPlayer2Ready;
      setPlayer2Ready(nextPlayer2Ready);
      setCountdown(nextBothReady ? 3 : null);
    };

    if (!isTouchDevice) {
      triggerReady();
      return;
    }

    if (motionPermission === "granted") {
      triggerReady();
      return;
    }

    try {
      setMotionPermission("requesting");
      const result = await requestMotionAccess();

      if (result === "granted") {
        setMotionPermission("granted");
        triggerReady();
        return;
      }

      setMotionPermission(result);
      setPermissionMessage("Motion access is required to play on mobile. Please enable motion permission and try again.");
    } catch {
      setMotionPermission("denied");
      setPermissionMessage("Motion access is required to play on mobile. Please enable motion permission and try again.");
    }
  };

  const handlePlayer1Toggle = () => {
    if (useSocketFlow && currentPlayerNumber !== 1) {
      return;
    }
    void requestPermissionAndReady(1);
  };

  const handlePlayer2Toggle = () => {
    if (useSocketFlow && currentPlayerNumber !== 2) {
      return;
    }
    void requestPermissionAndReady(2);
  };

  const handleCopyRoomCode = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyFeedback("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(roomCode);
      setCopyFeedback("copied");
    } catch {
      setCopyFeedback("failed");
    }
  };

  useEffect(() => {
    if (useSocketFlow) {
      return;
    }

    if (countdown === null) {
      return;
    }

    if (countdown === 0) {
      setCurrentPage("assembly");
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, setCurrentPage, useSocketFlow]);

  useEffect(() => {
    if (copyFeedback === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyFeedback("idle");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copyFeedback]);

  const displayPlayer1Ready = useSocketFlow ? (socketPlayer1?.ready ?? false) : player1Ready;
  const displayPlayer2Ready = useSocketFlow ? (socketPlayer2?.ready ?? false) : player2Ready;
  const displayCountdown = useSocketFlow ? null : countdown;
  const player1IsCurrent = !useSocketFlow || currentPlayerNumber === 1;
  const player2IsCurrent = !useSocketFlow || currentPlayerNumber === 2;
  const player1Present = useSocketFlow ? Boolean(socketPlayer1) : true;
  const player2Present = useSocketFlow ? Boolean(socketPlayer2) : true;
  const player1Name = useSocketFlow
    ? socketPlayer1?.nickname ?? "Waiting..."
    : currentPlayerNumber === 2
      ? fallbackOpponentNickname
      : fallbackCurrentNickname;
  const player2Name = useSocketFlow
    ? socketPlayer2?.nickname ?? "Waiting..."
    : currentPlayerNumber === 2
      ? fallbackCurrentNickname
      : fallbackOpponentNickname;

  const getActionLabel = (isCurrentPlayer: boolean, isReady: boolean) => {
    if (isReady) {
      return "READY";
    }

    if (!isCurrentPlayer) {
      return "NOT READY";
    }

    if (!isTouchDevice) {
      return "READY";
    }

    if (motionPermission === "requesting") {
      return "CHECKING...";
    }

    if (motionPermission === "denied" || motionPermission === "unavailable") {
      return "TRY AGAIN";
    }

    if (motionPermission === "granted") {
      return "READY";
    }

    return "ENABLE MOTION";
  };

  const getOtherPlayerStatus = (isPresent: boolean, isReady: boolean) => {
    if (!isPresent) {
      return "WAITING...";
    }

    if (isReady) {
      return "READY";
    }

    return "NOT READY";
  };

  const renderPlayerAction = (
    isCurrentPlayer: boolean,
    isPresent: boolean,
    isReady: boolean,
    onToggle: () => void,
  ) => {
    if (!isCurrentPlayer) {
      return (
        <div className={`ready-status ready-status-passive ${isReady ? "ready-badge-on" : "ready-badge-off"}`}>
          <span className="ready-check">{isReady ? "✓" : isPresent ? "○" : "…"}</span>
          <span>{getOtherPlayerStatus(isPresent, isReady)}</span>
        </div>
      );
    }

    if (isReady) {
      return (
        <div className="ready-status ready-status-active ready-badge ready-badge-on">
          <span className="ready-check">✓</span>
          <span>READY</span>
        </div>
      );
    }

    return (
      <button type="button" className="ready-badge ready-badge-off" onClick={onToggle}>
        <span className="ready-check">{motionPermission === "requesting" ? "…" : "○"}</span>
        <span>{getActionLabel(isCurrentPlayer, isReady)}</span>
      </button>
    );
  };

  return (
    <main className="screen ready-screen">
      <section className="ready-shell">
        <div className="ready-stars" aria-hidden="true">
          <span className="ready-dot dot-yellow dot-1" />
          <span className="ready-dot dot-white dot-2" />
          <span className="ready-dot dot-blue dot-3" />
          <span className="ready-star star-1">★</span>
          <span className="ready-star star-2">✦</span>
          <span className="ready-star star-3">★</span>
          <span className="ready-splash splash-left" />
          <span className="ready-splash splash-right" />
        </div>

        <article className="ready-stage">
          <div className="ready-room-code">
            <div className="ready-room-code-copy">
              <div className="ready-room-code-text">
                <span className="ready-room-code-label">ROOM CODE</span>
                <strong className="ready-room-code-value">{roomCode}</strong>
              </div>
              <button type="button" className="ready-copy-button" onClick={handleCopyRoomCode}>
                {copyFeedback === "copied" ? "COPIED" : "COPY"}
              </button>
            </div>
            {copyFeedback === "failed" ? <span className="ready-copy-feedback">Copy unavailable</span> : null}
          </div>

          <h1 className="ready-title">READY?</h1>

          <div className="ready-lineup">
            <div className="ready-player">
              <div className="ready-avatar ready-avatar-blue">
                <img src={player1} alt="Player 1 avatar" className="ready-avatar-image" />
              </div>
              <div className="ready-label ready-label-blue">
                {player1Name}
                {player1IsCurrent ? <span className="ready-you-label">(YOU)</span> : null}
              </div>
              {renderPlayerAction(player1IsCurrent, player1Present, displayPlayer1Ready, handlePlayer1Toggle)}
            </div>

            <div className={`ready-count-zone ${displayCountdown === null ? "ready-count-hidden" : ""}`}>
              {displayCountdown !== null && (
                <>
                  <div className="ready-count-glow" aria-hidden="true" />
                  <div className="ready-count-number">{displayCountdown}</div>
                </>
              )}
            </div>

            <div className="ready-player">
              <div className="ready-avatar ready-avatar-pink">
                <img src={player2} alt="Player 2 avatar" className="ready-avatar-image" />
              </div>
              <div className="ready-label ready-label-red">
                {player2Name}
                {player2IsCurrent ? <span className="ready-you-label">(YOU)</span> : null}
              </div>
              {renderPlayerAction(player2IsCurrent, player2Present, displayPlayer2Ready, handlePlayer2Toggle)}
            </div>
          </div>

          {permissionMessage ? <p className="section-text ready-permission-message">{permissionMessage}</p> : null}

          <div className="ready-controls">
            <button className="ready-control-button" onClick={() => (onLeaveRoom ? onLeaveRoom() : setCurrentPage("home"))}>
              Exit
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ReadyRoomPage;
