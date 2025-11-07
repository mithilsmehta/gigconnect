import { useTheme } from "../context/ThemeContext";

export default function Settings() {
    const { theme, setTheme, THEMES } = useTheme();

    return (
        <div className="container py-4">
            <h3 className="mb-3">Settings</h3>

            <div className="card shadow-sm p-3">
                <h6>Appearance</h6>
                <div className="row g-3 mt-1">
                    {Object.values(THEMES).map(t => (
                        <div key={t.id} className="col-md-4">
                            <label className={`w-100 border rounded-3 p-3 d-flex align-items-center justify-content-between ${theme === t.id ? "border-success bg-success bg-opacity-10" : ""}`}>
                                <div>
                                    <div className="fw-semibold">{t.name}</div>
                                    <small className="text-muted">Theme ID: {t.id.toUpperCase()}</small>
                                </div>
                                <input type="radio" name="theme" checked={theme === t.id} onChange={() => setTheme(t.id)} />
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}