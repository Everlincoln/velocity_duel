import type { Page } from "../App";

type Props = {
  setCurrentPage: (page: Page) => void;
};

function WeaponAssemblyPage({ setCurrentPage }: Props) {
  return (
    <main className="screen">
      <section className="shell stack-gap">
        <article className="card stage-card card-cream">
          <p className="kicker">Weapon Assembly</p>
          <h2 className="section-title center-title">Build Your Weapon!</h2>
          <p className="section-text">
            Keep it simple: three parts, big slots, satisfying feedback.
          </p>

          <div className="assembly-board">
            <div className="parts-row">
              <div className="part-chip">Barrel</div>
              <div className="part-chip">Core</div>
              <div className="part-chip">Grip</div>
            </div>
            <div className="slots-row">
              <div className="slot-box">Drag parts here</div>
              <div className="slot-box">Snap to outline</div>
              <div className="slot-box">Ready to fire</div>
            </div>
            <div className="snap-burst">SNAP! SNAP! SNAP!</div>
          </div>

          <div className="action-row">
            <button className="button button-coral" onClick={() => setCurrentPage("weapon-ready")}>
              Finish Build
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

export default WeaponAssemblyPage;
