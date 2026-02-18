"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  MessageCircle,
  FileCheck,
  Users,
  LayoutDashboard,
  Bot,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
  Settings,
  Heart,
  Moon,
  Sun,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

const publicLinks = [
  // Removed Home link - landing page is not needed after login
];

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/documents", label: "Documents", icon: FileCheck },
  { href: "/tribe", label: "Tribe", icon: Users },
  { href: "/wellness", label: "Wellness", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  let theme = "light";
  let toggleTheme = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (e) {
    // Theme provider not available yet
  }
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    console.log("Navbar - Auth check:", { token: !!token, role, pathname });
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUserRole(null);
    router.push("/");
  };

  const navLinks = isAuthenticated
    ? userRole === "admin"
      ? adminLinks
      : studentLinks
    : publicLinks;

  console.log("Navbar - Computed links:", { 
    isAuthenticated, 
    userRole, 
    linksCount: navLinks.length,
    links: navLinks.map(l => l.label)
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <span className="text-lg font-bold tracking-tight">P.A.L.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          )}
          
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:scale-[1.02]"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/50 bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
