import { apiClient } from "../api/apiClient";

/* -------- FETCH PENDING REQUESTS -------- */

export const fetchOrganizationRequests = async () => {

  const res = await apiClient.get(
    "/organizations/requests?status=pending"
  );

  return res.data;

};

/* -------- APPROVE REQUEST -------- */

export const approveOrganization = async (id: string) => {

  const res = await apiClient.post(
    `/organizations/${id}/approve`
  );

  return res.data;

};

/* -------- REJECT REQUEST -------- */

export const rejectOrganization = async (
  id: string,
  reason: string
) => {

  const res = await apiClient.post(
    `/organizations/${id}/reject`,
    { reason }
  );

  return res.data;

};

/* -------- SUSPEND ORGANIZATION -------- */

export const suspendOrganization = async (
  organizationId: string,
  reason: string
) => {

  const res = await apiClient.post(
    "/platform/suspend",
    { organizationId, reason }
  );

  return res.data;
};

/* -------- REACTIVATE ORGANIZATION -------- */

export const reactivateOrganization = async (
  organizationId: string,
  reason: string
) => {

  const res = await apiClient.post(
    "/platform/reactivate",
    { organizationId, reason }
  );

  return res.data;
};

/* -------- SCHEDULE DELETION -------- */

export const scheduleDeletion = async (
  organizationId: string,
  reason: string
) => {

  const res = await apiClient.post(
    "/platform/schedule-deletion",
    { organizationId, reason }
  );

  return res.data;
};