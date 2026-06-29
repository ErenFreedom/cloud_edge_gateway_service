import bcrypt from "bcrypt";
import crypto from "crypto";
import { PoolClient } from "pg";

import { pool } from "../../config/database";

import {
  createSiteRepo,
  createUserRepo,
  createSiteAdminOtpRepo,
  findValidSiteAdminOtp,
  markSiteAdminOtpVerified,
  updateSiteCredentialsRepo,
  assignUserToSiteRepo,
  findUserByEmailRepo,
  updateSiteInfoRepo,
  removeViewerRepo,
  replaceSiteAdminRepo,
  getUserByIdRepo,
  updateUserInfoRepo,
  updateUserPasswordRepo,
  updateUserEmailRepo,
  getSitesForManagerRepo,
  verifyManagerSiteAccessRepo,
  getSiteDetailsRepo,
  createEmailChangeOtpRepo,
  findValidEmailChangeOtpRepo,
  markEmailChangeOtpVerifiedRepo,
  getMonitorAssignedSiteIdsRepo,
  verifyMonitorSiteAccessRepo,
  getSiteForAdminMutationRepo,
  verifyUserIsSiteAdminRepo,
  removeSiteAdminRepo,
  markSiteAdminPendingRepo,

} from "./site.repository";
import { EditSitePayload } from "./site.types"
import { sendEmail } from "../../common/utils/email";

import { CreateSitePayload, EditSiteUserPayload, RequestEmailChangePayload, VerifyEmailChangePayload } from "./site.types";
import { getSitesByOrganizationRepo } from "./site.repository";

const attachViewerToSite = async (
  client: PoolClient,
  organizationId: string,
  siteId: string,
  viewer: any
) => {

  const existingUser = await findUserByEmailRepo(
    client,
    viewer.email
  );

  let user;

  if (existingUser) {

    user = existingUser;

  } else {

    const passwordHash = await bcrypt.hash(
      viewer.password,
      10
    );

    const encryptedIdentity = Buffer
      .from(viewer.aadhaar_pan)
      .toString("base64");

    user = await createUserRepo(
      client,
      organizationId,
      viewer,
      passwordHash,
      encryptedIdentity
    );

  }

  await assignUserToSiteRepo(
    client,
    siteId,
    user.id,
    "site_viewer"
  );

  return user;
};


export const createSiteService = async (
  superAdminId: string,
  payload: CreateSitePayload
) => {

  const client: PoolClient = await pool.connect();

  try {

    await client.query("BEGIN");



    const superAdmin = await client.query(
      `
      SELECT id, organization_id, role
      FROM users
      WHERE id = $1
      `,
      [superAdminId]
    );

    if (!superAdmin.rows.length)
      throw new Error("Super admin not found");

    if (superAdmin.rows[0].role !== "super_admin")
      throw new Error("Only super admin can create sites");

    const organizationId =
      superAdmin.rows[0].organization_id;




    const site = await createSiteRepo(
      client,
      organizationId,
      payload
    );


    const siteUuid = crypto.randomUUID();

    const rawSecret = crypto.randomBytes(32).toString("hex");

    const secretHash = await bcrypt.hash(rawSecret, 10);

    await updateSiteCredentialsRepo(
      site.id,
      siteUuid,
      secretHash
    );




    const passwordHash = await bcrypt.hash(
      payload.site_admin.password,
      10
    );




    const encryptedIdentity = Buffer
      .from(payload.site_admin.aadhaar_pan)
      .toString("base64");




    let siteAdmin;

    const existingUser = await findUserByEmailRepo(
      client,
      payload.site_admin.email
    );

    if (existingUser) {

      siteAdmin = existingUser;

    } else {

      siteAdmin = await createUserRepo(
        client,
        organizationId,
        payload.site_admin,
        passwordHash,
        encryptedIdentity
      );

    }




    await assignUserToSiteRepo(
      client,
      site.id,
      siteAdmin.id,
      "site_admin"
    );

    /* ---------------- ADD VIEWERS IF PROVIDED ---------------- */

    if (payload.viewers && payload.viewers.length > 0) {

      for (const viewer of payload.viewers) {

        const viewerUser = await attachViewerToSite(
          client,
          organizationId,
          site.id,
          viewer
        );

        /* If viewer email not verified → create OTP */

        if (!viewerUser.email_verified) {

          const otp = Math.floor(
            100000 + Math.random() * 900000
          ).toString();

          const otpRecord = await createSiteAdminOtpRepo(
            client,
            viewerUser.id,
            site.id,
            otp
          );

          await sendEmail(
            viewerUser.email,
            "Verify Viewer Email",
            `<h3>Your OTP is: ${otp}</h3>`
          );

        }

      }

    }




    let otpRecord: any = null;
    let otp: string | null = null;

    if (!siteAdmin.email_verified) {

      otp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      otpRecord = await createSiteAdminOtpRepo(
        client,
        siteAdmin.id,
        site.id,
        otp
      );

    }



    await client.query("COMMIT");




    if (otpRecord && otp) {

      await sendEmail(
        siteAdmin.email,
        "Verify Site Admin Email",
        `<h3>Your OTP is: ${otp}</h3>`
      );

    }




    return {

      message: otpRecord
        ? "Site created successfully. OTP sent to site admin email."
        : "Site created and admin linked successfully.",

      siteId: site.id,

      otpId: otpRecord ? otpRecord.id : null

    };

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }

};



export const verifySiteAdminOtpService = async (
  otpId: string,
  otp: string
) => {

  const record = await findValidSiteAdminOtp(
    otpId,
    otp
  );

  if (!record)
    throw new Error("Invalid or expired OTP");

  await markSiteAdminOtpVerified(otpId);

  const siteId = record.site_id;
  const userId = record.user_id;

  /* ============================= */
  /* MARK USER VERIFIED */
  /* ============================= */

  await pool.query(
    `
    UPDATE users
    SET
      email_verified = true,
      status = 'active'
    WHERE id = $1
    `,
    [userId]
  );

  /* ============================= */
  /* REMOVE PENDING FLAG */
  /* ============================= */

  await pool.query(
    `
    UPDATE sites
    SET
      site_admin_email_activation_pending = false
    WHERE id = $1
    `,
    [siteId]
  );

  /* ============================= */
  /* FETCH EXISTING SITE UUID */
  /* ============================= */

  const siteData = await pool.query(
    `
    SELECT site_uuid
    FROM sites
    WHERE id = $1
    `,
    [siteId]
  );

  const siteUuid = siteData.rows[0]?.site_uuid;

  /* ============================= */
  /* GET USER EMAIL */
  /* ============================= */

  const userEmail = (
    await pool.query(
      `SELECT email FROM users WHERE id=$1`,
      [userId]
    )
  ).rows[0].email;

  /* ============================= */
  /* SEND EMAIL */
  /* ============================= */

  await sendEmail(
    userEmail,
    "Site Email Verified",
    `
      <h2>Email Verified Successfully</h2>

      <p>Your site has been successfully verified.</p>

      <p><strong>Site UUID:</strong> ${siteUuid || "Not available"}</p>

      <p><strong>Site Secret:</strong> Already shared during site creation</p>

      <p>Note: Site will become active only after connector installation.</p>
    `
  );

  return {
    message:
      "Email verified successfully. Site is now ready for activation."
  };

};




const attachSiteAccess = (
  site: any,
  role: string,
  assignedSiteIds: string[] = []
) => {
  const assignedSet = new Set(assignedSiteIds);
  const assigned = assignedSet.has(site.id);

  if (role === "site_monitor") {
    return {
      ...site,
      access: {
        assigned,
        can_view: assigned,
        can_edit: false,
        can_download: false,
        can_manage_credentials: false,
        can_view_load_analytics: assigned,
      },
    };
  }

  return {
    ...site,
    access: {
      assigned: true,
      can_view: true,
      can_edit: true,
      can_download: true,
      can_manage_credentials: true,
      can_view_load_analytics: true,
    },
  };
};

export const getSitesService = async (
  userId: string,
  role: string,
  organizationId: string | null
) => {
  if (!organizationId) {
    throw new Error("User not linked to organization");
  }

  const client = await pool.connect();

  try {
    if (role === "super_admin") {
      const sites = await getSitesByOrganizationRepo(organizationId);

      return sites.map((site: any) =>
        attachSiteAccess(site, role)
      );
    }

    if (role === "org_site_manager") {
      const sites = await getSitesForManagerRepo(client, userId);

      return sites.map((site: any) =>
        attachSiteAccess(site, role)
      );
    }

    if (role === "site_monitor") {
      const allOrgSites = await getSitesByOrganizationRepo(organizationId);

      const assignedSiteIds = await getMonitorAssignedSiteIdsRepo(
        client,
        userId
      );

      return allOrgSites.map((site: any) =>
        attachSiteAccess(site, role, assignedSiteIds)
      );
    }

    throw new Error("Unauthorized to view sites");
  } finally {
    client.release();
  }
};



export const unlockSiteCredentialsService = async (
  userId: string,
  password: string,
  siteId: string
) => {

  const client = await pool.connect()

  try {

    const { rows } = await client.query(
      `
      SELECT password_hash, role
      FROM users
      WHERE id = $1
      `,
      [userId]
    )

    if (!rows.length)
      throw new Error("User not found")

    const role = rows[0].role

    if (
      role !== "super_admin" &&
      role !== "org_site_manager"
    )
      throw new Error("Unauthorized")

    const valid = await bcrypt.compare(
      password,
      rows[0].password_hash
    )

    if (!valid)
      throw new Error("Invalid password")


    /* MANAGER SITE ACCESS CHECK */

    if (role === "org_site_manager") {

      const hasAccess =
        await verifyManagerSiteAccessRepo(
          client,
          userId,
          siteId
        )

      if (!hasAccess)
        throw new Error("Access denied for this site")

    }


    const site = await client.query(
      `
      SELECT
        site_uuid,
        machine_fingerprint
      FROM sites
      WHERE id = $1
      `,
      [siteId]
    )

    if (!site.rows.length)
      throw new Error("Site not found")

    return site.rows[0]

  }
  finally {

    client.release()

  }

}


export const regenerateSiteCredentialsService = async (
  userId: string,
  password: string,
  siteId: string
) => {

  const client = await pool.connect()

  try {

    const { rows } = await client.query(
      `
      SELECT password_hash, role
      FROM users
      WHERE id = $1
      `,
      [userId]
    )

    if (!rows.length)
      throw new Error("User not found")

    const role = rows[0].role

    if (
      role !== "super_admin" &&
      role !== "org_site_manager"
    )
      throw new Error("Unauthorized")


    const valid = await bcrypt.compare(
      password,
      rows[0].password_hash
    )

    if (!valid)
      throw new Error("Invalid password")


    /* MANAGER SITE ACCESS CHECK */

    if (role === "org_site_manager") {

      const hasAccess =
        await verifyManagerSiteAccessRepo(
          client,
          userId,
          siteId
        )

      if (!hasAccess)
        throw new Error("Access denied for this site")

    }


    const siteUuid = crypto.randomUUID()

    const rawSecret = crypto
      .randomBytes(32)
      .toString("hex")

    const secretHash = await bcrypt.hash(
      rawSecret,
      10
    )

    await updateSiteCredentialsRepo(
      siteId,
      siteUuid,
      secretHash
    )

    return {

      site_uuid: siteUuid,
      site_secret: rawSecret

    }

  }
  finally {

    client.release()

  }

}


export const editSiteService = async (
  superAdminId: string,
  siteId: string,
  payload: EditSitePayload
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    /* ============================= */
    /* SUPER ADMIN VALIDATION */
    /* ============================= */

    const superAdmin = await client.query(
      `
      SELECT organization_id, role
      FROM users
      WHERE id = $1
      `,
      [superAdminId]
    );

    if (!superAdmin.rows.length) {
      throw new Error("Super admin not found");
    }

    const role = superAdmin.rows[0].role;

    if (role !== "super_admin" && role !== "org_site_manager") {
      throw new Error("Unauthorized");
    }

    const organizationId = superAdmin.rows[0].organization_id;


    /* ============================= */
    /* SITE VALIDATION */
    /* ============================= */

    const siteCheck = await client.query(
      `
      SELECT *
      FROM sites
      WHERE id = $1 AND organization_id = $2
      `,
      [siteId, organizationId]
    );

    if (!siteCheck.rows.length) {
      throw new Error("Site not found");
    }


    /* ============================= */
    /* MANAGER ACCESS CHECK */
    /* ============================= */

    if (role === "org_site_manager") {

      const hasAccess = await verifyManagerSiteAccessRepo(
        client,
        superAdminId,
        siteId
      );

      if (!hasAccess) {
        throw new Error("Access denied for this site");
      }
    }


    /* ============================= */
    /* UPDATE SITE INFO */
    /* ============================= */

    const updatedSite = await updateSiteInfoRepo(
      client,
      siteId,
      payload
    );


    /* ============================= */
    /* ADD VIEWERS */
    /* ============================= */

    if (payload.add_viewers?.length) {

      for (const email of payload.add_viewers) {

        const user = await findUserByEmailRepo(
          client,
          email
        );

        if (!user) {
          throw new Error(
            `User with email ${email} not found`
          );
        }

        if (user.role === "site_admin") {
          throw new Error(
            "Admin cannot be added as viewer"
          );
        }

        await assignUserToSiteRepo(
          client,
          siteId,
          user.id,
          "site_viewer"
        );
      }
    }


    /* ============================= */
    /* REMOVE VIEWERS */
    /* ============================= */

    if (payload.remove_viewers?.length) {

      for (const email of payload.remove_viewers) {

        const user = await findUserByEmailRepo(
          client,
          email
        );

        if (!user) continue;

        await removeViewerRepo(
          client,
          siteId,
          user.id
        );
      }
    }


    /* ============================= */
    /* CHANGE ADMIN */
    /* ============================= */

    if (payload.new_admin_email) {

      const user = await findUserByEmailRepo(
        client,
        payload.new_admin_email
      );

      if (!user) {
        throw new Error("New admin user not found");
      }

      await replaceSiteAdminRepo(
        client,
        siteId,
        user.id
      );
    }


    /* ============================= */
    /* COMMIT */
    /* ============================= */

    await client.query("COMMIT");

    return {
      message: "Site updated successfully",
      site: updatedSite
    };

  } catch (error) {

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();
  }
};


const handleSiteAdminMutation = async (
  client: PoolClient,
  requesterId: string,
  requesterRole: string,
  organizationId: string,
  payload: EditSiteUserPayload
) => {
  if (!payload.site_id) {
    throw new Error("site_id is required");
  }

  const site = await getSiteForAdminMutationRepo(
    client,
    payload.site_id,
    organizationId
  );

  if (!site) {
    throw new Error("Site not found");
  }

  if (requesterRole === "org_site_manager") {
    const hasAccess = await verifyManagerSiteAccessRepo(
      client,
      requesterId,
      payload.site_id
    );

    if (!hasAccess) {
      throw new Error("Access denied for this site");
    }
  }

  const isCurrentAdmin = await verifyUserIsSiteAdminRepo(
    client,
    payload.site_id,
    payload.user_id
  );

  if (!isCurrentAdmin) {
    throw new Error("User is not the site admin for this site");
  }

  if (payload.action === "remove_admin") {
    if (site.status === "active") {
      throw new Error(
        "Active site must have a site admin. Please assign a new site admin before removing the current one."
      );
    }

    await removeSiteAdminRepo(client, payload.site_id, payload.user_id);
    await markSiteAdminPendingRepo(client, payload.site_id, true);

    return {
      message: "Site admin removed successfully",
    };
  }

  if (payload.action === "replace_admin") {
    if (!payload.new_admin_email) {
      throw new Error("new_admin_email is required");
    }

    const newAdmin = await findUserByEmailRepo(
      client,
      payload.new_admin_email
    );

    if (!newAdmin) {
      throw new Error("New admin user not found");
    }

    if (newAdmin.role !== "site_admin") {
      throw new Error("New admin user must have site_admin role");
    }

    await replaceSiteAdminRepo(client, payload.site_id, newAdmin.id);
    await markSiteAdminPendingRepo(
      client,
      payload.site_id,
      !newAdmin.email_verified
    );

    return {
      message: "Site admin replaced successfully",
    };
  }

  throw new Error("Invalid site admin action");
};

export const editSiteUserService = async (
  superAdminId: string,
  payload: EditSiteUserPayload
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    const superAdmin = await client.query(
      `
      SELECT role, organization_id
      FROM users
      WHERE id = $1
  `,
      [superAdminId]
    );

    if (!superAdmin.rows.length)
      throw new Error("Super admin not found")

    const role = superAdmin.rows[0].role
    const organizationId = superAdmin.rows[0].organization_id;

    if (role !== "super_admin" && role !== "org_site_manager")
      throw new Error("Unauthorized")

    const user = await getUserByIdRepo(
      client,
      payload.user_id
    )

    if (!user)
      throw new Error("User not found")

    if (
      payload.action === "remove_admin" ||
      payload.action === "replace_admin"
    ) {
      const result = await handleSiteAdminMutation(
        client,
        superAdminId,
        role,
        organizationId,
        payload
      );

      await client.query("COMMIT");

      return result;
    }


    /*MANAGER SITE ACCESS CHECK (FIXED) */

    if (role === "org_site_manager") {

      const siteLinks = await client.query(`
        SELECT site_id
        FROM site_user_roles
        WHERE user_id = $1
      `, [user.id])

      if (!siteLinks.rows.length)
        throw new Error("User not linked to any site")

      let hasAccess = false

      for (const row of siteLinks.rows) {
        const access = await verifyManagerSiteAccessRepo(
          client,
          superAdminId,
          row.site_id
        )

        if (access) {
          hasAccess = true
          break
        }
      }

      if (!hasAccess)
        throw new Error("Access denied for this user")
    }


    /* -------- BASIC INFO UPDATE -------- */

    const encryptedIdentity =
      payload.aadhaar_pan
        ? Buffer.from(payload.aadhaar_pan).toString("base64")
        : null

    await updateUserInfoRepo(
      client,
      user.id,
      {
        ...payload,
        aadhaar_pan_encrypted: encryptedIdentity
      }
    )


    /* -------- PASSWORD CHANGE -------- */

    if (payload.new_password) {

      if (!payload.old_password)
        throw new Error("Old password required")

      const valid = await bcrypt.compare(
        payload.old_password,
        user.password_hash
      )

      if (!valid)
        throw new Error("Invalid old password")

      const newHash = await bcrypt.hash(
        payload.new_password,
        10
      )

      await updateUserPasswordRepo(
        client,
        user.id,
        newHash
      )
    }


    /* -------- EMAIL CHANGE -------- */

    if (payload.new_email) {

      if (!payload.current_password)
        throw new Error("Password required to change email")

      const valid = await bcrypt.compare(
        payload.current_password,
        user.password_hash
      )

      if (!valid)
        throw new Error("Invalid password")

      await updateUserEmailRepo(
        client,
        user.id,
        payload.new_email
      )
    }


    await client.query("COMMIT")

    return {
      message: "User updated successfully"
    }

  }
  catch (error) {

    await client.query("ROLLBACK")
    throw error

  }
  finally {

    client.release()

  }

}


// /**
//  * 
//  * @param userId 
//  * @param role 
//  * @param siteId 
//  * @returns 
//  */











export const getSiteDetailsService = async (
  userId: string,
  role: string,
  siteId: string
) => {
  const client = await pool.connect();

  try {
    if (
      role !== "super_admin" &&
      role !== "org_site_manager" &&
      role !== "site_monitor"
    ) {
      throw new Error("Unauthorized");
    }

    if (role === "org_site_manager") {
      const hasAccess = await verifyManagerSiteAccessRepo(
        client,
        userId,
        siteId
      );

      if (!hasAccess) {
        throw new Error("Access denied for this site");
      }
    }

    if (role === "site_monitor") {
      const hasAccess = await verifyMonitorSiteAccessRepo(
        client,
        userId,
        siteId
      );

      if (!hasAccess) {
        throw new Error("Access denied for this site");
      }
    }

    const result = await getSiteDetailsRepo(client, siteId);

    if (!result) {
      throw new Error("Site not found");
    }

    return result;
  } finally {
    client.release();
  }
};


export const requestEmailChangeService = async (
  superAdminId: string,
  payload: RequestEmailChangePayload
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    const admin = await client.query(
      `SELECT role FROM users WHERE id=$1`,
      [superAdminId]
    )

    if (!admin.rows.length)
      throw new Error("User not found")

    if (
      admin.rows[0].role !== "super_admin" &&
      admin.rows[0].role !== "org_site_manager"
    )
      throw new Error("Unauthorized")

    const user = await getUserByIdRepo(
      client,
      payload.user_id
    )

    if (!user)
      throw new Error("User not found")

    if (user.email !== payload.old_email)
      throw new Error("Old email mismatch")


    /* MANAGER ACCESS CHECK */

    if (admin.rows[0].role === "org_site_manager") {

      const siteLinks = await client.query(`
        SELECT site_id
        FROM site_user_roles
        WHERE user_id = $1
      `, [payload.user_id])

      if (!siteLinks.rows.length)
        throw new Error("User not linked to any site")

      let hasAccess = false

      for (const row of siteLinks.rows) {
        const access = await verifyManagerSiteAccessRepo(
          client,
          superAdminId,
          row.site_id
        )

        if (access) {
          hasAccess = true
          break
        }
      }

      if (!hasAccess)
        throw new Error("Access denied for this user")
    }


    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString()

    const otpRecord =
      await createEmailChangeOtpRepo(
        client,
        user.id,
        payload.new_email,
        otp
      )

    await client.query("COMMIT")

    await sendEmail(
      payload.new_email,
      "Verify Email Change",
      `<h3>Your OTP is: ${otp}</h3>`
    )

    return {
      message: "OTP sent to new email",
      otp_id: otpRecord.id
    }

  }
  catch (error) {

    await client.query("ROLLBACK")
    throw error

  }
  finally {

    client.release()

  }

}


export const verifyEmailChangeService = async (
  requestedBy: string,
  payload: VerifyEmailChangePayload
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    const record =
      await findValidEmailChangeOtpRepo(
        payload.otp_id,
        payload.otp
      )

    if (!record)
      throw new Error("Invalid or expired OTP")


    /* ✅ MANAGER ACCESS CHECK */

    const requester = await client.query(
      `
  SELECT role
  FROM users
  WHERE id = $1
  `,
      [requestedBy]
    )

    if (!requester.rows.length) {
      throw new Error("User not found")
    }

    const requesterRole = requester.rows[0].role

    if (
      requesterRole !== "super_admin" &&
      requesterRole !== "org_site_manager"
    ) {
      throw new Error("Unauthorized")
    }

    const siteLinks = await client.query(
      `
  SELECT site_id
  FROM site_user_roles
  WHERE user_id = $1
  `,
      [record.user_id]
    )

    if (!siteLinks.rows.length) {
      throw new Error("User not linked to any site")
    }

    if (requesterRole === "org_site_manager") {
      let hasAccess = false

      for (const row of siteLinks.rows) {
        const access = await verifyManagerSiteAccessRepo(
          client,
          requestedBy,
          row.site_id
        )

        if (access) {
          hasAccess = true
          break
        }
      }

      if (!hasAccess) {
        throw new Error("Access denied")
      }
    }

    await markEmailChangeOtpVerifiedRepo(
      client,
      payload.otp_id
    )

    await updateUserEmailRepo(
      client,
      record.user_id,
      record.new_email
    )

    await client.query("COMMIT")

    return {
      message: "Email updated successfully"
    }

  }
  catch (error) {

    await client.query("ROLLBACK")
    throw error

  }
  finally {

    client.release()

  }

}