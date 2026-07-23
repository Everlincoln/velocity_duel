import { useRef, useState } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
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
  startGame,
  onJoinRoom,
  isDev = false,
  roomActionLoading = false,
  roomActionLabel = null,
  roomError = null,
  socketDebugText = null,
}: Props) {
  const [joinCode, setJoinCode] = useState("");
  const keyboardRef = useRef<{ setInput: (value: string) => void } | null>(null);

  const handleKeyboardChange = (value: string) => {
    setJoinCode(value.replace(/[^A-Z0-9]/g, "").slice(0, 6));
  };

  const handleKeyPress = (button: string) => {
    if (button === "{clear}") {
      setJoinCode("");
      keyboardRef.current?.setInput("");
    }
  };

  return (
    <main className="screen minimal-screen">
      <section className="minimal-shell">
        <div className="minimal-card join-minimal-card">
          <h1 className="center-title">JOIN ROOM</h1>

          <div
            className={`join-room-code-display${joinCode ? "" : " is-empty"}`}
            role="status"
            aria-live="polite"
            aria-label={joinCode ? `Room code ${joinCode}` : "Room code is empty"}
          >
            {joinCode || "ROOM CODE"}
          </div>

          <div className="join-room-keyboard" aria-label="Room code keyboard">
            <Keyboard
              keyboardRef={(keyboard) => {
                keyboardRef.current = keyboard;
              }}
              onChange={handleKeyboardChange}
              onKeyPress={handleKeyPress}
              layout={{
                default: [
                  "1 2 3 4 5 6 7 8 9 0",
                  "Q W E R T Y U I O P",
                  "A S D F G H J K L",
                  "{clear} Z X C V B N M {bksp}",
                ],
              }}
              display={{
                "{clear}": "CLEAR",
                "{bksp}": "⌫",
              }}
              buttonTheme={[
                {
                  class: "room-key-action",
                  buttons: "{clear} {bksp}",
                },
              ]}
              maxLength={6}
              disableButtonHold
              physicalKeyboardHighlight
              physicalKeyboardHighlightPress
              physicalKeyboardHighlightPreventDefault
              preventMouseDownDefault
              useButtonTag
            />
          </div>

          {roomError ? <p className="join-room-message join-room-message-error">{roomError}</p> : null}

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
              disabled={roomActionLoading || joinCode.length < 4}
            >
              {roomActionLoading ? roomActionLabel ?? "CONNECTING..." : "JOIN"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default JoinRoomPage;
