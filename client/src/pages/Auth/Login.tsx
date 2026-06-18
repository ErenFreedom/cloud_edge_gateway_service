import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { store } from "../../store/store";

import toast from "react-hot-toast";

import type { RootState, AppDispatch } from "../../store/store";
import { loginThunk } from "../../features/auth/authSlice";

import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";

import "./Login.css";

type LoginForm = {
  email: string;
  password: string;
};

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    loading,
    error,
    loginSuccess,
    loginOtpVerified,
  } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  useEffect(() => {
    const state = store.getState().auth;

    if (loginOtpVerified && state.user?.role === "platform_admin") {
      toast.success("Welcome Platform Admin");
      navigate("/platform");
      return;
    }

    if (loginSuccess) {
      const { pendingLoginId, pendingLoginEmail } = state;

      if (pendingLoginId) {
        sessionStorage.setItem("pendingLoginId", pendingLoginId);
        sessionStorage.setItem("pendingLoginEmail", pendingLoginEmail ?? "");
      }

      toast.success("OTP sent to your email");
      navigate("/otp/login");
    }
  }, [loginSuccess, loginOtpVerified, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please enter email and password");
      return;
    }

    toast.loading("Logging in...", {
      id: "login",
    });

    dispatch(
      loginThunk({
        email: form.email.trim(),
        password: form.password,
      })
    ).finally(() => {
      toast.dismiss("login");
    });
  };

  const isDisabled =
    form.email.trim() === "" ||
    form.password.trim() === "";

  return (
    <AuthLayout>
      <div className="login-card">
        <img
          src="/logo.png"
          alt="Koncept Engineers"
          className="login-logo"
        />

        <h1>Login</h1>

        <p className="login-subtitle">
          Access your Administrator Ops dashboard
        </p>

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className="login-button">
            <Button
              disabled={isDisabled || loading}
              type="submit"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;