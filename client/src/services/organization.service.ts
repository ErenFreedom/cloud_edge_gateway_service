import { apiClient } from "../api/apiClient";


export interface RegisterOrganizationPayload {
  org_name: string
  org_phone: string
  org_address: string
  pincode: string
  gst_number: string
  registration_number: string

  super_admin_name: string
  super_admin_email: string
  super_admin_phone: string

  password: string

  aadhaar_pan: string
  birthdate: string
  gender: string
}

export const registerOrganization = async (
  payload: RegisterOrganizationPayload
) => {

  const response = await apiClient.post(
    "/organizations/request",
    payload
  );

  return response.data;
};



export interface VerifyOrganizationOtpPayload {
  requestId: string;
  otp: string;
}

export const verifyOrganizationOtp = async (
  payload: VerifyOrganizationOtpPayload
) => {

  const response = await apiClient.post(
    "/organizations/verify-otp",
    payload
  );

  return response.data;

};