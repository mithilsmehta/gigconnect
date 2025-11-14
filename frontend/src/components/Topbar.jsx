import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnectBalance } from '../api/connectAPI';

export default function Topbar({ onLogout, primary }) {
    const name = localStorage.getItem("userName") || "User";
    const role = localStorage.getItem("userRole") || "";
    const [connects, setConnects] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (role === 'freelancer') {
            fetchConnects();
        }
    }, [role]);

    const fetchConnects = async () => {
        try {
            const res = await getConnectBalance();
            setConnects(res.data.connects);
        } catch (err) {
            console.error('Failed to fetch connects:', err);
        }
    };

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
                {role === 'freelancer' && (
                    <button
                        className="btn btn-sm btn-success"
                        onClick={() => navigate('/buy-connects')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: 20,
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        ⚡ {connects} Connects
                    </button>
                )}
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
        </div>
    );
}