"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  FileCheck,
  CreditCard,
  Building,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Calendar,
  Bell,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AuthGuard } from "@/components/auth-guard";
import api from "@/lib/api";
import { OnboardingTour, dashboardTour } from "@/components/onboarding-tour";

const phaseIcons: Record<string, any> = {
  "Document Verification": FileCheck,
  "Fee Payment": CreditCard,
  "Hostel Allotment": Building,
  "Academic Setup": BookOpen,
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);

  const toggleTask = (phaseId: string, taskName: string) => {
    setPhases((prevPhases) => {
      const newPhases = prevPhases.map((phase) => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            tasks: phase.tasks.map((task: any) =>
              task.name === taskName ? { ...task, done: !task.done } : task
            ),
          };
        }
        return phase;
      });

      // Recalculate progress
      const totalTasks = newPhases.flatMap((p) => p.tasks).length;
      const doneTasks = newPhases.flatMap((p) => p.tasks).filter((t) => t.done).length;
      const newProgress = Math.round((doneTasks / totalTasks) * 100);
      setProgressPercent(newProgress);
      
      // Trigger confetti if all tasks are complete!
      if (newProgress === 100 && progressPercent !== 100) {
        // Fire confetti from multiple angles
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            // Clean up any remaining confetti
            confetti.reset();
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);
      }

      return newPhases;
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // ALWAYS use mock data for now to populate the dashboard
        console.log("Using mock data for dashboard");
        
        // Load saved profile if exists
        const savedProfile = localStorage.getItem("userProfile");
        const profileData = savedProfile ? JSON.parse(savedProfile) : null;
          
          setUserData({
            name: profileData?.name || "Student User",
            admissionNumber: profileData?.admissionNumber || "CS-2026-001",
            branch: profileData?.branch || "Computer Science",
            currentPhase: "Document Verification",
            overallProgress: 35,
            year: profileData?.year || "1st Year",
            batch: "2026",
          });
          
          setPhases([
            {
              id: "documents",
              title: "Document Verification",
              icon: FileCheck,
              status: "current",
              tasks: [
                { name: "Upload 10th Marksheet", done: true },
                { name: "Upload 12th Marksheet", done: true },
                { name: "Upload ID Proof", done: false },
                { name: "Upload Photo", done: false },
              ],
            },
            {
              id: "fees",
              title: "Fee Payment",
              icon: CreditCard,
              status: "upcoming",
              tasks: [
                { name: "Pay Admission Fee", done: false },
                { name: "Pay Hostel Fee", done: false },
                { name: "Upload Fee Receipt", done: false },
              ],
            },
            {
              id: "hostel",
              title: "Hostel Allotment",
              icon: Building,
              status: "upcoming",
              tasks: [
                { name: "Fill Hostel Preference", done: false },
                { name: "Submit Medical Certificate", done: false },
                { name: "Confirm Allotment", done: false },
              ],
            },
            {
              id: "academic",
              title: "Academic Setup",
              icon: BookOpen,
              status: "upcoming",
              tasks: [
                { name: "Register for Courses", done: false },
                { name: "Download Timetable", done: false },
                { name: "Join WhatsApp Groups", done: false },
              ],
            },
          ]);
          
          setNotifications([
            {
              id: "1",
              title: "Welcome to P.A.L.!",
              message: "Complete your document verification to proceed.",
              priority: "high",
              type: "urgent",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              title: "Document Uploaded",
              message: "Your 10th marksheet has been verified successfully.",
              priority: "medium",
              type: "info",
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              title: "Reminder",
              message: "Fee payment deadline is approaching - 5 days left.",
              priority: "high",
              type: "urgent",
              createdAt: new Date().toISOString(),
            },
          ]);
          
          setProgressPercent(35);
          setLoading(false);
          return;
        
        /* Commented out real API calls for now
        // Use real data
        const profile = profileRes.data.user;
        const currentPhase = dashboardRes.data;
        const notifs = notificationsRes?.data?.notifications || [];

        setUserData(profile);
        
        const tasksRes = await api.tasks.getAll();
        const allTasks = tasksRes.data.tasks;
        
        const phaseMap = new Map();
        allTasks.forEach((task: any) => {
          if (!phaseMap.has(task.phase)) {
            phaseMap.set(task.phase, {
              id: task.phase,
              title: task.phase,
              icon: phaseIcons[task.phase] || FileCheck,
              status: task.phase === currentPhase.phase ? "current" : "upcoming",
              tasks: [],
            });
          }
          phaseMap.get(task.phase).tasks.push({
            name: task.title,
            done: task.status === "completed",
          });
        });

        const phasesArray = Array.from(phaseMap.values());
        
        let foundCurrent = false;
        phasesArray.forEach((phase) => {
          const allDone = phase.tasks.every((t: any) => t.done);
          if (allDone && !foundCurrent) {
            phase.status = "completed";
          } else if (phase.id === currentPhase.phase) {
            phase.status = "current";
            foundCurrent = true;
          } else if (foundCurrent) {
            phase.status = "upcoming";
          }
        });

        setPhases(phasesArray);

        // Calculate progress
        const totalTasks = allTasks.length;
        const doneTasks = allTasks.filter((t: any) => t.status === "completed").length;
        setProgressPercent(Math.round((doneTasks / totalTasks) * 100));

        // Format notifications
        const formattedNotifs = notifs.map((notif: any) => ({
          type: notif.priority === "high" ? "urgent" : notif.type === "social" ? "social" : "info",
          message: notif.message,
          time: formatTime(notif.createdAt),
        }));
        setNotifications(formattedNotifs);
        */

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="student">
        <div className="gradient-mesh min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  const totalTasks = phases.flatMap((p) => p.tasks).length;
  const doneTasks = phases.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const currentPhase = phases.find((p) => p.status === "current");
  const urgentNotifs = notifications.filter((n) => n.type === "urgent").length;

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <OnboardingTour steps={dashboardTour} tourKey="dashboard" />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {userData?.name || "Student"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {userData?.branch || "Branch"}, {userData?.year || "Year"} — Batch {userData?.batch || "2026"}
          </p>
        </div>

        {/* Overview cards */}
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/50 bg-card p-6 neu-flat">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/15">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">{progressPercent}%</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </div>
            <Progress value={progressPercent} className="mt-4 h-2" />
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 neu-flat">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/15">
                <Calendar className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentPhase?.title || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Current Stage</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {currentPhase ? `${currentPhase.tasks.filter((t: any) => t.done).length} of ${currentPhase.tasks.length} tasks done` : "No active phase"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 neu-flat">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15">
                <Bell className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentNotifs}</p>
                <p className="text-sm text-muted-foreground">Urgent Action{urgentNotifs !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-destructive font-medium">
              {urgentNotifs > 0 ? notifications.find((n) => n.type === "urgent")?.message : "No urgent actions"}
            </p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Tasks and Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lifecycle Progress */}
            <div>
              <h2 className="mb-6 text-xl font-semibold tracking-tight">
                Onboarding Journey
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {phases.map((phase) => {
                  const phaseComplete = phase.tasks.every((t) => t.done);
                  const phaseDone = phase.tasks.filter((t) => t.done).length;
                  return (
                    <div
                      key={phase.id}
                      className={`rounded-2xl border p-6 transition-all ${
                        phase.status === "current"
                          ? "border-chart-1/40 bg-chart-1/5 shadow-md"
                          : "border-border/50 bg-card neu-flat"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              phaseComplete
                                ? "bg-chart-4/15"
                                : phase.status === "current"
                                ? "bg-chart-1/15"
                                : "bg-secondary"
                            }`}
                          >
                            <phase.icon
                              className={`h-5 w-5 ${
                                phaseComplete
                                  ? "text-chart-4"
                                  : phase.status === "current"
                                  ? "text-chart-1"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{phase.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {phaseDone}/{phase.tasks.length} tasks
                            </p>
                          </div>
                        </div>
                        {phaseComplete && (
                          <CheckCircle2 className="h-5 w-5 text-chart-4" />
                        )}
                        {phase.status === "current" && !phaseComplete && (
                          <Clock className="h-5 w-5 text-chart-1" />
                        )}
                      </div>
                      <div className="space-y-2">
                        {phase.tasks.map((task) => (
                          <button
                            key={task.name}
                            onClick={() => toggleTask(phase.id, task.name)}
                            className="flex w-full items-center gap-2.5 text-sm text-left hover:bg-secondary/50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                          >
                            {task.done ? (
                              <CheckCircle2 className="h-4 w-4 text-chart-4 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            )}
                            <span
                              className={
                                task.done
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }
                            >
                              {task.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Notices and Updates */}
          <div className="space-y-6">
            {/* Important Notices */}
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight flex items-center gap-2">
                📢 Important Notices
              </h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 neu-flat">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm text-destructive">Fee Payment Deadline</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last date: March 15, 2026
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-card p-4 neu-flat hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Campus Handbook</h3>
                      <p className="mt-1 text-xs text-muted-foreground">52 pages • 1 week ago</p>
                      <button className="mt-2 text-xs font-medium text-chart-1 hover:underline">
                        View PDF →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-card p-4 neu-flat hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-chart-2 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Fee Structure</h3>
                      <p className="mt-1 text-xs text-muted-foreground">8 pages • 2 weeks ago</p>
                      <button className="mt-2 text-xs font-medium text-chart-2 hover:underline">
                        View PDF →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-card p-4 neu-flat hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-chart-3 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">CS Syllabus</h3>
                      <p className="mt-1 text-xs text-muted-foreground">24 pages • 3 weeks ago</p>
                      <button className="mt-2 text-xs font-medium text-chart-3 hover:underline">
                        View PDF →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-card p-4 neu-flat hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">Hostel Guidelines</h3>
                      <p className="mt-1 text-xs text-muted-foreground">16 pages • 1 month ago</p>
                      <button className="mt-2 text-xs font-medium text-chart-4 hover:underline">
                        View PDF →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Updates */}
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                Recent Updates
              </h2>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notif, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 neu-flat ${
                      notif.type === "urgent" ? "border-destructive/30" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notif.type === "urgent"
                          ? "bg-destructive"
                          : notif.type === "social"
                          ? "bg-chart-1"
                          : "bg-chart-4"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{notif.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
