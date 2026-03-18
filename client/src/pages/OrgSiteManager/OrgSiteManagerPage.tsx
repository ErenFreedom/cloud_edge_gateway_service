import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./OrgSiteManagerPage.css";
import { useDispatch, useSelector } from "react-redux";
import {
  createOrgManagerThunk,
  verifyManagerOtpThunk,
  assignSitesThunk,
  removeSitesThunk,
  resetOrgManagerState,
  fetchInitDataThunk,
  fetchScopeThunk
} from "../../features/orgManager/orgManagerSlice";
import type { AppDispatch, RootState } from "../../store/store";

const OrgSiteManagerPage = () => {

  const dispatch = useDispatch<AppDispatch>();

  const {
    loading,
    success,
    error,
    managers,
    sites,
    currentScope
  } = useSelector(
    (state: RootState) => state.orgManager
  );

  const [openModal, setOpenModal] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [createdManagerId, setCreatedManagerId] = useState("");

  /* ---------- CREATE FORM ---------- */

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    aadhaar_pan: "",
    birthdate: "",
    gender: "",
    site_ids: [] as string[]
  });

  /* ---------- SCOPE ---------- */

  const [selectedManager, setSelectedManager] = useState("");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

  /* ---------- INIT LOAD ---------- */

  useEffect(() => {

    dispatch(fetchInitDataThunk());
  }, []);  // ❌ REMOVE dispatch

  /* ---------- LOAD SCOPE WHEN MANAGER CHANGES ---------- */

  useEffect(() => {
    if (selectedManager) {
      dispatch(fetchScopeThunk(selectedManager));
    }
  }, [selectedManager, dispatch]);

  /* ---------- PREFILL SELECTED SITES ---------- */

  useEffect(() => {
    if (currentScope && currentScope.length > 0) {
      const ids = currentScope.map((s: any) => s.id);
      setSelectedSites(ids);
    } else {
      setSelectedSites([]);
    }
  }, [currentScope]);

  /* ---------- SUCCESS / ERROR ---------- */

  useEffect(() => {

    if (success) {

      toast.success("Operation successful 🎉");

      dispatch(resetOrgManagerState());

      setIsOtpStep(false);
      setOpenModal(false);
      setOtp("");

      dispatch(fetchInitDataThunk());

      if (selectedManager) {
        dispatch(fetchScopeThunk(selectedManager));
      }
    }

    if (error) {
      toast.error(error);
      dispatch(resetOrgManagerState());
    }

  }, [success, error]);

  /* ---------- HANDLERS ---------- */

  const handleInput = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleSite = (siteId: string) => {
    setForm(prev => ({
      ...prev,
      site_ids: prev.site_ids.includes(siteId)
        ? prev.site_ids.filter(id => id !== siteId)
        : [...prev.site_ids, siteId]
    }));
  };

  const handleCreateManager = () => {

    if (form.site_ids.length === 0) {
      toast.error("At least one site required");
      return;
    }

    dispatch(createOrgManagerThunk(form)).then((res: any) => {
      if (res.meta.requestStatus === "fulfilled") {

        setCreatedManagerId(res.payload.managerId);

        setIsOtpStep(true);
      }
    });
  };


  const handleVerifyOtp = () => {

    if (!otp) {
      toast.error("Enter OTP");
      return;
    }

    dispatch(
      verifyManagerOtpThunk({
        managerId: createdManagerId,
        otp
      })
    );
  };

  const toggleScopeSite = (siteId: string) => {
    setSelectedSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleAssignScope = () => {

    if (!selectedManager) {
      toast.error("Select manager first");
      return;
    }

    dispatch(assignSitesThunk({
      manager_id: selectedManager,
      site_ids: selectedSites
    }));
  };

  const handleRemoveScope = () => {

    if (!selectedManager) {
      toast.error("Select manager first");
      return;
    }

    if (selectedSites.length === 0) {
      toast.error("Select at least one site to remove");
      return;
    }

    if (currentScope.length === 0) {
      toast.error("No sites assigned");
      return;
    }

    if (currentScope.length - selectedSites.length < 1) {
      toast.error("At least one site must remain assigned");
      return;
    }

    dispatch(removeSitesThunk({
      manager_id: selectedManager,
      site_ids: selectedSites
    }));
  };

  return (
    <div className="org-container">

      {/* ---------- HEADER ---------- */}

      <div className="org-header">
        <h2>Org Site Manager</h2>

        <button
          className="primary-btn"
          onClick={() => {
            setOpenModal(true);
            setIsOtpStep(false);
          }}
        >
          + Add Org Site Manager
        </button>
      </div>

      {/* ---------- MANAGE SCOPE ---------- */}

      <div className="scope-card">

        <h3>Manage Scope</h3>

        <div className="scope-row">

          {/* ---------- MANAGER ---------- */}
          <div className="scope-box">
            <label>Select Manager</label>

            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
            >
              <option value="">Select Manager</option>
              {managers.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.email}
                </option>
              ))}
            </select>
          </div>

          {/* ---------- SITES (FIXED) ---------- */}
          <div className="scope-box">
            <label>Select Sites</label>

            <div className="multi-select">

              <div
                className="dropdown-header"
                onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
              >
                {selectedSites.length === 0
                  ? "Select Sites"
                  : `${selectedSites.length} site(s) selected`}
              </div>

              {siteDropdownOpen && (
                <div className="dropdown-list">
                  {sites.map((site: any) => (
                    <label key={site.id}>
                      <input
                        type="checkbox"
                        checked={selectedSites.includes(site.id)}
                        onChange={() => toggleScopeSite(site.id)}
                      />
                      {site.site_name}
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        <div style={{ display: "flex", gap: "10px" }}>

          <button
            className="primary-btn"
            onClick={handleAssignScope}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Scope"}
          </button>

          <button
            className="danger-btn"
            onClick={handleRemoveScope}
            disabled={loading}
          >
            {loading ? "Removing..." : "Remove Selected"}
          </button>

        </div>

      </div>

      {/* ---------- CURRENT SCOPE ---------- */}

      <div className="scope-card">

        <h3>Current Assigned Sites</h3>

        {!selectedManager ? (
          <p className="empty-text">
            Select a manager to view assigned sites
          </p>
        ) : currentScope.length === 0 ? (
          <p className="empty-text">
            No sites assigned yet
          </p>
        ) : (
          <div className="chip-container">
            {currentScope.map((site: any) => (
              <span key={site.id} className="chip">
                {site.site_name}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* ---------- MODAL ---------- */}

      {openModal && (
        <div className="modal-overlay">

          <div className="modal">

            <h3>
              {isOtpStep ? "Verify OTP" : "Create Org Site Manager"}
            </h3>

            {!isOtpStep ? (
              <>
                <input name="full_name" placeholder="Full Name" onChange={handleInput} />
                <input name="email" placeholder="Email" onChange={handleInput} />
                <input name="phone" placeholder="Phone" onChange={handleInput} />
                <input name="password" placeholder="Password" type="password" onChange={handleInput} />
                <input name="aadhaar_pan" placeholder="Aadhaar/PAN" onChange={handleInput} />
                <input name="birthdate" type="date" onChange={handleInput} />

                <select name="gender" onChange={handleInput}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                {/* SITES */}
                <div className="multi-select">
                  <div
                    className="dropdown-header"
                    onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
                  >
                    {form.site_ids.length === 0
                      ? "Select Sites"
                      : `${form.site_ids.length} site(s) selected`}
                  </div>

                  {siteDropdownOpen && (
                    <div className="dropdown-list">
                      {sites.map((site: any) => (
                        <label key={site.id}>
                          <input
                            type="checkbox"
                            checked={form.site_ids.includes(site.id)}
                            onChange={() => toggleSite(site.id)}
                          />
                          {site.site_name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <p>Enter OTP sent to email</p>

                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </>
            )}

            <div className="modal-actions">
              <button onClick={() => {
                setOpenModal(false);
                setIsOtpStep(false);
              }}>
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={isOtpStep ? handleVerifyOtp : handleCreateManager}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : isOtpStep
                    ? "Verify OTP"
                    : "Create"}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default OrgSiteManagerPage;