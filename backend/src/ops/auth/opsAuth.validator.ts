export const validateOpsLogin = (body: any) => {
  if (!body.email || !body.password) {
    throw new Error("Email and password are required");
  }
};

export const validateOpsOtp = (body: any) => {
  if (!body.tempLoginId || !body.otp) {
    throw new Error("tempLoginId and otp are required");
  }
};

export const validateResendOpsOtp = (
  body: any
) => {
  if (!body.tempLoginId) {
    throw new Error(
      "tempLoginId is required"
    );
  }
};