import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "@/lib/auth";
import { ReactNode } from "react";

export const RequireAuth = ({ role, children }: { role?: Role; children: ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/login" state={{ from: location.pathname, error: "admin-required" }} replace />;
  }
  return <>{children}</>;
};
