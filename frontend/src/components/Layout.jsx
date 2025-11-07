import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

const PRIMARY = "#0F9D58"; // your brand hex

export default function Layout({ role }) {
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true); // Page-load style A (skeleton)
    const nav = useNavigate();
    const loc = useLocation();

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 350); // tiny skeleton delay
        return () => clearTimeout(t);
    }, [loc.pathname]);

    const onLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        nav("/login", { replace: true });
    };

    return (
        <div className="app-shell" style={{ "--primary": PRIMARY }}>
            <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
            <div className={`main-wrap ${collapsed ? "wide" : ""}`}>
                <Topbar onLogout={onLogout} primary={PRIMARY} />
                <div className="page-wrap">
                    {loading ? (
                        <div className="skeleton">
                            <div className="shimmer" />
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
        </div>
    );
}