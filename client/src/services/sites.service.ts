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