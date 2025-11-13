import { NavLink } from "react-router-dom";

const itemsByRole = {
    client: [
        { to: "/client/dashboard", label: "Dashboard", icon: "📊" },
        { to: "/client/post-job", label: "Post Job", icon: "➕" },
        { to: "/client/jobs", label: "My Jobs", icon: "📂" },
        { to: "/client/proposals", label: "Proposals", icon: "📨" },
        { to: "/client/contracts", label: "Contracts", icon: "📜" },
        { to: "/client/messages", label: "Messages", icon: "💬" },
        { to: "/client/profile", label: "Profile", icon: "👤" }, // Settings inside Profile
    ],
    freelancer: [
        { to: "/freelancer/dashboard", label: "Dashboard", icon: "📊" },
        { to: "/freelancer/find-work", label: "Find Work", icon: "🔎" },
        { to: "/freelancer/proposals", label: "My Proposals", icon: "📝" },
        { to: "/freelancer/contractF", label: "My Contracts", icon: "📜" },
        { to: "/freelancer/messagesF", label: "Messages", icon: "💬" },
        { to: "/freelancer/profileF", label: "Profile", icon: "👤" }, // Settings inside Profile
    ],
};

export default function Sidebar({ role, collapsed, onToggle }) {
    const items = itemsByRole[role] || [];
    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", borderBottom: "1px solid #eee" }}>
                <div className="brand">
                    <span style={{ fontWeight: "700", color: "#0F9D58", fontSize: "1.1rem" }}>GigConnect</span>
                </div>
            </div>

            <div className="menu-group-title" style={{ padding: "12px 16px", fontSize: "0.85rem", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {role === "client" ? "Menu" : "Menu"}
            </div>
            <nav>
                {items.map((m) => (
                    <NavLink key={m.to} to={m.to} className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
                        <span className="icon">{m.icon}</span>
                        <span style={{ display: collapsed ? "none" : "inline" }}>{m.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}