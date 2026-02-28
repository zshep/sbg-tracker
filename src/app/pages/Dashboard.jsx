import { useAuth } from "../context/AuthContext";
import ClassSection from "../components/Dashboard/ClassSection";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="page">
      <header className="page-header">
        <h2>Dashboard</h2>
        <p className="muted">Hello, {user.uid}</p>
      </header>

      <ClassSection />
    </div>
  );
}