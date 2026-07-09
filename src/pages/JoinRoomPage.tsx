import { useState } from "react";
import type { Page } from "../App";

type Props = {
  roomCode: string;
  startGame: (page: Page) => void;
  onJoinRoom?: (roomCode: string) => void;
  isDev?: boolean;
  roomActionLoading?: boolean;
  roomActionLabel?: string | null;
  roomError?: string | null;
  socketDebugText?: string | null;
};

function JoinRoomPage({
  roomCode,
  startGame,
  onJoinRoom,
  isDev = false,
  roomActionLoading = false,
  roomActionLabel = null,
  socketDebugText = null,
}: Props) {
  const [joinCode, setJoinCode] = useState(roomCode);

  return (
    <main className="screen minimal-screen">
      <section className="minimal-shell">
        <div className="minimal-card join-minimal-card">
          <h1 className="center-title">JOIN ROOM</h1>

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

          {isDev && socketDebugText ? (
            <details className="socket-debug-details">
              <summary className="socket-debug-summary">Debug Info</summary>
              <pre className="socket-debug-panel">{socketDebugText}</pre>
            </details>
          ) : null}

          <div className="join-room-actions">
            <button
              className="button button-blue"
              onClick={() => (onJoinRoom ? onJoinRoom(joinCode) : startGame("ready"))}
              disabled={roomActionLoading}
            >
              {roomActionLoading ? roomActionLabel ?? "CONNECTING..." : "PLAY"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default JoinRoomPage;
