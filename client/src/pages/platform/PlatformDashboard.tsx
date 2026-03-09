import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../../store/store";

import {
  fetchRequestsThunk,
  fetchOrganizationsThunk,
  approveRequestThunk,
  rejectRequestThunk,
  suspendOrganizationThunk,
  reactivateOrganizationThunk,
  scheduleDeletionThunk
} from "../../features/platform/platformSlice";

import Button from "../../components/ui/Button";
import "./PlatformDashboard.css";

type ActionType =
  | "approve"
  | "reject"
  | "suspend"
  | "reactivate"
  | "delete"
  | null;

const PlatformDashboard = () => {

  const dispatch = useDispatch<AppDispatch>();

  const { pendingRequests, organizations, loading } = useSelector(
    (state: RootState) => state.platform
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    dispatch(fetchRequestsThunk());
    dispatch(fetchOrganizationsThunk());
  }, [dispatch]);

  const openModal = (id: string, type: ActionType) => {
    setSelectedId(id);
    setActionType(type);
    setReason("");
    setConfirmText("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedId(null);
    setActionType(null);
  };

  const executeAction = () => {

    if (!selectedId || !actionType) return;

    if (actionType === "approve") {
      dispatch(approveRequestThunk(selectedId));
    }

    if (actionType === "reject") {
      dispatch(rejectRequestThunk({
        id: selectedId,
        reason
      }));
    }

    if (actionType === "suspend") {
      dispatch(suspendOrganizationThunk({
        organizationId: selectedId,
        reason
      }));
    }

    if (actionType === "reactivate") {
      dispatch(reactivateOrganizationThunk({
        organizationId: selectedId,
        reason
      }));
    }

    if (actionType === "delete") {
      dispatch(scheduleDeletionThunk({
        organizationId: selectedId,
        reason
      }));
    }

    closeModal();
  };

  return (

    <div className="platform-container">

      <h1>Platform Admin Dashboard</h1>

      {loading && <p>Loading...</p>}

      {/* ---------------- PENDING REQUESTS ---------------- */}

      <h2>Pending Requests</h2>

      <table className="platform-table">

        <thead>
          <tr>
            <th>Organization</th>
            <th>Admin Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {pendingRequests
            .filter((r: any) => r.status === "pending")
            .map((r: any) => (

              <tr key={r.id}>

                <td>{r.org_name}</td>
                <td>{r.super_admin_email}</td>
                <td>{r.status}</td>

                <td className="action-buttons">

                  <Button size="small" onClick={() => openModal(r.id, "approve")}>
                    Approve
                  </Button>

                  <Button size="small" onClick={() => openModal(r.id, "reject")}>
                    Reject
                  </Button>

                </td>

              </tr>

            ))}

        </tbody>

      </table>

      {/* ---------------- APPROVED ORGANIZATIONS ---------------- */}

      <h2>Approved Organizations</h2>

      <table className="platform-table">

        <thead>
          <tr>
            <th>Organization</th>
            <th>Status</th>
            <th>Activated</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {organizations.map((org: any) => (

            <tr key={org.id}>

              <td>{org.org_name}</td>
              <td>{org.status}</td>
              <td>{org.activated_at}</td>

              <td className="action-buttons">

                {org.status === "active" && (
                  <>
                    <Button size="small" onClick={() => openModal(org.id, "suspend")}>
                      Suspend
                    </Button>

                    <Button size="small" onClick={() => openModal(org.id, "delete")}>
                      Delete
                    </Button>
                  </>
                )}

                {org.status === "suspended" && (
                  <Button size="small" onClick={() => openModal(org.id, "reactivate")}>
                    Reactivate
                  </Button>
                )}

                {org.status === "deletion_scheduled" && (
                  <span>Deletion Scheduled</span>
                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* ---------------- ACTION MODAL ---------------- */}

      {modalOpen && (

        <div className="modal-overlay">

          <div className="modal">

            <h2>{actionType?.toUpperCase()} Confirmation</h2>

            {actionType !== "approve" && (
              <textarea
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}

            <input
              placeholder={`Type "${actionType}" to confirm`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />

            <div className="modal-buttons">

              <Button size="medium" onClick={closeModal}>
                Cancel
              </Button>

              <Button
                size="medium"
                disabled={
                  confirmText !== actionType ||
                  (actionType !== "approve" && reason.trim() === "")
                }
                onClick={executeAction}
              >
                Confirm
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default PlatformDashboard;