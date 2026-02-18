"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Save,
  Loader2,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    designation: "",
    joinDate: "",
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage or use mock data
      const storedProfile = localStorage.getItem("adminProfile");

      if (storedProfile) {
        setProfileData(JSON.parse(storedProfile));
      } else {
        // Default mock data
        setProfileData({
          name: "Admin User",
          email: "admin@college.edu",
          phone: "+91 98765 43210",
          employeeId: "ADMIN-001",
          department: "Administration",
          designation: "System Administrator",
          joinDate: "2024-01-15",
        });
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage (in real app, would call API)
      localStorage.setItem("adminProfile", JSON.stringify(profileData));
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="gradient-mesh min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Admin Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your profile and account settings
          </p>
        </div>

        {/* Profile Section */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-1/15">
                <Shield className="h-8 w-8 text-chart-1" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Administrator Profile</h2>
                <p className="text-sm text-muted-foreground">Update your personal information</p>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={profileData.employeeId}
                  disabled
                  className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm opacity-60 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Department
                </label>
                <select
                  value={profileData.department}
                  onChange={(e) => handleProfileChange("department", e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="Administration">Administration</option>
                  <option value="Admissions">Admissions</option>
                  <option value="Academics">Academics</option>
                  <option value="Student Affairs">Student Affairs</option>
                  <option value="IT Department">IT Department</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={profileData.designation}
                  onChange={(e) => handleProfileChange("designation", e.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Join Date
                </label>
                <input
                  type="date"
                  value={profileData.joinDate}
                  disabled
                  className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-6 flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Account Information */}
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-xs text-muted-foreground">Administrator Access</p>
                </div>
                <span className="rounded-full bg-chart-1/15 px-3 py-1 text-xs font-medium text-chart-1">
                  Admin
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-xs text-muted-foreground">Your account is active</p>
                </div>
                <span className="rounded-full bg-chart-4/15 px-3 py-1 text-xs font-medium text-chart-4">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Last Login</p>
                  <p className="text-xs text-muted-foreground">Track your account activity</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-2xl border border-chart-1/30 bg-chart-1/5 p-5">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-chart-1 mb-1">Security Notice</p>
                <p className="text-muted-foreground">
                  For password changes or security settings, please contact the IT administrator or use the college's central authentication system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
