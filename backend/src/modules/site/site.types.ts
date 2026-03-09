export interface CreateSitePayload {
  site_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  state: string;
  country: string;
  gst_number?: string;

  site_admin: {
    full_name: string;
    email: string;
    password: string;
    aadhaar_pan: string;
    birthdate: string;
    gender: string;
  };
}

export interface VerifySiteAdminOtpPayload {
  siteId: string;
  otpId: string;
  otp: string;
}