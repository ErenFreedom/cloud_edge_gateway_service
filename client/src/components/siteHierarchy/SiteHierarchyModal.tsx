import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store/store";

import {
  fetchSiteHierarchyThunk,
  fetchSensorAssignmentsThunk,
  resetSiteHierarchyState,
} from "../../features/siteHierarchy/siteHierarchySlice";

import HierarchyOverviewTab from "./HierarchyOverviewTab";
import HierarchyTreeBuilderTab from "./HierarchyTreeBuilderTab";
import SensorAssignmentTab from "./SensorAssignmentTab";

import "./SiteHierarchy.css";

type HierarchyTab = "overview" | "tree" | "sensors";

interface SiteHierarchyModalProps {
  siteId: string;
  siteName: string;
  siteStatus: string;
  onClose: () => void;
}

const SiteHierarchyModal = ({
  siteId,
  siteName,
  siteStatus,
  onClose,
}: SiteHierarchyModalProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const [activeTab, setActiveTab] =
    useState<HierarchyTab>("overview");

  useEffect(() => {
    dispatch(fetchSiteHierarchyThunk(siteId));
    dispatch(fetchSensorAssignmentsThunk(siteId));

    return () => {
      dispatch(resetSiteHierarchyState());
    };
  }, [dispatch, siteId]);

  return (
    <div className="hierarchy-modal-overlay">
      <div className="hierarchy-modal">
        <div className="hierarchy-modal-header">
          <div>
            <h2>Site Hierarchy</h2>
            <p>{siteName}</p>
          </div>

          <button
            className="hierarchy-close-btn"
            onClick={onClose}
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        <div className="hierarchy-tabs">
          <button
            type="button"
            className={
              activeTab === "overview"
                ? "hierarchy-tab active"
                : "hierarchy-tab"
            }
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>

          <button
            type="button"
            className={
              activeTab === "tree"
                ? "hierarchy-tab active"
                : "hierarchy-tab"
            }
            onClick={() => setActiveTab("tree")}
          >
            Tree Builder
          </button>

          <button
            type="button"
            className={
              activeTab === "sensors"
                ? "hierarchy-tab active"
                : "hierarchy-tab"
            }
            onClick={() => setActiveTab("sensors")}
          >
            Sensor Assignment
          </button>
        </div>

        <div className="hierarchy-modal-body">
          {activeTab === "overview" && (
            <HierarchyOverviewTab
              siteId={siteId}
              siteStatus={siteStatus}
            />
          )}

          {activeTab === "tree" && (
            <HierarchyTreeBuilderTab
              siteId={siteId}
              siteStatus={siteStatus}
            />
          )}

          {activeTab === "sensors" && (
            <SensorAssignmentTab
              siteId={siteId}
              siteStatus={siteStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteHierarchyModal;