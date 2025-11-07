import { useNavigate } from "react-router-dom";
import { logout } from "../utils/logout";

export default function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const role = user?.role;

    return (
        <div style={{ padding: 20 }}>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <button
                    onClick={() => logout(navigate)}
                    style={{ border: "1px solid red", padding: "6px 14px", borderRadius: 8, background: "white", color: "red" }}
                >
                    Logout
                </button>
            </div>

            {role === "client" && <div>Client Dashboard</div>}
            {role === "freelancer" && <div>Freelancer Dashboard</div>}
            {!role && <div>No role found</div>}
        </div>
    );
}