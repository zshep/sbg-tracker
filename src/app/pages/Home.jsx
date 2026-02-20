import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function Home() {

    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return null;


    return (
        <div>
            <h1>Standard Base Grading Tracker</h1>

            <p>Welcome to SBG Tracker.</p>

            <p>Sign ins will be available soon. For now CLick on the link below to go to the dashboard</p>

            <nav className="home-nav">
                <Link className="primary-link" to="/dashboard" >Dashboard</Link>
            </nav>



        </div>

    )
}