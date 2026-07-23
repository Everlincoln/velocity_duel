import type { DuelResult } from "../App";

type Props = {
  duelResult: DuelResult | null;
  onBackHome: () => void;
  onPlayAgain: () => void;
  reactionTimeMs: number | null;
};

function ResultPage({ duelResult, onBackHome, onPlayAgain, reactionTimeMs }: Props) {
  const didWin = duelResult ? duelResult.outcome === "win" : true;
  const title = didWin ? "YOU WIN" : "YOU LOSE";
  const playerCompletionTime = duelResult?.playerCompletionTimeMs ?? reactionTimeMs;
  const time = didWin ? playerCompletionTime : playerCompletionTime ?? duelResult?.winnerCompletionTimeMs ?? null;
  const message = didWin
    ? `You eliminated your opponent in ${time ?? "--"} ms.`
    : `You were eliminated in ${time ?? "--"} ms.`;

  return (
    <main className={`screen duel-result-screen ${didWin ? "is-win" : "is-lose"}`}>
      <section className="duel-result-shell">
        <article className="duel-result-card">
          <h1 className="duel-result-title">{title}</h1>
          <p className="duel-result-message">{message}</p>
          <div className="duel-result-time">{time ?? "--"} ms</div>
          <div className="duel-result-actions">
            <button className="button button-yellow" onClick={onPlayAgain}>
              PLAY AGAIN
            </button>
            <button className="button button-blue" onClick={onBackHome}>
              BACK HOME
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ResultPage;
