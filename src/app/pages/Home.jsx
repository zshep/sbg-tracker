import { Link } from "react-router-dom";


export default function Home() {


    return (
        <div>
            <h1>Standard Base Grading Tracker</h1>

            <p>Welcome to SBG Tracker.</p>

            <p>Sign ins will be available soon. For now CLick on the link below to go to the dashboard</p>

            <nav className="home-nav">
                <Link className="primary-link" to="/teacher/{uid}" >Dashboard</Link>
            </nav>



        </div>

    )
}