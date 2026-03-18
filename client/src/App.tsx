import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landing/LandingPage";
import SignUp from "./pages/SignUp/SignUp";
import Login from "./pages/Auth/Login";

import SignupOtp from "./pages/Auth/SignupOtp";
import LoginOtp from "./pages/Auth/LoginOtp";
import SiteAdminOtp from "./pages/Auth/SiteAdminOtp";

import Dashboard from "./pages/Dashboard/Dashboard";
import PlatformDashboard from "./pages/platform/PlatformDashboard";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SiteDetails from "./pages/SiteDetails/SiteDetails";

import OrgSiteManagerPage from "./pages/OrgSiteManager/OrgSiteManagerPage";
function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/signup" element={<SignUp />} />

        <Route path="/login" element={<Login />} />


        <Route path="/otp/signup" element={<SignupOtp />} />

        <Route path="/otp/login" element={<LoginOtp />} />

        <Route path="/otp/site-admin" element={<SiteAdminOtp />} />


        {/* ORGANIZATION USERS */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* PLATFORM ADMIN */}

        <Route
          path="/platform"
          element={
            <ProtectedRoute role="platform_admin">
              <PlatformDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/sites/:siteId" element={<SiteDetails />} />
        <Route path="/sites/:siteId/edit" element={<SiteDetails />} />
        <Route path="/org-site-manager" element={<OrgSiteManagerPage />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;