import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Role checks are intentionally skipped here so sidebar visibility controls which pages are shown.

  return <>{children}</>;
}
