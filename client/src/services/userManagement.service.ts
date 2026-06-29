import { apiClient } from "../api/apiClient";

/* ========================= */
/* TYPES */
/* ========================= */

export type UserManagementRole =
  | "super_admin"
  | "org_site_manager"
  | "site_admin"
  | "site_viewer"
  | "site_monitor";

export type UserManagementStatus =
  | "active"
  | "pending"
  | "disabled";

export type UserAssignmentStatus =
  | "assigned"
  | "orphan"
  | "super_admin";

export interface UserAssignedSite {
  site_id: string;
  site_name: string;
  site_status: string;
  role_on_site: "site_admin" | "site_viewer" | "site_monitor";
  assigned_at: string | null;
}

export interface UserManagedSite {
  site_id: string;
  site_name: string;
  site_status: string;
  assigned_at: string | null;
}

export interface UserManagementUser {
  id: string;
  organization_id: string;

  full_name: string;
  email: string;
  phone: string | null;

  role: UserManagementRole;
  status: UserManagementStatus;
  email_verified: boolean;

  created_at: string;

  assigned_sites: UserAssignedSite[];
  managed_sites: UserManagedSite[];

  assignment_count: number;
  assignment_status: UserAssignmentStatus;

  can_disable: boolean;
  can_enable: boolean;
  can_delete: boolean;
}

export interface UserManagementStats {
  total_users: number;

  super_admins: number;
  org_site_managers: number;
  site_admins: number;
  site_monitors: number;
  site_viewers: number;

  assigned_users: number;
  orphan_users: number;
  disabled_users: number;
  pending_users: number;
}

export interface UserManagementListResponse {
  stats: UserManagementStats;
  users: UserManagementUser[];
}

export interface UserManagementFilters {
  search?: string;
  role?: UserManagementRole | "all";
  status?: UserManagementStatus | "all";
  assignment_status?: UserAssignmentStatus | "all";
  site_id?: string;
}

export interface UpdateUserStatusPayload {
  userId: string;
  status: "active" | "disabled";
}

export interface DeleteOrphanUserPayload {
  userId: string;
  reason?: string;
}

/* ========================= */
/* HELPERS */
/* ========================= */

const buildQueryParams = (
  filters?: UserManagementFilters
): URLSearchParams => {
  const params = new URLSearchParams();

  if (!filters) return params;

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.role && filters.role !== "all") {
    params.set("role", filters.role);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (
    filters.assignment_status &&
    filters.assignment_status !== "all"
  ) {
    params.set("assignment_status", filters.assignment_status);
  }

  if (filters.site_id?.trim()) {
    params.set("site_id", filters.site_id.trim());
  }

  return params;
};

/* ========================= */
/* API FUNCTIONS */
/* ========================= */

export const fetchUserManagementUsers = async (
  filters?: UserManagementFilters
): Promise<UserManagementListResponse> => {
  const params = buildQueryParams(filters);

  const queryString = params.toString();

  const response = await apiClient.get<UserManagementListResponse>(
    queryString
      ? `/user-management/users?${queryString}`
      : "/user-management/users"
  );

  return response.data;
};

export const updateUserManagementStatus = async (
  payload: UpdateUserStatusPayload
) => {
  const response = await apiClient.patch(
    `/user-management/users/${payload.userId}/status`,
    {
      status: payload.status,
    }
  );

  return response.data;
};

export const deleteOrphanUser = async (
  payload: DeleteOrphanUserPayload
) => {
  const response = await apiClient.delete(
    `/user-management/users/${payload.userId}`,
    {
      data: {
        reason: payload.reason,
      },
    }
  );

  return response.data;
};