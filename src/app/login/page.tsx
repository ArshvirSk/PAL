"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, User, Shield, ArrowRight, Loader2, QrCode, X } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

type UserType = "student" | "admin" | null;

export default function LoginPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"select" | "credentials" | "otp">("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TEST MODE: Skip OTP sending, just go to OTP step
      setStep("otp");
      setLoading(false);
      return;

      /* PRODUCTION CODE (uncomment when backend is ready):
      const response = await fetch("http://localhost:3001/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionNumber })
      });

      const data = await response.json();

      if (data.success) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
      */
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Clear any old tokens first
      localStorage.clear();
      
      // TEST MODE: Auto-create user and login
      const isAdmin = admissionNumber.toUpperCase().includes("ADMIN");
      const role = isAdmin ? "admin" : "student";
      
      // Try to login with backend (will auto-create user if doesn't exist)
      const response = await fetch("http://localhost:3002/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          admissionNumber, 
          otp // In test mode, backend should accept any OTP
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store real token from backend
        console.log("=== LOGIN SUCCESS ===");
        console.log("User data:", data.data.user);
        console.log("Role:", data.data.user.role);
        console.log("Token:", data.data.accessToken.substring(0, 20) + "...");
        
        localStorage.setItem("token", data.data.accessToken);
        localStorage.setItem("userRole", data.data.user.role);
        localStorage.setItem("userName", data.data.user.name);
        localStorage.setItem("admissionNumber", admissionNumber);
        
        console.log("Stored in localStorage:");
        console.log("- token:", localStorage.getItem("token")?.substring(0, 20) + "...");
        console.log("- userRole:", localStorage.getItem("userRole"));
        console.log("- userName:", localStorage.getItem("userName"));
        
        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log("Redirecting to:", data.data.user.role === "admin" ? "/admin" : "/dashboard");
        
        // Use router.push for proper Next.js navigation
        if (data.data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        // If backend fails, fall back to test mode
        console.warn("Backend login failed, using test mode");
        localStorage.setItem("token", "test-token-" + Date.now());
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", isAdmin ? "Test Admin" : "Test Student");
        localStorage.setItem("admissionNumber", admissionNumber);
        
        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-mesh min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground">
            <Bot className="h-6 w-6 text-background" />
          </div>
          <span className="text-2xl font-bold">P.A.L.</span>
        </Link>

        {/* Login Card */}
        <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
          {step === "select" && (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
                Welcome Back
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Choose your login type to continue
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setUserType("student");
                    setStep("credentials");
                  }}
                  className="w-full group flex items-center gap-4 rounded-2xl border border-border/50 bg-secondary p-6 transition-all hover:border-border hover:shadow-lg neu-flat"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/15">
                    <User className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">Student Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Access your dashboard and onboarding
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => {
                    setUserType("admin");
                    setStep("credentials");
                  }}
                  className="w-full group flex items-center gap-4 rounded-2xl border border-border/50 bg-secondary p-6 transition-all hover:border-border hover:shadow-lg neu-flat"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/15">
                    <Shield className="h-6 w-6 text-chart-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">Admin Login</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage verifications and analytics
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Accounts are created by administrators only
              </p>

              <div className="mt-4 rounded-xl bg-secondary/50 border border-border/50 p-4">
                <p className="text-xs font-semibold mb-2">🧪 Test Credentials:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• Student: <code className="bg-background px-2 py-0.5 rounded">CS-2026-001</code></p>
                  <p>• Admin: <code className="bg-background px-2 py-1 rounded">ADMIN-001</code></p>
                  <p className="mt-2 text-[10px]">Any 6-digit OTP will work in test mode</p>
                </div>
              </div>
              
              {/* QR Code Button */}
              <button
                onClick={() => setShowQR(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                Login with QR Code
              </button>
            </div>
          )}
          
          {/* QR Code Modal */}
          {showQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
              <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card p-6 shadow-xl neu-flat" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Scan to Login</h3>
                  <button onClick={() => setShowQR(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl">
                    <QRCodeSVG 
                      value={`${window.location.origin}/login?quick=true&type=student`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="mt-4 text-sm text-center text-muted-foreground">
                    Scan this QR code with your mobile device to login quickly
                  </p>
                  <p className="mt-2 text-xs text-center text-muted-foreground">
                    Works with any QR code scanner app
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "credentials" && (
            <div>
              <button
                onClick={() => {
                  setStep("select");
                  setUserType(null);
                  setError("");
                }}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to login type
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  userType === "admin" ? "bg-chart-4/15" : "bg-chart-1/15"
                }`}>
                  {userType === "admin" ? (
                    <Shield className="h-5 w-5 text-chart-4" />
                  ) : (
                    <User className="h-5 w-5 text-chart-1" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">
                    {userType === "admin" ? "Admin" : "Student"} Login
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your credentials
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {userType === "admin" ? "Admin ID" : "Admission Number"}
                  </label>
                  <input
                    type="text"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder={userType === "admin" ? "ADMIN-001" : "CS-2026-001"}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-chart-1 focus:outline-none focus:ring-2 focus:ring-chart-1/20"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === "otp" && (
            <div>
              <button
                onClick={() => {
                  setStep("credentials");
                  setOtp("");
                  setError("");
                }}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>

              <div className="mb-6 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/15 mb-3">
                  <Bot className="h-6 w-6 text-chart-1" />
                </div>
                <h2 className="font-semibold">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a code to your registered mobile
                </p>
                <div className="mt-3 rounded-xl bg-chart-1/10 border border-chart-1/20 px-4 py-2">
                  <p className="text-xs font-medium text-chart-1">
                    🧪 TEST MODE: Enter any 6 digits (e.g., 123456)
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-mono tracking-widest focus:border-chart-1 focus:outline-none focus:ring-2 focus:ring-chart-1/20"
                    required
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Login
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Didn't receive? Resend OTP
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
