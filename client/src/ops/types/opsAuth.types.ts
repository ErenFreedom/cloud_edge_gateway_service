export interface OpsUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

export interface OpsLoginRequest {
  email: string;
  password: string;
}

export interface OpsLoginResponse {
  message: string;
  tempLoginId: string;
  requiresOtp: boolean;
}

export interface OpsVerifyOtpRequest {
  tempLoginId: string;
  otp: string;
}

export interface OpsVerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: OpsUser;
}

export interface OpsAuthState {
  user: OpsUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tempLoginId: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}