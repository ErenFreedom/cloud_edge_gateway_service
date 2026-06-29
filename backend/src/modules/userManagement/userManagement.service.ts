import { PoolClient } from "pg";
import { pool } from "../../config/database";

import {
  DeleteUserPayload,
  ListUsersQuery,
  RawUserManagementRow,
  UpdateUserStatusPayload,
  UserAssignmentStatus,
  UserManagementListResponse,
  UserManagementStats,
  UserManagementUser,
} from "./userManagement.types";

import {
  countUserManagerAssignmentsRepo,
  countUserSiteAssignmentsRepo,
  deleteUserRepo,
  getOrganizationUsersRepo,
  getRequesterRepo,
  getUserForMutationRepo,
  insertDeletedUserAuditRepo,
  updateUserStatusRepo,
} from "./userManagement.repository";

/* ========================= */
/* AUTH HELPERS */
/* ========================= */

const assertSuperAdmin = (requester: any) => {
  if (!requester) {
    throw new Error("User not found");
  }

  if (requester.status === "disabled") {
    throw new Error("User account is disabled");
  }

  if (requester.role !== "super_admin") {
    throw new Error("Only super admin can access user management");
  }

  if (!requester.organization_id) {
    throw new Error("User not linked to organization");
  }
};

const assertCanMutateTargetUser = async (
  client: PoolClient,
  organizationId: string,
  targetUserId: string
) => {
  const user = await getUserForMutationRepo(
    client,
    organizationId,
    targetUserId
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "super_admin") {
    throw new Error("Super admin users cannot be modified from this module");
  }

  return user;
};

/* ========================= */
/* ASSIGNMENT HEALTH */
/* ========================= */

const getAssignmentStatus = (
  user: RawUserManagementRow
): UserAssignmentStatus => {
  const siteAssignmentCount = Number(user.site_assignment_count || 0);
  const managerAssignmentCount = Number(user.manager_assignment_count || 0);

  if (user.role === "super_admin") {
    return "super_admin";
  }

  if (user.role === "org_site_manager") {
    return managerAssignmentCount > 0 ? "assigned" : "orphan";
  }

  if (
    user.role === "site_admin" ||
    user.role === "site_viewer" ||
    user.role === "site_monitor"
  ) {
    return siteAssignmentCount > 0 ? "assigned" : "orphan";
  }

  return "orphan";
};

const getAssignmentCount = (user: RawUserManagementRow): number => {
  if (user.role === "org_site_manager") {
    return Number(user.manager_assignment_count || 0);
  }

  if (user.role === "super_admin") {
    return 0;
  }

  return Number(user.site_assignment_count || 0);
};

const normalizeJsonArray = <T>(value: unknown): T[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeUserManagementUser = (
  user: RawUserManagementRow
): UserManagementUser => {
  const assignmentStatus = getAssignmentStatus(user);
  const assignmentCount = getAssignmentCount(user);

  const isSuperAdmin = user.role === "super_admin";
  const isDisabled = user.status === "disabled";

  return {
    id: user.id,
    organization_id: user.organization_id,

    full_name: user.full_name,
    email: user.email,
    phone: user.phone,

    role: user.role,
    status: user.status,
    email_verified: user.email_verified,

    created_at: user.created_at,

    assigned_sites: normalizeJsonArray(user.assigned_sites),
    managed_sites: normalizeJsonArray(user.managed_sites),

    assignment_count: assignmentCount,
    assignment_status: assignmentStatus,

    can_disable: !isSuperAdmin && !isDisabled,
    can_enable: !isSuperAdmin && isDisabled,
    can_delete: !isSuperAdmin && assignmentStatus === "orphan",
  };
};

const applyAssignmentStatusFilter = (
  users: UserManagementUser[],
  query: ListUsersQuery
): UserManagementUser[] => {
  if (!query.assignment_status || query.assignment_status === "all") {
    return users;
  }

  return users.filter(
    (user) => user.assignment_status === query.assignment_status
  );
};

const buildStats = (
  users: UserManagementUser[]
): UserManagementStats => {
  return {
    total_users: users.length,

    super_admins: users.filter((u) => u.role === "super_admin").length,
    org_site_managers: users.filter((u) => u.role === "org_site_manager").length,
    site_admins: users.filter((u) => u.role === "site_admin").length,
    site_monitors: users.filter((u) => u.role === "site_monitor").length,
    site_viewers: users.filter((u) => u.role === "site_viewer").length,

    assigned_users: users.filter((u) => u.assignment_status === "assigned").length,
    orphan_users: users.filter((u) => u.assignment_status === "orphan").length,
    disabled_users: users.filter((u) => u.status === "disabled").length,
    pending_users: users.filter((u) => u.status === "pending").length,
  };
};

/* ========================= */
/* SERVICES */
/* ========================= */

export const listOrganizationUsersService = async (
  requesterId: string,
  query: ListUsersQuery
): Promise<UserManagementListResponse> => {
  const client: PoolClient = await pool.connect();

  try {
    const requester = await getRequesterRepo(client, requesterId);

    assertSuperAdmin(requester);

    const rawUsers = await getOrganizationUsersRepo(
      client,
      requester.organization_id,
      query
    );

    const normalizedUsers = rawUsers.map(normalizeUserManagementUser);

    const filteredUsers = applyAssignmentStatusFilter(
      normalizedUsers,
      query
    );

    return {
      stats: buildStats(filteredUsers),
      users: filteredUsers,
    };
  } finally {
    client.release();
  }
};

export const updateUserManagementStatusService = async (
  requesterId: string,
  targetUserId: string,
  payload: UpdateUserStatusPayload
) => {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");

    const requester = await getRequesterRepo(client, requesterId);
    assertSuperAdmin(requester);

    const targetUser = await assertCanMutateTargetUser(
      client,
      requester.organization_id,
      targetUserId
    );

    if (targetUser.status === payload.status) {
      await client.query("COMMIT");

      return {
        message: `User is already ${payload.status}`,
        user: {
          id: targetUser.id,
          full_name: targetUser.full_name,
          email: targetUser.email,
          role: targetUser.role,
          status: targetUser.status,
          email_verified: targetUser.email_verified,
        },
      };
    }

    const updatedUser = await updateUserStatusRepo(
      client,
      targetUserId,
      payload
    );

    await client.query("COMMIT");

    return {
      message:
        payload.status === "disabled"
          ? "User disabled successfully"
          : "User enabled successfully",
      user: updatedUser,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteOrphanUserService = async (
  requesterId: string,
  targetUserId: string,
  payload: DeleteUserPayload
) => {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");

    const requester = await getRequesterRepo(client, requesterId);
    assertSuperAdmin(requester);

    const targetUser = await assertCanMutateTargetUser(
      client,
      requester.organization_id,
      targetUserId
    );

    const siteAssignmentCount = await countUserSiteAssignmentsRepo(
      client,
      targetUserId
    );

    const managerAssignmentCount = await countUserManagerAssignmentsRepo(
      client,
      targetUserId
    );

    if (siteAssignmentCount > 0 || managerAssignmentCount > 0) {
      throw new Error("Only orphan users can be deleted");
    }

    await insertDeletedUserAuditRepo(client, {
      user: targetUser,
      deletedBy: requesterId,
      reason: payload.reason || "Deleted orphan user from user management",
    });

    await deleteUserRepo(client, targetUserId);

    await client.query("COMMIT");

    return {
      message: "Orphan user deleted successfully",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};