import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaUserEdit, FaUserMinus, FaUserPlus } from "react-icons/fa";
import type { RootState, AppDispatch } from "../../store/store";
import SiteLocationPicker from "../../components/maps/SiteLocationPicker";
import { reverseGeocode } from "../../utils/geocode";
import LocationSearchInput from "../../components/maps/LocationSearchInput";
import {
    fetchSiteDetailsThunk,
    updateSiteThunk,
    editSiteUserThunk,
    requestEmailChangeThunk,
    verifyEmailChangeThunk
} from "../../features/sites/sitesSlice";

import {
    inviteSiteMonitorThunk,
    verifySiteMonitorOtpThunk,
    fetchSiteMonitorsThunk,
} from "../../features/siteMonitor/siteMonitorSlice";

import SiteHierarchySection from "../../components/siteHierarchy/SiteHierarchySection";


import Button from "../../components/ui/Button";

import "./SiteDetails.css";

// const mask = (value?: string | null) => {
//     if (!value) return "Not yet activated";
//     return "**************";
// };

const SiteDetails = () => {

    const dispatch = useDispatch<AppDispatch>();

    const { siteId } = useParams();

    const location = useLocation();

    const [editingAdmin, setEditingAdmin] = useState(false);

    const [adminForm, setAdminForm] = useState<any>({});

    const [newViewerEmail, setNewViewerEmail] = useState("");

    const [emailChangeMode, setEmailChangeMode] = useState(false);

    const [viewerModal, setViewerModal] = useState(false);

    const [newEmail, setNewEmail] = useState("");

    const [otp, setOtp] = useState("");

    const isEditMode = location.pathname.includes("/edit");

    const { selectedSite, siteDetailsLoading, emailChangeOtpId } =
        useSelector((state: RootState) => state.sites);

    const [formData, setFormData] = useState<any>({});

    const [monitorModal, setMonitorModal] = useState(false);
    const [monitorStep, setMonitorStep] = useState<"invite" | "verify">("invite");

    const [monitorForm, setMonitorForm] = useState({
        full_name: "",
        email: "",
        otp: "",
    });

    const { monitors, inviteLoading, verifyLoading } = useSelector(
        (state: RootState) => state.siteMonitor
    );


    const [adminModal, setAdminModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [removeAdminModal, setRemoveAdminModal] = useState(false);





    useEffect(() => {

        if (siteId) {
            dispatch(fetchSiteDetailsThunk(siteId));
        }

    }, [siteId, dispatch]);

    useEffect(() => {
        dispatch(fetchSiteMonitorsThunk());
    }, [dispatch]);

    useEffect(() => {

        if (selectedSite?.site) {
            setFormData(selectedSite.site);
        }

    }, [selectedSite]);

    const updateField = (field: string, value: string) => {

        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));

    };

    const saveAdminChanges = () => {
        dispatch(editSiteUserThunk({
            user_id: adminForm.id,
            full_name: adminForm.full_name,
            phone: adminForm.phone,
            birthdate: adminForm.birthdate,
            gender: adminForm.gender
        }));

        setEditingAdmin(false);
    };

    const removeAdmin = () => {
        if (!admin || !siteId) return;

        if (site.status === "active") {
            alert("Active site must have a site admin. Please assign a new site admin instead.");
            setAdminModal(true);
            return;
        }

        setRemoveAdminModal(true);
    };

    const confirmRemoveAdmin = async () => {
        if (!admin || !siteId) return;

        const result = await dispatch(
            editSiteUserThunk({
                action: "remove_admin",
                site_id: siteId,
                user_id: admin.id,
            })
        );

        if (editSiteUserThunk.fulfilled.match(result)) {
            setRemoveAdminModal(false);
            dispatch(fetchSiteDetailsThunk(siteId));
        }
    };


    const addViewer = async () => {
        if (!siteId || !newViewerEmail.trim()) return;

        const result = await dispatch(
            updateSiteThunk({
                siteId,
                data: {
                    add_viewers: [newViewerEmail.trim()],
                },
            })
        );

        if (updateSiteThunk.fulfilled.match(result)) {
            setNewViewerEmail("");
            setViewerModal(false);
            dispatch(fetchSiteDetailsThunk(siteId));
        }
    };

    const assignSiteAdmin = async () => {
        if (!siteId || !newAdminEmail.trim()) {
            alert("Please enter admin email");
            return;
        }

        let result;

        if (admin) {
            result = await dispatch(
                editSiteUserThunk({
                    action: "replace_admin",
                    site_id: siteId,
                    user_id: admin.id,
                    new_admin_email: newAdminEmail.trim(),
                })
            );
        } else {
            result = await dispatch(
                updateSiteThunk({
                    siteId,
                    data: {
                        new_admin_email: newAdminEmail.trim(),
                    },
                })
            );
        }

        if (
            editSiteUserThunk.fulfilled.match(result as any) ||
            updateSiteThunk.fulfilled.match(result as any)
        ) {
            setAdminModal(false);
            setNewAdminEmail("");
            dispatch(fetchSiteDetailsThunk(siteId));
        }
    };


    const removeViewer = async (viewerEmail: string) => {
        if (!siteId || !viewerEmail) return;

        const result = await dispatch(
            updateSiteThunk({
                siteId,
                data: {
                    remove_viewers: [viewerEmail],
                },
            })
        );

        if (updateSiteThunk.fulfilled.match(result)) {
            dispatch(fetchSiteDetailsThunk(siteId));
        }
    };

    const requestEmailChange = () => {
        if (!adminForm.id || !adminForm.email || !newEmail.trim()) {
            alert("Please enter a valid new email");
            return;
        }

        dispatch(requestEmailChangeThunk({
            user_id: adminForm.id,
            old_email: adminForm.email,
            new_email: newEmail.trim()
        }));
    };

    const verifyEmailOtp = (otpId: string) => {

        dispatch(verifyEmailChangeThunk({
            otp_id: otpId,
            otp
        })).then(() => {
            if (siteId) {
                dispatch(fetchSiteDetailsThunk(siteId));
            }
        });

    };

    const saveChanges = () => {

        if (!siteId) return;

        const payload = {
            site_name: formData.site_name,
            phone: formData.phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            state: formData.state,
            country: formData.country,
            gst_number: formData.gst_number,
            latitude: formData.latitude,
            longitude: formData.longitude
        };

        dispatch(updateSiteThunk({
            siteId,
            data: payload
        }));

    };

    useEffect(() => {

        if (selectedSite?.site_admin) {
            setAdminForm(selectedSite.site_admin);
        }

    }, [selectedSite]);

    if (siteDetailsLoading) {
        return <div className="site-page">Loading site...</div>;
    }

    if (!selectedSite) {
        return <div className="site-page">Site not found</div>;
    }

    const site = selectedSite.site;

    const admin = selectedSite.site_admin;

    const viewers = selectedSite.viewers || [];

    const siteMonitors = monitors.filter((monitor) =>
        monitor.sites?.some((s) => s.site_id === siteId)
    );

    const inviteMonitor = async () => {
        if (!siteId) return;
        if (!monitorForm.full_name || !monitorForm.email) return;

        const result = await dispatch(
            inviteSiteMonitorThunk({
                full_name: monitorForm.full_name,
                email: monitorForm.email,
                site_ids: [siteId],
            })
        );

        if (inviteSiteMonitorThunk.fulfilled.match(result)) {
            setMonitorStep("verify");
        }
    };

    const verifyMonitorOtp = async () => {
        if (!monitorForm.email || !monitorForm.otp) return;

        const result = await dispatch(
            verifySiteMonitorOtpThunk({
                email: monitorForm.email,
                otp: monitorForm.otp,
            })
        );

        if (verifySiteMonitorOtpThunk.fulfilled.match(result)) {
            setMonitorModal(false);
            setMonitorStep("invite");
            setMonitorForm({
                full_name: "",
                email: "",
                otp: "",
            });
            dispatch(fetchSiteMonitorsThunk());
        }
    };

    return (

        <div className="site-page">
            <div className="site-container">
                <div className="site-header">
                    <h1 className="site-title">

                        {isEditMode ? (
                            <input
                                className="site-title-input big-title"
                                value={formData.site_name || ""}
                                onChange={(e) =>
                                    updateField("site_name", e.target.value)
                                }
                            />
                        ) : (
                            site.site_name
                        )}

                    </h1>
                </div>

                {/* SITE INFO */}

                <div className="site-section">

                    <h2>Site Information</h2>

                    <div className="site-grid">

                        <div>
                            <label>Phone</label>

                            {isEditMode ? (
                                <input
                                    value={formData.phone || ""}
                                    onChange={(e) =>
                                        updateField("phone", e.target.value)
                                    }
                                />
                            ) : (
                                <p>{site.phone || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label>GST</label>

                            {isEditMode ? (
                                <input
                                    value={formData.gst_number || ""}
                                    onChange={(e) =>
                                        updateField("gst_number", e.target.value)
                                    }
                                />
                            ) : (
                                <p>{site.gst_number || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label>Address</label>

                            {isEditMode ? (
                                <input
                                    value={formData.address_line1 || ""}
                                    onChange={(e) =>
                                        updateField("address_line1", e.target.value)
                                    }
                                />
                            ) : (
                                <p>{site.address_line1 || "-"}</p>
                            )}

                        </div>

                        <div>
                            <label>Location</label>
                            <p>
                                {formData.state || site.state}, {formData.country || site.country}
                            </p>
                        </div>

                        <div>
                            <label>Site UUID</label>
                            <p>{site.site_uuid || "-"}</p>
                        </div>

                        <div>
                            <label>Site Secret</label>
                            <p>{site.site_secret || "******"}</p>
                        </div>

                        <div>
                            <label>Device Secret</label>
                            <p>{site.device_secret || "******"}</p>
                        </div>

                        <div>
                            <label>Machine Fingerprint</label>
                            <p>{site.machine_fingerprint || "-"}</p>
                        </div>

                        <div>
                            <label>Status</label>
                            <p className={`status ${site.status}`}>
                                {site.status}
                            </p>
                        </div>

                    </div>

                </div>

                {/* MAP SECTION */}

                <div className="site-section">

                    <h2>📍 Site Location</h2>

                    {/* 🔍 SEARCH BAR (ONLY IN EDIT MODE) */}
                    {isEditMode && (
                        <LocationSearchInput
                            onSelect={(data) => {
                                setFormData((prev: any) => ({
                                    ...prev,
                                    latitude: data.lat,
                                    longitude: data.lng,
                                    address_line1: data.address,
                                    state: data.state,
                                    country: data.country
                                }));
                            }}
                        />
                    )}
                    {isEditMode && (
                        <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>
                            🔍 Search or drag marker to update location
                        </p>
                    )}

                    <div className="map-wrapper">

                        <SiteLocationPicker
                            latitude={formData.latitude || site.latitude || 28.6139}
                            longitude={formData.longitude || site.longitude || 77.2090}
                            onChange={async (lat, lng) => {

                                if (!isEditMode) return;

                                const geo = await reverseGeocode(lat, lng);

                                setFormData((prev: any) => ({
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

                </div>

                {/* USERS */}

                <div className="site-section">

                    <h2>Site Users</h2>

                    {/* ADMIN */}

                    <div className="user-block">

                        <div className="viewer-header user-section-header">
                            <div>
                                <h3>Site Admin</h3>
                                <p className="user-section-subtitle">
                                    Assign or manage the primary site administrator
                                </p>
                            </div>

                            <FaUserPlus
                                className="user-icon user-icon-primary"
                                title={admin ? "Change Site Admin" : "Add Site Admin"}
                                onClick={() => setAdminModal(true)}
                            />
                        </div>

                        {admin && (

                            <div className="user-card">

                                {editingAdmin ? (

                                    <>
                                        <input
                                            value={adminForm.full_name}
                                            onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                                        />

                                        <input
                                            value={adminForm.phone || ""}
                                            onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                                        />

                                        {emailChangeMode ? (

                                            <>
                                                <input
                                                    placeholder="New email"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                />

                                                <Button onClick={requestEmailChange}>
                                                    Send OTP
                                                </Button>

                                                <input
                                                    placeholder="OTP"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                />

                                                <Button
                                                    size="medium"
                                                    onClick={() => emailChangeOtpId && verifyEmailOtp(emailChangeOtpId)}
                                                >
                                                    Verify OTP
                                                </Button>

                                            </>

                                        ) : (

                                            <p>
                                                <strong>Email:</strong> {admin.email}
                                                <FaUserEdit
                                                    className="user-icon"
                                                    onClick={() => setEmailChangeMode(true)}
                                                />
                                            </p>

                                        )}

                                        <Button onClick={saveAdminChanges}>
                                            Save
                                        </Button>

                                    </>

                                ) : (

                                    <>
                                        <p><strong>Name:</strong> {admin.full_name}</p>
                                        <p><strong>Email:</strong> {admin.email}</p>
                                        <p><strong>Phone:</strong> {admin.phone || "-"}</p>

                                        <div className="user-actions">

                                            <button
                                                className="user-action-btn edit"
                                                type="button"
                                                onClick={() => setEditingAdmin(true)}
                                            >
                                                <FaUserEdit />
                                                Edit
                                            </button>

                                            <button
                                                className="user-action-btn danger"
                                                type="button"
                                                onClick={removeAdmin}
                                            >
                                                <FaUserMinus />
                                                {site.status === "active" ? "Replace Required" : "Remove Admin"}
                                            </button>

                                        </div>

                                    </>

                                )}

                            </div>

                        )}


                        {!admin && (
                            <div className="empty-user-card">
                                <p>No site admin assigned</p>

                                <Button
                                    size="medium"
                                    onClick={() => setAdminModal(true)}
                                >
                                    Add Site Admin
                                </Button>
                            </div>
                        )}

                    </div>

                    {/* VIEWERS */}

                    <div className="user-block">



                        <div className="viewer-header">
                            <h3>Site Viewers</h3>

                            <FaUserPlus
                                className="user-icon"
                                onClick={() => setViewerModal(true)}
                            />
                        </div>

                        {viewers.length === 0 && (
                            <p>No viewers assigned</p>
                        )}

                        {viewers.map((viewer: any) => (
                            <div key={viewer.id} className="user-card">

                                <p><strong>Name:</strong> {viewer.full_name}</p>
                                <p><strong>Email:</strong> {viewer.email}</p>

                                <FaUserMinus
                                    className="user-icon"
                                    onClick={() => removeViewer(viewer.id)}
                                />

                            </div>
                        ))}

                    </div>

                    {/* SITE MONITORS */}

                    <div className="user-block">
                        <div className="viewer-header">
                            <h3>Site Monitors</h3>

                            <FaUserPlus
                                className="user-icon"
                                onClick={() => {
                                    setMonitorModal(true);
                                    setMonitorStep("invite");
                                }}
                            />
                        </div>

                        {siteMonitors.length === 0 && <p>No site monitors assigned</p>}

                        {siteMonitors.map((monitor) => (
                            <div key={monitor.id} className="user-card">
                                <p><strong>Name:</strong> {monitor.full_name}</p>
                                <p><strong>Email:</strong> {monitor.email}</p>
                                <p><strong>Phone:</strong> {monitor.phone || "-"}</p>
                                <p>
                                    <strong>Status:</strong>{" "}
                                    <span className={`status ${monitor.status}`}>
                                        {monitor.status}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>

                </div>

                <SiteHierarchySection
                    siteId={siteId as string}
                    siteName={site.site_name}
                    siteStatus={site.status}
                />


                {isEditMode && (

                    <div className="site-save">

                        <Button size="medium" onClick={saveChanges}>
                            Save Changes
                        </Button>

                    </div>

                )}

                {removeAdminModal && admin && (
                    <div className="modal-overlay">
                        <div className="modal-card admin-danger-modal-card">
                            <div className="danger-modal-icon">
                                <FaUserMinus />
                            </div>

                            <h3>Remove Site Admin?</h3>

                            <p className="modal-helper-text">
                                This will remove <strong>{admin.full_name}</strong> as the site admin
                                for this site.
                            </p>

                            <div className="admin-warning-box">
                                This is allowed because the site is not active yet. Active sites must
                                always have a site admin assigned.
                            </div>

                            <div className="modal-actions">
                                <Button
                                    size="medium"
                                    onClick={confirmRemoveAdmin}
                                >
                                    Remove Admin
                                </Button>

                                <Button
                                    size="medium"
                                    onClick={() => setRemoveAdminModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {adminModal && (
                    <div className="modal-overlay">
                        <div className="modal-card admin-modal-card">
                            <h3>{admin ? "Change Site Admin" : "Add Site Admin"}</h3>

                            <p className="modal-helper-text">
                                Enter the email of an existing user to assign them as site admin.
                            </p>

                            <input
                                placeholder="Admin email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                            />

                            <div className="modal-actions">
                                <Button
                                    size="medium"
                                    onClick={assignSiteAdmin}
                                >
                                    {admin ? "Change Admin" : "Add Admin"}
                                </Button>

                                <Button
                                    size="medium"
                                    onClick={() => {
                                        setAdminModal(false);
                                        setNewAdminEmail("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {viewerModal && (

                    <div className="modal-overlay">

                        <div className="modal-card">

                            <h3>Add Viewer</h3>

                            <input
                                placeholder="Viewer email"
                                value={newViewerEmail}
                                onChange={(e) => setNewViewerEmail(e.target.value)}
                            />

                            <div className="modal-actions">

                                <Button
                                    size="medium"
                                    onClick={() => {
                                        addViewer()
                                        setViewerModal(false)
                                    }}
                                >
                                    Add Viewer
                                </Button>

                                <Button
                                    size="medium"
                                    onClick={() => setViewerModal(false)}
                                >
                                    Cancel
                                </Button>

                            </div>

                        </div>

                    </div>

                )}

                {monitorModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            {monitorStep === "invite" ? (
                                <>
                                    <h3>Add Site Monitor</h3>

                                    <input
                                        placeholder="Full name"
                                        value={monitorForm.full_name}
                                        onChange={(e) =>
                                            setMonitorForm({
                                                ...monitorForm,
                                                full_name: e.target.value,
                                            })
                                        }
                                    />

                                    <input
                                        placeholder="Email"
                                        value={monitorForm.email}
                                        onChange={(e) =>
                                            setMonitorForm({
                                                ...monitorForm,
                                                email: e.target.value,
                                            })
                                        }
                                    />

                                    <div className="modal-actions">
                                        <Button
                                            size="medium"
                                            onClick={inviteMonitor}
                                            disabled={inviteLoading}
                                        >
                                            {inviteLoading ? "Sending..." : "Send OTP"}
                                        </Button>

                                        <Button
                                            size="medium"
                                            onClick={() => setMonitorModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3>Verify Site Monitor OTP</h3>

                                    <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                                        OTP sent to {monitorForm.email}
                                    </p>

                                    <input
                                        placeholder="Enter OTP"
                                        value={monitorForm.otp}
                                        onChange={(e) =>
                                            setMonitorForm({
                                                ...monitorForm,
                                                otp: e.target.value,
                                            })
                                        }
                                    />

                                    <div className="modal-actions">
                                        <Button
                                            size="medium"
                                            onClick={verifyMonitorOtp}
                                            disabled={verifyLoading}
                                        >
                                            {verifyLoading ? "Verifying..." : "Verify"}
                                        </Button>

                                        <Button
                                            size="medium"
                                            onClick={() => {
                                                setMonitorModal(false);
                                                setMonitorStep("invite");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>

    );

};

export default SiteDetails;