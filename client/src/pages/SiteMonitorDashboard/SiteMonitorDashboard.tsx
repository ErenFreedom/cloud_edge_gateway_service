import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";

import type { RootState, AppDispatch } from "../../store/store";

import SiteMonitorDashboardPanel from "../../components/siteMonitorDashboard/SiteMonitorDashboardPanel";

import {
  fetchSiteMonitorDashboardSitesThunk,
  setSelectedDashboardSiteId,
} from "../../features/siteMonitorDashboard/siteMonitorDashboardSlice";

import "./SiteMonitorDashboard.css";

const SiteMonitorDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    sites,
    selectedSiteId,
    sitesLoading,
    error,
  } = useSelector((state: RootState) => state.siteMonitorDashboard);

  useEffect(() => {
    dispatch(fetchSiteMonitorDashboardSitesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSiteId) return;
    if (sites.length === 0) return;

    dispatch(setSelectedDashboardSiteId(sites[0].id));
  }, [dispatch, sites, selectedSiteId]);

  const selectedSite =
    sites.find((site) => site.id === selectedSiteId) || sites[0] || null;

  const handleSiteChange = (siteId: string) => {
    dispatch(setSelectedDashboardSiteId(siteId));
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("site_monitor_dashboard_site_id");

    window.location.href = "/login";
  };

  return (
    <div className="site-monitor-page">
      <div className="site-monitor-bg-glow site-monitor-bg-glow-one" />
      <div className="site-monitor-bg-glow site-monitor-bg-glow-two" />

      <header className="site-monitor-header">
        <div>
          <p className="site-monitor-kicker">
            BMS Operations Platform
          </p>

          <h1>Site Monitor Dashboard</h1>

          <p className="site-monitor-subtitle">
            View assigned site telemetry, live readings, load analytics and CSV exports.
          </p>
        </div>

        <div className="site-monitor-header-actions">
          {sites.length > 1 && (
            <select
              className="site-monitor-site-select"
              value={selectedSite?.id || ""}
              onChange={(event) => handleSiteChange(event.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_name}
                </option>
              ))}
            </select>
          )}

          <button
            className="site-monitor-profile-btn"
            type="button"
            title="Logout"
            onClick={logout}
          >
            <FaUserCircle />
            Logout
          </button>
        </div>
      </header>

      {sitesLoading && (
        <div className="site-monitor-state-card">
          Loading assigned sites...
        </div>
      )}

      {!sitesLoading && error && (
        <div className="site-monitor-error-card">
          {error}
        </div>
      )}

      {!sitesLoading && !error && sites.length === 0 && (
        <div className="site-monitor-state-card">
          No active assigned sites found. Please contact your administrator.
        </div>
      )}

      {!sitesLoading && selectedSite && (
        <main className="site-monitor-content">
          <SiteMonitorDashboardPanel
            siteId={selectedSite.id}
            siteName={selectedSite.site_name}
            mode="monitor"
            embedded
            showSensorsTab={false}
          />
        </main>
      )}
    </div>
  );
};

export default SiteMonitorDashboard;