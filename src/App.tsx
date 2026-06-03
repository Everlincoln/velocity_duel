import { useState } from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import ReadyRoomPage from "./pages/ReadyRoomPage";
import WeaponAssemblyPage from "./pages/WeaponAssemblyPage";
import WeaponReadyPage from "./pages/WeaponReadyPage";
import FirePhasePage from "./pages/FirePhasePage";
import ResultPage from "./pages/ResultPage";

export type Page =
  | "home"
  | "create"
  | "join"
  | "ready"
  | "assembly"
  | "weapon-ready"
  | "fire"
  | "result";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [roomCode] = useState("BOP-88");

  return (
    <div className="app-shell">
      {currentPage === "home" && <HomePage setCurrentPage={setCurrentPage} />}
      {currentPage === "create" && (
        <CreateRoomPage roomCode={roomCode} setCurrentPage={setCurrentPage} />
      )}
      {currentPage === "join" && <JoinRoomPage roomCode={roomCode} setCurrentPage={setCurrentPage} />}
      {currentPage === "ready" && <ReadyRoomPage roomCode={roomCode} setCurrentPage={setCurrentPage} />}
      {currentPage === "assembly" && <WeaponAssemblyPage setCurrentPage={setCurrentPage} />}
      {currentPage === "weapon-ready" && <WeaponReadyPage setCurrentPage={setCurrentPage} />}
      {currentPage === "fire" && <FirePhasePage setCurrentPage={setCurrentPage} />}
      {currentPage === "result" && <ResultPage setCurrentPage={setCurrentPage} />}
    </div>
  );
}

export default App;
