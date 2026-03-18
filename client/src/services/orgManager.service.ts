import { apiClient } from "../api/apiClient";


export const createOrgSiteManager = async (data: any) => {

  const res = await apiClient.post(
    "/org-site-managers/create",
    data
  );

  return res.data;
};


export const verifyManagerOtp = async (data: {
  managerId: string;
  otp: string;
}) => {

  const res = await apiClient.post(
    "/org-site-managers/verify-otp",
    data
  );

  return res.data;
};


export const assignSitesToManager = async (data: {
  manager_id: string;
  site_ids: string[];
}) => {

  const res = await apiClient.post(
    "/org-site-managers/assign-sites",
    {
      managerId: data.manager_id,
      siteIds: data.site_ids
    }
  );

  return res.data;
};


export const removeSitesFromManager = async (data: {
  manager_id: string;
  site_ids: string[];
}) => {

  const res = await apiClient.post(
    "/org-site-managers/remove-sites",
    {
      managerId: data.manager_id,
      siteIds: data.site_ids
    }
  );

  return res.data;
};



export const fetchManagersAndSites = async () => {

  const res = await apiClient.get(
    "/org-site-managers/init-data"
  );

  return res.data;
};



export const fetchManagerScope = async (managerId: string) => {

  const res = await apiClient.get(
    `/org-site-managers/scope/${managerId}`
  );

  return res.data;
};