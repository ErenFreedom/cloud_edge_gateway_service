export interface CreateOrgSiteManagerPayload {
  full_name: string
  email: string
  phone: string
  password: string
  aadhaar_pan: string
  birthdate: string
  gender: string
  site_ids: string[]
}

export interface AssignSitesPayload {
  managerId: string
  siteIds: string[]
}

export interface RemoveSitesPayload {
  managerId: string
  siteIds: string[]
}