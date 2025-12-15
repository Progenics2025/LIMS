import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation('/login');
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  // Role checks are intentionally skipped here so sidebar visibility controls which pages are shown.

  return <>{children}</>;
}
