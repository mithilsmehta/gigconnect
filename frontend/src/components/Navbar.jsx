import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ onToggleSidebar }) {
  const { theme } = useTheme();

  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom px-3 sticky-top">
      <button className="btn btn-outline-secondary me-2 d-md-none" onClick={onToggleSidebar}>☰</button>
      <Link to="/" className="navbar-brand fw-bold">GigConnect</Link>
      <div className="ms-auto d-flex align-items-center gap-2">
        <span className="badge text-bg-success">Theme {theme.toUpperCase()}</span>
        <NavLink to="/messages" className="btn btn-outline-secondary btn-sm">💬 Messages</NavLink>
        <NavLink to="/profile" className="btn btn-success btn-sm">My Profile</NavLink>
      </div>
    </nav>
  );
}