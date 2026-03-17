import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="home">
      {/* HERO */}
      <section className="home__hero">
        <h1 className="home__title">SBG Tracker</h1>

        <p className="home__subtitle">
          Track standards, evidence, and student mastery—without spreadsheet chaos.
        </p>

        <p className="home__intro">
          Build classes, connect standards, and record evidence over time to see
          where students actually are, not just where they started.
        </p>
      </section>

      {/* DEMO STATUS */}
      <section className="home__section home__statusCard">
        <h2 className="home__sectionTitle">Demo status</h2>
        <p className="home__statusText">
          This version focuses on the core teacher workflow: creating classes,
          linking standards, adding students, and tracking mastery.
        </p>
        <div className="home__actions">
          <Link className="btn btn-primary" to="/dashboard">
            Open Dashboard
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home__section">
        <h2 className="home__sectionTitle">What SBG Tracker does</h2>

        <div className="home__grid">
          <article className="home__featureCard">
            <h3>Organize classes & standards</h3>
            <p>
              Keep your classes and standards structured and easy to manage in one place.
            </p>
          </article>

          <article className="home__featureCard">
            <h3>Track evidence over time</h3>
            <p>
              Record multiple pieces of student evidence so growth is visible and meaningful.
            </p>
          </article>

          <article className="home__featureCard">
            <h3>Focus on current mastery</h3>
            <p>
              Use a “most recent wins” approach to reflect where students are now.
            </p>
          </article>
        </div>
      </section>

      
    </div>
  );
}