import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../../config/database';
import { sendEmail } from '../../common/utils/email';



export const createOrganizationRequestService = async (data: any) => {
  const password_hash = await bcrypt.hash(data.password, 10);

  const aadhaar_pan_encrypted = Buffer.from(
    data.aadhaar_pan
  ).toString('base64');

  /**
   * 🔍 Step 1 — Check if request already exists
   */
  const existing = await pool.query(
    `
    SELECT * FROM organization_requests
    WHERE super_admin_email = $1
    LIMIT 1
    `,
    [data.super_admin_email]
  );

  let request;

  if (existing.rows.length > 0) {
    const row = existing.rows[0];

    // 🔴 If already approved
    if (row.status === 'approved') {
      throw new Error('Organization already approved for this email');
    }

    // 🔴 If rejected
    if (row.status === 'rejected') {
      throw new Error('Organization request was rejected');
    }

    // 🟢 If pending but NOT verified → update and resend OTP
    if (!row.email_verified) {
      const update = await pool.query(
        `
        UPDATE organization_requests
        SET
          org_name = $1,
          org_phone = $2,
          org_address = $3,
          pincode = $4,
          gst_number = $5,
          registration_number = $6,
          super_admin_name = $7,
          super_admin_phone = $8,
          password_hash = $9,
          aadhaar_pan_encrypted = $10,
          birthdate = $11,
          gender = $12,
          updated_at = now()
        WHERE id = $13
        RETURNING *
        `,
        [
          data.org_name,
          data.org_phone,
          data.org_address,
          data.pincode,
          data.gst_number,
          data.registration_number,
          data.super_admin_name,
          data.super_admin_phone,
          password_hash,
          aadhaar_pan_encrypted,
          data.birthdate,
          data.gender,
          row.id
        ]
      );

      request = update.rows[0];
    } else {
      throw new Error('Request already submitted and under review');
    }

  } else {
    /**
     * 🟢 Fresh Insert
     */
    const insert = await pool.query(
      `
      INSERT INTO organization_requests (
        org_name, org_phone, org_address, pincode,
        gst_number, registration_number,
        super_admin_name, super_admin_email,
        super_admin_phone, password_hash,
        aadhaar_pan_encrypted, birthdate, gender
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *;
      `,
      [
        data.org_name,
        data.org_phone,
        data.org_address,
        data.pincode,
        data.gst_number,
        data.registration_number,
        data.super_admin_name,
        data.super_admin_email,
        data.super_admin_phone,
        password_hash,
        aadhaar_pan_encrypted,
        data.birthdate,
        data.gender,
      ]
    );

    request = insert.rows[0];
  }

  /**
   * 🔥 Always generate fresh OTP
   */
  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  await pool.query(
    `
    INSERT INTO otp_verifications (request_id, otp_code, expires_at)
    VALUES ($1,$2,now() + interval '10 minutes')
    `,
    [request.id, otp]
  );

  await sendEmail(
    data.super_admin_email,
    'Verify Your Registration',
    `<h3>Your OTP is: ${otp}</h3>`
  );

  return {
    message: 'OTP sent to your email',
    requestId: request.id
  };
};


export const verifyOrganizationOtpService = async (
  requestId: string,
  otp: string
) => {
  const otpRecord = await pool.query(
    `
    SELECT * FROM otp_verifications
    WHERE request_id = $1
      AND otp_code = $2
      AND verified = false
      AND expires_at > now()
    `,
    [requestId, otp]
  );

  if (!otpRecord.rows.length)
    throw new Error('Invalid or expired OTP');

  await pool.query(
    `UPDATE otp_verifications
     SET verified = true
     WHERE id = $1`,
    [otpRecord.rows[0].id]
  );

  const { rows } = await pool.query(
    `
    UPDATE organization_requests
    SET email_verified = true
    WHERE id = $1
    RETURNING *
    `,
    [requestId]
  );

  const request = rows[0];

  /**
   * 🔵 SEND PROFESSIONAL "UNDER REVIEW" EMAIL
   */
  await sendEmail(
    request.super_admin_email,
    'Registration Received – Under Review',
    `
      <h2>Thank You for Registering</h2>

      <p>Dear ${request.super_admin_name},</p>

      <p>Your organization <strong>${request.org_name}</strong> has been successfully registered in our system.</p>

      <p>Our platform team is currently reviewing your request. You will receive another email once your organization has been approved.</p>

      <br/>

      <p>We appreciate your patience.</p>

      <p>Best Regards,<br/>
      Platform Team</p>
    `
  );

  return {
    message:
      'Email verified successfully. Your request is now under review.',
  };
};


export const getOrganizationRequestsService = async (
  status?: string
) => {

  const finalStatus = status || 'pending';

  const { rows } = await pool.query(
    `
    SELECT *
    FROM organization_requests
    WHERE status = $1
    ORDER BY created_at DESC
    `,
    [finalStatus]
  );

  return rows;
};



export const approveOrganizationService = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM organization_requests WHERE id = $1`,
    [id]
  );

  const request = rows[0];
  if (!request) throw new Error('Request not found');

  if (!request.email_verified)
    throw new Error('Email not verified');

  if (request.status !== 'pending')
    throw new Error('Already reviewed');

  const client_id = crypto.randomUUID();
  const client_secret = crypto.randomBytes(32).toString('hex');
  const client_secret_hash = await bcrypt.hash(client_secret, 10);

  const orgInsert = await pool.query(
    `
    INSERT INTO organizations (
      org_name, org_phone, org_address,
      pincode, gst_number, registration_number,
      client_id, client_secret_hash,
      activated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
    RETURNING *;
    `,
    [
      request.org_name,
      request.org_phone,
      request.org_address,
      request.pincode,
      request.gst_number,
      request.registration_number,
      client_id,
      client_secret_hash,
    ]
  );

  const organization = orgInsert.rows[0];

  await pool.query(
    `
    INSERT INTO users (
      organization_id,
      full_name,
      email,
      phone,
      password_hash,
      aadhaar_pan_encrypted,
      birthdate,
      gender,
      role,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'super_admin','active')
    `,
    [
      organization.id,
      request.super_admin_name,
      request.super_admin_email,
      request.super_admin_phone,
      request.password_hash,
      request.aadhaar_pan_encrypted,
      request.birthdate,
      request.gender,
    ]
  );

  await pool.query(
    `UPDATE organization_requests
     SET status = 'approved',
         reviewed_at = now()
     WHERE id = $1`,
    [id]
  );


  await sendEmail(
    request.super_admin_email,
    'Organization Approved – Credentials Enclosed',
    `
    <h2>Congratulations 🎉</h2>

    <p>Dear ${request.super_admin_name},</p>

    <p>We are pleased to inform you that your organization 
    <strong>${request.org_name}</strong> has been successfully approved.</p>

    <p>Your organization is now active on our platform.</p>

    <hr/>

    <h3>🔐 Your Organization Credentials</h3>

    <p><strong>Client ID:</strong> ${client_id}</p>
    <p><strong>Client Secret:</strong> ${client_secret}</p>

    <br/>

    <p>Please store these credentials securely. 
    The client secret will not be shown again.</p>

    <br/>

    <p>You may now log in using your registered email address.</p>

    <p>Welcome aboard!</p>

    <p>Best Regards,<br/>
    Platform Team</p>
  `
  );

  return { message: 'Organization approved successfully' };
};


export const rejectOrganizationService = async (
  id: string,
  reason: string
) => {
  await pool.query(
    `
    UPDATE organization_requests
    SET status = 'rejected',
        reviewed_at = now(),
        rejection_reason = $2
    WHERE id = $1
  `,
    [id, reason]
  );

  return { message: 'Organization rejected' };
};