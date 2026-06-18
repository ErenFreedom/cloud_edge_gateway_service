import { useEffect, useState } from "react";
import "./AuthLayout.css";

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

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auth-layout">
      <div className="auth-layout-left">
        <img
          src={slides[current].image}
          alt={slides[current].title}
          className="auth-slide-image"
        />

        <div className="auth-slide-content">
          <h2>{slides[current].title}</h2>
          <p>{slides[current].subtitle}</p>

          <div className="auth-slide-dots">
            {slides.map((_, index) => (
              <span
                key={index}
                className={
                  current === index
                    ? "auth-slide-dot active"
                    : "auth-slide-dot"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="auth-layout-right">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;