
export const validateEdgeLogin = (body: any) => {
  if (!body.email || !body.password || !body.machine_fingerprint) {
    throw new Error("Missing required fields");
  }
};

export const validateActivation = (body: any) => {
  if (!body.site_id || !body.site_secret || !body.machine_fingerprint) {
    throw new Error("Missing activation fields");
  }
};