import { useAuth } from "../context/AuthContext"

export default function Dashboard() {

    const { user } = useAuth();

    if(!user) return null;

    return (
        <div>
            
            <h3>Dashboard</h3>
            <p>Hello user, {user.uid}</p>

            <div>
                <p>class Section</p>
            </div>

            <div>
                <p>standars section </p>
            </div>

        </div>
    )
}