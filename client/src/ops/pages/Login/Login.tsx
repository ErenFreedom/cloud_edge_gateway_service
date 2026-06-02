import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Button from "../../../components/ui/Button";
import { useOpsDispatch, useOpsSelector } from "../../store/hooks/opsHooks";
import {
  opsLoginThunk,
  clearOpsAuthError,
} from "../../store/slices/opsAuthSlice";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useOpsDispatch();

  const { loading, error } = useOpsSelector((state) => state.opsAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSendOtp = async () => {
    dispatch(clearOpsAuthError());

    if (!email.trim() || !password.trim()) {
      toast.warning("Please enter both email and password.");
      return;
    }

    const result = await dispatch(
      opsLoginThunk({
        email,
        password,
      })
    );

    if (opsLoginThunk.fulfilled.match(result)) {
      toast.success("OTP sent successfully to your registered email.");
      navigate("/ops/verify-otp");
    }

    if (opsLoginThunk.rejected.match(result)) {
      toast.error((result.payload as string) || "Login failed.");
    }
  };

  return (
    <div className="ops-auth-card">
      <img
        className="ops-company-logo"
        src="/ops/home/company-logo.png"
        alt="Company Logo"
      />

      <h2>Login</h2>
      <p>Enter your credentials to receive a secure OTP.</p>

      <div className="ops-login-form">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="ops-forgot-btn" type="button">
          Forgot password?
        </button>

        {error && <p className="ops-auth-error">{error}</p>}

        <Button size="large" onClick={handleSendOtp} disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </Button>
      </div>
    </div>
  );
};

export default Login;