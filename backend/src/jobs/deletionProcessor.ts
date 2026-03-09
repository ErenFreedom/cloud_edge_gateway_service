import cron from 'node-cron';
import {
  getOrganizationsPendingDeletion,
  deleteOrganizationHard
} from '../modules/platform/platform.repository';

cron.schedule('0 0 * * *', async () => {
  const orgs = await getOrganizationsPendingDeletion();

  for (const org of orgs) {
    await deleteOrganizationHard(org.id);
    console.log(`Deleted organization ${org.id}`);
  }
});