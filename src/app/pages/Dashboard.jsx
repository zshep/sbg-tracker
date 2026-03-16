
import { useAuth } from "../context/AuthContext";
import ClassSection from "../components/Dashboard/ClassSection";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="page">
      <header className="page-header">
      <h1>DASHBOARD CANARY</h1>
      <p>If you see this, routing + layout are fine.</p>
        <h2>Dashboard</h2>
<<<<<<< HEAD
        
        <p className="muted">Hello, {user.uid}</p>
=======
        <p className="muted">Hello, Demo User</p>
>>>>>>> chore/cleanup
      </header>

      <ClassSection />
    </div>
  );
}
