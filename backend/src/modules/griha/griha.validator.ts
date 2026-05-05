//Old Validators
// const ALLOWED_TYPES = [
//   "utility",
//   "hvac",
//   "ups",
//   "lighting",
//   "water",
//   "stp",
//   "irrigation",
//   "other"
// ];

const ALLOWED_TYPES = [
  "municipal_water",
  "borewell_water",
  "utility_grid",
  "genset_energy",
  "renewable_energy",
  "stp_treated_water",
  "rainwater",
  "other"
];


/* ------------------------- */
/* TYPE VALIDATION */
/* ------------------------- */

export const validateGrihaType = (type: string) => {
  if (!type) {
    throw new Error("type required");
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw new Error("invalid griha type");
  }
};

/* ------------------------- */
/* CLIENT TOKEN VALIDATION */
/* ------------------------- */

export const validateClientAccess = (client: any) => {
  if (!client || !client.token) {
    throw new Error("Invalid client token");
  }

  if (!client.organization_id || !client.site_id) {
    throw new Error("Invalid client context");
  }
};

/* ------------------------- */
/* CONFIG VALIDATION */
/* ------------------------- */

export const validateSaveGrihaConfig = (body: any) => {
  if (!body.site_id) {
    throw new Error("site_id required");
  }

  if (!body.mapping || typeof body.mapping !== "object") {
    throw new Error("mapping required");
  }
};

/* ------------------------- */
/* GENERIC TYPE */
/* ------------------------- */

export const validateType = (type: string) => {
  if (!type) {
    throw new Error("type required");
  }
};

/* ------------------------- */
/* MONTH + YEAR VALIDATION */
/* ------------------------- */

export const validateMonthYear = (month: any, year: any) => {
  if (!month || !year) {
    throw new Error("month and year required");
  }

  const m = Number(month);
  const y = Number(year);

  if (isNaN(m) || m < 1 || m > 12) {
    throw new Error("Invalid month");
  }

  if (isNaN(y) || y < 2000 || y > 2100) {
    throw new Error("Invalid year");
  }
};