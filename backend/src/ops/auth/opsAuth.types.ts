export type OpsAllowedRole =
  | "super_admin"
  | "org_site_manager"
  | "site_admin"
  | "site_viewer";

export interface OpsJwtPayload {
  userId: string;
  email: string;
  role: OpsAllowedRole;
  organizationId: string;
  purpose: "ops_dashboard";
}

export interface ResendOpsOtpRequest {
  tempLoginId: string;
}