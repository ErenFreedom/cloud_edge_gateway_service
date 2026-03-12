import bcrypt from "bcrypt"
import { pool } from '../../config/database';
import { sendEmail } from "../../common/utils/email"

import {
  findUserByEmailRepo,
  createOrgSiteManagerRepo,
  assignManagerToSiteRepo,
  checkSiteAlreadyAssignedRepo,
  createManagerOtpRepo,
  
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