import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";

import type { RootState, AppDispatch } from "../../store/store";

import {
  fetchSitesThunk,
  regenerateCredentialsThunk,
  resetCredentials
} from "../../features/sites/sitesSlice";

import Button from "../../components/ui/Button";

import "./Dashboard.css";

const Dashboard = () => {

  const dispatch = useDispatch<AppDispatch>();

  const {
    sites,
    loading,
    credentials,
    credentialsGenerated
  } = useSelector((state: RootState) => state.sites);


  const [profileOpen, setProfileOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [password, setPassword] = useState("");

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);


  useEffect(() => {
    dispatch(fetchSitesThunk());
  }, [dispatch]);


  const logout = () => {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    window.location.href = "/login";

  };


  const openCredentialModal = (siteId: string) => {

    setSelectedSiteId(siteId);
    setModalOpen(true);

  };


  const closeModal = () => {

    setModalOpen(false);
    setPassword("");

    dispatch(resetCredentials());

  };


  const generateCredentials = () => {

    if (!selectedSiteId) return;

    dispatch(
      regenerateCredentialsThunk({
        siteId: selectedSiteId,
        password
      })
    );

  };


  const downloadJSON = () => {

    if (!credentials) return;

    const blob = new Blob(
      [JSON.stringify(credentials, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "site_credentials.json";
    a.click();

  };


  const downloadCSV = () => {

    if (!credentials) return;

    const csv =
      `site_uuid,site_secret\n${credentials.site_uuid},${credentials.site_secret}`;

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "site_credentials.csv";
    a.click();

  };


  return (

    <div className="dashboard-container">

      {/* HEADER */}

      <div className="dashboard-header">

        <div className="header-actions">

          <Button size="medium">
            Add Site
          </Button>

          <div className="profile-wrapper">

            <FaUserCircle
              className="profile-icon"
              onClick={() => setProfileOpen(!profileOpen)}
            />

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


      {/* BODY */}

      <div className="dashboard-body">

        <h1 className="dashboard-title">
          Sites Dashboard
        </h1>


        {/* SITES */}

        <div className="sites-container">

          {loading && <p>Loading sites...</p>}

          {!loading && sites.length === 0 && (
            <p>No sites created yet.</p>
          )}

          {sites.map((site: any) => (

            <div key={site.id} className="site-card">

              <div className="site-card-header">

                <h2>{site.site_name}</h2>

                <span className={`status ${site.status}`}>
                  {site.status}
                </span>

              </div>


              <div className="site-info">

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


              {/* MASKED CREDENTIALS */}

              <div className="site-credentials">

                <p>
                  <strong>Site UUID:</strong> ************
                </p>

                <p>
                  <strong>Secret:</strong> ************
                </p>

              </div>


              <div className="site-actions">

                <Button
                  size="small"
                  onClick={() => openCredentialModal(site.id)}
                >
                  Generate New Credentials
                </Button>

              </div>

            </div>

          ))}

        </div>

      </div>



      {/* MODAL */}

      {modalOpen && (

        <div className="credential-modal">

          <div className="modal-content">

            <h2>Generate Site Credentials</h2>


            {!credentialsGenerated && (

              <>
                <p>
                  Enter Super Admin password to generate new credentials.
                </p>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="modal-buttons">

                  <Button onClick={generateCredentials}>
                    Generate
                  </Button>

                  <Button onClick={closeModal}>
                    Cancel
                  </Button>

                </div>

              </>

            )}



            {credentialsGenerated && credentials && (

              <div className="credentials-display">

                <p className="warning-text">
                  ⚠️ These credentials will only be shown once.
                  Please download them now.
                </p>


                <div className="credential-field">

                  <label>Site UUID</label>

                  <code>{credentials.site_uuid}</code>

                </div>


                <div className="credential-field">

                  <label>Site Secret</label>

                  <code>{credentials.site_secret}</code>

                </div>


                <div className="download-buttons">

                  <Button onClick={downloadJSON}>
                    Download JSON
                  </Button>

                  <Button onClick={downloadCSV}>
                    Download CSV
                  </Button>

                </div>


                <div style={{ marginTop: "20px" }}>

                  <Button onClick={closeModal}>
                    Close
                  </Button>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

};

export default Dashboard;