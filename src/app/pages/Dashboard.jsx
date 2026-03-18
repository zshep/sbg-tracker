
import { useAuth } from "../context/AuthContext";
import ClassSection from "../components/Dashboard/ClassSection";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) <div>Lodaing User</div>;

  return (
    <div className="page">
      <header className="page-header">
     
        <p className="muted">Hello, Demo User</p>

      </header>

      <ClassSection />
    </div>
  );
}
