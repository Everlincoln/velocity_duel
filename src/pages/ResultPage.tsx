import type { Page } from "../App";

type Props = {
  reactionTimeMs: number | null;
  setCurrentPage: (page: Page) => void;
};

function ResultPage({ reactionTimeMs, setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <article className="card card-lilac center-card">
          <p className="kicker">Single Player Test Result</p>
          <div className="winner-badge">FIRED!</div>
          <h2 className="section-title">Reaction captured</h2>

          <div className="results-grid">
            <div className="result-chip">
              <strong>{reactionTimeMs ?? "--"} ms</strong>
              <span>Reaction time</span>
            </div>
            <div className="result-chip">
              <strong>1 shot</strong>
              <span>Assembly to fire flow works</span>
            </div>
          </div>

          <p className="section-text">
            This is the single-player firing test. Next we can layer the same flow into the two-player duel.
          </p>

          <div className="action-row center-actions">
            <button className="button button-coral" onClick={() => setCurrentPage("assembly")}>
              Play Again
            </button>
            <button className="button button-cream" onClick={() => setCurrentPage("home")}>
              Back Home
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ResultPage;
