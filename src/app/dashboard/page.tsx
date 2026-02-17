"use client";

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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const phases = [
  {
    id: 1,
    title: "Document Verification",
    icon: FileCheck,
    status: "completed" as const,
    tasks: [
      { name: "12th Marksheet", done: true },
      { name: "ID Card / Aadhar", done: true },
      { name: "Passport Photo", done: true },
      { name: "Transfer Certificate", done: true },
    ],
  },
  {
    id: 2,
    title: "Fee Payment",
    icon: CreditCard,
    status: "current" as const,
    tasks: [
      { name: "Tuition Fee", done: true },
      { name: "Hostel Fee", done: false },
      { name: "Lab Fee", done: false },
    ],
  },
  {
    id: 3,
    title: "Hostel Allotment",
    icon: Building,
    status: "upcoming" as const,
    tasks: [
      { name: "Room Preference", done: false },
      { name: "Roommate Matching", done: false },
      { name: "Move-in Confirmation", done: false },
    ],
  },
  {
    id: 4,
    title: "Academic Setup",
    icon: BookOpen,
    status: "upcoming" as const,
    tasks: [
      { name: "Course Registration", done: false },
      { name: "Timetable Generation", done: false },
      { name: "Lab Allotment", done: false },
      { name: "Library Card", done: false },
    ],
  },
];

const notifications = [
  {
    type: "urgent",
    message: "Hostel fee deadline is tomorrow — Oct 12th",
    time: "2h ago",
  },
  {
    type: "info",
    message: "Your marksheet verification is approved",
    time: "1d ago",
  },
  {
    type: "social",
    message: "2 students with similar interests found in your hostel block",
    time: "2d ago",
  },
];

export default function DashboardPage() {
  const totalTasks = phases.flatMap((p) => p.tasks).length;
  const doneTasks = phases.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const progressPercent = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, Rahul
          </h1>
          <p className="mt-2 text-muted-foreground">
            Computer Science, 1st Year — Batch 2026
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
                <p className="text-2xl font-bold">Phase 2</p>
                <p className="text-sm text-muted-foreground">Current Stage</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Fee Payment — 1 of 3 tasks done
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 neu-flat">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15">
                <Bell className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Urgent Action</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-destructive font-medium">
              Hostel fee due tomorrow
            </p>
          </div>
        </div>

        {/* Lifecycle Progress */}
        <div className="mb-10">
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
                          Phase {phase.id} — {phaseDone}/{phase.tasks.length}{" "}
                          tasks
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
                      <div
                        key={task.name}
                        className="flex items-center gap-2.5 text-sm"
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Recent Updates
          </h2>
          <div className="space-y-3">
            {notifications.map((notif, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-5 neu-flat ${
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
                <div className="flex-1">
                  <p className="text-sm font-medium">{notif.message}</p>
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
  );
}
