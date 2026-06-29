import { apiClient } from "../api/apiClient";


export interface CreateSitePayload {

  site_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  state: string;
  country: string;
  gst_number?: string;

  /* NEW */

  latitude: number;
  longitude: number;

  site_admin: {
    full_name: string;
    email: string;
    password: string;
    aadhaar_pan: string;
    birthdate: string;
    gender: string;
  };
}

export interface SiteUser {

  id: string;
  organization_id: string;

  full_name: string;
  email: string;
  phone?: string | null;

  password_hash: string;
  aadhaar_pan: string;

  birthdate?: string | null;
  gender?: string | null;

  role: "site_admin" | "site_viewer";

  status: string;

  created_at: string;
  email_verified: boolean;

  platform_role?: string | null;

}


export interface SiteInfo {

  id: string
  site_name: string

  phone: string | null
  address_line1: string
  address_line2: string | null

  state: string
  country: string

  gst_number: string | null

  latitude: number | null
  longitude: number | null

  site_uuid: string | null

  site_secret: string | null
  device_secret: string | null

  machine_fingerprint: string | null

  status: string

  created_at: string
  activated_at: string | null
}


export interface SiteDetails {
  site: SiteInfo
  site_admin: SiteUser | null
  viewers: SiteUser[]
}


export const getSites = async () => {

  const response = await apiClient.get(
    "/sites/list"
  );

  return response.data;

};


export const createSite = async (
  payload: CreateSitePayload
) => {

  const response = await apiClient.post(
    "/sites/create",
    payload
  );

  return response.data;

};


export const regenerateSiteCredentials = async (
  siteId: string,
  password: string
) => {

  const response = await apiClient.post(
    "/sites/regenerate-credentials",
    {
      siteId,
      password
    }
  );

  return response.data;

};

export interface UpdateSitePayload {
  site_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  state?: string;
  country?: string;
  gst_number?: string;

  latitude?: number;
  longitude?: number;

  new_admin_email?: string;

  add_viewers?: string[];
  remove_viewers?: string[];
}


export const verifySiteAdminOtp = async (
  otpId: string,
  otp: string
) => {

  const response = await apiClient.post(
    "/sites/verify-admin-otp",
    {
      otpId,
      otp
    }
  );

  return response.data;

};


export const getSiteDetails = async (
  siteId: string
): Promise<SiteDetails> => {

  const response = await apiClient.get<SiteDetails>(
    `/sites/${siteId}/details`
  );

  return response.data;

};

export const updateSite = async (
  siteId: string,
  payload: UpdateSitePayload
) => {

  const response = await apiClient.put(
    `/sites/${siteId}`,
    payload
  );

  return response.data;
};


export const requestEmailChange = async (
  payload: {
    user_id: string;
    old_email: string;
    new_email: string;
  }
) => {

  const response = await apiClient.post(
    "/sites/user/request-email-change",
    payload
  );

  return response.data;
};


export const verifyEmailChange = async (
  payload: {
    otp_id: string;
    otp: string;
  }
) => {

  const response = await apiClient.post(
    "/sites/user/verify-email-change",
    payload
  );

  return response.data;

};

export type EditSiteUserAction =
  | "update_user"
  | "remove_admin"
  | "replace_admin";

export interface EditSiteUserPayload {
  user_id: string;

  action?: EditSiteUserAction;

  site_id?: string;
  new_admin_email?: string;

  full_name?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
  aadhaar_pan?: string;

  new_password?: string;
  old_password?: string;

  new_email?: string;
  current_password?: string;
}


export const editSiteUser = async (
  payload: EditSiteUserPayload
) => {
  const response = await apiClient.put(
    "/sites/users/edit",
    payload
  );

  return response.data;
};


export const removeSiteAdmin = async (
  payload: {
    site_id: string;
    user_id: string;
  }
) => {
  return editSiteUser({
    action: "remove_admin",
    site_id: payload.site_id,
    user_id: payload.user_id,
  });
};

export const replaceSiteAdmin = async (
  payload: {
    site_id: string;
    user_id: string;
    new_admin_email: string;
  }
) => {
  return editSiteUser({
    action: "replace_admin",
    site_id: payload.site_id,
    user_id: payload.user_id,
    new_admin_email: payload.new_admin_email,
  });
};