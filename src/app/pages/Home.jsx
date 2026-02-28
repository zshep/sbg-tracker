import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="home page">
      <header className="home__header">
        <h1 className="home__title">SBG Tracker</h1>
        <p className="home__subtitle">
          Track standards, evidence, and “most recent wins” mastery—without spreadsheet pain.
        </p>
      </header>

      <section className="home__card">
        <h2 className="home__cardTitle">Heads up</h2>
        <p className="home__cardText">
          Full sign-in options are coming soon. For now, jump into your dashboard to start building classes and standards.
        </p>

        <div className="home__actions">
          <Link className="btn btn-primary" to="/dashboard">
            Go to Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}