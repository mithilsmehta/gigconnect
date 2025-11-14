import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import RoleRoute from "./components/RoleRoute";
import Layout from "./components/Layout";

/* --- CLIENT PAGES --- */
import ClientDashboard from "./pages/client/ClientDashboard";
import PostJob from "./pages/client/PostJob";
import Jobs from "./pages/client/Jobs";
import ProposalsReceived from "./pages/client/ProposalsReceived";
import Contracts from "./pages/client/Contracts";
import Messages from "./pages/client/Messages";
import Profile from "./pages/client/Profile";


/* --- FREELANCER PAGES --- */
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard";
import FindWork from "./pages/freelancer/FindWork";
import Proposals from "./pages/freelancer/Proposals";
import ContractF from "./pages/freelancer/ContractF";
import MessagesF from "./pages/freelancer/MessagesF";
import ProfileF from "./pages/freelancer/ProfileF";
import ChangeEmail from "./pages/freelancer/ChangeEmail";
import BuyConnects from "./pages/BuyConnects";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* DASHBOARD REDIRECT - Always redirect to role-specific dashboard with sidebar */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navigate to={
              localStorage.getItem("userRole") === "freelancer"
                ? "/freelancer/dashboard"
                : localStorage.getItem("userRole") === "client"
                  ? "/client/dashboard"
                  : "/login"
            } replace />
          </ProtectedRoute>
        } />

        {/* CLIENT WITH SIDEBAR */}
        <Route path="/client" element={<ProtectedRoute><RoleRoute allow={["client"]}><Layout role="client" /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="proposals" element={<ProposalsReceived />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="messages" element={<Messages />} />
        </Route>

        {/* CLIENT PROFILE PAGE WITHOUT SIDEBAR */}
        <Route path="/client/profile" element={<ProtectedRoute><RoleRoute allow={["client"]}><Profile /></RoleRoute></ProtectedRoute>} />
        <Route path="/client/change-email" element={<ProtectedRoute><RoleRoute allow={["client"]}><ChangeEmail /></RoleRoute></ProtectedRoute>} />

        {/* FREELANCER WITH SIDEBAR */}
        <Route path="/freelancer" element={<ProtectedRoute><RoleRoute allow={["freelancer"]}><Layout role="freelancer" /></RoleRoute></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FreelancerDashboard />} />
          <Route path="find-work" element={<FindWork />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="contractF" element={<ContractF />} />
          <Route path="messagesF" element={<MessagesF />} />
        </Route>

        {/* PROFILE PAGES WITHOUT SIDEBAR */}
        <Route path="/freelancer/profileF" element={<ProtectedRoute><RoleRoute allow={["freelancer"]}><ProfileF /></RoleRoute></ProtectedRoute>} />
        <Route path="/freelancer/change-email" element={<ProtectedRoute><RoleRoute allow={["freelancer"]}><ChangeEmail /></RoleRoute></ProtectedRoute>} />

        {/* BUY CONNECTS PAGE */}
        <Route path="/buy-connects" element={<ProtectedRoute><RoleRoute allow={["freelancer"]}><BuyConnects /></RoleRoute></ProtectedRoute>} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}