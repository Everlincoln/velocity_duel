import type { Page } from "../App";
import mainCharacter from "../assets/characters/hero.png";

type Props = {
  setCurrentPage: (page: Page) => void;
  onStartGame?: () => void;
  roomActionLoading?: boolean;
  roomError?: string | null;
  socketDebugText?: string | null;
  nickname: string;
  onNicknameChange: (value: string) => void;
};

function HomePage({
  setCurrentPage,
  onStartGame,
  roomActionLoading = false,
  roomError = null,
  socketDebugText = null,
  nickname,
  onNicknameChange,
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

            <label className="field home-nickname-field">
              <span className="sr-only">Nickname</span>
              <input
                className="input playful-input home-nickname-input"
                value={nickname}
                onChange={(event) => onNicknameChange(event.target.value)}
                maxLength={24}
                placeholder="Enter nickname (optional)"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>

            <div className="home-simple-actions">
              <button
                className="button button-big button-yellow"
                onClick={() => (onStartGame ? onStartGame() : setCurrentPage("create"))}
                disabled={roomActionLoading}
              >
                {roomActionLoading ? "STARTING..." : "PLAY"}
              </button>
              <button
                className="button button-big button-blue button-home-outline"
                onClick={() => setCurrentPage("join")}
              >
                JOIN ROOM
              </button>
            </div>

            {roomError ? <p className="section-text join-room-message-error">{roomError}</p> : null}
            {socketDebugText ? (
              <pre className="socket-debug-panel">{socketDebugText}</pre>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
