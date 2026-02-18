"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "student" | "admin";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");

      console.log("AuthGuard check:", { pathname, token: token?.substring(0, 20), userRole, requiredRole });

      // Public routes
      const publicRoutes = ["/", "/login", "/test-auth"];
      if (publicRoutes.includes(pathname)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user is authenticated
      if (!token) {
        console.log("No token found, redirecting to login");
        router.push("/login");
        return;
      }

      // Check role-based access
      if (requiredRole && userRole !== requiredRole) {
        console.log("Role mismatch:", { userRole, requiredRole });
        // Redirect to appropriate dashboard
        if (userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      console.log("Auth check passed!");
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, requiredRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
