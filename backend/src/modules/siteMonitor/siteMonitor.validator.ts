import {
  ChangeSiteMonitorPasswordPayload,
  InviteSiteMonitorPayload,
  UpdateSiteMonitorPayload,
  VerifySiteMonitorOtpPayload,
  AuthUser,
} from "./siteMonitor.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: any): string => {
  if (!email || typeof email !== "string") {
    throw new Error("Valid email is required");
  }

  const normalized = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalized)) {
    throw new Error("Invalid email format");
  }

  return normalized;
};

export const validateSiteIds = (siteIds: any): string[] => {
  if (!Array.isArray(siteIds) || siteIds.length === 0) {
    throw new Error("At least one site_id is required");
  }

  const cleaned = siteIds
    .filter((id) => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    throw new Error("Valid site_ids are required");
  }

  return [...new Set(cleaned)];
};

export const validateInvitePayload = (
  body: any
): InviteSiteMonitorPayload => {
  if (!body.full_name || typeof body.full_name !== "string") {
    throw new Error("full_name is required");
  }

  return {
    full_name: body.full_name.trim(),
    email: validateEmail(body.email),
    site_ids: validateSiteIds(body.site_ids),
  };
};

export const validateVerifyOtpPayload = (
  body: any
): VerifySiteMonitorOtpPayload => {
  if (!body.otp || typeof body.otp !== "string") {
    throw new Error("OTP is required");
  }

  if (!/^\d{6}$/.test(body.otp.trim())) {
    throw new Error("OTP must be 6 digits");
  }

  return {
    email: validateEmail(body.email),
    otp: body.otp.trim(),
  };
};

export const validateUpdatePayload = (
  body: any
): UpdateSiteMonitorPayload => {
  const payload: UpdateSiteMonitorPayload = {};

  if (body.full_name !== undefined) {
    if (!body.full_name || typeof body.full_name !== "string") {
      throw new Error("Invalid full_name");
    }

    payload.full_name = body.full_name.trim();
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string") {
      throw new Error("Invalid phone");
    }

    payload.phone = body.phone.trim();
  }

  if (body.site_ids !== undefined) {
    payload.site_ids = validateSiteIds(body.site_ids);
  }

  if (body.status !== undefined) {
    if (!["active", "disabled"].includes(body.status)) {
      throw new Error("Invalid status");
    }

    payload.status = body.status;
  }

  return payload;
};

export const validateChangePasswordPayload = (
  body: any
): ChangeSiteMonitorPasswordPayload => {
  if (!body.user_id || typeof body.user_id !== "string") {
    throw new Error("user_id is required");
  }

  if (!body.new_password || typeof body.new_password !== "string") {
    throw new Error("new_password is required");
  }

  if (body.new_password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  return {
    user_id: body.user_id.trim(),
    new_password: body.new_password,
  };
};

export const assertCanManageSiteMonitor = (user: AuthUser) => {
  if (!user?.role) {
    throw new Error("Unauthorized");
  }

  if (
    ![
      "super_admin",
      "org_site_manager",
      "site_admin",
    ].includes(user.role)
  ) {
    throw new Error("Forbidden");
  }

  if (!user.organizationId && user.role !== "super_admin") {
    throw new Error("Organization context missing");
  }
};