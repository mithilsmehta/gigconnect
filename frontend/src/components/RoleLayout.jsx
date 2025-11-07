import { Outlet, NavLink, useLocation } from "react-router-dom";
import { getAuth } from "../App";
import { useMemo } from "react";
import {
    FiHome, FiPlusCircle, FiBriefcase, FiMessageSquare, FiUser,
    FiSearch, FiFileText
} from "react-icons/fi";

const tabStyle =
    "flex flex-col items-center justify-center gap-1 px-3 py-2 text-[12px] font-medium transition-colors";

export default function RoleLayout() {
    const { user } = getAuth();
    const location = useLocation();

    const tabs = useMemo(() => {
        if (!user) return [];
        if (user.role === "client") {
            return [
                { to: "/dashboard", label: "Dashboard", icon: <FiHome /> },
                { to: "/post-job", label: "Post Job", icon: <FiPlusCircle /> },
                { to: "/my-jobs", label: "My Jobs", icon: <FiBriefcase /> },
                { to: "/messages", label: "Messages", icon: <FiMessageSquare /> },
                { to: "/profile", label: "Profile", icon: <FiUser /> }, // includes settings
            ];
        }
        return [
            { to: "/dashboard", label: "Dashboard", icon: <FiHome /> },
            { to: "/find-work", label: "Find Work", icon: <FiSearch /> },
            { to: "/my-proposals", label: "My Proposals", icon: <FiFileText /> },
            { to: "/messages", label: "Messages", icon: <FiMessageSquare /> },
            { to: "/profile", label: "Profile", icon: <FiUser /> }, // includes settings
        ];
    }, [user]);

    return (
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
            {/* content */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
                <Outlet />
            </main>

            {/* bottom nav (mobile-first) */}
            {user && (
                <nav className="sticky bottom-0 w-full border-t bg-white">
                    <div className="mx-auto max-w-5xl grid grid-cols-5">
                        {tabs.map((t) => {
                            const active = location.pathname === t.to;
                            return (
                                <NavLink
                                    key={t.to}
                                    to={t.to}
                                    className={tabStyle + (active ? " text-emerald-600" : " text-gray-500")}
                                >
                                    <span className={`text-[20px] ${active ? "text-emerald-600" : "text-gray-500"}`}>
                                        {t.icon}
                                    </span>
                                    {t.label}
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}