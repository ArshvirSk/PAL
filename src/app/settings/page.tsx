"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Save,
  Loader2,
  Settings as SettingsIcon,
  Users,
  Code,
  Gamepad2,
  Music,
  BookOpen,
  Camera,
  Dumbbell,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import api from "@/lib/api";

type Interest = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const interestOptions: Interest[] = [
  { id: "coding", label: "Coding", icon: Code },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "music", label: "Music", icon: Music },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "tribe">("profile");

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    admissionNumber: "",
    branch: "",
    year: "",
    hostelBlock: "",
    roomNumber: "",
    hometown: "",
  });

  // Tribe data
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage or use mock data
      const storedProfile = localStorage.getItem("userProfile");
      const storedInterests = localStorage.getItem("userInterests");
      const storedBio = localStorage.getItem("userBio");

      if (storedProfile) {
        setProfileData(JSON.parse(storedProfile));
      } else {
        // Default mock data
        setProfileData({
          name: "Student User",
          email: "cs-2026-001@test.com",
          phone: "+91 98765 43210",
          admissionNumber: "CS-2026-001",
          branch: "Computer Science",
          year: "1st Year",
          hostelBlock: "Block A",
          roomNumber: "A-204",
          hometown: "Mumbai, Maharashtra",
        });
      }

      if (storedInterests) {
        setSelectedInterests(JSON.parse(storedInterests));
      } else {
        setSelectedInterests(["coding", "gaming"]);
      }

      if (storedBio) {
        setBio(storedBio);
      } else {
        setBio("Hey! I'm a first-year CS student passionate about technology and making new friends on campus.");
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage (in real app, would call API)
      localStorage.setItem("userProfile", JSON.stringify(profileData));
      
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

  const saveTribeInfo = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage
      localStorage.setItem("userInterests", JSON.stringify(selectedInterests));
      localStorage.setItem("userBio", bio);
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      alert("Tribe information updated successfully!");
    } catch (error) {
      console.error("Failed to save tribe info:", error);
      alert("Failed to save tribe information");
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your profile and tribe preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "profile"
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
            }`}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("tribe")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
              activeTab === "tribe"
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
            }`}
          >
            <Users className="h-4 w-4" />
            Tribe Info
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
              <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h2>
              
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
                    Email
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
                    Admission Number
                  </label>
                  <input
                    type="text"
                    value={profileData.admissionNumber}
                    disabled
                    className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={profileData.branch}
                    disabled
                    className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={profileData.year}
                    disabled
                    className="w-full rounded-xl border border-border/50 bg-secondary px-4 py-3 text-sm opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hostel Block
                  </label>
                  <input
                    type="text"
                    value={profileData.hostelBlock}
                    onChange={(e) => handleProfileChange("hostelBlock", e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={profileData.roomNumber}
                    onChange={(e) => handleProfileChange("roomNumber", e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Hometown
                  </label>
                  <input
                    type="text"
                    value={profileData.hometown}
                    onChange={(e) => handleProfileChange("hometown", e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
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
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tribe Tab */}
        {activeTab === "tribe" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
              <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                About Me
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell others about yourself..."
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {bio.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">
                  My Interests
                </label>
                <div className="flex flex-wrap gap-3">
                  {interestOptions.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-foreground text-background"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground neu-flat"
                        }`}
                      >
                        <interest.icon className="h-4 w-4" />
                        {interest.label}
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={saveTribeInfo}
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
                    Save Tribe Info
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
