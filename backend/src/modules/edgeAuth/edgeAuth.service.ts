import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  findUserWithSiteRepo,
  getSiteByIdRepo,
  activateSiteRepo,
  createActivationRequestRepo,
  getPendingRequestsRepo,
  getActivationRequestByIdRepo,
  updateActivationRequestStatusRepo,
  updateSiteStatusRepo
} from "./edgeAuth.repo";
import {
  EdgeLoginPayload,
  ActivateSitePayload,
  ActivationRequestPayload
} from "./edgeAuth.types";

export const edgeLoginService = async (data: EdgeLoginPayload) => {
  const user = await findUserWithSiteRepo(data.email);

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!isMatch) throw new Error("Invalid credentials");

  const site = user;

  // CASE 1: Not activated
  if (!site.machine_fingerprint) {
    return {
      activation_required: true,
      site_id: site.site_id,
      organization_id: site.organization_id
    };
  }

  // CASE 2: Different machine
  if (site.machine_fingerprint !== data.machine_fingerprint) {
    throw new Error("Site already activated on another machine");
  }

  // CASE 3: First login after approval (no signature yet)
  if (!data.signature || !data.timestamp) {
    return {
      success: true,
      message: "First login after activation",
      site_id: site.site_id,
      organization_id: site.organization_id,
      device_secret: site.device_secret
    };
  }

  // prevent replay
  const now = Date.now();
  if (Math.abs(now - data.timestamp) > 60 * 1000) {
    throw new Error("Request expired");
  }

  const payload = `${data.email}:${data.timestamp}`;

  const expected = crypto
    .createHmac("sha256", site.device_secret)
    .update(payload)
    .digest("hex");

  if (expected !== data.signature) {
    throw new Error("Invalid device signature");
  }

  return {
    success: true,
    message: "Login successful",
    site_id: site.site_id,
    organization_id: site.organization_id,
    device_secret: site.device_secret
  };
};


export const requestActivationService = async (
  data: ActivationRequestPayload
) => {
  const site = await getSiteByIdRepo(data.site_id);

  if (!site) throw new Error("Site not found");

  if (site.machine_fingerprint) {
    throw new Error("Site already activated");
  }

  await createActivationRequestRepo(
    data.site_id,
    data.machine_fingerprint
  );

  // TODO: send email
  console.log("📧 Activation request email sent");

  return {
    message: "Activation request submitted"
  };
};


export const getPendingRequestsService = async () => {
  return await getPendingRequestsRepo();
};

export const approveActivationService = async (requestId: string) => {
  const request = await getActivationRequestByIdRepo(requestId);

  if (!request) throw new Error("Request not found");

  const deviceSecret = crypto.randomBytes(32).toString("hex");

  await activateSiteRepo(
    request.site_id,
    request.machine_fingerprint,
    deviceSecret
  );

  await updateActivationRequestStatusRepo(requestId, "approved");

  // TODO: send email
  console.log("📧 Activation success email sent");

  return {
    message: "Site activated",
    device_secret: deviceSecret
  };
};


export const rejectActivationService = async (requestId: string) => {
  const request = await getActivationRequestByIdRepo(requestId);

  if (!request) throw new Error("Request not found");

  await updateActivationRequestStatusRepo(requestId, "rejected");

  // TODO: send email
  console.log("📧 Rejection email sent");

  return {
    message: "Activation request rejected"
  };
};


export const activateSiteService = async (data: ActivateSitePayload) => {
  const site = await getSiteByIdRepo(data.site_id);

  if (!site) throw new Error("Site not found");

  // already activated
  if (site.machine_fingerprint) {
    throw new Error("Site already activated");
  }

  // verify site secret
  const isValid = await bcrypt.compare(
    data.site_secret,
    site.site_secret_hash
  );

  if (!isValid) {
    throw new Error("Invalid site secret");
  }

  // generate device secret
  const deviceSecret = crypto.randomBytes(32).toString("hex");

  await activateSiteRepo(
    data.site_id,
    data.machine_fingerprint,
    deviceSecret
  );

  return {
    message: "Site activated",
    device_secret: deviceSecret
  };
};

export const suspendSiteService = async (siteId: string) => {
  const site = await getSiteByIdRepo(siteId);

  if (!site) throw new Error("Site not found");

  await updateSiteStatusRepo(siteId, "suspended");

  console.log("📧 Suspension email sent");

  return { message: "Site suspended" };
};

export const deleteSiteService = async (siteId: string) => {
  const site = await getSiteByIdRepo(siteId);

  if (!site) throw new Error("Site not found");

  await updateSiteStatusRepo(siteId, "scheduled_for_deletion");

  // 📧 email
  console.log("📧 Deletion scheduled email sent");

  return { message: "Site scheduled for deletion (1 hour)" };
};