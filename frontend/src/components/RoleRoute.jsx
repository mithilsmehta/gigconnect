import { Navigate } from "react-router-dom";

export default function RoleRoute({ allow = [], children }) {
    const role = localStorage.getItem("userRole");
    if (!role) return <Navigate to="/login" replace />;

    if (!allow.includes(role)) {
        return <Navigate to={role === "client" ? "/client/dashboard" : "/freelancer/dashboard"} replace />;
    }

    return children;
}