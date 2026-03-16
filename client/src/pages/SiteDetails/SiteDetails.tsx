import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaUserEdit, FaUserMinus, FaUserPlus } from "react-icons/fa";
import type { RootState, AppDispatch } from "../../store/store";

import {
    fetchSiteDetailsThunk,
    updateSiteThunk,
    editSiteUserThunk,
    requestEmailChangeThunk,
    verifyEmailChangeThunk
} from "../../features/sites/sitesSlice";

import Button from "../../components/ui/Button";

import "./SiteDetails.css";

const mask = (value?: string | null) => {
    if (!value) return "Not yet activated";
    return "**************";
};

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

    useEffect(() => {

        if (siteId) {
            dispatch(fetchSiteDetailsThunk(siteId));
        }

    }, [siteId, dispatch]);

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
            userId: adminForm.id,
            full_name: adminForm.full_name,
            phone: adminForm.phone,
            birthdate: adminForm.birthdate,
            gender: adminForm.gender
        }));

        setEditingAdmin(false);

    };

    const removeAdmin = () => {

        if (!admin) return;

        dispatch(editSiteUserThunk({
            action: "remove_admin",
            userId: admin.id
        }));

    };


    const addViewer = () => {

        if (!newViewerEmail) return;

        dispatch(editSiteUserThunk({
            action: "add_viewer",
            email: newViewerEmail
        }));

        setNewViewerEmail("");

    };

    const removeViewer = (viewerId: string) => {

        dispatch(editSiteUserThunk({
            action: "remove_viewer",
            userId: viewerId
        }));

    };

    const requestEmailChange = () => {

        dispatch(requestEmailChangeThunk({
            userId: adminForm.id,
            newEmail
        }));

    };

    const verifyEmailOtp = (otpId: string) => {

        dispatch(verifyEmailChangeThunk({
            otpId,
            otp
        })).then(() => {
            if (siteId) {
                dispatch(fetchSiteDetailsThunk(siteId));
            }
        });

    };

    const saveChanges = () => {

        if (!siteId) return;

        dispatch(updateSiteThunk({
            siteId,
            data: formData
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

    return (

        <div className="site-page">
            <div className="site-container">
                <div className="site-header">
                    <h1 className="site-title">
                        {site.site_name}
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
                                <p>{site.address_line1}</p>
                            )}
                        </div>

                        <div>
                            <label>Location</label>
                            <p>
                                {site.state}, {site.country}
                            </p>
                        </div>

                        <div>
                            <label>Site UUID</label>
                            <p>{mask(site.site_uuid)}</p>
                        </div>

                        <div>
                            <label>Machine Fingerprint</label>
                            <p>{mask(site.machine_fingerprint)}</p>
                        </div>

                        <div>
                            <label>Status</label>
                            <p className={`status ${site.status}`}>
                                {site.status}
                            </p>
                        </div>

                    </div>

                </div>

                {/* USERS */}

                <div className="site-section">

                    <h2>Site Users</h2>

                    {/* ADMIN */}

                    <div className="user-block">

                        <h3>Site Admin</h3>

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

                                            <FaUserEdit
                                                className="user-icon"
                                                onClick={() => setEditingAdmin(true)}
                                            />

                                            <FaUserMinus
                                                className="user-icon"
                                                onClick={removeAdmin}
                                            />

                                        </div>

                                    </>

                                )}

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

                </div>

                {isEditMode && (

                    <div className="site-save">

                        <Button size="medium" onClick={saveChanges}>
                            Save Changes
                        </Button>

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
            </div>

        </div>

    );

};

export default SiteDetails;