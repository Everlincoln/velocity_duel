import type { Page } from "../App";

type Props = {
  setCurrentPage: (page: Page) => void;
};

function WeaponReadyPage({ setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <article className="card stage-card card-field center-card">
          <p className="kicker">Weapon Ready</p>
          <div className="weapon-showcase">
            <div className="weapon-toy">
              <span className="weapon-star">★</span>
              <span className="weapon-name">Bubble Pop Blaster</span>
            </div>
          </div>
          <h2 className="section-title">Weapon Ready!</h2>
          <p className="section-text">
            Big visual confirmation helps the round feel rewarding before the fire phase starts.
          </p>

          <div className="action-row center-actions">
            <button className="button button-green" onClick={() => setCurrentPage("fire")}>
              Let's Duel!
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default WeaponReadyPage;
