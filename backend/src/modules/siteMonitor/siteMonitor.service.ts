import {
  assertCanManageSiteMonitor,
  validateChangePasswordPayload,
  validateInvitePayload,
  validateUpdatePayload,
  validateVerifyOtpPayload,
} from "./siteMonitor.validator";

import {
  assignMonitorSitesRepo,
  changeMonitorPasswordRepo,
  createInviteRepo,
  createSiteMonitorUserRepo,
  deleteSiteMonitorRepo,
  findPendingInviteRepo,
  findUserByEmailRepo,
  getAuthorizedSitesRepo,
  getSiteMonitorByIdRepo,
  listSiteMonitorsRepo,
  markInvitePasswordSentRepo,
  markInviteVerifiedRepo,
  replaceMonitorSitesRepo,
  updateSiteMonitorRepo,
  verifySitesBelongToOrgRepo,
  withTransaction,
} from "./siteMonitor.repository";

import {
  generateOtp,
  generateSystemPassword,
  hashPassword,
} from "./siteMonitor.password";

import {
  sendSiteMonitorOtpEmail,
  sendSiteMonitorPasswordEmail,
} from "./siteMonitor.email";

import { AuthUser } from "./siteMonitor.types";

const getOrgId = (user: AuthUser): string => {
  if (!user.organizationId) {
    throw new Error("Organization context missing");
  }

  return user.organizationId;
};

const ensureSiteAccess = async (
  user: AuthUser,
  requestedSiteIds: string[]
) => {
  const allowedSiteIds = await getAuthorizedSitesRepo(user);

  if (allowedSiteIds.length === 0) {
    throw new Error("No site access found");
  }

  const allowedSet = new Set(allowedSiteIds);

  const unauthorized = requestedSiteIds.some(
    (siteId) => !allowedSet.has(siteId)
  );

  if (unauthorized) {
    throw new Error("Unauthorized site assignment");
  }

  return allowedSiteIds;
};

export const inviteSiteMonitorService = async (
  user: AuthUser,
  body: any
) => {
  assertCanManageSiteMonitor(user);

  const payload = validateInvitePayload(body);
  const organizationId = getOrgId(user);

  await ensureSiteAccess(user, payload.site_ids);

  const belongToOrg = await verifySitesBelongToOrgRepo(
    organizationId,
    payload.site_ids
  );

  if (!belongToOrg) {
    throw new Error("One or more sites do not belong to organization");
  }

  const existingUser = await findUserByEmailRepo(payload.email);

  if (existingUser && existingUser.role !== "site_monitor") {
    throw new Error("Email already belongs to another user role");
  }

  const otp = generateOtp();

  await withTransaction(async (client) => {
    for (const siteId of payload.site_ids) {
      await createInviteRepo(
        {
          organizationId,
          siteId,
          email: payload.email,
          fullName: payload.full_name,
          otp,
          createdBy: user.userId,
        },
        client
      );
    }
  });

  await sendSiteMonitorOtpEmail(
    payload.email,
    payload.full_name,
    otp
  );

  return {
    message: "Site monitor OTP sent successfully",
    email: payload.email,
    site_count: payload.site_ids.length,
  };
};

export const verifySiteMonitorOtpService = async (
  body: any
) => {
  const payload = validateVerifyOtpPayload(body);

  const plainPassword = generateSystemPassword();
  const passwordHash = await hashPassword(plainPassword);

  const result = await withTransaction(async (client) => {
    const invite = await findPendingInviteRepo(
      payload.email,
      payload.otp,
      client
    );

    if (!invite) {
      throw new Error("Invalid or expired OTP");
    }

    const { rows: allInvites } = await client.query(
      `
      SELECT *
      FROM site_monitor_invites
      WHERE LOWER(email) = LOWER($1)
        AND otp_code = $2
        AND verified = false
        AND expires_at > now()
      `,
      [payload.email, payload.otp]
    );

    const organizationId = invite.organization_id;
    const fullName = invite.full_name || "Site Monitor";
    const siteIds = allInvites.map((i) => i.site_id);

    let monitorUser = await findUserByEmailRepo(
      payload.email,
      client
    );

    if (!monitorUser) {
      monitorUser = await createSiteMonitorUserRepo(
        {
          organizationId,
          fullName,
          email: payload.email,
          passwordHash,
          createdBy: invite.created_by,
        },
        client
      );
    } else {
      if (monitorUser.role !== "site_monitor") {
        throw new Error("Email already belongs to another user role");
      }

      await changeMonitorPasswordRepo(
        monitorUser.id,
        passwordHash,
        client
      );
    }

    for (const inv of allInvites) {
      await markInviteVerifiedRepo(inv.id, client);
    }

    await assignMonitorSitesRepo(
      monitorUser.id,
      siteIds,
      client
    );

    await markInvitePasswordSentRepo(
      payload.email,
      client
    );

    return {
      user: monitorUser,
      fullName,
      siteCount: siteIds.length,
    };
  });

  await sendSiteMonitorPasswordEmail(
    payload.email,
    result.fullName,
    plainPassword
  );

  return {
    message: "Site monitor verified and password sent successfully",
    email: payload.email,
    site_count: result.siteCount,
  };
};

export const listSiteMonitorsService = async (
  user: AuthUser
) => {
  assertCanManageSiteMonitor(user);

  const organizationId = getOrgId(user);
  const allowedSiteIds = await getAuthorizedSitesRepo(user);

  if (allowedSiteIds.length === 0) {
    return [];
  }

  return await listSiteMonitorsRepo(
    organizationId,
    allowedSiteIds
  );
};

export const getSiteMonitorByIdService = async (
  user: AuthUser,
  monitorId: string
) => {
  assertCanManageSiteMonitor(user);

  const organizationId = getOrgId(user);
  const allowedSiteIds = await getAuthorizedSitesRepo(user);

  const monitor = await getSiteMonitorByIdRepo(
    monitorId,
    organizationId,
    allowedSiteIds
  );

  if (!monitor) {
    throw new Error("Site monitor not found");
  }

  return monitor;
};

export const updateSiteMonitorService = async (
  user: AuthUser,
  monitorId: string,
  body: any
) => {
  assertCanManageSiteMonitor(user);

  const payload = validateUpdatePayload(body);
  const organizationId = getOrgId(user);

  if (payload.site_ids) {
    await ensureSiteAccess(user, payload.site_ids);

    const belongToOrg = await verifySitesBelongToOrgRepo(
      organizationId,
      payload.site_ids
    );

    if (!belongToOrg) {
      throw new Error("One or more sites do not belong to organization");
    }
  }

  return await withTransaction(async (client) => {
    const updated = await updateSiteMonitorRepo(
      monitorId,
      {
        fullName: payload.full_name,
        phone: payload.phone,
        status: payload.status,
      },
      client
    );

    if (!updated) {
      throw new Error("Site monitor not found");
    }

    if (payload.site_ids) {
      await replaceMonitorSitesRepo(
        monitorId,
        payload.site_ids,
        client
      );
    }

    return {
      message: "Site monitor updated successfully",
      monitor_id: monitorId,
    };
  });
};

export const changeSiteMonitorPasswordService = async (
  user: AuthUser,
  body: any
) => {
  assertCanManageSiteMonitor(user);

  const payload = validateChangePasswordPayload(body);

  await getSiteMonitorByIdService(user, payload.user_id);

  const passwordHash = await hashPassword(
    payload.new_password
  );

  await changeMonitorPasswordRepo(
    payload.user_id,
    passwordHash
  );

  return {
    message: "Site monitor password changed successfully",
  };
};

export const deleteSiteMonitorService = async (
  user: AuthUser,
  monitorId: string
) => {
  assertCanManageSiteMonitor(user);

  await getSiteMonitorByIdService(user, monitorId);

  await deleteSiteMonitorRepo(monitorId);

  return {
    message: "Site monitor disabled successfully",
  };
};