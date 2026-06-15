export interface InviteSiteMonitorPayload {
  full_name: string;
  email: string;
  site_ids: string[];
}

export interface VerifySiteMonitorOtpPayload {
  email: string;
  otp: string;
}

export interface UpdateSiteMonitorPayload {
  full_name?: string;
  phone?: string;
  site_ids?: string[];
  status?: "active" | "disabled";
}

export interface ChangeSiteMonitorPasswordPayload {
  user_id: string;
  new_password: string;
}

export interface AuthUser {
  userId: string;
  role: string;
  organizationId: string | null;
}

export interface SiteMonitorInviteRow {
  id: string;
  organization_id: string;
  site_id: string;
  email: string;
  full_name: string | null;
  otp_code: string;
  verified: boolean;
  expires_at: Date;
  created_by: string;
}

export interface SiteMonitorUserRow {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: "site_monitor";
  status: "pending" | "active" | "disabled";
  email_verified: boolean;
}