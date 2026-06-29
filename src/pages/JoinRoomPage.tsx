import { useState } from "react";
import type { Page } from "../App";

type Props = {
  roomCode: string;
  startGame: (page: Page) => void;
  onJoinRoom?: (roomCode: string) => void;
  roomActionLoading?: boolean;
  roomError?: string | null;
};

function JoinRoomPage({
  roomCode,
  startGame,
  onJoinRoom,
  roomActionLoading = false,
  roomError = null,
}: Props) {
  const [joinCode, setJoinCode] = useState(roomCode);

  return (
    <main className="screen minimal-screen">
      <section className="minimal-shell">
        <div className="minimal-card join-minimal-card">
          <p className="kicker">Join Room</p>
          <h1 className="center-title">JOIN DUEL</h1>
          <p className="section-text join-room-text">Enter a room code and jump straight into the lobby.</p>

          <label className="field join-room-field">
            <span className="field-label">Room Code</span>
            <input
              className="input playful-input join-room-input"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="ABCD"
            />
          </label>

          <p className={`waiting-text join-room-message ${roomError ? "join-room-message-error" : ""}`}>
            {roomError ?? "Ask your friend for the room code."}
          </p>

          <div className="join-room-actions">
            <button
              className="button button-blue"
              onClick={() => (onJoinRoom ? onJoinRoom(joinCode) : startGame("ready"))}
              disabled={roomActionLoading}
            >
              {roomActionLoading ? "JOINING..." : "PLAY"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default JoinRoomPage;
