type Props = {
  onBack: () => void;
  onHome: () => void;
};

function GameNavigation({ onBack, onHome }: Props) {
  return (
    <nav className="game-navigation" aria-label="Game navigation">
      <button className="game-navigation-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        <span>BACK</span>
      </button>
      <button className="game-navigation-button" type="button" onClick={onHome}>
        <span aria-hidden="true">⌂</span>
        <span>HOME</span>
      </button>
    </nav>
  );
}

export default GameNavigation;
