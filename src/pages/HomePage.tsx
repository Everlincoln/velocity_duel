import type { Page } from "../App";
import mainCharacter from "../assets/characters/hero.png";

type Props = {
  setCurrentPage: (page: Page) => void;
  onStartGame?: () => void;
  isDev?: boolean;
  roomActionLoading?: boolean;
  roomActionLabel?: string | null;
  roomError?: string | null;
  socketDebugText?: string | null;
};

function HomePage({
  setCurrentPage,
  onStartGame,
  isDev = false,
  roomActionLoading = false,
  roomActionLabel = null,
  roomError = null,
  socketDebugText = null,
}: Props) {
  return (
    <main className="screen screen-home screen-home-simple">
      <section className="shell home-simple-shell">
        <div className="home-simple-layout">
          <div className="home-character-wrap">
            <img className="home-character-image" src={mainCharacter} alt="Main character holding a large toy blaster" />
          </div>

          <div className="home-simple-card">
            <h1 className="home-simple-title">
              <span className="home-title-top">Velocity</span>
              <span className="home-title-bottom">Duel</span>
            </h1>

            <div className="home-simple-actions">
              <button
                className="button button-big button-yellow home-play-button"
                onClick={() => (onStartGame ? onStartGame() : setCurrentPage("create"))}
                disabled={roomActionLoading}
              >
                {roomActionLoading ? roomActionLabel ?? "CONNECTING..." : "CREATE ROOM"}
              </button>
              <button
                className="button button-big button-blue button-home-outline home-join-button"
                onClick={() => setCurrentPage("join")}
                disabled={roomActionLoading}
              >
                JOIN ROOM
              </button>
            </div>

            {roomError ? <p className="section-text join-room-message-error">{roomError}</p> : null}
            {isDev && socketDebugText ? (
              <details className="socket-debug-details">
                <summary className="socket-debug-summary">Debug Info</summary>
                <pre className="socket-debug-panel">{socketDebugText}</pre>
              </details>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
