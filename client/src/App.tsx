import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landing/LandingPage";
import SignUp from "./pages/SignUp/SignUp";
import Login from "./pages/Auth/Login";

import SignupOtp from "./pages/Auth/SignupOtp";
import LoginOtp from "./pages/Auth/LoginOtp";
import SiteAdminOtp from "./pages/Auth/SiteAdminOtp";

import Dashboard from "./pages/Dashboard/Dashboard";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import OrgManagerDashboard from "./pages/OrgManagerDashboard/OrgManagerDashboard";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SiteDetails from "./pages/SiteDetails/SiteDetails";
import OrgSiteManagerPage from "./pages/OrgSiteManager/OrgSiteManagerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}

        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        <Route path="/otp/signup" element={<SignupOtp />} />
        <Route path="/otp/login" element={<LoginOtp />} />
        <Route path="/otp/site-admin" element={<SiteAdminOtp />} />

        {/* SUPER ADMIN */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="super_admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ORG SITE MANAGER */}

        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute role="org_site_manager">
              <OrgManagerDashboard />
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

        {/* SHARED */}

        <Route
          path="/sites/:siteId"
          element={
            <ProtectedRoute>
              <SiteDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sites/:siteId/edit"
          element={
            <ProtectedRoute role="super_admin">
              <SiteDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/org-site-manager"
          element={
            <ProtectedRoute role="super_admin">
              <OrgSiteManagerPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;