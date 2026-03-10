import bcrypt from "bcrypt";
import crypto from "crypto";
import { PoolClient } from "pg";

import { pool } from "../../config/database";

import {
  createSiteRepo,
  createUserRepo,
  createSiteAdminOtpRepo,
  findValidSiteAdminOtp,
  markSiteAdminOtpVerified
} from "./site.repository";

import { sendEmail } from "../../common/utils/email";

import { CreateSitePayload } from "./site.types";
import { getSitesByOrganizationRepo } from "./site.repository";




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

    

    const passwordHash = await bcrypt.hash(
      payload.site_admin.password,
      10
    );

    

    const encryptedIdentity = Buffer
      .from(payload.site_admin.aadhaar_pan)
      .toString("base64");

    

    const siteAdmin = await createUserRepo(
      client,
      organizationId,
      payload.site_admin,
      passwordHash,
      encryptedIdentity
    );

    

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpRecord = await createSiteAdminOtpRepo(
      client,
      siteAdmin.id,
      site.id,
      otp
    );

    await client.query("COMMIT");

    

    await sendEmail(
      siteAdmin.email,
      "Verify Site Admin Email",
      `<h3>Your OTP is: ${otp}</h3>`
    );

    return {
      message:
        "Site created successfully. OTP sent to site admin email.",
      siteId: site.id,
      otpId: otpRecord.id
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

  
  const siteUuid = crypto.randomUUID();

  const rawSecret = crypto
    .randomBytes(32)
    .toString("hex");

  const secretHash = await bcrypt.hash(
    rawSecret,
    10
  );

  

  await pool.query(
    `
    UPDATE users
    SET email_verified = true,
        status = 'active'
    WHERE id = $1
    `,
    [userId]
  );

  

  await pool.query(
    `
    UPDATE sites
    SET
      site_uuid = $1,
      site_secret_hash = $2,
      status = 'active',
      site_admin_email_activation_pending = false,
      activated_at = now()
    WHERE id = $3
    `,
    [siteUuid, secretHash, siteId]
  );


  const userEmail = (
    await pool.query(
      `SELECT email FROM users WHERE id=$1`,
      [userId]
    )
  ).rows[0].email;


  await sendEmail(
    userEmail,
    "Site Activated Successfully 🎉",
    `
      <h2>Congratulations!</h2>

      <p>Your site has been activated.</p>

      <p><strong>Site UUID:</strong> ${siteUuid}</p>
      <p><strong>Site Secret:</strong> ${rawSecret}</p>

      <p>Please store these credentials securely.</p>
    `
  );

  return {
    message: "Site activated successfully"
  };

};






export const getSitesService = async (
  userId: string,
  role: string,
  organizationId: string | null
) => {

  if (!organizationId)
    throw new Error("User not linked to organization");

  if (role !== "super_admin")
    throw new Error("Only super admin can view sites");

  const sites = await getSitesByOrganizationRepo(
    organizationId
  );

  return sites;

};