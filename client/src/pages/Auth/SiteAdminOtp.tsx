import OtpVerification from "../../components/otp/OtpVerification";

const SiteAdminOtp = () => {

  const email = "siteadmin@email.com";

  const verifyOtp = async (otp: string) => {

    console.log("site admin verify", otp);

    // POST /site-admin/verify-otp
  };

  const resendOtp = async () => {

    console.log("resend site admin otp");

  };

  return (
    <OtpVerification
      email={email}
      onVerify={verifyOtp}
      onResend={resendOtp}
    />
  );
};

export default SiteAdminOtp;