import { apiClient } from "../api/apiClient";


export interface LoginPayload {
  email: string;
  password: string;
}

export const loginUser = async (payload: LoginPayload) => {

  const response = await apiClient.post(
    "/auth/login",
    payload
  );

  return response.data;

};



export interface VerifyLoginOtpPayload {
  tempLoginId: string;
  otp: string;
}

export const verifyLoginOtp = async (
  payload: VerifyLoginOtpPayload
) => {

  const response = await apiClient.post(
    "/auth/verify-otp",
    payload
  );

  return response.data;

};