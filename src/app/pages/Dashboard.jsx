import { useAuth } from "../context/AuthContext";

import ClassSection from "../components/Dashboard/ClassSection";


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

        

        </div>
    )
}