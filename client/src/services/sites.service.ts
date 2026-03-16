import { apiClient } from "../api/apiClient";


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

  site_uuid: string | null
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
  payload: {
    site_name?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    state?: string;
    country?: string;
    gst_number?: string;
  }
) => {

  const response = await apiClient.put(
    `/sites/${siteId}`,
    payload
  );

  return response.data;

};


export const requestEmailChange = async (
  payload: {
    userId: string;
    newEmail: string;
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
    otpId: string;
    otp: string;
  }
) => {

  const response = await apiClient.post(
    "/sites/user/verify-email-change",
    payload
  );

  return response.data;

};


export const editSiteUser = async (
  payload: {
    userId: string
    full_name?: string
    phone?: string
    birthdate?: string
    gender?: string
    action?: "add_viewer" | "remove_viewer" | "remove_admin"
    email?: string
  }
) => {

  const response = await apiClient.put(
    "/sites/users/edit",
    payload
  )

  return response.data

}