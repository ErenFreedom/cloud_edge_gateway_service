import { useState } from "react";
import { FaProjectDiagram } from "react-icons/fa";

import Button from "../ui/Button";
import SiteHierarchyModal from "./SiteHierarchyModal";

import "./SiteHierarchy.css";

interface SiteHierarchySectionProps {
  siteId: string;
  siteName: string;
  siteStatus: string;
}

const SiteHierarchySection = ({
  siteId,
  siteName,
  siteStatus,
}: SiteHierarchySectionProps) => {
  const [open, setOpen] = useState(false);

  const isActive = siteStatus === "active";

  return (
    <>
      <div className="site-section hierarchy-section">
        <div className="hierarchy-section-header">
          <div>
            <h2>Site Hierarchy</h2>
            <p>
              Create buildings, floors, rooms and components, then assign
              sensors to their physical location.
            </p>
          </div>

          <Button size="medium" onClick={() => setOpen(true)}>
            Manage Hierarchy
          </Button>
        </div>

        <div className="hierarchy-preview-card">
          <div className="hierarchy-preview-icon">
            <FaProjectDiagram />
          </div>

          <div>
            <h3>{siteName}</h3>
            <p>
              {isActive
                ? "Hierarchy configuration is enabled for this active site."
                : "This site is not active. Hierarchy is view-only until activation."}
            </p>
          </div>

          <span
            className={`hierarchy-status ${
              isActive ? "active" : "inactive"
            }`}
          >
            {isActive ? "Active" : "View Only"}
          </span>
        </div>
      </div>

      {open && (
        <SiteHierarchyModal
          siteId={siteId}
          siteName={siteName}
          siteStatus={siteStatus}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default SiteHierarchySection;