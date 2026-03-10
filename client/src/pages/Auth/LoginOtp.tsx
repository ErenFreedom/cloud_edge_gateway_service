import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import OtpVerification from "../../components/otp/OtpVerification";
import type { RootState, AppDispatch } from "../../store/store";
import {
  verifyLoginOtpThunk,
  resetAuthState
} from "../../features/auth/authSlice";

const LoginOtp = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { loading, error, loginOtpVerified } = useSelector(
    (state: RootState) => state.auth
  );

  // ✅ Read ONCE on mount into a ref — never re-reads on re-render
  const loginIdRef = useRef<string | null>(
    sessionStorage.getItem("pendingLoginId")
  );
  const emailRef = useRef<string>(
    sessionStorage.getItem("pendingLoginEmail") ?? ""
  );

  /* ---------- SESSION GUARD (mount only) ---------- */
  useEffect(() => {
    if (!loginIdRef.current) {
      navigate("/login");
    }
  }, []);

  /* ---------- VERIFY OTP ---------- */
  const verifyOtp = async (otp: string): Promise<void> => {
    if (!loginIdRef.current) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
      return;
    }
    await dispatch(
      verifyLoginOtpThunk({
        tempLoginId: loginIdRef.current,
        otp
      })
    );
  };

  /* ---------- SUCCESS ---------- */
  useEffect(() => {
    if (loginOtpVerified) {
      // ✅ Clear storage AFTER saving to ref, so no re-render race
      sessionStorage.removeItem("pendingLoginId");
      sessionStorage.removeItem("pendingLoginEmail");
      toast.success("Login successful");
      navigate("/dashboard");
      dispatch(resetAuthState());
    }
  }, [loginOtpVerified]);

  /* ---------- ERROR ---------- */
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // ✅ Guard uses ref, not live sessionStorage read
  if (!loginIdRef.current) return null;

  const resendOtp = async (): Promise<void> => {
    toast("Resend OTP coming soon");
  };

  return (
    <OtpVerification
      email={emailRef.current}
      onVerify={verifyOtp}
      onResend={resendOtp}
      loading={loading}
    />
  );
};

export default LoginOtp;
