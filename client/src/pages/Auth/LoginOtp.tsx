import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import OtpVerification from "../../components/otp/OtpVerification";

import type { RootState, AppDispatch } from "../../store/store";

import {
  verifyLoginOtpThunk
} from "../../features/auth/authSlice";

const LoginOtp = () => {

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    pendingLoginId,
    pendingLoginEmail,
    loading,
    error,
    loginOtpVerified
  } = useSelector((state: RootState) => state.auth);


  /* ---------- VERIFY OTP ---------- */

  const verifyOtp = async (otp: string) => {

    if (!pendingLoginId) {

      toast.error("Session expired. Please login again.");
      navigate("/login");
      return;

    }

    dispatch(
      verifyLoginOtpThunk({
        tempLoginId: pendingLoginId,
        otp
      })
    );

  };


  /* ---------- RESEND OTP ---------- */

  const resendOtp = async () => {

    toast("Resend OTP feature coming soon");

  };


  /* ---------- LOGIN SUCCESS ---------- */

  useEffect(() => {

    if (loginOtpVerified) {

      toast.success("Login successful");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    }

    if (error) {
      toast.error(error);
    }

  }, [loginOtpVerified, error, navigate]);


  /* ---------- SESSION GUARD ---------- */

  if (!pendingLoginId) {
    return null;
  }


  return (

    <OtpVerification
      email={pendingLoginEmail ?? ""}
      onVerify={verifyOtp}
      onResend={resendOtp}
      loading={loading}
    />

  );

};

export default LoginOtp;