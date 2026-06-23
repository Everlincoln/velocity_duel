import type { Page } from "../App";

type Props = {
  roomCode: string;
  startGame: (page: Page) => void;
};

function CreateRoomPage({ roomCode, startGame }: Props) {
  return (
    <main className="screen minimal-screen">
      <section className="minimal-shell">
        <div className="minimal-card">
          <p className="kicker">Create Room</p>
          <h1 className="center-title">CREATE ROOM</h1>

          <div className="room-code-card">
            <strong className="room-code">{roomCode}</strong>
          </div>

          <p className="waiting-text">Waiting for player...</p>

          <button
            className="button button-start"
            onClick={() => startGame("ready")}
            aria-label="Start"
          >
            START
          </button>
        </div>
      </section>
    </main>
  );
}

export default CreateRoomPage;
