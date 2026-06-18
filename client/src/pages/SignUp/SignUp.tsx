import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";

import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "../../store/store";
import { registerOrgThunk } from "../../features/auth/authSlice";

import Button from "../../components/ui/Button";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import "./SignUp.css";

type SignUpForm = {
  org_name: string;
  org_phone: string;
  org_address: string;
  pincode: string;
  gst_number: string;
  registration_number: string;
  super_admin_name: string;
  super_admin_email: string;
  super_admin_phone: string;
  password: string;
  birthdate: string;
  gender: string;
  aadhaar_pan: string;
};

const SignUp = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { loading, error, registrationSuccess } = useSelector(
    (state: RootState) => state.auth
  );

  const [form, setForm] = useState<SignUpForm>({
    org_name: "",
    org_phone: "",
    org_address: "",
    pincode: "",
    gst_number: "",
    registration_number: "",
    super_admin_name: "",
    super_admin_email: "",
    super_admin_phone: "",
    password: "",
    birthdate: "",
    gender: "",
    aadhaar_pan: "",
  });

  const [gstVerified, setGstVerified] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  useEffect(() => {
    if (registrationSuccess) {
      toast.success("OTP has been sent to your verified email");

      setTimeout(() => {
        navigate("/otp/signup");
      }, 1200);
    }

    if (error) {
      toast.error(error);
    }
  }, [registrationSuccess, error, navigate]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const verifyGST = () => {
    if (form.gst_number.trim().length >= 10) {
      setGstVerified(true);
      toast.success("GST number verified");
    } else {
      toast.error("Invalid GST number");
    }
  };

  const verifyAadhaar = () => {
    if (form.aadhaar_pan.trim().length >= 10) {
      setAadhaarVerified(true);
      toast.success("Aadhaar/PAN verified");
    } else {
      toast.error("Invalid Aadhaar/PAN");
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!gstVerified || !aadhaarVerified) {
      toast.error("Please verify GST and Aadhaar/PAN");
      return;
    }

    toast.loading("Registering organization...", {
      id: "signup",
    });

    dispatch(
      registerOrgThunk({
        org_name: form.org_name,
        org_phone: form.org_phone,
        org_address: form.org_address,
        pincode: form.pincode,
        gst_number: form.gst_number,
        registration_number: form.registration_number,
        super_admin_name: form.super_admin_name,
        super_admin_email: form.super_admin_email,
        super_admin_phone: form.super_admin_phone,
        password: form.password,
        aadhaar_pan: form.aadhaar_pan,
        birthdate: form.birthdate,
        gender: form.gender,
      })
    ).finally(() => {
      toast.dismiss("signup");
    });
  };

  return (
    <AuthLayout>
      <div className="signup-card">
        <img
          src="/logo.png"
          alt="Koncept Engineers"
          className="signup-logo"
        />

        <h1>Register Organization</h1>

        <p className="signup-subtitle">
          Create your Administrator Ops account
        </p>

        <form onSubmit={handleSubmit}>
          <h2 className="section-title">Organization Info</h2>

          <input
            name="org_name"
            placeholder="Organization Name"
            value={form.org_name}
            onChange={handleChange}
            required
          />

          <PhoneInput
            country="in"
            value={form.org_phone}
            onChange={(phone: string) =>
              setForm((prev) => ({
                ...prev,
                org_phone: phone,
              }))
            }
            containerClass="phone-container"
            inputClass="phone-input"
            buttonClass="phone-button"
          />

          <input
            name="org_address"
            placeholder="Organization Address"
            value={form.org_address}
            onChange={handleChange}
          />

          <input
            name="pincode"
            placeholder="Pincode"
            value={form.pincode}
            onChange={handleChange}
          />

          <div className="verify-field">
            <input
              name="gst_number"
              placeholder="GST Number"
              value={form.gst_number}
              onChange={(e) => {
                setGstVerified(false);
                handleChange(e);
              }}
            />

            <button
              type="button"
              className={`verify-circle ${
                gstVerified ? "verified" : ""
              }`}
              onClick={verifyGST}
              title="Verify GST"
            />
          </div>

          <input
            name="registration_number"
            placeholder="Registration Number"
            value={form.registration_number}
            onChange={handleChange}
          />

          <h2 className="section-title">Admin Info</h2>

          <input
            name="super_admin_name"
            placeholder="Super Admin Name"
            value={form.super_admin_name}
            onChange={handleChange}
            required
          />

          <input
            name="super_admin_email"
            type="email"
            placeholder="Email"
            value={form.super_admin_email}
            onChange={handleChange}
            required
          />

          <PhoneInput
            country="in"
            value={form.super_admin_phone}
            onChange={(phone: string) =>
              setForm((prev) => ({
                ...prev,
                super_admin_phone: phone,
              }))
            }
            containerClass="phone-container"
            inputClass="phone-input"
            buttonClass="phone-button"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            name="birthdate"
            type="date"
            value={form.birthdate}
            onChange={handleChange}
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <div className="verify-field">
            <input
              name="aadhaar_pan"
              placeholder="Aadhaar / PAN"
              value={form.aadhaar_pan}
              onChange={(e) => {
                setAadhaarVerified(false);
                handleChange(e);
              }}
            />

            <button
              type="button"
              className={`verify-circle ${
                aadhaarVerified ? "verified" : ""
              }`}
              onClick={verifyAadhaar}
              title="Verify Aadhaar/PAN"
            />
          </div>

          <div className="signup-button">
            <Button
              type="submit"
              disabled={
                !(gstVerified && aadhaarVerified) || loading
              }
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;