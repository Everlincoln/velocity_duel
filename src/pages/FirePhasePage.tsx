import type { Page } from "../App";

type Props = {
  setCurrentPage: (page: Page) => void;
};

function FirePhasePage({ setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <article className="card card-sunset center-card">
          <p className="kicker">Fire Phase</p>
          <h2 className="section-title center-title">Shake or swipe to fire!</h2>
          <div className="boom-stage">
            <div className="shake-card">SHAKE!</div>
            <div className="boom-burst">BOOM!</div>
          </div>
          <p className="section-text">
            This should feel loud, silly, and instantly readable with screen shake and fun sound.
          </p>
          <div className="action-row center-actions">
            <button className="button button-cream" onClick={() => setCurrentPage("result")}>
              Show Results
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default FirePhasePage;
