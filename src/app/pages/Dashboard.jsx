import { useAuth } from "../context/AuthContext";

import ClassSection from "../components/ClassSection";
import ClassCard from "../components/ClassCard";

export default function Dashboard() {

    const { user } = useAuth();
    if(!user) return null;


    return (
        <div>
            
            <h2>Dashboard</h2>
            <p>Hello user, {user.uid}</p>

            <div>
                <ClassSection/>
            </div>

            <div>
                <p>standars section </p>
            </div>

        </div>
    )
}