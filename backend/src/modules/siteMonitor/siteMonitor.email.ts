import { sendEmail } from "../../common/utils/email";

export const sendSiteMonitorOtpEmail = async (
  to: string,
  fullName: string,
  otp: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Site Monitor Verification</h2>

      <p>Hello ${fullName},</p>

      <p>You have been invited as a <b>Site Monitor</b> on the Cloud Edge Gateway platform.</p>

      <p>Your verification OTP is:</p>

      <h1 style="letter-spacing: 4px;">${otp}</h1>

      <p>This OTP is valid for 10 minutes.</p>

      <p>If you did not request this access, please ignore this email.</p>

      <br />

      <p>Regards,<br />Cloud Edge Gateway Team</p>
    </div>
  `;

  await sendEmail(
    to,
    "Site Monitor Verification OTP",
    html
  );
};

export const sendSiteMonitorPasswordEmail = async (
  to: string,
  fullName: string,
  password: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Site Monitor Account Created</h2>

      <p>Hello ${fullName},</p>

      <p>Your Site Monitor account has been created successfully.</p>

      <p><b>Email:</b> ${to}</p>
      <p><b>System Generated Password:</b></p>

      <h2 style="letter-spacing: 2px;">${password}</h2>

      <p>
        This password is managed by your Site Admin / Super Admin.
        Please contact your administrator if you need it changed.
      </p>

      <br />

      <p>Regards,<br />Cloud Edge Gateway Team</p>
    </div>
  `;

  await sendEmail(
    to,
    "Your Site Monitor Login Password",
    html
  );
};