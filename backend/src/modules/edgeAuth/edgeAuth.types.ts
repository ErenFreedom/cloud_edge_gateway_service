
export interface EdgeLoginPayload {
  email: string;
  password: string;
  machine_fingerprint: string;
  signature?: string;
  timestamp?: number;
}

export interface ActivateSitePayload {
  site_id: string;
  site_secret: string;
  machine_fingerprint: string;
}