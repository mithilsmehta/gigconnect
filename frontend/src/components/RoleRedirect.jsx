import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        axios.get("http://localhost:5000/api/auth/me", {
            headers: { Authorization: "Bearer " + token }
        })
            .then(res => {
                const role = res.data.user.role;
                if (role === "client") navigate("/client/dashboard");
                else navigate("/freelancer/dashboard");
            })
            .catch(() => navigate("/login"));
    }, []);

    return null;
}