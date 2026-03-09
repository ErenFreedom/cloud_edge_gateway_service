import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import { registerOrgThunk } from "../../features/auth/authSlice";
import "./SignUp.css";
import Button from "../../components/ui/Button";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/* ---------------- FORM TYPE ---------------- */

type SignUpForm = {
  org_name: string
  org_phone: string
  org_address: string
  pincode: string
  gst_number: string
  registration_number: string
  super_admin_name: string
  super_admin_email: string
  super_admin_phone: string
  password: string
  birthdate: string
  gender: string
  aadhaar_pan: string
}

const SignUp = () => {

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { loading, error, registrationSuccess } = useSelector(
    (state: RootState) => state.auth
  );

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
    aadhaar_pan: ""
  });

  const [gstVerified, setGstVerified] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  /* ---------------- INPUT CHANGE ---------------- */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

  };

  const verifyGST = () => {

    if (form.gst_number.length >= 10) {

      setGstVerified(true);
      toast.success("GST number verified");

    } else {

      toast.error("Invalid GST number");

    }

  };

  const verifyAadhaar = () => {

    if (form.aadhaar_pan.length >= 10) {

      setAadhaarVerified(true);
      toast.success("Aadhaar/PAN verified");

    } else {

      toast.error("Invalid Aadhaar/PAN");

    }

  };

  /* ---------------- FORM SUBMIT ---------------- */

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault();

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
        gender: form.gender
      })
    );

  };


  return (
    <div className="signup-container">

      <div className="signup-card">

        <h1>Register Organization</h1>
        {loading && <p className="info">Registering...</p>}
        {error && <p className="error">{error}</p>}
        {registrationSuccess && <p className="success">Organization registered!</p>}

        <form onSubmit={handleSubmit}>

          {/* ORGANIZATION INFO */}

          <h2 className="section-title">Organization Info</h2>

          <input
            name="org_name"
            placeholder="Organization Name"
            onChange={handleChange}
            required
          />

          <PhoneInput
            country={"in"}
            value={form.org_phone}
            onChange={(phone: string) =>
              setForm((prev) => ({ ...prev, org_phone: phone }))
            }
            containerClass="phone-container"
            inputClass="phone-input"
            buttonClass="phone-button"
          />

          <input
            name="org_address"
            placeholder="Organization Address"
            onChange={handleChange}
          />

          <input
            name="pincode"
            placeholder="Pincode"
            onChange={handleChange}
          />

          <div className="verify-field">

            <input
              name="gst_number"
              placeholder="GST Number"
              onChange={handleChange}
            />

            <button
              type="button"
              className={`verify-circle ${gstVerified ? "verified" : ""}`}
              onClick={verifyGST}
            />

          </div>

          <input
            name="registration_number"
            placeholder="Registration Number"
            onChange={handleChange}
          />

          {/* ADMIN INFO */}

          <h2 className="section-title">Admin Info</h2>

          <input
            name="super_admin_name"
            placeholder="Super Admin Name"
            onChange={handleChange}
            required
          />

          <input
            name="super_admin_email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <PhoneInput
            country={"in"}
            value={form.super_admin_phone}
            onChange={(phone: string) =>
              setForm((prev) => ({ ...prev, super_admin_phone: phone }))
            }
            containerClass="phone-container"
            inputClass="phone-input"
            buttonClass="phone-button"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <input
            name="birthdate"
            type="date"
            placeholder="Enter your birthdate"
            onChange={handleChange}
          />

          <select
            name="gender"
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
              onChange={handleChange}
            />

            <button
              type="button"
              className={`verify-circle ${aadhaarVerified ? "verified" : ""}`}
              onClick={verifyAadhaar}
            />

          </div>

          <div className="signup-button">
            <Button
              type="submit"
              disabled={!(gstVerified && aadhaarVerified) || loading}
            >
              Register
            </Button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default SignUp;