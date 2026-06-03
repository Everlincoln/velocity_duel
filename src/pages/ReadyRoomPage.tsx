import type { Page } from "../App";
import player1 from "../assets/characters/player1.png";
import player2 from "../assets/characters/player2.png";

type Props = {
  roomCode: string;
  setCurrentPage: (page: Page) => void;
};

function ReadyRoomPage({ roomCode, setCurrentPage }: Props) {
  return (
    <main className="screen ready-screen">
      <section className="ready-shell">
        <div className="topbar">
          <button className="button button-pill button-cream" onClick={() => setCurrentPage("home")}>
            Exit
          </button>
          <div className="topbar-mark">Ready Room {roomCode}</div>
        </div>

        <article className="ready-card">
          <p className="kicker">Ready Room</p>
          <h2 className="ready-title">Ready?</h2>

          <div className="versus-area">
            <div className="player-side">
              <img src={player1} alt="Player 1" className="player-img" />
              <strong>Player 1</strong>
              <span className="ready-pill on">Ready!</span>
            </div>

            <div className="countdown">
              <span>Match starts in</span>
              <div className="count-number">3</div>
            </div>

            <div className="player-side">
              <img src={player2} alt="Player 2" className="player-img" />
              <strong>Player 2</strong>
              <span className="ready-pill on">Ready!</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button className="button-primary" onClick={() => setCurrentPage("assembly")}>
              START
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ReadyRoomPage;
