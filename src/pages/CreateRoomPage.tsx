import type { Page } from "../App";

type Props = {
  roomCode: string;
  setCurrentPage: (page: Page) => void;
};

function CreateRoomPage({ roomCode, setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <div className="topbar">
          <button className="button button-pill button-cream" onClick={() => setCurrentPage("home")}>
            Home
          </button>
          <div className="topbar-mark">Host Flow</div>
        </div>

        <div className="layout-two">
          <article className="card stage-card card-field">
            <p className="kicker">Create Room</p>
            <h2 className="section-title center-title">Create Arena</h2>
            <p className="section-text">
              Send the code to a friend and wait for them to bounce into the lobby.
            </p>

            <div className="room-code-card cream-panel">
              <span className="room-code-label">Your Arena Code</span>
              <strong className="room-code">{roomCode}</strong>
            </div>

            <div className="player-wait">
              <div className="player-bubble player-host cream-panel">
                <span className="player-avatar">^_^</span>
                <span>Host ready</span>
              </div>
              <div className="waiting-cloud cream-panel">Waiting for opponent...</div>
            </div>

            <div className="action-row">
              <button className="button button-coral" onClick={() => setCurrentPage("ready")}>
                Continue to Ready Room
              </button>
              <button className="button button-cream" onClick={() => setCurrentPage("join")}>
                Preview Join Screen
              </button>
            </div>
          </article>

          <aside className="card card-mint">
            <p className="kicker">What matters</p>
            <div className="tips-grid">
              <div className="tip-box">
                <strong>Big code</strong>
                <span>Easy to read on a phone from across a sofa.</span>
              </div>
              <div className="tip-box">
                <strong>Fast lobby</strong>
                <span>Players should understand the next action instantly.</span>
              </div>
              <div className="tip-box">
                <strong>Friendly feel</strong>
                <span>Everything looks like a toy, not a weapons dashboard.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default CreateRoomPage;
