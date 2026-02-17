"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileCheck,
  TrendingUp,
  AlertOctagon,
  Send,
  BarChart3,
  Upload,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Verification queue items
type VerificationItem = {
  id: string;
  studentName: string;
  studentId: string;
  docType: string;
  status: "green" | "yellow" | "red";
  confidence: number;
  issue?: string;
  uploadedAt: string;
};

const verificationQueue: VerificationItem[] = [
  {
    id: "v1",
    studentName: "Rahul Sharma",
    studentId: "CS-2026-001",
    docType: "Marksheet",
    status: "green",
    confidence: 97,
    uploadedAt: "2 hours ago",
  },
  {
    id: "v2",
    studentName: "Rahul Sharma",
    studentId: "CS-2026-001",
    docType: "ID Card",
    status: "yellow",
    confidence: 72,
    issue: "Name mismatch: 'Rahul Kumar Sharma' vs 'Rahul Sharma'",
    uploadedAt: "2 hours ago",
  },
  {
    id: "v3",
    studentName: "Priya Patel",
    studentId: "CS-2026-015",
    docType: "Marksheet",
    status: "green",
    confidence: 95,
    uploadedAt: "3 hours ago",
  },
  {
    id: "v4",
    studentName: "Arjun Singh",
    studentId: "CS-2026-042",
    docType: "Transfer Certificate",
    status: "red",
    confidence: 23,
    issue: "Document appears blurry/unreadable",
    uploadedAt: "5 hours ago",
  },
  {
    id: "v5",
    studentName: "Neha Gupta",
    studentId: "ECE-2026-008",
    docType: "Marksheet",
    status: "yellow",
    confidence: 68,
    issue: "Score mismatch: Extracted 78% vs admission record 82%",
    uploadedAt: "6 hours ago",
  },
  {
    id: "v6",
    studentName: "Vikram Reddy",
    studentId: "CS-2026-023",
    docType: "Photo",
    status: "green",
    confidence: 91,
    uploadedAt: "8 hours ago",
  },
];

const funnelData = [
  { stage: "Registered", count: 1200, percent: 100 },
  { stage: "Docs Uploaded", count: 980, percent: 82 },
  { stage: "Docs Verified", count: 820, percent: 68 },
  { stage: "Fees Paid", count: 670, percent: 56 },
  { stage: "Hostel Allotted", count: 450, percent: 38 },
  { stage: "Fully Onboarded", count: 320, percent: 27 },
];

const sentimentAlerts = [
  {
    id: "s1",
    studentName: "Anonymous Student",
    studentId: "CS-2026-???",
    severity: "high",
    lastMessage: "I'm really struggling to understand anything...",
    detectedAt: "1 hour ago",
  },
  {
    id: "s2",
    studentName: "Anonymous Student",
    studentId: "ECE-2026-???",
    severity: "medium",
    lastMessage: "The fee process is so confusing and stressful",
    detectedAt: "3 hours ago",
  },
];

const statusStyles = {
  green: {
    bg: "bg-status-green",
    text: "status-green",
    label: "Auto-Approved",
    icon: CheckCircle2,
  },
  yellow: {
    bg: "bg-status-yellow",
    text: "status-yellow",
    label: "Needs Review",
    icon: AlertTriangle,
  },
  red: {
    bg: "bg-status-red",
    text: "status-red",
    label: "Rejected",
    icon: XCircle,
  },
};

type Tab = "queue" | "funnel" | "sentiment" | "knowledge";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [queue, setQueue] = useState(verificationQueue);
  const [filter, setFilter] = useState<"all" | "green" | "yellow" | "red">("all");

  const filteredQueue =
    filter === "all" ? queue : queue.filter((item) => item.status === filter);

  const approveItem = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "green" as const, confidence: 100 } : item
      )
    );
  };

  const rejectItem = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "red" as const } : item
      )
    );
  };

  const tabs: { id: Tab; label: string; icon: typeof FileCheck }[] = [
    { id: "queue", label: "Verification Queue", icon: FileCheck },
    { id: "funnel", label: "Onboarding Funnel", icon: BarChart3 },
    { id: "sentiment", label: "Sentiment Alerts", icon: AlertOctagon },
    { id: "knowledge", label: "Knowledge Base", icon: Upload },
  ];

  const greenCount = queue.filter((i) => i.status === "green").length;
  const yellowCount = queue.filter((i) => i.status === "yellow").length;
  const redCount = queue.filter((i) => i.status === "red").length;

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Admin Control Tower
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage verifications, track onboarding progress, and monitor student
            well-being.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
            <p className="text-3xl font-bold">1,200</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[oklch(0.65_0.20_150)]" />
              <p className="text-3xl font-bold">{greenCount}</p>
            </div>
            <p className="text-sm text-muted-foreground">Auto-Approved</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[oklch(0.80_0.18_85)]" />
              <p className="text-3xl font-bold">{yellowCount}</p>
            </div>
            <p className="text-sm text-muted-foreground">Needs Review</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[oklch(0.60_0.25_25)]" />
              <p className="text-3xl font-bold">{redCount}</p>
            </div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "queue" && (
          <div>
            {/* Filter */}
            <div className="mb-6 flex gap-2">
              {(["all", "green", "yellow", "red"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    filter === f
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all"
                    ? `All (${queue.length})`
                    : f === "green"
                    ? `Approved (${greenCount})`
                    : f === "yellow"
                    ? `Review (${yellowCount})`
                    : `Rejected (${redCount})`}
                </button>
              ))}
            </div>

            {/* Queue list */}
            <div className="space-y-3">
              {filteredQueue.map((item) => {
                const style = statusStyles[item.status];
                const StatusIcon = style.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 neu-flat"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg}`}
                    >
                      <StatusIcon className={`h-5 w-5 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.studentName}</h3>
                        <span className="text-xs text-muted-foreground">
                          {item.studentId}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.docType} — Confidence: {item.confidence}% —{" "}
                        {item.uploadedAt}
                      </p>
                      {item.issue && (
                        <p className={`mt-1 text-sm font-medium ${style.text}`}>
                          {item.issue}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                      {item.status === "yellow" && (
                        <>
                          <button
                            onClick={() => approveItem(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-status-green status-green hover:opacity-80"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rejectItem(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-status-red status-red hover:opacity-80"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "funnel" && (
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Onboarding Funnel</h2>
              <p className="text-sm text-muted-foreground">
                1,200 total students
              </p>
            </div>
            <div className="space-y-5">
              {funnelData.map((stage, i) => (
                <div key={stage.stage}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.count} ({stage.percent}%)
                    </span>
                  </div>
                  <Progress value={stage.percent} className="h-3" />
                  {i < funnelData.length - 1 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                      <TrendingUp className="h-3 w-3 rotate-180" />
                      {funnelData[i].count - funnelData[i + 1].count} drop-offs
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:scale-[1.02]">
                <Send className="h-4 w-4" />
                Bulk Nudge: 150 stuck at Fee Payment
              </button>
            </div>
          </div>
        )}

        {activeTab === "sentiment" && (
          <div>
            <div className="mb-6 rounded-2xl border border-border/50 bg-card p-5 neu-flat">
              <div className="flex items-center gap-3">
                <AlertOctagon className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">
                    Sentiment Red Flag Monitor
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AI passively analyzes student chat sentiment and flags
                    distress signals to assigned mentors.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {sentimentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-5 neu-flat ${
                    alert.severity === "high"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-status-yellow bg-status-yellow"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{alert.studentName}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            alert.severity === "high"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-status-yellow status-yellow"
                          }`}
                        >
                          {alert.severity === "high" ? "High Priority" : "Medium"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm italic text-muted-foreground">
                        &ldquo;{alert.lastMessage}&rdquo;
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Detected {alert.detectedAt}
                      </p>
                    </div>
                    <button className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                      <Send className="h-3.5 w-3.5" />
                      Alert Mentor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <h2 className="mb-2 text-lg font-semibold">
              Drag-and-Drop Knowledge Base
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Upload new circulars and documents. The RAG vector database updates
              instantly.
            </p>
            <div className="rounded-2xl border-2 border-dashed border-border/50 p-12 text-center neu-pressed">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 font-medium">
                Drop PDFs here to update the knowledge base
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Rulebooks, circulars, syllabi, guidelines
              </p>
              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:scale-[1.02]">
                <Upload className="h-4 w-4" />
                Choose Files
                <input type="file" multiple accept=".pdf" className="hidden" />
              </label>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { name: "campus_handbook_2026.pdf", pages: 52, updated: "1 week ago" },
                { name: "fee_structure_2026.pdf", pages: 8, updated: "2 weeks ago" },
                { name: "cs_syllabus_2026.pdf", pages: 24, updated: "3 weeks ago" },
                { name: "hostel_guidelines_2026.pdf", pages: 16, updated: "1 month ago" },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4"
                >
                  <FileCheck className="h-5 w-5 text-chart-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pages} pages — Updated {doc.updated}
                    </p>
                  </div>
                  <span className="text-xs text-chart-4 font-medium">Indexed</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
