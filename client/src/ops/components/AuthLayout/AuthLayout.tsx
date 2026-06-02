import { useEffect, useState } from "react";
import { FaLinkedin, FaEnvelope, FaXTwitter } from "react-icons/fa6";
import { Outlet } from "react-router-dom";
import "./AuthLayout.css";

const slides = [
  {
    image: "/ops/home/ops-overview.png",
    title: "Industrial Operations Dashboard",
    text: "Monitor sites, buildings, floors, rooms, equipment, and sensors from one unified BMS command center.",
  },
  {
    image: "/ops/home/centralized.png",
    title: "Centralized Building Intelligence",
    text: "Connect multiple sites and sensor systems into one secure operational platform.",
  },
  {
    image: "/ops/home/security.png",
    title: "Secure Role-Based Access",
    text: "Access dashboards based on organization, site, and user role permissions.",
  },
  {
    image: "/ops/home/alarms.png",
    title: "Live Alarms & Monitoring",
    text: "Track anomalies, communication loss, spikes, resets, and operational alerts in real time.",
  },
  {
    image: "/ops/home/analytics.png",
    title: "Energy & Data Analytics",
    text: "Visualize consumption, trends, performance, and site-level analytics from processed IoT data.",
  },
];

const AuthLayout = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <main className="ops-auth-layout">
      <section className="ops-auth-left">
        <div className="ops-auth-slide">
          <img src={activeSlide.image} alt={activeSlide.title} />

          <div className="ops-auth-slide-overlay">
            <p className="ops-auth-slide-kicker">BMS Operations Platform</p>
            <h1>{activeSlide.title}</h1>
            <p>{activeSlide.text}</p>

            <div className="ops-auth-slide-dots">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={index === activeIndex ? "active" : ""}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ops-auth-right">
        <Outlet />

        <footer className="ops-auth-footer">
          <p>Contact us</p>

          <div>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="mailto:support@example.com" aria-label="Email">
              <FaEnvelope />
            </a>
            <a href="#" aria-label="X">
              <FaXTwitter />
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default AuthLayout;