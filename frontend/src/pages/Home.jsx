import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.info("Logged out successfully.");
    navigate("/login", { replace: true });
  };

  // Disable browser back to home after logout
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, "", window.location.href);
    };
  }, []);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
      <h2 className="text-success mb-4">Welcome to GigConnect 🎉</h2>
      <button className="btn btn-danger px-4 py-2 fw-semibold" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}