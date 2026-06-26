import { useEffect, useMemo, useState } from "react";
import type { Page, RoomPlayer } from "../App";
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
};

function ReadyRoomPage({
  roomCode,
  setCurrentPage,
  useSocketFlow = false,
  currentPlayerNumber = null,
  roomPlayers = [],
  onToggleReady,
  onLeaveRoom,
}: Props) {
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const socketPlayer1 = useMemo(
    () => roomPlayers.find((player) => player.playerNumber === 1),
    [roomPlayers],
  );
  const socketPlayer2 = useMemo(
    () => roomPlayers.find((player) => player.playerNumber === 2),
    [roomPlayers],
  );

  const handlePlayer1Toggle = () => {
    if (useSocketFlow) {
      if (currentPlayerNumber === 1) {
        onToggleReady?.();
      }
      return;
    }

    const nextPlayer1Ready = !player1Ready;
    const nextBothReady = nextPlayer1Ready && player2Ready;

    setPlayer1Ready(nextPlayer1Ready);
    setCountdown(nextBothReady ? 3 : null);
  };

  const handlePlayer2Toggle = () => {
    if (useSocketFlow) {
      if (currentPlayerNumber === 2) {
        onToggleReady?.();
      }
      return;
    }

    const nextPlayer2Ready = !player2Ready;
    const nextBothReady = player1Ready && nextPlayer2Ready;

    setPlayer2Ready(nextPlayer2Ready);
    setCountdown(nextBothReady ? 3 : null);
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

  const displayPlayer1Ready = useSocketFlow ? (socketPlayer1?.ready ?? false) : player1Ready;
  const displayPlayer2Ready = useSocketFlow ? (socketPlayer2?.ready ?? false) : player2Ready;
  const displayCountdown = useSocketFlow ? null : countdown;

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

        <span className="sr-only">{roomCode}</span>

        <article className="ready-stage">
          <h1 className="ready-title">READY?</h1>

          <div className="ready-lineup">
            <div className="ready-player">
              <div className="ready-avatar ready-avatar-blue">
                <img src={player1} alt="Player 1 avatar" className="ready-avatar-image" />
              </div>
              <div className="ready-label ready-label-blue">PLAYER 1</div>
              <button
                type="button"
                className={`ready-badge ${displayPlayer1Ready ? "ready-badge-on" : "ready-badge-off"}`}
                onClick={handlePlayer1Toggle}
                disabled={useSocketFlow && currentPlayerNumber !== 1}
              >
                <span className="ready-check">{displayPlayer1Ready ? "✓" : "○"}</span>
                <span>{displayPlayer1Ready ? "READY!" : "NOT READY"}</span>
              </button>
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
              <div className="ready-label ready-label-red">PLAYER 2</div>
              <button
                type="button"
                className={`ready-badge ${displayPlayer2Ready ? "ready-badge-on" : "ready-badge-off"}`}
                onClick={handlePlayer2Toggle}
                disabled={useSocketFlow && currentPlayerNumber !== 2}
              >
                <span className="ready-check">{displayPlayer2Ready ? "✓" : "○"}</span>
                <span>{displayPlayer2Ready ? "READY!" : "NOT READY"}</span>
              </button>
            </div>
          </div>

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
