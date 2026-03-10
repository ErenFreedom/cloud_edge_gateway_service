import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { store } from "../../store/store";

import toast from "react-hot-toast";

import type { RootState, AppDispatch } from "../../store/store";

import { loginThunk } from "../../features/auth/authSlice";

import "./Login.css";
import Button from "../../components/ui/Button";

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
    loginSuccess
  } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: ""
  });

  /* ---------- LOGIN SUCCESS ---------- */

  useEffect(() => {

    if (loginSuccess) {

      const { pendingLoginId, pendingLoginEmail } =
        store.getState().auth;

      if (pendingLoginId) {

        sessionStorage.setItem(
          "pendingLoginId",
          pendingLoginId
        );

        sessionStorage.setItem(
          "pendingLoginEmail",
          pendingLoginEmail ?? ""
        );

      }

      toast.success("OTP sent to your email");

      navigate("/otp/login");

    }

  }, [loginSuccess, navigate]);


  /* ---------- ERROR ---------- */

  useEffect(() => {

    if (error) {
      toast.error(error);
    }

  }, [error]);


  /* ---------- INPUT ---------- */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

  };


  /* ---------- SUBMIT ---------- */

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    dispatch(
      loginThunk({
        email: form.email,
        password: form.password
      })
    );

  };


  const isDisabled =
    form.email.trim() === "" ||
    form.password.trim() === "";


  return (

    <div className="login-container">

      <div className="login-card">

        <h1>Login</h1>

        <form onSubmit={handleSubmit}>

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
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

    </div>

  );

};

export default Login;