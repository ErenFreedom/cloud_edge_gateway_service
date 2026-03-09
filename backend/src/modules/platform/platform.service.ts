import {
  findOrganizationById,
  disableUsersByOrg,
  enableUsersByOrg,
  suspendSitesByOrg,
  activateSitesByOrg,
  suspendOrganizationWithReason,
  scheduleDeletionWithReason,
  reactivateOrganizationWithReason,
  getAllOrganizations
} from './platform.repository';

import { sendEmail } from '../../common/utils/email';



export const suspendOrganizationService = async (
  orgId: string,
  reason: string
) => {

  const org = await findOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  await suspendOrganizationWithReason(orgId, reason);
  await disableUsersByOrg(orgId);
  await suspendSitesByOrg(orgId);

  if (!org.super_admin_email) {
    console.warn("Super admin email missing for org:", orgId);
  } else {
    await sendEmail(
      org.super_admin_email,
      'Organization Suspended',
      `
        <h2>Organization Suspended</h2>
        <p>Your organization has been suspended.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please contact support for clarification.</p>
      `
    );
  }

  return { message: 'Organization suspended successfully' };
};



export const reactivateOrganizationService = async (
  orgId: string,
  reason: string
) => {

  const org = await findOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  await reactivateOrganizationWithReason(orgId, reason);
  await enableUsersByOrg(orgId);
  await activateSitesByOrg(orgId);

  if (!org.super_admin_email) {
    console.warn("Super admin email missing for org:", orgId);
  } else {
    await sendEmail(
      org.super_admin_email,
      'Organization Reactivated',
      `
        <h2>Organization Reactivated</h2>
        <p>Your organization has been reactivated.</p>
        <p><strong>Remark:</strong> ${reason}</p>
      `
    );
  }

  return { message: 'Organization reactivated successfully' };
};



export const scheduleOrganizationDeletionService = async (
  orgId: string,
  reason: string
) => {

  const org = await findOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  await scheduleDeletionWithReason(orgId, reason);

  if (!org.super_admin_email) {
    console.warn("Super admin email missing for org:", orgId);
  } else {
    await sendEmail(
      org.super_admin_email,
      'Organization Deletion Scheduled',
      `
        <h2>Deletion Scheduled</h2>
        <p>Your organization has been scheduled for deletion.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You have 30 days to resolve this before permanent deletion.</p>
      `
    );
  }

  return { message: 'Deletion scheduled successfully' };
};



export const getApprovedOrganizationsService = async () => {
  return await getAllOrganizations();
};