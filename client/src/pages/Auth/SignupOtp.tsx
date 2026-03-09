import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import type { RootState, AppDispatch } from "../../store/store";

import {
  verifyOtpThunk
} from "../../features/auth/authSlice";

import OtpVerification from "../../components/otp/OtpVerification";

const SignupOtp = () => {

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    pendingRequestId,
    loading,
    error,
    otpVerified
  } = useSelector((state: RootState) => state.auth);

  /* ---------------- VERIFY OTP ---------------- */

  const verifyOtp = async (otp: string) => {

    if (!pendingRequestId) {

      toast.error("Registration session expired. Please sign up again.");
      navigate("/signup");
      return;

    }

    dispatch(
      verifyOtpThunk({
        requestId: pendingRequestId,
        otp
      })
    );

  };

  /* ---------------- RESEND OTP ---------------- */

  const resendOtp = async () => {

    if (!pendingRequestId) {

      toast.error("Registration session expired.");
      return;

    }

    toast.success("OTP resent to your email");

    // Optional future API:
    // dispatch(resendOtpThunk(pendingRequestId))

  };

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {

    if (otpVerified) {

      toast.success("OTP verified successfully");

      setTimeout(() => {
        navigate("/registration-pending");
      }, 1200);

    }

    if (error) {
      toast.error(error);
    }

  }, [otpVerified, error, navigate]);

  /* ---------------- RENDER ---------------- */

  return (

    <OtpVerification
      email="Check your email for OTP"
      onVerify={verifyOtp}
      onResend={resendOtp}
      loading={loading}
    />

  );

};

export default SignupOtp;