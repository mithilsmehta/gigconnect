export default function Topbar({ onLogout, primary }) {
    const name = localStorage.getItem("userName") || "User";
    const role = localStorage.getItem("userRole") || "";

    return (
        <div className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 10, height: 10, background: primary, borderRadius: "50%" }} />
                <strong style={{ color: "#111827" }}>Welcome, {name}</strong>
                <span style={{ fontSize: 12, color: "#6b7280", padding: "2px 8px", border: "1px solid #eee", borderRadius: 999 }}>
                    {role}
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
}