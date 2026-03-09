
export interface CreateOrganizationRequestDTO {
  org_name: string;
  org_phone?: string;
  org_address?: string;
  pincode?: string;
  gst_number?: string;
  registration_number?: string;

  super_admin_name: string;
  super_admin_email: string;
  super_admin_phone?: string;
  password: string;

  aadhaar_pan: string;
  birthdate?: string;
  gender?: string;
}