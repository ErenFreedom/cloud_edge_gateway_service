import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";

import "./LandingPage.css";

const slides = [
  {
    image: "/image_1.jpeg",
    title: "Enterprise Security",
    subtitle:
      "Secure authentication, role-based access and protected infrastructure.",
  },
  {
    image: "/image_2.jpeg",
    title: "Centralized Monitoring",
    subtitle:
      "Manage organizations, sites, devices and users from one dashboard.",
  },
  {
    image: "/image_3.jpeg",
    title: "Access Anywhere",
    subtitle:
      "Cloud powered Building Management System available from anywhere.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-left">
        <img
          src={slides[current].image}
          alt={slides[current].title}
          className="landing-slide-image"
        />

        <div className="landing-slide-content">
          <h2>{slides[current].title}</h2>

          <p>{slides[current].subtitle}</p>

          <div className="landing-dots">
            {slides.map((_, index) => (
              <span
                key={index}
                className={
                  current === index
                    ? "landing-dot active"
                    : "landing-dot"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="landing-right">
        <img
          src="/logo.png"
          alt="Koncept Engineers"
          className="landing-logo"
        />

        <h1 className="landing-heading">Welcome to</h1>

        <h2 className="landing-subheading">
          Administrator Ops
        </h2>

        <div className="landing-buttons">
          <Button onClick={() => navigate("/login")}>
            Login
          </Button>

          <Button onClick={() => navigate("/signup")}>
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;