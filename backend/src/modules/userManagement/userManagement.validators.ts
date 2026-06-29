import {
  DeleteUserPayload,
  ListUsersQuery,
  UpdateUserStatusPayload,
  USER_ASSIGNMENT_STATUSES,
  USER_MANAGEMENT_ROLES,
  USER_MANAGEMENT_STATUSES,
  UserAssignmentStatus,
  UserManagementRole,
  UserManagementStatus,
} from "./userManagement.types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

export const isValidUuid = (value: unknown): value is string => {
  return typeof value === "string" && UUID_REGEX.test(value);
};

const normalizeOptionalString = (
  value: unknown,
  fieldName: string,
  options?: {
    maxLength?: number;
    allowEmpty?: boolean;
  }
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (!options?.allowEmpty && trimmed.length === 0) {
    return undefined;
  }

  if (options?.maxLength && trimmed.length > options.maxLength) {
    throw new Error(`${fieldName} must be at most ${options.maxLength} characters`);
  }

  return trimmed;
};

const assertAllowedValue = <T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  fieldName: string
): T[number] => {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  if (!allowedValues.includes(value)) {
    throw new Error(
      `${fieldName} must be one of: ${allowedValues.join(", ")}`
    );
  }

  return value as T[number];
};

const assertAllowedOrAll = <T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  fieldName: string
): T[number] | "all" | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "all") {
    return "all";
  }

  return assertAllowedValue(value, allowedValues, fieldName);
};

export const validateUserIdParam = (
  userId: unknown
): string => {
  if (!isValidUuid(userId)) {
    throw new Error("Invalid userId");
  }

  return userId;
};

export const validateListUsersQuery = (
  query: unknown
): ListUsersQuery => {
  if (!isPlainObject(query)) {
    return {};
  }

  const search = normalizeOptionalString(query.search, "search", {
    maxLength: 120,
  });

  const role = assertAllowedOrAll(
    query.role,
    USER_MANAGEMENT_ROLES,
    "role"
  ) as UserManagementRole | "all" | undefined;

  const status = assertAllowedOrAll(
    query.status,
    USER_MANAGEMENT_STATUSES,
    "status"
  ) as UserManagementStatus | "all" | undefined;

  const assignmentStatus = assertAllowedOrAll(
    query.assignment_status,
    USER_ASSIGNMENT_STATUSES,
    "assignment_status"
  ) as UserAssignmentStatus | "all" | undefined;

  const siteId = normalizeOptionalString(query.site_id, "site_id", {
    maxLength: 80,
  });

  if (siteId && !isValidUuid(siteId)) {
    throw new Error("Invalid site_id");
  }

  return {
    search,
    role,
    status,
    assignment_status: assignmentStatus,
    site_id: siteId,
  };
};

export const validateUpdateUserStatusPayload = (
  body: unknown
): UpdateUserStatusPayload => {
  if (!isPlainObject(body)) {
    throw new Error("Request body must be an object");
  }

  const status = assertAllowedValue(
    body.status,
    ["active", "disabled"] as const,
    "status"
  );

  return {
    status,
  };
};

export const validateDeleteUserPayload = (
  body: unknown
): DeleteUserPayload => {
  if (body === undefined || body === null) {
    return {};
  }

  if (!isPlainObject(body)) {
    throw new Error("Request body must be an object");
  }

  const reason = normalizeOptionalString(body.reason, "reason", {
    maxLength: 300,
  });

  return {
    reason,
  };
};