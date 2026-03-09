import { useState, useRef, useEffect } from "react";
import "./OtpVerification.css";
import Button from "../ui/Button";

type Props = {
  email: string
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  loading?: boolean
}

const OtpVerification = ({ email, onVerify, onResend }: Props) => {

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(600);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {

    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = () => {

    const finalOtp = otp.join("");

    if (finalOtp.length === 6) {
      onVerify(finalOtp);
    }

  };

  const formatTime = () => {

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isDisabled = otp.join("").length !== 6;

  return (
    <div className="otp-container">

      <div className="otp-card">

        <h2>Please verify OTP</h2>

        <p>
          OTP sent to your registered email <br />
          <strong>{email}</strong>
        </p>

        <div className="otp-inputs">

          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              onChange={(e) =>
                handleChange(e.target.value, index)
              }
            />
          ))}

        </div>

        <p className="otp-timer">

          OTP expires in {formatTime()}

        </p>

        <p className="otp-resend">

          Didn't get OTP?{" "}
          <span onClick={onResend}>Resend</span>

        </p>

        <Button disabled={isDisabled} onClick={handleVerify}>
          Verify OTP
        </Button>

      </div>

    </div>
  );
};

export default OtpVerification;