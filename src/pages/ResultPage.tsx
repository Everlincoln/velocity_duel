import type { Page } from "../App";

type Props = {
  setCurrentPage: (page: Page) => void;
};

function ResultPage({ setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <article className="card card-lilac center-card">
          <p className="kicker">Result Screen</p>
          <div className="winner-badge">Winner!</div>
          <h2 className="section-title">Banana Rocket wins</h2>

          <div className="results-grid">
            <div className="result-chip">
              <strong>0.82s</strong>
              <span>Reaction time</span>
            </div>
            <div className="result-chip">
              <strong>1 round</strong>
              <span>Perfect for party pacing</span>
            </div>
          </div>

          <p className="section-text">
            Celebrate quickly, then offer a big replay button so the next round starts without
            friction.
          </p>

          <div className="action-row center-actions">
            <button className="button button-coral" onClick={() => setCurrentPage("ready")}>
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
