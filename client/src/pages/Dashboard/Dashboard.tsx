import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle, FaEye, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../../store/store";
import SiteLocationPicker from "../../components/maps/SiteLocationPicker";
import LocationSearchInput from "../../components/maps/LocationSearchInput";
import { reverseGeocode } from "../../utils/geocode";
import {
  fetchSitesThunk,
  regenerateCredentialsThunk,
  resetCredentials,
  createSiteThunk, resetSiteState, verifySiteAdminOtpThunk
} from "../../features/sites/sitesSlice";

import Button from "../../components/ui/Button";

import "./Dashboard.css";

const Dashboard = () => {

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  //const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const [siteForm, setSiteForm] = useState({
    site_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    state: "",
    country: "",
    gst_number: "",


    latitude: 28.6139,
    longitude: 77.2090,

    site_admin: {
      full_name: "",
      email: "",
      password: "",
      aadhaar_pan: "",
      birthdate: "",
      gender: ""
    }
  });

  const viewSite = (siteId: string) => {
    navigate(`/sites/${siteId}`);
  };

  const editSite = (siteId: string) => {
    navigate(`/sites/${siteId}/edit`);
  };

  const {
    sites,
    loading,
    credentials,
    credentialsGenerated,
    siteCreated,
    requiresOtp,
    otpId
  } = useSelector((state: RootState) => state.sites);


  const [profileOpen, setProfileOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [password, setPassword] = useState("");

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setSiteForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAdminField = (field: string, value: string) => {
    setSiteForm((prev) => ({
      ...prev,
      site_admin: {
        ...prev.site_admin,
        [field]: value
      }
    }));
  };

  const submitOtp = () => {

    if (!otpId) return;

    dispatch(
      verifySiteAdminOtpThunk({
        otpId,
        otp
      })
    );

  };


  const submitCreateSite = () => {

    dispatch(createSiteThunk(siteForm));

  };


  useEffect(() => {
    dispatch(fetchSitesThunk());
  }, [dispatch]);



  useEffect(() => {

    if (requiresOtp) {

      setCreateModalOpen(false);
      setOtpModalOpen(true);

      return;

    }

    if (siteCreated) {

      setCreateModalOpen(false);

      dispatch(fetchSitesThunk());
      dispatch(resetSiteState());

    }

  }, [siteCreated, requiresOtp]);

  useEffect(() => {
    if (createModalOpen) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 300);
    }
  }, [createModalOpen]);


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

          <Button
            size="medium"
            onClick={() => navigate("/org-site-manager")}
          >
            Org Manager Panel
          </Button>

          <Button
            size="medium"
            onClick={() => setCreateModalOpen(true)}
          >
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

                <div className="site-icons">

                  <FaEye
                    className="site-action-icon"
                    title="View Site"
                    onClick={() => viewSite(site.id)}
                  />

                  <FaEdit
                    className="site-action-icon"
                    title="Edit Site"
                    onClick={() => editSite(site.id)}
                  />

                </div>

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

                  <Button size="medium" onClick={generateCredentials}>
                    Generate
                  </Button>

                  <Button size="medium" onClick={closeModal}>
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

                  <Button size="medium" onClick={downloadJSON}>
                    Download JSON
                  </Button>

                  <Button size="medium" onClick={downloadCSV}>
                    Download CSV
                  </Button>

                </div>


                <div style={{ marginTop: "20px" }}>

                  <Button size="medium" onClick={closeModal}>
                    Close
                  </Button>

                </div>

              </div>

            )}

          </div>

        </div>

      )}


      {createModalOpen && (

        <div className="credential-modal">

          <div className="modal-content">

            <h2>Create New Site</h2>

            <input
              placeholder="Site Name"
              value={siteForm.site_name}
              onChange={(e) => updateField("site_name", e.target.value)}
            />

            <input
              placeholder="Phone"
              value={siteForm.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />

            <input
              placeholder="Address Line 1"
              value={siteForm.address_line1}
              readOnly
            />

            <input
              placeholder="Address Line 2"
              value={siteForm.address_line2}
              onChange={(e) => updateField("address_line2", e.target.value)}
            />


            <input
              placeholder="State"
              value={siteForm.state}
              readOnly
            />

            <input
              placeholder="Country"
              value={siteForm.country}
              readOnly
            />

            <input
              placeholder="GST"
              value={siteForm.gst_number}
              onChange={(e) => updateField("gst_number", e.target.value)}
            />



            {/* ⭐ ADD HERE */}

            <div className="map-section">

              <h3>📍 Select Site Location</h3>

              <LocationSearchInput
                onSelect={(data) => {
                  setSiteForm((prev) => ({
                    ...prev,
                    latitude: data.lat,
                    longitude: data.lng,
                    address_line1: data.address,
                    state: data.state,
                    country: data.country
                  }));
                }}
              />

              <SiteLocationPicker
                latitude={siteForm.latitude}
                longitude={siteForm.longitude}
                onChange={async (lat, lng) => {

                  const geo = await reverseGeocode(lat, lng);

                  setSiteForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,

                    ...(geo && {
                      address_line1: geo.address_line1,
                      state: geo.state,
                      country: geo.country
                    })
                  }));
                }}
              />

            </div>

            <p>
              <strong>Lat:</strong> {siteForm.latitude.toFixed(6)} |
              <strong> Lng:</strong> {siteForm.longitude.toFixed(6)}
            </p>

            {/* EXISTING */}



            <h3>Site Admin</h3>

            <input
              placeholder="Admin Name"
              value={siteForm.site_admin.full_name}
              onChange={(e) =>
                updateAdminField("full_name", e.target.value)
              }
            />

            <input
              placeholder="Admin Email"
              value={siteForm.site_admin.email}
              onChange={(e) =>
                updateAdminField("email", e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Admin Password"
              value={siteForm.site_admin.password}
              onChange={(e) =>
                updateAdminField("password", e.target.value)
              }
            />

            <input
              placeholder="Aadhaar / PAN"
              value={siteForm.site_admin.aadhaar_pan}
              onChange={(e) =>
                updateAdminField("aadhaar_pan", e.target.value)
              }
            />

            <input
              type="date"
              value={siteForm.site_admin.birthdate}
              onChange={(e) =>
                updateAdminField("birthdate", e.target.value)
              }
            />

            <select
              value={siteForm.site_admin.gender}
              onChange={(e) =>
                updateAdminField("gender", e.target.value)
              }
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <div className="modal-buttons">

              <Button size="medium" onClick={submitCreateSite}>
                Create Site
              </Button>

              <Button
                size="medium"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>

            </div>

          </div>

        </div>

      )}


      {otpModalOpen && (

        <div className="credential-modal">

          <div className="modal-content">

            <h2>Verify Site Admin OTP</h2>

            <p>
              An OTP has been sent to the site admin email.
            </p>

            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="modal-buttons">

              <Button size="medium" onClick={submitOtp}>
                Verify OTP
              </Button>

              <Button
                size="medium"
                onClick={() => setOtpModalOpen(false)}
              >
                Cancel
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};

export default Dashboard;