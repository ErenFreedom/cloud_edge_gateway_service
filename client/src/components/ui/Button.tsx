import "./Button.css";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "small" | "medium" | "large";
}

const Button = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  size = "large"
}: ButtonProps) => {

  return (
    <button
      className={`button-81 ${size}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;