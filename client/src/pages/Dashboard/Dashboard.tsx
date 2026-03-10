import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../../store/store";

import { fetchSitesThunk } from "../../features/sites/sitesSlice";

import Button from "../../components/ui/Button";

import "./Dashboard.css";

const Dashboard = () => {

  const dispatch = useDispatch<AppDispatch>();

  const { sites, loading } = useSelector(
    (state: RootState) => state.sites
  );

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSitesThunk());
  }, [dispatch]);

  const logout = () => {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.location.href = "/login";

  };

  return (

    <div className="dashboard-container">

      {/* HEADER */}

      <div className="dashboard-header">

        <h1>Sites Dashboard</h1>

        <div className="header-actions">

          <Button size="small">
            Add Site
          </Button>

          <div className="profile-wrapper">

            <div
              className="profile-icon"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              👤
            </div>

            {profileOpen && (
              <div className="profile-dropdown">

                <button onClick={logout}>
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

      </div>


      {/* SITES LIST */}

      <div className="sites-container">

        {loading && <p>Loading sites...</p>}

        {!loading && sites.length === 0 && (
          <p>No sites created yet.</p>
        )}

        {sites.map((site: any) => (

          <div key={site.id} className="site-card">

            <h2>{site.site_name}</h2>

            <div className="site-info">

              <p><strong>Phone:</strong> {site.phone || "-"}</p>

              <p>
                <strong>Address:</strong>
                {" "}
                {site.address_line1}
                {" "}
                {site.address_line2 || ""}
              </p>

              <p>
                <strong>State:</strong> {site.state}
              </p>

              <p>
                <strong>Country:</strong> {site.country}
              </p>

              <p>
                <strong>GST:</strong> {site.gst_number || "-"}
              </p>

              <p>
                <strong>Status:</strong>
                {" "}
                <span className={`status ${site.status}`}>
                  {site.status}
                </span>
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

};

export default Dashboard;