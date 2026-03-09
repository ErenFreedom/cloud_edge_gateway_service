
import { z } from 'zod';

export const createOrganizationSchema = z.object({
  org_name: z.string().min(2),
  org_phone: z.string().optional(),
  org_address: z.string().optional(),
  pincode: z.string().optional(),
  gst_number: z.string().optional(),
  registration_number: z.string().optional(),

  super_admin_name: z.string().min(2),
  super_admin_email: z.string().email(),
  super_admin_phone: z.string().optional(),
  password: z.string().min(6),

  aadhaar_pan: z.string().min(10).max(16),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
});