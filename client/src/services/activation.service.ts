import { apiClient } from "../api/apiClient";


export interface ActivationRequest {
  id: string;
  site_id: string;
  site_name: string;
  organization_id: string;
  machine_fingerprint: string;
  status: string;
  requested_at: string;
}


export const fetchActivationRequests = async () => {
  const res = await apiClient.get("/edge/activation-requests");
  return res.data;
};

export const approveActivation = async (request_id: string) => {
  const res = await apiClient.post("/edge/approve-activation", {
    request_id
  });
  return res.data;
};

export const rejectActivation = async (request_id: string) => {
  const res = await apiClient.post("/edge/reject-activation", {
    request_id
  });
  return res.data;
};