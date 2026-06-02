import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="ops-auth-card">
      <img
        className="ops-company-logo"
        src="/ops/home/company-logo.png"
        alt="Company Logo"
      />

      <h2>Operations Dashboard</h2>

      <p>
        Secure access for Super Admins, Site Managers,
        and Site Admins.
      </p>

      <div className="ops-auth-actions">
        <Button
          size="large"
          onClick={() => navigate("/ops/login")}
        >
          Login
        </Button>

        <Button size="large">
          Sign Up
        </Button>
      </div>
    </div>
  );
};

export default Home;