import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
    loginSuccess,
    loginOtpVerified
  } = useSelector((state: RootState) => state.auth);


  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: ""
  });


  /* ---------------- REDIRECT LOGIC ---------------- */

  useEffect(() => {

    /* NORMAL USER → OTP */

    if (loginSuccess) {

      toast.success("OTP sent to your email");

      setTimeout(() => {
        navigate("/otp/login");
      }, 1200);

    }


    /* PLATFORM ADMIN → DIRECT LOGIN */

    if (loginOtpVerified) {

      toast.success("Login successful");

      setTimeout(() => {
        navigate("/platform");
      }, 800);

    }


    if (error) {
      toast.error(error);
    }

  }, [
    loginSuccess,
    loginOtpVerified,
    error,
    navigate
  ]);


  /* ---------------- INPUT HANDLER ---------------- */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

  };


  /* ---------------- SUBMIT ---------------- */

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

              {loading
                ? "Logging in..."
                : "Login"}

            </Button>

          </div>

        </form>

      </div>

    </div>

  );

};

export default Login;