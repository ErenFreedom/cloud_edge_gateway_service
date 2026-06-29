import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaEye,
  FaFilter,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTrash,
  FaUserLock,
  FaUserSlash,
  FaUsers,
  FaUserShield,
  FaUserTie,
  FaTimes,
} from "react-icons/fa";

import type { RootState, AppDispatch } from "../../store/store";

import {
  clearUserManagementError,
  deleteOrphanUserThunk,
  fetchUserManagementUsersThunk,
  resetUserManagementFilters,
  resetUserManagementMutationState,
  setSelectedUser,
  setUserManagementFilters,
  updateUserManagementStatusThunk,
} from "../../features/userManagement/userManagementSlice";

import type {
  UserAssignmentStatus,
  UserManagementRole,
  UserManagementStatus,
  UserManagementUser,
} from "../../services/userManagement.service";

import "./UserManagementPanel.css";

/* ========================= */
/* CONSTANTS */
/* ========================= */

const ROLE_OPTIONS: {
  value: UserManagementRole | "all";
  label: string;
}[] = [
  { value: "all", label: "All Roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "org_site_manager", label: "Org Site Manager" },
  { value: "site_admin", label: "Site Admin" },
  { value: "site_monitor", label: "Site Monitor" },
  { value: "site_viewer", label: "Site Viewer" },
];

const STATUS_OPTIONS: {
  value: UserManagementStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "disabled", label: "Disabled" },
];

const ASSIGNMENT_OPTIONS: {
  value: UserAssignmentStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All Assignments" },
  { value: "assigned", label: "Assigned" },
  { value: "orphan", label: "Orphan" },
  { value: "super_admin", label: "Super Admin" },
];

/* ========================= */
/* HELPERS */
/* ========================= */

const formatRole = (role: string): string => {
  return role
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getPrimaryAssignmentLabel = (user: UserManagementUser): string => {
  if (user.role === "super_admin") {
    return "Organization owner";
  }

  if (user.role === "org_site_manager") {
    if (user.managed_sites.length === 0) return "No managed sites";
    if (user.managed_sites.length === 1) return user.managed_sites[0].site_name;
    return `${user.managed_sites[0].site_name} +${user.managed_sites.length - 1}`;
  }

  if (user.assigned_sites.length === 0) return "No assigned sites";
  if (user.assigned_sites.length === 1) return user.assigned_sites[0].site_name;

  return `${user.assigned_sites[0].site_name} +${user.assigned_sites.length - 1}`;
};

const buildCsv = (users: UserManagementUser[]): string => {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Role",
    "Status",
    "Email Verified",
    "Assignment Status",
    "Assignment Count",
    "Assigned Sites",
    "Managed Sites",
    "Created At",
  ];

  const rows = users.map((user) => [
    user.full_name,
    user.email,
    user.phone || "",
    user.role,
    user.status,
    user.email_verified ? "yes" : "no",
    user.assignment_status,
    String(user.assignment_count),
    user.assigned_sites.map((site) => site.site_name).join(" | "),
    user.managed_sites.map((site) => site.site_name).join(" | "),
    user.created_at,
  ]);

  const escapeCsv = (value: string): string => {
    const safe = value ?? "";
    if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
};

const downloadCsv = (users: UserManagementUser[]) => {
  const csv = buildCsv(users);
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `user-management-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

/* ========================= */
/* COMPONENT */
/* ========================= */

const UserManagementPanel = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    users,
    stats,
    selectedUser,
    filters,
    loading,
    statusLoading,
    deleteLoading,
    error,
    statusUpdated,
    userDeleted,
  } = useSelector((state: RootState) => state.userManagement);

  const [deleteModalUser, setDeleteModalUser] =
    useState<UserManagementUser | null>(null);

  const [deleteReason, setDeleteReason] = useState("");

  const [disableModalUser, setDisableModalUser] =
    useState<UserManagementUser | null>(null);

  const [enableModalUser, setEnableModalUser] =
    useState<UserManagementUser | null>(null);

  const hasUsers = users.length > 0;

  const availableSites = useMemo(() => {
    const map = new Map<string, string>();

    users.forEach((user) => {
      user.assigned_sites.forEach((site) => {
        map.set(site.site_id, site.site_name);
      });

      user.managed_sites.forEach((site) => {
        map.set(site.site_id, site.site_name);
      });
    });

    return Array.from(map.entries())
      .map(([site_id, site_name]) => ({
        site_id,
        site_name,
      }))
      .sort((a, b) => a.site_name.localeCompare(b.site_name));
  }, [users]);

  useEffect(() => {
    dispatch(fetchUserManagementUsersThunk(filters));
  }, [dispatch]);

  useEffect(() => {
    if (!statusUpdated && !userDeleted) return;

    const timer = window.setTimeout(() => {
      dispatch(resetUserManagementMutationState());
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [dispatch, statusUpdated, userDeleted]);

  const refreshUsers = () => {
    dispatch(fetchUserManagementUsersThunk(filters));
  };

  const applyFilters = () => {
    dispatch(fetchUserManagementUsersThunk(filters));
  };

  const resetFilters = () => {
    dispatch(resetUserManagementFilters());
    dispatch(fetchUserManagementUsersThunk({
      search: "",
      role: "all",
      status: "all",
      assignment_status: "all",
      site_id: "",
    }));
  };

  const updateFilter = (
    key: keyof typeof filters,
    value: string
  ) => {
    dispatch(
      setUserManagementFilters({
        [key]: value,
      })
    );
  };

  const confirmDisableUser = async () => {
    if (!disableModalUser) return;

    const result = await dispatch(
      updateUserManagementStatusThunk({
        userId: disableModalUser.id,
        status: "disabled",
      })
    );

    if (updateUserManagementStatusThunk.fulfilled.match(result)) {
      setDisableModalUser(null);
    }
  };

  const confirmEnableUser = async () => {
    if (!enableModalUser) return;

    const result = await dispatch(
      updateUserManagementStatusThunk({
        userId: enableModalUser.id,
        status: "active",
      })
    );

    if (updateUserManagementStatusThunk.fulfilled.match(result)) {
      setEnableModalUser(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteModalUser) return;

    const result = await dispatch(
      deleteOrphanUserThunk({
        userId: deleteModalUser.id,
        reason:
          deleteReason.trim() ||
          "Deleted orphan user from user management panel",
      })
    );

    if (deleteOrphanUserThunk.fulfilled.match(result)) {
      setDeleteModalUser(null);
      setDeleteReason("");
    }
  };

  const renderStatCards = () => {
    return (
      <div className="um-stat-grid">
        <div className="um-stat-card">
          <div className="um-stat-icon total">
            <FaUsers />
          </div>
          <div>
            <span>Total Users</span>
            <strong>{stats?.total_users ?? 0}</strong>
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-icon manager">
            <FaUserTie />
          </div>
          <div>
            <span>Org Managers</span>
            <strong>{stats?.org_site_managers ?? 0}</strong>
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-icon admin">
            <FaUserShield />
          </div>
          <div>
            <span>Site Admins</span>
            <strong>{stats?.site_admins ?? 0}</strong>
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-icon monitor">
            <FaShieldAlt />
          </div>
          <div>
            <span>Site Monitors</span>
            <strong>{stats?.site_monitors ?? 0}</strong>
          </div>
        </div>

        <div className="um-stat-card danger">
          <div className="um-stat-icon orphan">
            <FaExclamationTriangle />
          </div>
          <div>
            <span>Orphan Users</span>
            <strong>{stats?.orphan_users ?? 0}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignmentBadge = (status: UserAssignmentStatus) => {
    return (
      <span className={`um-assignment-badge ${status}`}>
        {status === "super_admin" ? "SUPER ADMIN" : status.toUpperCase()}
      </span>
    );
  };

  const renderUserDrawer = () => {
    if (!selectedUser) return null;

    const assignmentSites =
      selectedUser.role === "org_site_manager"
        ? selectedUser.managed_sites
        : selectedUser.assigned_sites;

    return (
      <div className="um-drawer-backdrop" onClick={() => dispatch(setSelectedUser(null))}>
        <aside
          className="um-user-drawer"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="um-drawer-header">
            <div>
              <p>User Details</p>
              <h3>{selectedUser.full_name}</h3>
              <span>{selectedUser.email}</span>
            </div>

            <button
              className="um-icon-button"
              type="button"
              onClick={() => dispatch(setSelectedUser(null))}
            >
              <FaTimes />
            </button>
          </div>

          <div className="um-drawer-section">
            <h4>Profile</h4>

            <div className="um-detail-grid">
              <div>
                <span>Role</span>
                <strong className={`um-role-badge ${selectedUser.role}`}>
                  {formatRole(selectedUser.role)}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className={`um-status-badge ${selectedUser.status}`}>
                  {selectedUser.status}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{selectedUser.phone || "-"}</strong>
              </div>

              <div>
                <span>Email Verified</span>
                <strong>{selectedUser.email_verified ? "Yes" : "No"}</strong>
              </div>

              <div>
                <span>Created</span>
                <strong>{formatDateTime(selectedUser.created_at)}</strong>
              </div>

              <div>
                <span>Assignment Health</span>
                {renderAssignmentBadge(selectedUser.assignment_status)}
              </div>
            </div>
          </div>

          <div className="um-drawer-section">
            <h4>
              {selectedUser.role === "org_site_manager"
                ? "Managed Sites"
                : "Assigned Sites"}
            </h4>

            {assignmentSites.length === 0 && (
              <div className="um-empty-assignment">
                No site assignments found for this user.
              </div>
            )}

            {assignmentSites.map((site: any) => (
              <div key={site.site_id} className="um-assignment-card">
                <div>
                  <strong>{site.site_name}</strong>
                  <span>{site.site_status}</span>
                </div>

                {"role_on_site" in site && (
                  <span className="um-mini-role">
                    {formatRole(site.role_on_site)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="um-drawer-section danger-zone">
            <h4>Danger Zone</h4>

            <p>
              Disable prevents login but keeps the account recoverable. Delete is
              available only for orphan users and writes an audit snapshot first.
            </p>

            <div className="um-drawer-actions">
              {selectedUser.can_disable && (
                <button
                  className="um-secondary-danger-btn"
                  type="button"
                  onClick={() => setDisableModalUser(selectedUser)}
                >
                  <FaUserSlash />
                  Disable
                </button>
              )}

              {selectedUser.can_enable && (
                <button
                  className="um-success-btn"
                  type="button"
                  onClick={() => setEnableModalUser(selectedUser)}
                >
                  <FaCheckCircle />
                  Enable
                </button>
              )}

              {selectedUser.can_delete && (
                <button
                  className="um-danger-btn"
                  type="button"
                  onClick={() => setDeleteModalUser(selectedUser)}
                >
                  <FaTrash />
                  Delete Orphan
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    );
  };

  return (
    <div className="um-panel">
      <div className="um-header">
        <div>
          <p className="um-kicker">Access Control</p>
          <h2>User Management</h2>
          <span>
            Centralized view of organization users, role assignments and orphan accounts.
          </span>
        </div>

        <div className="um-header-actions">
          <button
            className="um-light-btn"
            type="button"
            onClick={() => downloadCsv(users)}
            disabled={!hasUsers}
          >
            <FaDownload />
            Export CSV
          </button>

          <button
            className="um-refresh-btn"
            type="button"
            onClick={refreshUsers}
            disabled={loading}
          >
            <FaRedo />
            Refresh
          </button>
        </div>
      </div>

      {renderStatCards()}

      {error && (
        <div className="um-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => dispatch(clearUserManagementError())}
          >
            ×
          </button>
        </div>
      )}

      {(statusUpdated || userDeleted) && (
        <div className="um-success-alert">
          {statusUpdated && "User status updated successfully."}
          {userDeleted && "Orphan user deleted successfully."}
        </div>
      )}

      <div className="um-filter-card">
        <div className="um-search-box">
          <FaSearch />
          <input
            placeholder="Search by name, email or phone..."
            value={filters.search || ""}
            onChange={(event) => updateFilter("search", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyFilters();
            }}
          />
        </div>

        <select
          value={filters.role || "all"}
          onChange={(event) => updateFilter("role", event.target.value)}
        >
          {ROLE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status || "all"}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={filters.assignment_status || "all"}
          onChange={(event) =>
            updateFilter("assignment_status", event.target.value)
          }
        >
          {ASSIGNMENT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={filters.site_id || ""}
          onChange={(event) => updateFilter("site_id", event.target.value)}
        >
          <option value="">All Sites</option>

          {availableSites.map((site) => (
            <option key={site.site_id} value={site.site_id}>
              {site.site_name}
            </option>
          ))}
        </select>

        <button
          className="um-apply-btn"
          type="button"
          onClick={applyFilters}
          disabled={loading}
        >
          <FaFilter />
          Apply
        </button>

        <button
          className="um-reset-btn"
          type="button"
          onClick={resetFilters}
          disabled={loading}
        >
          Reset
        </button>
      </div>

      <div className="um-table-card">
        <div className="um-table-header">
          <div>
            <h3>Organization Users</h3>
            <p>
              {loading
                ? "Loading users..."
                : `${users.length} user${users.length === 1 ? "" : "s"} found`}
            </p>
          </div>
        </div>

        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email</th>
                <th>Assigned / Managed Sites</th>
                <th>Health</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="um-empty-cell">
                    Loading organization users...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="um-empty-cell">
                    No users found for the selected filters.
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="um-user-cell">
                        <div className="um-avatar">
                          {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div>
                          <strong>{user.full_name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`um-role-badge ${user.role}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>

                    <td>
                      <span className={`um-status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`um-email-verified ${
                          user.email_verified ? "yes" : "no"
                        }`}
                      >
                        {user.email_verified ? "Verified" : "Not Verified"}
                      </span>
                    </td>

                    <td>
                      <div className="um-assignment-text">
                        <strong>{getPrimaryAssignmentLabel(user)}</strong>
                        <span>{user.assignment_count} assignment(s)</span>
                      </div>
                    </td>

                    <td>{renderAssignmentBadge(user.assignment_status)}</td>

                    <td>{formatDateTime(user.created_at)}</td>

                    <td>
                      <div className="um-row-actions">
                        <button
                          className="um-icon-action"
                          type="button"
                          title="View details"
                          onClick={() => dispatch(setSelectedUser(user))}
                        >
                          <FaEye />
                        </button>

                        {user.can_disable && (
                          <button
                            className="um-icon-action warning"
                            type="button"
                            title="Disable user"
                            onClick={() => setDisableModalUser(user)}
                          >
                            <FaUserLock />
                          </button>
                        )}

                        {user.can_enable && (
                          <button
                            className="um-icon-action success"
                            type="button"
                            title="Enable user"
                            onClick={() => setEnableModalUser(user)}
                          >
                            <FaCheckCircle />
                          </button>
                        )}

                        {user.can_delete && (
                          <button
                            className="um-icon-action danger"
                            type="button"
                            title="Delete orphan user"
                            onClick={() => setDeleteModalUser(user)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {renderUserDrawer()}

      {disableModalUser && (
        <div className="um-modal-backdrop">
          <div className="um-modal-card">
            <div className="um-modal-icon warning">
              <FaUserSlash />
            </div>

            <h3>Disable User?</h3>

            <p>
              This will prevent <strong>{disableModalUser.full_name}</strong> from
              logging in. Their assignments will remain intact.
            </p>

            <div className="um-modal-actions">
              <button
                className="um-secondary-danger-btn"
                type="button"
                onClick={confirmDisableUser}
                disabled={statusLoading}
              >
                {statusLoading ? "Disabling..." : "Disable User"}
              </button>

              <button
                className="um-cancel-btn"
                type="button"
                onClick={() => setDisableModalUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {enableModalUser && (
        <div className="um-modal-backdrop">
          <div className="um-modal-card">
            <div className="um-modal-icon success">
              <FaCheckCircle />
            </div>

            <h3>Enable User?</h3>

            <p>
              This will restore login access for{" "}
              <strong>{enableModalUser.full_name}</strong>.
            </p>

            <div className="um-modal-actions">
              <button
                className="um-success-btn"
                type="button"
                onClick={confirmEnableUser}
                disabled={statusLoading}
              >
                {statusLoading ? "Enabling..." : "Enable User"}
              </button>

              <button
                className="um-cancel-btn"
                type="button"
                onClick={() => setEnableModalUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalUser && (
        <div className="um-modal-backdrop">
          <div className="um-modal-card">
            <div className="um-modal-icon danger">
              <FaTrash />
            </div>

            <h3>Delete Orphan User?</h3>

            <p>
              This will permanently remove{" "}
              <strong>{deleteModalUser.full_name}</strong> from the users table
              after saving an audit snapshot.
            </p>

            <div className="um-warning-box">
              Delete is allowed only because this user has no site or manager
              assignments.
            </div>

            <textarea
              placeholder="Reason for deletion..."
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
            />

            <div className="um-modal-actions">
              <button
                className="um-danger-btn"
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete User"}
              </button>

              <button
                className="um-cancel-btn"
                type="button"
                onClick={() => {
                  setDeleteModalUser(null);
                  setDeleteReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;