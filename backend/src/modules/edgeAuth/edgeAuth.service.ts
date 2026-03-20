
import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  findUserWithSiteRepo,
  getSiteByIdRepo,
  activateSiteRepo
} from "./edgeAuth.repo";
import {
  EdgeLoginPayload,
  ActivateSitePayload
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
      site_id: site.site_id
    };
  }

  // CASE 2: Different machine
  if (site.machine_fingerprint !== data.machine_fingerprint) {
    throw new Error("Site already activated on another machine");
  }

  // CASE 3: Verify signature
  if (!data.signature || !data.timestamp) {
    throw new Error("Missing signature");
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
    site_id: site.site_id
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