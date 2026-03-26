
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

export interface ActivationRequestPayload {
  site_id: string;
  machine_fingerprint: string;
}

export interface ApproveActivationPayload {
  request_id: string;
}

export interface RejectActivationPayload {
  request_id: string;
}

export interface SiteActionPayload {
  site_id: string;
}