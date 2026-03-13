import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../../store/store";

import {
    fetchSiteDetailsThunk,
    updateSiteThunk
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

    const isEditMode = location.pathname.includes("/edit");

    const { selectedSite, siteDetailsLoading } =
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

    const saveChanges = () => {

        if (!siteId) return;

        dispatch(updateSiteThunk({
            siteId,
            data: formData
        }));

    };

    if (siteDetailsLoading) {
        return <div className="site-page">Loading site...</div>;
    }

    if (!selectedSite) {
        return <div className="site-page">Site not found</div>;
    }

    const site = selectedSite.site;

    const admin = selectedSite.users.find(
        (u: any) => u.site_role === "site_admin"
    );

    const viewers = selectedSite.users.filter(
        (u: any) => u.site_role === "site_viewer"
    );

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

                            <p><strong>Name:</strong> {admin.full_name}</p>
                            <p><strong>Email:</strong> {admin.email}</p>
                            <p><strong>Phone:</strong> {admin.phone || "-"}</p>

                        </div>

                    )}

                </div>

                {/* VIEWERS */}

                <div className="user-block">

                    <h3>Site Viewers</h3>

                    {viewers.length === 0 && (
                        <p>No viewers assigned</p>
                    )}

                    {viewers.map((viewer: any) => (

                        <div key={viewer.id} className="user-card">

                            <p><strong>Name:</strong> {viewer.full_name}</p>
                            <p><strong>Email:</strong> {viewer.email}</p>

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
            </div>

        </div>

    );

};

export default SiteDetails;