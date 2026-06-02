import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "../../../components/ui/Button";
import { useOpsDispatch, useOpsSelector } from "../../store/hooks/opsHooks";
import {
  opsVerifyOtpThunk,
  opsResendOtpThunk,
  clearOpsAuthError,
} from "../../store/slices/opsAuthSlice";

import "./VerifyOtp.css";

const OTP_DURATION_SECONDS = 10 * 60;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const VerifyOtp = () => {
  const navigate = useNavigate();
  const dispatch = useOpsDispatch();

  const { loading, error, tempLoginId } = useOpsSelector(
    (state) => state.opsAuth
  );

  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_DURATION_SECONDS);

  useEffect(() => {
    if (!tempLoginId) return;

    setTimeLeft(OTP_DURATION_SECONDS);
  }, [tempLoginId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async () => {
    dispatch(clearOpsAuthError());

    if (!tempLoginId) {
      toast.error("Login session expired. Please login again.");
      navigate("/ops/login");
      return;
    }

    if (timeLeft <= 0) {
      toast.error("OTP expired. Please resend OTP.");
      return;
    }

    if (otp.length !== 6) {
      toast.warning("Please enter a valid 6-digit OTP.");
      return;
    }

    const result = await dispatch(
      opsVerifyOtpThunk({
        tempLoginId,
        otp,
      })
    );

    if (opsVerifyOtpThunk.fulfilled.match(result)) {
      toast.success("Login successful.");
      navigate("/ops/dashboard");
    }

    if (opsVerifyOtpThunk.rejected.match(result)) {
      toast.error((result.payload as string) || "OTP verification failed.");
    }
  };

  const handleResendOtp = async () => {
    dispatch(clearOpsAuthError());

    if (!tempLoginId) {
      toast.error("Login session expired. Please login again.");
      navigate("/ops/login");
      return;
    }

    const result = await dispatch(opsResendOtpThunk(tempLoginId));

    if (opsResendOtpThunk.fulfilled.match(result)) {
      setOtp("");
      setTimeLeft(OTP_DURATION_SECONDS);
      toast.success("A new OTP has been sent.");
    }

    if (opsResendOtpThunk.rejected.match(result)) {
      toast.error((result.payload as string) || "Failed to resend OTP.");
    }
  };

  const isOtpExpired = timeLeft <= 0;

  return (
    <div className="ops-auth-card">
      <img
        className="ops-company-logo"
        src="/ops/home/company-logo.png"
        alt="Company Logo"
      />

      <h2>Verify OTP</h2>
      <p>Enter the 6-digit OTP sent to your registered email.</p>

      <div className="ops-otp-form">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter OTP"
          value={otp}
          disabled={loading || isOtpExpired}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <p className={isOtpExpired ? "ops-otp-timer expired" : "ops-otp-timer"}>
          {isOtpExpired
            ? "OTP expired. Please resend OTP."
            : `OTP expires in ${formatTime(timeLeft)}`}
        </p>

        {error && <p className="ops-auth-error">{error}</p>}

        {!tempLoginId && (
          <p className="ops-auth-error">
            Login session expired. Please login again.
          </p>
        )}

        <Button
          size="large"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6 || !tempLoginId || isOtpExpired}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </Button>

        <button
          className="ops-resend-btn"
          type="button"
          disabled={loading || !tempLoginId}
          onClick={handleResendOtp}
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;