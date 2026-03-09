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
    pendingEmail,
    loading,
    error,
    loginOtpVerified
  } = useSelector((state: RootState) => state.auth);



  const verifyOtp = async (otp: string) => {

    if (!pendingEmail) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    dispatch(
      verifyLoginOtpThunk({
        email: pendingEmail,
        otp
      })
    );

  };



  const resendOtp = async () => {

    toast("Resend OTP feature coming soon");

  };



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



  if (!pendingEmail) {
    return null;
  }

  return (

    <OtpVerification
      email={pendingEmail}
      onVerify={verifyOtp}
      onResend={resendOtp}
      loading={loading}
    />

  );

};

export default LoginOtp;