import type { Page } from "../App";

type Props = {
  roomCode: string;
  startGame: (page: Page) => void;
  onCreateRoom?: () => void;
  roomActionLoading?: boolean;
  roomError?: string | null;
};

function CreateRoomPage({ roomCode, startGame, onCreateRoom, roomActionLoading = false, roomError = null }: Props) {
  return (
    <main className="screen minimal-screen">
      <section className="minimal-shell">
        <div className="minimal-card">
          <p className="kicker">Create Room</p>
          <h1 className="center-title">CREATE ROOM</h1>

          <div className="room-code-card">
            <strong className="room-code">{roomCode}</strong>
          </div>

          <p className="waiting-text">{roomError ?? "Waiting for player..."}</p>

          <button
            className="button button-start"
            onClick={() => (onCreateRoom ? onCreateRoom() : startGame("ready"))}
            aria-label="Start"
            disabled={roomActionLoading}
          >
            {roomActionLoading ? "CONNECTING..." : "START"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default CreateRoomPage;
