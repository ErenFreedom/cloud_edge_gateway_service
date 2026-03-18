import bcrypt from "bcrypt"
import { pool } from '../../config/database';
import { sendEmail } from "../../common/utils/email"

import {
  findUserByEmailRepo,
  createOrgSiteManagerRepo,
  assignManagerToSiteRepo,
  checkSiteAlreadyAssignedRepo,
  createManagerOtpRepo,
  findManagerByIdRepo,
  getAllManagersRepo,
  getAllSitesRepo,getManagerScopeRepo,
  removeManagerSiteRepo,
  countManagerSitesRepo,
  verifyManagerOtpRepo,
  markOtpVerifiedRepo,
  activateManagerRepo,
} from "./orgSiteManager.repository"

import { CreateOrgSiteManagerPayload } from "./orgSiteManager.types"

export const createOrgSiteManagerService = async (
  superAdminId: string,
  payload: CreateOrgSiteManagerPayload
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /* CHECK SUPER ADMIN */

    const admin = await client.query(
      `
      SELECT role, organization_id
      FROM users
      WHERE id = $1
      `,
      [superAdminId]
    )

    if (!admin.rows.length)
      throw new Error("User not found")

    if (admin.rows[0].role !== "super_admin")
      throw new Error("Only super admin can create managers")

    const organizationId = admin.rows[0].organization_id

    if (!payload.site_ids?.length)
      throw new Error("At least one site must be assigned")



    /* CHECK EMAIL DUPLICATE */

    const existingUser = await findUserByEmailRepo(
      client,
      payload.email
    )

    if (existingUser)
      throw new Error("User already exists")



    /* HASH PASSWORD */

    const passwordHash = await bcrypt.hash(
      payload.password,
      10
    )



    /* ENCRYPT IDENTITY */

    const encryptedIdentity =
      Buffer.from(payload.aadhaar_pan)
        .toString("base64")



    /* CREATE USER */

    const manager = await createOrgSiteManagerRepo(
      client,
      organizationId,
      payload,
      passwordHash,
      encryptedIdentity
    )



    /* ASSIGN SITES */

    for (const siteId of payload.site_ids) {

      const alreadyAssigned =
        await checkSiteAlreadyAssignedRepo(
          client,
          siteId
        )

      if (alreadyAssigned)
        throw new Error(
          `Site ${siteId} already assigned to another manager`
        )

      await assignManagerToSiteRepo(
        client,
        manager.id,
        siteId
      )

    }



    /* GENERATE OTP */

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString()



    const otpRecord =
      await createManagerOtpRepo(
        client,
        manager.id,
        otp
      )



    await client.query("COMMIT")



    await sendEmail(
      manager.email,
      "Verify Org Site Manager Email",
      `<h3>Your OTP is: ${otp}</h3>`
    )



    return {
      message: "Org Site Manager created",
      managerId: manager.id,
      otpId: otpRecord.id
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


export const verifyManagerOtpService = async (
  superAdminId: string,
  managerId: string,
  otp: string
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    /* CHECK SUPER ADMIN */

    const admin = await client.query(
      `SELECT role FROM users WHERE id = $1`,
      [superAdminId]
    );

    if (!admin.rows.length || admin.rows[0].role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    /* CHECK OTP */

    const otpRecord = await verifyManagerOtpRepo(
      client,
      managerId,
      otp
    );

    if (!otpRecord) {
      throw new Error("Invalid or expired OTP");
    }

    /* MARK VERIFIED */

    await markOtpVerifiedRepo(client, otpRecord.id);

    /* ACTIVATE USER */

    await activateManagerRepo(client, managerId);

    await client.query("COMMIT");

    return {
      message: "Manager verified successfully"
    };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
};


export const assignSitesToManagerService = async (
  superAdminId: string,
  managerId: string,
  siteIds: string[]
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /* CHECK SUPER ADMIN */

    const admin = await client.query(
      `
      SELECT role, organization_id
      FROM users
      WHERE id = $1
      `,
      [superAdminId]
    )

    if (!admin.rows.length)
      throw new Error("User not found")

    if (admin.rows[0].role !== "super_admin")
      throw new Error("Only super admin can assign sites")

    /* CHECK MANAGER */

    const manager = await findManagerByIdRepo(client, managerId)

    if (!manager)
      throw new Error("Manager not found")

    if (manager.role !== "org_site_manager")
      throw new Error("User is not an org site manager")

    /* ASSIGN SITES (🔥 FIXED LOGIC) */

    for (const siteId of siteIds) {

      const alreadyAssigned =
        await checkSiteAlreadyAssignedRepo(client, siteId)

      if (alreadyAssigned) continue;

      await assignManagerToSiteRepo(
        client,
        managerId,
        siteId
      )
    }

    await client.query("COMMIT")

    return {
      message: "Sites assigned successfully"
    }

  } catch (err) {

    await client.query("ROLLBACK")
    throw err

  } finally {

    client.release()

  }

}



export const removeSitesFromManagerService = async (
  superAdminId: string,
  managerId: string,
  siteIds: string[]
) => {

  const client = await pool.connect()

  try {

    await client.query("BEGIN")

    /* CHECK SUPER ADMIN */

    const admin = await client.query(
      `
      SELECT role
      FROM users
      WHERE id = $1
      `,
      [superAdminId]
    )

    if (admin.rows[0].role !== "super_admin")
      throw new Error("Only super admin can remove sites")

    /* 🔥 NEW: CHECK CURRENT COUNT */

    const currentCount =
      await countManagerSitesRepo(client, managerId)

    if (currentCount <= siteIds.length)
      throw new Error(
        "At least one site must remain assigned to manager"
      )

    /* REMOVE */

    for (const siteId of siteIds) {

      await removeManagerSiteRepo(
        client,
        managerId,
        siteId
      )
    }

    await client.query("COMMIT")

    return {
      message: "Sites removed successfully"
    }

  } catch (err) {

    await client.query("ROLLBACK")
    throw err

  } finally {

    client.release()

  }

}


export const getManagersAndSitesService = async (
  superAdminId: string
) => {

  const client = await pool.connect();

  try {

    const admin = await client.query(
      `
      SELECT role, organization_id
      FROM users
      WHERE id = $1
      `,
      [superAdminId]
    );

    if (admin.rows[0].role !== "super_admin")
      throw new Error("Unauthorized");

    const orgId = admin.rows[0].organization_id;

    const managers = await getAllManagersRepo(client, orgId);
    const sites = await getAllSitesRepo(client, orgId);

    return { managers, sites };

  } finally {
    client.release();
  }
};



export const getManagerScopeService = async (
  superAdminId: string,
  managerId: string
) => {

  const client = await pool.connect();

  try {

    const admin = await client.query(
      `SELECT role FROM users WHERE id = $1`,
      [superAdminId]
    );

    if (admin.rows[0].role !== "super_admin")
      throw new Error("Unauthorized");

    const scope = await getManagerScopeRepo(client, managerId);

    return scope;

  } finally {
    client.release();
  }
};