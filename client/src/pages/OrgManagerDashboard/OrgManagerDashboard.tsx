import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle, FaEye, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import type { RootState, AppDispatch } from "../../store/store";
import { fetchMySitesThunk } from "../../features/orgManager/orgManagerSlice";

import "./OrgManagerDashboard.css";

const OrgManagerDashboard = () => {

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { mySites, loading } = useSelector(
    (state: RootState) => state.orgManager
  );

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMySitesThunk());
  }, [dispatch]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  const viewSite = (siteId: string) => {
    navigate(`/sites/${siteId}`);
  };

  const editSite = (siteId: string) => {
    navigate(`/sites/${siteId}/edit`);
  };

  return (

    <div className="orgm-dashboard-container">

      {/* HEADER */}

      <div className="orgm-dashboard-header">

        <div className="orgm-profile-wrapper">

          <FaUserCircle
            className="orgm-profile-icon"
            onClick={() => setProfileOpen(!profileOpen)}
          />

          {profileOpen && (
            <div className="orgm-profile-dropdown">
              <button onClick={logout}>Logout</button>
            </div>
          )}

        </div>

      </div>

      {/* BODY */}

      <div className="orgm-dashboard-body">

        <h1 className="orgm-dashboard-title">
          My Assigned Sites
        </h1>

        <div className="orgm-sites-container">

          {loading && <p>Loading sites...</p>}

          {!loading && mySites.length === 0 && (
            <p>No sites assigned.</p>
          )}

          {mySites.map((site: any) => (

            <div key={site.id} className="orgm-site-card">

              {/* HEADER */}
              <div className="orgm-site-card-header">

                <h2>{site.site_name}</h2>

                <span className={`orgm-status ${site.status}`}>
                  {site.status}
                </span>

              </div>

              {/* INFO */}
              <div className="orgm-site-info">

                <div>
                  <p><strong>Phone:</strong> {site.phone || "-"}</p>
                  <p><strong>GST:</strong> {site.gst_number || "-"}</p>
                </div>

                <div>
                  <p>
                    <strong>Address:</strong>{" "}
                    {site.address_line1} {site.address_line2 || ""}
                  </p>

                  <p>
                    <strong>Location:</strong>{" "}
                    {site.state}, {site.country}
                  </p>
                </div>

              </div>

              {/* ACTIONS */}
              <div className="orgm-site-actions">

                <FaEye
                  className="orgm-site-action-icon"
                  title="View Site"
                  onClick={() => viewSite(site.id)}
                />

                <FaEdit
                  className="orgm-site-action-icon edit"
                  title="Edit Site"
                  onClick={() => editSite(site.id)}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

};

export default OrgManagerDashboard;