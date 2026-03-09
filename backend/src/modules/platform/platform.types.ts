export interface SuspendOrgDTO {
  organizationId: string;
  reason: string;
}

export interface ReactivateOrgDTO {
  organizationId: string;
}

export interface ScheduleDeletionDTO {
  organizationId: string;
  reason: string;
}