import { useEffect, useState } from "react";
import type { Page } from "../App";
import player1 from "../assets/characters/player1.png";
import player2 from "../assets/characters/player2.png";

type Props = {
  roomCode: string;
  setCurrentPage: (page: Page) => void;
};

function ReadyRoomPage({ roomCode, setCurrentPage }: Props) {
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handlePlayer1Toggle = () => {
    const nextPlayer1Ready = !player1Ready;
    const nextBothReady = nextPlayer1Ready && player2Ready;

    setPlayer1Ready(nextPlayer1Ready);
    setCountdown(nextBothReady ? 3 : null);
  };

  const handlePlayer2Toggle = () => {
    const nextPlayer2Ready = !player2Ready;
    const nextBothReady = player1Ready && nextPlayer2Ready;

    setPlayer2Ready(nextPlayer2Ready);
    setCountdown(nextBothReady ? 3 : null);
  };

  useEffect(() => {
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
  }, [countdown, setCurrentPage]);

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
                className={`ready-badge ${player1Ready ? "ready-badge-on" : "ready-badge-off"}`}
                onClick={handlePlayer1Toggle}
              >
                <span className="ready-check">{player1Ready ? "✓" : "○"}</span>
                <span>{player1Ready ? "READY!" : "NOT READY"}</span>
              </button>
            </div>

            <div className={`ready-count-zone ${countdown === null ? "ready-count-hidden" : ""}`}>
              {countdown !== null && (
                <>
                  <div className="ready-count-glow" aria-hidden="true" />
                  <div className="ready-count-number">{countdown}</div>
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
                className={`ready-badge ${player2Ready ? "ready-badge-on" : "ready-badge-off"}`}
                onClick={handlePlayer2Toggle}
              >
                <span className="ready-check">{player2Ready ? "✓" : "○"}</span>
                <span>{player2Ready ? "READY!" : "NOT READY"}</span>
              </button>
            </div>
          </div>

          <div className="ready-controls">
            <button className="ready-control-button" onClick={() => setCurrentPage("home")}>
              Exit
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ReadyRoomPage;
