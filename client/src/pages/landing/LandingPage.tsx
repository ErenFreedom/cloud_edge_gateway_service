import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import Button from "../../components/ui/Button";

const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="landing-container">

            <div className="landing-content">

                <img
                    src="/logo.png"
                    alt="Koncept Engineers"
                    className="landing-logo"
                />

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