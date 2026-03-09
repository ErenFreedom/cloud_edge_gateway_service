export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  tempLoginId: string;
  otp: string;
}