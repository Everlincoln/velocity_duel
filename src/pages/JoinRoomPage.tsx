import type { Page } from "../App";

type Props = {
  roomCode: string;
  setCurrentPage: (page: Page) => void;
  startGame: (page: Page) => void;
};

function JoinRoomPage({ roomCode, setCurrentPage, startGame }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <div className="topbar">
          <button className="button button-pill button-cream" onClick={() => setCurrentPage("home")}>
            Home
          </button>
          <div className="topbar-mark">Join Flow</div>
        </div>

        <div className="layout-two">
          <article className="card stage-card card-sky">
            <p className="kicker">Join Room</p>
            <h2 className="section-title center-title">Join Duel</h2>
            <p className="section-text">
              Type the room code, pick your nickname, and jump into the countdown.
            </p>

            <div className="form-stack">
              <label className="field">
                <span className="field-label">Room code</span>
                <input className="input playful-input" defaultValue={roomCode} />
              </label>
              <label className="field">
                <span className="field-label">Nickname</span>
                <input className="input playful-input" placeholder="Banana Rocket" />
              </label>
            </div>

            <div className="action-row">
              <button className="button button-blue" onClick={() => startGame("ready")}>
                Join
              </button>
              <button className="button button-cream" onClick={() => setCurrentPage("create")}>
                Host Instead
              </button>
            </div>
          </article>

          <aside className="card card-lilac">
            <p className="kicker">Fast read</p>
            <div className="tips-grid">
              <div className="tip-box">
                <strong>One clear input</strong>
                <span>No clutter between the player and the match.</span>
              </div>
              <div className="tip-box">
                <strong>Phone-friendly</strong>
                <span>Large tap zones and roomy spacing for thumbs.</span>
              </div>
              <div className="tip-box">
                <strong>Playful tone</strong>
                <span>The UI feels welcoming even before the match starts.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default JoinRoomPage;
