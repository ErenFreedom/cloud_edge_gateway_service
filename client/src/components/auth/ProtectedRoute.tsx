import { Navigate } from "react-router-dom";
import { getUserFromToken } from "../../utils/auth";

type Props = {
  children: React.ReactNode;
  role?: string;
};

const ProtectedRoute = ({ children, role }: Props) => {

  const user = getUserFromToken();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;