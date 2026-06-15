import { apiClient } from "../api/apiClient";

export type SiteMonitorStatus = "active" | "disabled";

export interface SiteMonitorSite {
  site_id: string;
  site_name: string;
}

export interface SiteMonitor {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  status: SiteMonitorStatus;
  email_verified: boolean;
  password_managed_by_admin: boolean;
  last_password_generated_at?: string | null;
  sites: SiteMonitorSite[];
}

export interface InviteSiteMonitorRequest {
  full_name: string;
  email: string;
  site_ids: string[];
}

export interface VerifySiteMonitorOtpRequest {
  email: string;
  otp: string;
}

export interface UpdateSiteMonitorRequest {
  id: string;
  full_name?: string;
  phone?: string;
  status?: SiteMonitorStatus;
  site_ids?: string[];
}

export interface ChangeSiteMonitorPasswordRequest {
  user_id: string;
  new_password: string;
}

export interface SiteMonitorMessageResponse {
  message: string;
  email?: string;
  site_count?: number;
  monitor_id?: string;
}

export const inviteSiteMonitor = async (
  payload: InviteSiteMonitorRequest
): Promise<SiteMonitorMessageResponse> => {
  const response = await apiClient.post(
    "/site-monitors/invite",
    payload
  );

  return response.data;
};

export const verifySiteMonitorOtp = async (
  payload: VerifySiteMonitorOtpRequest
): Promise<SiteMonitorMessageResponse> => {
  const response = await apiClient.post(
    "/site-monitors/verify-otp",
    payload
  );

  return response.data;
};

export const fetchSiteMonitors = async (): Promise<SiteMonitor[]> => {
  const response = await apiClient.get(
    "/site-monitors"
  );

  return response.data;
};

export const fetchSiteMonitorById = async (
  id: string
): Promise<SiteMonitor> => {
  const response = await apiClient.get(
    `/site-monitors/${id}`
  );

  return response.data;
};

export const updateSiteMonitor = async (
  payload: UpdateSiteMonitorRequest
): Promise<SiteMonitorMessageResponse> => {
  const { id, ...body } = payload;

  const response = await apiClient.put(
    `/site-monitors/${id}`,
    body
  );

  return response.data;
};

export const changeSiteMonitorPassword = async (
  payload: ChangeSiteMonitorPasswordRequest
): Promise<SiteMonitorMessageResponse> => {
  const response = await apiClient.post(
    "/site-monitors/change-password",
    payload
  );

  return response.data;
};

export const deleteSiteMonitor = async (
  id: string
): Promise<SiteMonitorMessageResponse> => {
  const response = await apiClient.delete(
    `/site-monitors/${id}`
  );

  return response.data;
};