export default function Profile() {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Profile</h2>
                {user && (
                    <p className="text-gray-600 mt-1">
                        {user.firstName} {user.lastName} • <span className="capitalize">{user.role}</span>
                    </p>
                )}
            </div>

            <div className="border-t pt-4">
                <h3 className="text-lg font-semibold">Settings</h3>
                <div className="mt-3 space-y-3">
                    <label className="flex items-center gap-3">
                        <input type="checkbox" className="accent-emerald-600" />
                        Enable notifications
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" className="accent-emerald-600" />
                        Dark mode (placeholder)
                    </label>
                </div>
            </div>

            <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
                Logout
            </button>
        </div>
    );
}