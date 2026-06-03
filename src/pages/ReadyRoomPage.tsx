import type { Page } from "../App";

type Props = {
  roomCode: string;
  setCurrentPage: (page: Page) => void;
};

function ReadyRoomPage({ roomCode, setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <div className="topbar">
          <button className="button button-pill button-cream" onClick={() => setCurrentPage("home")}>
            Exit
          </button>
          <div className="topbar-mark">Ready Room {roomCode}</div>
        </div>

        <article className="card stage-card card-sky">
          <p className="kicker">Ready Room</p>
          <h2 className="section-title center-title">Ready?</h2>
          <div className="versus-grid">
            <div className="player-card player-card-coral">
              <div className="player-avatar-big">^_^</div>
              <strong>Player 1</strong>
              <span className="ready-pill ready-pill-on">Ready!</span>
            </div>
            <div className="countdown-badge">
              <span>Match starts in</span>
              <strong>3</strong>
            </div>
            <div className="player-card player-card-sky">
              <div className="player-avatar-big">o_o</div>
              <strong>Player 2</strong>
              <span className="ready-pill ready-pill-on">Ready!</span>
            </div>
          </div>

          <div className="action-row">
            <button className="button button-coral" onClick={() => setCurrentPage("assembly")}>
              Start Weapon Assembly
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ReadyRoomPage;
