import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../../utils/auth";

type Props = {
  children: React.ReactNode;
  role?: string;
};

const ProtectedRoute = ({ children, role }: Props) => {

  const user = getUserFromToken();

  /* 🔒 NOT LOGGED IN */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* 🔒 ROLE CHECK */
  if (role && user.role !== role) {
    return <Navigate to="/" replace />; // ✅ safe fallback
  }

  return <>{children}</>;
};

export default ProtectedRoute;