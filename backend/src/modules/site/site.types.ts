export interface CreateSitePayload {

  site_name: string;
  phone?: string;

  address_line1: string;
  address_line2?: string;

  state: string;
  country: string;

  gst_number?: string;


  latitude: number;
  longitude: number;

  site_admin: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    aadhaar_pan: string;
    birthdate: string;
    gender: string;
  };

  viewers?: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    aadhaar_pan: string;
    birthdate: string;
    gender: string;
  }[];

}


export interface VerifySiteAdminOtpPayload {

  siteId: string;
  otpId: string;
  otp: string;

}



export interface EditSitePayload {

  site_name?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  state?: string
  country?: string
  gst_number?: string


  latitude?: number
  longitude?: number

  add_viewers?: string[]
  remove_viewers?: string[]

  new_admin_email?: string

}



export interface SiteUser {

  id: string

  full_name: string
  email: string
  phone: string | null

  password_hash: string
  aadhaar_pan: string

  birthdate: string
  gender: string

  role: string
  status: string

  created_at: string
  email_verified: boolean
  platform_role: string | null
}

export interface EditSiteUserPayload {

  user_id: string

  full_name?: string
  phone?: string
  birthdate?: string
  gender?: string
  aadhaar_pan?: string

  new_password?: string
  old_password?: string

  new_email?: string
  current_password?: string

}


export interface RequestEmailChangePayload {

  user_id: string
  old_email: string
  new_email: string

}

export interface VerifyEmailChangePayload {

  otp_id: string
  otp: string

}