export const USER_MANAGEMENT_ROLES = [
  "super_admin",
  "org_site_manager",
  "site_admin",
  "site_viewer",
  "site_monitor",
] as const;

export const USER_MANAGEMENT_STATUSES = [
  "active",
  "pending",
  "disabled",
] as const;

export const USER_ASSIGNMENT_STATUSES = [
  "assigned",
  "orphan",
  "super_admin",
] as const;

export type UserManagementRole =
  (typeof USER_MANAGEMENT_ROLES)[number];

export type UserManagementStatus =
  (typeof USER_MANAGEMENT_STATUSES)[number];

export type UserAssignmentStatus =
  (typeof USER_ASSIGNMENT_STATUSES)[number];

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

export interface ListUsersQuery {
  search?: string;
  role?: UserManagementRole | "all";
  status?: UserManagementStatus | "all";
  assignment_status?: UserAssignmentStatus | "all";
  site_id?: string;
}

export interface UpdateUserStatusPayload {
  status: "active" | "disabled";
}

export interface DeleteUserPayload {
  reason?: string;
}

export interface RequesterContext {
  id: string;
  organization_id: string;
  role: string;
}

export interface RawUserManagementRow {
  id: string;
  organization_id: string;

  full_name: string;
  email: string;
  phone: string | null;

  role: UserManagementRole;
  status: UserManagementStatus;
  email_verified: boolean;

  created_at: string;

  assigned_sites: UserAssignedSite[] | null;
  managed_sites: UserManagedSite[] | null;

  site_assignment_count: number;
  manager_assignment_count: number;
}