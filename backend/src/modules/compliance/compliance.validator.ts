/* ========================= */
/* MONTH + YEAR VALIDATION */
/* ========================= */

export const validateMonthYear = (
  month: any,
  year: any
) => {

  const m = Number(month);
  const y = Number(year);

  if (isNaN(m) || m < 1 || m > 12) {
    throw new Error("Invalid month");
  }

  if (isNaN(y) || y < 2000 || y > 2100) {
    throw new Error("Invalid year");
  }
};

/* ========================= */
/* REPORT TYPE VALIDATION */
/* ========================= */

export const validateReportType = (
  reportType: any
) => {

  if (
    !reportType ||
    typeof reportType !== "string"
  ) {
    throw new Error("reportType required");
  }
};

/* ========================= */
/* CLIENT VALIDATION */
/* ========================= */

export const validateClientAccess = (
  client: any
) => {

  if (!client || !client.token) {
    throw new Error("Invalid client token");
  }

  if (
    !client.organization_id ||
    !client.site_id
  ) {
    throw new Error("Invalid client context");
  }
};


export const validateRequiredString = (
  value: any,
  field: string
) => {

  if (!value || typeof value !== "string") {
    throw new Error(`${field} required`);
  }
};