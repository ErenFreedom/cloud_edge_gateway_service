import axios from "axios";
import type {
  OpsLoginRequest,
  OpsLoginResponse,
  OpsVerifyOtpRequest,
  OpsVerifyOtpResponse,
} from "../types/opsAuth.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const opsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/ops/auth`,
});

export const loginOps = async (
  data: OpsLoginRequest
): Promise<OpsLoginResponse> => {
  const response = await opsApi.post("/login", data);
  return response.data;
};

export const verifyOpsOtp = async (
  data: OpsVerifyOtpRequest
): Promise<OpsVerifyOtpResponse> => {
  const response = await opsApi.post("/verify-otp", data);
  return response.data;
};

export const resendOpsOtp = async (
  tempLoginId: string
): Promise<OpsLoginResponse> => {
  const response = await opsApi.post("/resend-otp", {
    tempLoginId,
  });

  return response.data;
};