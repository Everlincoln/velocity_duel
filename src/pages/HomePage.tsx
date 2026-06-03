import type { Page } from "../App";
import mainCharacter from "../assets/characters/hero.png";

type Props = {
  setCurrentPage: (page: Page) => void;
};

function HomePage({ setCurrentPage }: Props) {
  return (
    <main className="screen screen-home screen-home-simple">
      <section className="shell home-simple-shell">
        <div className="home-simple-layout">
          <div className="home-character-wrap">
            <img className="home-character-image" src={mainCharacter} alt="Main character holding a large toy blaster" />
          </div>

          <div className="home-simple-card">
            <h1 className="home-simple-title">
              <span className="home-title-top">Velocity</span>
              <span className="home-title-bottom">Duel</span>
            </h1>

            <div className="home-simple-actions">
              <button className="button button-big button-yellow" onClick={() => setCurrentPage("create")}>
                Create Arena
              </button>
              <button
                className="button button-big button-blue button-home-outline"
                onClick={() => setCurrentPage("join")}
              >
                Join Duel
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
