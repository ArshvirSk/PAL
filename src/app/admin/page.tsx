"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  HelpCircle,
  MessageCircle,
  Bot,
  BookOpen,
  User,
  LayoutDashboard,
  Bell,
  Users,
  Clock,
  Settings,
  Search,
  Download,
  Filter,
  Keyboard,
  Copy,
  RefreshCw,
  CreditCard,
  Building,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AuthGuard } from "@/components/auth-guard";
import api from "@/lib/api";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/loading-skeleton";

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

type Tab = "dashboard" | "queue" | "funnel" | "sentiment" | "knowledge" | "guide" | "chat";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [queue, setQueue] = useState<VerificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "green" | "yellow" | "red">("all");
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [sentimentAlerts, setSentimentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, green: 0, yellow: 0, red: 0 });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Document viewer state
  const [viewingDoc, setViewingDoc] = useState<VerificationItem | null>(null);
  const [showDocViewer, setShowDocViewer] = useState(false);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Bulk actions state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  
  // Activity timeline
  const [activities] = useState([
    { id: 1, type: "approval", user: "Admin", action: "approved document for Priya Patel", time: "2 min ago", icon: CheckCircle2, color: "status-green" },
    { id: 2, type: "alert", user: "System", action: "detected high-priority wellness alert", time: "15 min ago", icon: AlertOctagon, color: "text-destructive" },
    { id: 3, type: "upload", user: "Rahul Sharma", action: "uploaded 10th Marksheet", time: "30 min ago", icon: Upload, color: "text-chart-1" },
    { id: 4, type: "rejection", user: "Admin", action: "rejected document for Sneha Reddy", time: "1h ago", icon: XCircle, color: "text-destructive" },
    { id: 5, type: "approval", user: "Admin", action: "approved document for Vikram Singh", time: "2h ago", icon: CheckCircle2, color: "status-green" },
  ]);
  
  // Keyboard shortcuts help
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Student profile modal
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  
  console.log("🎉 ADMIN PAGE LOADED - VERSION 2.0 WITH NOTIFICATIONS AND CHARTS");
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // / - Focus search
      if (e.key === "/" && activeTab === "queue") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      }
      
      // n - Toggle notifications
      if (e.key === "n") {
        e.preventDefault();
        setShowNotifications(!showNotifications);
      }
      
      // c - Open chat
      if (e.key === "c") {
        e.preventDefault();
        setActiveTab("chat");
      }
      
      // d - Dashboard
      if (e.key === "d") {
        e.preventDefault();
        setActiveTab("dashboard");
      }
      
      // q - Queue
      if (e.key === "q") {
        e.preventDefault();
        setActiveTab("queue");
      }
      
      // f - Funnel
      if (e.key === "f") {
        e.preventDefault();
        setActiveTab("funnel");
      }
      
      // Esc - Close modals
      if (e.key === "Escape") {
        setShowDocViewer(false);
        setShowNotifications(false);
        setShowShortcuts(false);
        setShowStudentProfile(false);
      }
      
      // ? - Toggle shortcuts help
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeTab, showNotifications, showShortcuts]);
  
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const exportFunnelData = () => {
    const csvContent = [
      ["Stage", "Count", "Percentage", "Drop-off"],
      ...funnelData.map((stage, i) => {
        const dropOff = i < funnelData.length - 1 ? funnelData[i].count - funnelData[i + 1].count : 0;
        return [stage.stage, stage.count, `${stage.percent}%`, dropOff];
      })
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funnel-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ Funnel data exported successfully!", "success");
  };
  
  const exportQueueData = () => {
    const csvContent = [
      ["Student Name", "Student ID", "Document Type", "Status", "Confidence", "Issue", "Uploaded At"],
      ...queue.map(item => [
        item.studentName,
        item.studentId,
        item.docType,
        item.status,
        `${item.confidence}%`,
        item.issue || "None",
        item.uploadedAt
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-queue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ Queue data exported successfully!", "success");
  };
  
  const toggleDocSelection = (id: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const selectAllDocs = () => {
    const yellowDocs = searchedQueue.filter(item => item.status === "yellow");
    setSelectedDocs(new Set(yellowDocs.map(item => item.id)));
  };
  
  const clearSelection = () => {
    setSelectedDocs(new Set());
  };
  
  const bulkApprove = () => {
    selectedDocs.forEach(id => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "green" as const, confidence: 100 } : item
        )
      );
    });
    
    setStats((prev) => ({
      ...prev,
      green: prev.green + selectedDocs.size,
      yellow: prev.yellow - selectedDocs.size,
    }));
    
    showToast(`✓ ${selectedDocs.size} documents approved!`, "success");
    clearSelection();
    setBulkActionMode(false);
  };
  
  const bulkReject = () => {
    selectedDocs.forEach(id => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "red" as const } : item
        )
      );
    });
    
    setStats((prev) => ({
      ...prev,
      red: prev.red + selectedDocs.size,
      yellow: prev.yellow - selectedDocs.size,
    }));
    
    showToast(`✗ ${selectedDocs.size} documents rejected`, "error");
    clearSelection();
    setBulkActionMode(false);
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ ${label} copied to clipboard!`, "success");
  };
  
  const refreshData = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
      showToast("✓ Data refreshed!", "success");
    }, 1000);
  };

  const loadSentimentAlerts = () => {
    // Load sentiment alerts from localStorage (student wellness feedback)
    const wellnessFeedback = JSON.parse(localStorage.getItem("wellnessFeedback") || "[]");
    
    // Format wellness feedback for sentiment alerts
    const formattedAlerts = wellnessFeedback
      .filter((feedback: any) => feedback.severity === "high" || feedback.severity === "medium")
      .map((feedback: any) => {
        const timeAgo = formatTime(feedback.timestamp);
        return {
          id: feedback.id,
          studentName: "Anonymous Student",
          studentId: "***-****-***",
          severity: feedback.severity,
          lastMessage: feedback.message || `Student reported feeling ${feedback.mood}`,
          detectedAt: timeAgo,
        };
      });
    
    // If no real feedback, show sample alerts
    if (formattedAlerts.length === 0) {
      setSentimentAlerts([
        {
          id: "sample-1",
          studentName: "Anonymous Student #1",
          studentId: "***-****-***",
          severity: "high",
          lastMessage: "I'm really struggling with the workload and feeling overwhelmed...",
          detectedAt: "30 min ago",
        },
        {
          id: "sample-2",
          studentName: "Anonymous Student #2",
          studentId: "***-****-***",
          severity: "medium",
          lastMessage: "Having trouble adjusting to hostel life, feeling homesick",
          detectedAt: "2h ago",
        },
      ]);
    } else {
      setSentimentAlerts(formattedAlerts);
    }
  };

  useEffect(() => {
    // Load mock data for admin dashboard
    setLoading(false);
    console.log("Admin page loaded with mock data");
    
    // Mock stats
    setStats({ total: 24, green: 15, yellow: 6, red: 3 });
    
    // Mock queue data
    setQueue([
      {
        id: "1",
        studentName: "Rahul Sharma",
        studentId: "CS-2026-001",
        docType: "10th Marksheet",
        status: "yellow",
        confidence: 75,
        issue: "Date mismatch detected - needs verification",
        uploadedAt: "2h ago",
      },
      {
        id: "2",
        studentName: "Priya Patel",
        studentId: "CS-2026-002",
        docType: "ID Proof",
        status: "green",
        confidence: 98,
        uploadedAt: "3h ago",
      },
      {
        id: "3",
        studentName: "Arjun Kumar",
        studentId: "EC-2026-015",
        docType: "12th Marksheet",
        status: "yellow",
        confidence: 68,
        issue: "Low image quality - manual review required",
        uploadedAt: "5h ago",
      },
      {
        id: "4",
        studentName: "Sneha Reddy",
        studentId: "CS-2026-003",
        docType: "Photo",
        status: "red",
        confidence: 45,
        issue: "Face not clearly visible",
        uploadedAt: "1d ago",
      },
      {
        id: "5",
        studentName: "Vikram Singh",
        studentId: "ME-2026-008",
        docType: "10th Marksheet",
        status: "green",
        confidence: 95,
        uploadedAt: "1d ago",
      },
    ]);
    
    // Mock funnel data
    setFunnelData([
      { stage: "Registered", count: 450, percent: 100 },
      { stage: "Docs Uploaded", count: 380, percent: 84 },
      { stage: "Docs Verified", count: 320, percent: 71 },
      { stage: "Fees Paid", count: 285, percent: 63 },
      { stage: "Hostel Allotted", count: 240, percent: 53 },
      { stage: "Fully Onboarded", count: 195, percent: 43 },
    ]);
    
    // Mock notifications
    setNotifications([
      {
        id: "n1",
        type: "document",
        message: "New document uploaded by Rahul Sharma",
        time: "2 min ago",
        unread: true,
      },
      {
        id: "n2",
        type: "alert",
        message: "High priority wellness alert received",
        time: "15 min ago",
        unread: true,
      },
      {
        id: "n3",
        type: "verification",
        message: "6 documents pending review",
        time: "1h ago",
        unread: true,
      },
      {
        id: "n4",
        type: "system",
        message: "Daily backup completed successfully",
        time: "3h ago",
        unread: false,
      },
      {
        id: "n5",
        type: "document",
        message: "Priya Patel's documents auto-approved",
        time: "5h ago",
        unread: false,
      },
    ]);
    setUnreadCount(3);
    
    // Load sentiment alerts from localStorage (student wellness feedback)
    const wellnessFeedback = JSON.parse(localStorage.getItem("wellnessFeedback") || "[]");
    
    // Format wellness feedback for sentiment alerts
    const formattedAlerts = wellnessFeedback
      .filter((feedback: any) => feedback.severity === "high" || feedback.severity === "medium")
      .map((feedback: any) => {
        const timeAgo = formatTime(feedback.timestamp);
        return {
          id: feedback.id,
          studentName: "Anonymous Student",
          studentId: "***-****-***",
          severity: feedback.severity,
          lastMessage: feedback.message || `Student reported feeling ${feedback.mood}`,
          detectedAt: timeAgo,
        };
      });
    
    // If no real feedback, show sample alerts
    if (formattedAlerts.length === 0) {
      setSentimentAlerts([
        {
          id: "sample-1",
          studentName: "Anonymous Student #1",
          studentId: "***-****-***",
          severity: "high",
          lastMessage: "I'm really struggling with the workload and feeling overwhelmed...",
          detectedAt: "30 min ago",
        },
        {
          id: "sample-2",
          studentName: "Anonymous Student #2",
          studentId: "***-****-***",
          severity: "medium",
          lastMessage: "Having trouble adjusting to hostel life, feeling homesick",
          detectedAt: "2h ago",
        },
      ]);
    } else {
      setSentimentAlerts(formattedAlerts);
    }
    
    // Initialize chat with welcome message
    setChatMessages([
      {
        role: "assistant",
        content: "Hello Admin! I'm your AI assistant. I can help you with:\n\n• Student queries and information\n• Document verification insights\n• Onboarding analytics\n• Policy questions\n\nHow can I assist you today?",
      },
    ]);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.admin.getQueue();
      const documents = response.data.documents;
      
      const formattedQueue: VerificationItem[] = documents.map((doc: any) => ({
        id: doc.id,
        studentName: doc.user.name,
        studentId: doc.user.admissionNumber,
        docType: doc.documentType,
        status: doc.verificationStatus as "green" | "yellow" | "red",
        confidence: doc.confidence || 0,
        issue: doc.rejectionReason || doc.validationIssues?.join(", "),
        uploadedAt: formatTime(doc.createdAt),
      }));

      setQueue(formattedQueue);
      
      // Calculate stats
      const greenCount = formattedQueue.filter((i) => i.status === "green").length;
      const yellowCount = formattedQueue.filter((i) => i.status === "yellow").length;
      const redCount = formattedQueue.filter((i) => i.status === "red").length;
      
      setStats({
        total: formattedQueue.length,
        green: greenCount,
        yellow: yellowCount,
        red: redCount,
      });
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    }
  };

  const fetchFunnelData = async () => {
    try {
      const response = await api.admin.getFunnelAnalytics();
      const funnel = response.data.funnel;
      
      const formattedFunnel = [
        { stage: "Registered", count: funnel.registered, percent: 100 },
        { stage: "Docs Uploaded", count: funnel.docsUploaded, percent: Math.round((funnel.docsUploaded / funnel.registered) * 100) },
        { stage: "Docs Verified", count: funnel.docsVerified, percent: Math.round((funnel.docsVerified / funnel.registered) * 100) },
        { stage: "Fees Paid", count: funnel.feesPaid, percent: Math.round((funnel.feesPaid / funnel.registered) * 100) },
        { stage: "Hostel Allotted", count: funnel.hostelAllotted, percent: Math.round((funnel.hostelAllotted / funnel.registered) * 100) },
        { stage: "Fully Onboarded", count: funnel.fullyOnboarded, percent: Math.round((funnel.fullyOnboarded / funnel.registered) * 100) },
      ];
      
      setFunnelData(formattedFunnel);
    } catch (error) {
      console.error("Failed to fetch funnel data:", error);
    }
  };

  const fetchSentimentAlerts = async () => {
    try {
      const response = await api.admin.getSentimentAlerts();
      const alerts = response.data.alerts;
      
      const formattedAlerts = alerts.map((alert: any) => ({
        id: alert.id,
        studentName: "Anonymous Student", // Privacy preserved
        studentId: alert.userId.slice(0, 10) + "???",
        severity: alert.severity,
        lastMessage: alert.lastMessage || "Distress indicators detected",
        detectedAt: formatTime(alert.createdAt),
      }));
      
      setSentimentAlerts(formattedAlerts);
    } catch (error) {
      console.error("Failed to fetch sentiment alerts:", error);
    }
  };

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

  const filteredQueue =
    filter === "all" ? queue : queue.filter((item) => item.status === filter);
  
  // Apply search filter
  const searchedQueue = filteredQueue.filter((item) => 
    searchQuery === "" || 
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.docType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const approveItem = async (id: string) => {
    try {
      // In mock mode, just update local state
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "green" as const, confidence: 100 } : item
        )
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        green: prev.green + 1,
        yellow: prev.yellow - 1,
      }));
      
      // Close viewer if open
      setShowDocViewer(false);
      setViewingDoc(null);
      
      showToast("✓ Document approved successfully!", "success");
      
      /* Real API call - commented for mock mode
      await api.admin.approveDocument(id);
      */
    } catch (error) {
      console.error("Failed to approve document:", error);
    }
  };

  const rejectItem = async (id: string) => {
    try {
      // In mock mode, just update local state
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "red" as const } : item
        )
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        red: prev.red + 1,
        yellow: prev.yellow - 1,
      }));
      
      // Close viewer if open
      setShowDocViewer(false);
      setViewingDoc(null);
      
      showToast("✗ Document rejected", "error");
      
      /* Real API call - commented for mock mode
      await api.admin.rejectDocument(id, "Rejected by admin");
      */
    } catch (error) {
      console.error("Failed to reject document:", error);
    }
  };

  const viewDocument = (item: VerificationItem) => {
    setViewingDoc(item);
    setShowDocViewer(true);
  };
  
  const viewStudentProfile = (item: VerificationItem) => {
    // Create a detailed student profile from the queue item
    setSelectedStudent({
      name: item.studentName,
      id: item.studentId,
      branch: item.studentId.startsWith("CS") ? "Computer Science" : item.studentId.startsWith("EC") ? "Electronics" : "Mechanical",
      year: "1st Year",
      batch: "2026",
      email: `${item.studentName.toLowerCase().replace(" ", ".")}@college.edu`,
      phone: "+91 98765 43210",
      documents: [
        { type: "10th Marksheet", status: item.docType === "10th Marksheet" ? item.status : "green", uploadedAt: item.uploadedAt },
        { type: "12th Marksheet", status: item.docType === "12th Marksheet" ? item.status : "green", uploadedAt: "2d ago" },
        { type: "ID Proof", status: item.docType === "ID Proof" ? item.status : "yellow", uploadedAt: "1d ago" },
        { type: "Photo", status: item.docType === "Photo" ? item.status : "green", uploadedAt: "3d ago" },
      ],
      progress: {
        documents: 75,
        fees: 100,
        hostel: 50,
        academic: 0,
      },
      overallProgress: 56,
    });
    setShowStudentProfile(true);
  };

  const tabs: { id: Tab; label: string; icon: typeof FileCheck }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "guide", label: "User Guide", icon: HelpCircle },
    { id: "queue", label: "Verification Queue", icon: FileCheck },
    { id: "funnel", label: "Onboarding Funnel", icon: BarChart3 },
    { id: "sentiment", label: "Sentiment Alerts", icon: AlertOctagon },
    { id: "knowledge", label: "Knowledge Base", icon: Upload },
  ];

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      let response = "";
      
      if (userMessage.toLowerCase().includes("student") || userMessage.toLowerCase().includes("how many")) {
        response = "Based on current data:\n\n• Total registered students: 450\n• Documents verified: 320 (71%)\n• Pending verifications: 60\n• Average verification time: 2.5 hours\n\nWould you like more specific information?";
      } else if (userMessage.toLowerCase().includes("document") || userMessage.toLowerCase().includes("verification")) {
        response = "Document Verification Status:\n\n• Auto-approved (Green): 15 documents\n• Needs review (Yellow): 6 documents\n• Rejected (Red): 3 documents\n\nThe AI confidence threshold is set at 85%. Documents below this require manual review.";
      } else if (userMessage.toLowerCase().includes("funnel") || userMessage.toLowerCase().includes("drop")) {
        response = "Onboarding Funnel Analysis:\n\n• Biggest drop-off: Docs Uploaded → Docs Verified (60 students)\n• Second drop-off: Fees Paid → Hostel Allotted (45 students)\n\nRecommendation: Send reminder notifications to students stuck at document verification stage.";
      } else {
        response = "I can help you with:\n\n• Student statistics and analytics\n• Document verification insights\n• Funnel analysis and drop-off points\n• Sentiment monitoring\n• Policy and procedure questions\n\nWhat would you like to know?";
      }
      
      setChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setChatLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="gradient-mesh min-h-screen px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-10 bg-secondary rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-secondary rounded w-96 animate-pulse" />
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen">
      {/* Top Navigation Bar */}
      <div className="sticky top-16 z-40 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-foreground text-background shadow-md"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {/* Keyboard Shortcuts Help */}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-all"
                title="Keyboard Shortcuts (? to toggle)"
              >
                <Keyboard className="h-5 w-5" />
              </button>
              
              {/* Notification Bell */}
              <div className="relative notification-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-all"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border border-border/50 bg-card shadow-lg neu-flat z-50">
                    <div className="border-b border-border/50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        <button
                          onClick={() => {
                            setUnreadCount(0);
                            setNotifications(notifications.map(n => ({ ...n, unread: false })));
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Mark all read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`border-b border-border/50 p-4 hover:bg-secondary/50 transition-colors ${
                            notif.unread ? "bg-secondary/30" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              notif.type === "alert" ? "bg-destructive/15" :
                              notif.type === "document" ? "bg-chart-1/15" :
                              notif.type === "verification" ? "bg-status-yellow" :
                              "bg-secondary"
                            }`}>
                              {notif.type === "alert" && <AlertOctagon className="h-4 w-4 text-destructive" />}
                              {notif.type === "document" && <FileCheck className="h-4 w-4 text-chart-1" />}
                              {notif.type === "verification" && <Eye className="h-4 w-4 status-yellow" />}
                              {notif.type === "system" && <Settings className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                            </div>
                            {notif.unread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-chart-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border/50 p-3 text-center">
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Link
                href="/admin/settings"
                className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-foreground text-background hover:scale-105 transition-all"
                title="Admin Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Admin Dashboard
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Overview of student onboarding and system status
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Stats Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat hover:scale-105 transition-transform">
                  <p className="text-3xl font-bold animate-in fade-in slide-in-from-bottom-3 duration-500">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat hover:scale-105 transition-transform">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[oklch(0.65_0.20_150)]" />
                    <p className="text-3xl font-bold animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">{stats.green}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Auto-Approved</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat hover:scale-105 transition-transform">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[oklch(0.80_0.18_85)]" />
                    <p className="text-3xl font-bold animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">{stats.yellow}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Needs Review</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat hover:scale-105 transition-transform">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[oklch(0.60_0.25_25)]" />
                    <p className="text-3xl font-bold animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">{stats.red}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Quick Actions */}
                  <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                    <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => setActiveTab("queue")}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-yellow">
                          <FileCheck className="h-5 w-5 status-yellow" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Review Documents</p>
                          <p className="text-xs text-muted-foreground">{stats.yellow} pending</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("sentiment")}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/15">
                          <AlertOctagon className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Check Wellness Alerts</p>
                          <p className="text-xs text-muted-foreground">{sentimentAlerts.length} alerts</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("funnel")}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/15">
                          <BarChart3 className="h-5 w-5 text-chart-1" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">View Funnel</p>
                          <p className="text-xs text-muted-foreground">Track progress</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab("knowledge")}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/15">
                          <Upload className="h-5 w-5 text-chart-3" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Upload Documents</p>
                          <p className="text-xs text-muted-foreground">Knowledge base</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity Timeline */}
                  <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                    <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Activity Timeline
                    </h2>
                    <div className="relative space-y-4">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                      
                      {activities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div key={activity.id} className="relative flex items-start gap-3 pl-10">
                            <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-border ${activity.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 rounded-lg bg-secondary/30 p-3">
                              <p className="text-sm">
                                <span className="font-medium">{activity.user}</span> {activity.action}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      className="w-full mt-4 text-xs font-medium text-chart-1 hover:underline text-center py-2"
                    >
                      View Full History →
                    </button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Important Alerts */}
                  <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                    <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-destructive" />
                      Important Alerts
                    </h2>
                    <div className="space-y-3">
                      {sentimentAlerts.slice(0, 2).map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-xl border p-3 ${
                            alert.severity === "high"
                              ? "border-destructive/30 bg-destructive/5"
                              : "border-status-yellow bg-status-yellow"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertOctagon className={`h-4 w-4 ${alert.severity === "high" ? "text-destructive" : "status-yellow"}`} />
                            <span className="text-xs font-medium">
                              {alert.severity === "high" ? "High Priority" : "Medium"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alert.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.detectedAt}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveTab("sentiment")}
                        className="w-full text-xs font-medium text-chart-1 hover:underline text-center py-2"
                      >
                        View All Alerts →
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                    <h2 className="mb-4 text-lg font-semibold">System Status</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Students</span>
                        <span className="text-sm font-semibold">450</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fully Onboarded</span>
                        <span className="text-sm font-semibold text-chart-4">195 (43%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Actions</span>
                        <span className="text-sm font-semibold text-status-yellow">{stats.yellow}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Wellness Alerts</span>
                        <span className="text-sm font-semibold text-destructive">{sentimentAlerts.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                    <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
                    <div className="space-y-2">
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 w-full text-left p-3 rounded-xl bg-chart-1/10 border border-chart-1/20 hover:bg-chart-1/20 transition-colors"
                      >
                        <Settings className="h-5 w-5 text-chart-1" />
                        <div>
                          <p className="text-sm font-semibold text-chart-1">Admin Settings</p>
                          <p className="text-xs text-muted-foreground">Manage your profile</p>
                        </div>
                      </Link>
                      
                      <button
                        onClick={() => setActiveTab("guide")}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                      >
                        📖 User Guide
                      </button>
                      <button
                        onClick={() => setActiveTab("chat")}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                      >
                        💬 AI Assistant
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs - Header */}
          {activeTab !== "dashboard" && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === "queue" && (
          <div>
            {/* Search and Filter Row */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or document type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!bulkActionMode ? (
                  <>
                    <button
                      onClick={() => setBulkActionMode(true)}
                      className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Bulk Actions
                    </button>
                    <button
                      onClick={exportQueueData}
                      className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                      title="Export to CSV"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedDocs.size} selected
                    </span>
                    <button
                      onClick={selectAllDocs}
                      className="text-sm text-chart-1 hover:underline"
                    >
                      Select All Pending
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Clear
                    </button>
                    <button
                      onClick={bulkApprove}
                      disabled={selectedDocs.size === 0}
                      className="flex items-center gap-2 rounded-full bg-status-green px-4 py-2 text-sm font-medium status-green hover:opacity-80 disabled:opacity-50 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve ({selectedDocs.size})
                    </button>
                    <button
                      onClick={bulkReject}
                      disabled={selectedDocs.size === 0}
                      className="flex items-center gap-2 rounded-full bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive hover:opacity-80 disabled:opacity-50 transition-colors"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Reject ({selectedDocs.size})
                    </button>
                    <button
                      onClick={() => {
                        setBulkActionMode(false);
                        clearSelection();
                      }}
                      className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Filter Buttons */}
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
                    ? `Approved (${stats.green})`
                    : f === "yellow"
                    ? `Review (${stats.yellow})`
                    : `Rejected (${stats.red})`}
                </button>
              ))}
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="mb-4 text-sm text-muted-foreground">
                Found {searchedQueue.length} result{searchedQueue.length !== 1 ? 's' : ''}
              </div>
            )}

            {/* Queue list */}
            <div className="space-y-3">
              {searchedQueue.length === 0 ? (
                <div className="rounded-2xl border border-border/50 bg-card p-12 text-center neu-flat">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="font-medium mb-2">No documents found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "Try adjusting your search" : "No documents in this category"}
                  </p>
                </div>
              ) : (
                searchedQueue.map((item) => {
                const style = statusStyles[item.status];
                const StatusIcon = style.icon;
                const isSelected = selectedDocs.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 rounded-2xl border p-5 neu-flat transition-all ${
                      isSelected 
                        ? "border-chart-1 bg-chart-1/5" 
                        : "border-border/50 bg-card"
                    }`}
                  >
                    {/* Checkbox for bulk actions */}
                    {bulkActionMode && item.status === "yellow" && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDocSelection(item.id)}
                        className="h-5 w-5 rounded border-border cursor-pointer"
                      />
                    )}
                    
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg}`}
                    >
                      <StatusIcon className={`h-5 w-5 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewStudentProfile(item)}
                          className="font-medium hover:text-chart-1 hover:underline cursor-pointer"
                        >
                          {item.studentName}
                        </button>
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
                      <button 
                        onClick={() => viewDocument(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {item.status === "yellow" && !bulkActionMode && (
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
              })
              )}
            </div>
          </div>
        )}

        {activeTab === "funnel" && (
          <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/15">
                    <Users className="h-6 w-6 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{funnelData[0]?.count || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-green">
                    <CheckCircle2 className="h-6 w-6 status-green" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{funnelData[funnelData.length - 1]?.count || 0}</p>
                    <p className="text-sm text-muted-foreground">Fully Onboarded</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15">
                    <TrendingUp className="h-6 w-6 text-destructive rotate-180" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {funnelData[0]?.count - funnelData[funnelData.length - 1]?.count || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Drop-offs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Funnel Visualization - Takes 2 columns */}
              <div className="lg:col-span-2 rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Student Journey Funnel</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={exportFunnelData}
                      className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                      title="Export to CSV"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                    <button className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:scale-105">
                      <Send className="h-4 w-4" />
                      Send Reminder
                    </button>
                  </div>
                </div>
                
                {/* Visual Funnel */}
                <div className="space-y-3">
                  {funnelData.map((stage, i) => {
                    const widthPercent = stage.percent;
                    const dropOff = i < funnelData.length - 1 ? funnelData[i].count - funnelData[i + 1].count : 0;
                    const dropOffPercent = i < funnelData.length - 1 ? Math.round((dropOff / funnelData[i].count) * 100) : 0;
                    
                    return (
                      <div key={stage.stage} className="relative">
                        <div 
                          className="group relative mx-auto rounded-xl bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                          style={{ width: `${widthPercent}%`, minWidth: '50%' }}
                        >
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">
                                {i + 1}
                              </span>
                              <span className="font-semibold">{stage.stage}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{stage.count}</p>
                              <p className="text-xs opacity-90">{stage.percent}%</p>
                            </div>
                          </div>
                        </div>
                        {dropOff > 0 && (
                          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                            <div className="flex items-center gap-1 text-destructive font-medium">
                              <TrendingUp className="h-4 w-4 rotate-180" />
                              <span>{dropOff} students</span>
                            </div>
                            <span className="text-muted-foreground">({dropOffPercent}% drop-off)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Insights */}
                <div className="mt-6 rounded-xl bg-secondary/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-status-yellow mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Biggest Drop-off Point</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(() => {
                          let maxDrop = 0;
                          let maxStage = "";
                          funnelData.forEach((stage, i) => {
                            if (i < funnelData.length - 1) {
                              const drop = stage.count - funnelData[i + 1].count;
                              if (drop > maxDrop) {
                                maxDrop = drop;
                                maxStage = stage.stage;
                              }
                            }
                          });
                          return `${maxDrop} students dropped between "${maxStage}" and the next stage. Consider sending targeted reminders.`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Stats */}
              <div className="space-y-6">
                {/* Document Status */}
                <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                  <h3 className="mb-4 text-sm font-semibold">Document Status</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative h-32 w-32">
                      <svg viewBox="0 0 200 200" className="transform -rotate-90">
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="transparent"
                          stroke="oklch(0.65 0.20 150)"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.green / stats.total) * 502.4} 502.4`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="transparent"
                          stroke="oklch(0.80 0.18 85)"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.yellow / stats.total) * 502.4} 502.4`}
                          strokeDashoffset={`-${(stats.green / stats.total) * 502.4}`}
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="transparent"
                          stroke="oklch(0.60 0.25 25)"
                          strokeWidth="40"
                          strokeDasharray={`${(stats.red / stats.total) * 502.4} 502.4`}
                          strokeDashoffset={`-${((stats.green + stats.yellow) / stats.total) * 502.4}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl font-bold">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">Docs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[oklch(0.65_0.20_150)]" />
                        <span>Approved</span>
                      </div>
                      <span className="font-medium">{stats.green}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[oklch(0.80_0.18_85)]" />
                        <span>Review</span>
                      </div>
                      <span className="font-medium">{stats.yellow}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[oklch(0.60_0.25_25)]" />
                        <span>Rejected</span>
                      </div>
                      <span className="font-medium">{stats.red}</span>
                    </div>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                  <h3 className="mb-4 text-sm font-semibold">Completion Rate</h3>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-chart-1">
                      {funnelData.length > 0 ? funnelData[funnelData.length - 1].percent : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Students completed onboarding</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Started</span>
                      <span className="font-medium">{funnelData[0]?.count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">{funnelData[funnelData.length - 1]?.count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">In Progress</span>
                      <span className="font-medium">
                        {(funnelData[0]?.count || 0) - (funnelData[funnelData.length - 1]?.count || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
                  <h3 className="mb-4 text-sm font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveTab("queue")}
                      className="w-full flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm hover:bg-secondary/80 transition-colors"
                    >
                      <FileCheck className="h-4 w-4" />
                      <span>Review Queue</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab("sentiment")}
                      className="w-full flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm hover:bg-secondary/80 transition-colors"
                    >
                      <AlertOctagon className="h-4 w-4" />
                      <span>Check Alerts</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sentiment" && (
          <div>
            <div className="mb-6 rounded-2xl border border-border/50 bg-card p-5 neu-flat">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertOctagon className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">
                      Student Well-being Monitor
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Students submit anonymous wellness check-ins. High and medium priority responses appear here for counselor follow-up.
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadSentimentAlerts}
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  <AlertOctagon className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            {sentimentAlerts.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card p-12 text-center neu-flat">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="font-medium mb-2">No Alerts Yet</p>
                <p className="text-sm text-muted-foreground">
                  When students submit wellness check-ins indicating they need support, they'll appear here.
                </p>
              </div>
            ) : (
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
                          Submitted {alert.detectedAt}
                        </p>
                      </div>
                      <button className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                        <Send className="h-3.5 w-3.5" />
                        Alert Counselor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {activeTab === "guide" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/15">
                  <BookOpen className="h-6 w-6 text-chart-1" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">How to Use the Admin Dashboard</h2>
                  <p className="text-sm text-muted-foreground">Simple guide to help you manage student onboarding</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Verification Queue */}
                <div className="border-l-4 border-chart-1 pl-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Document Verification
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Review and approve student documents like marksheets, ID cards, and photos.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-status-green">
                      <CheckCircle2 className="h-5 w-5 status-green shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium status-green">Green - Already Approved</p>
                        <p className="text-muted-foreground">Our AI checked these documents and they look perfect. No action needed!</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-status-yellow">
                      <AlertTriangle className="h-5 w-5 status-yellow shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium status-yellow">Yellow - Please Check</p>
                        <p className="text-muted-foreground">These documents need your review. Click the 👍 button to approve or 👎 to reject.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-status-red">
                      <XCircle className="h-5 w-5 status-red shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium status-red">Red - Rejected</p>
                        <p className="text-muted-foreground">These documents have issues (blurry photo, wrong document, etc.). Student needs to re-upload.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding Funnel */}
                <div className="border-l-4 border-chart-2 pl-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Student Progress Tracker
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    See how many students completed each step of joining the college.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span>Watch the numbers at each stage - if many students stop at one step, you know where to help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span>Use the "Send Bulk Notification" button to remind students who are stuck</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span>Example: If 100 students uploaded documents but only 50 got verified, check what's blocking them</span>
                    </li>
                  </ul>
                </div>

                {/* Sentiment Alerts */}
                <div className="border-l-4 border-destructive pl-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5" />
                    Student Well-being Alerts
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get notified when a student submits an anonymous wellness check-in indicating they need support.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>How it works:</strong> Students can submit anonymous wellness check-ins from the "Wellness" page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>Privacy:</strong> Student identities are completely hidden to protect their privacy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-1">⚠</span>
                      <span><strong>High Priority (Red):</strong> Student selected "Struggling" - needs immediate support, click "Alert Counselor" right away</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-status-yellow mt-1">⚠</span>
                      <span><strong>Medium Priority (Yellow):</strong> Student selected "It's Okay" or used stress-related words - keep an eye on them</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span>Students who feel "Doing Great" don't appear here - only those who need support</span>
                    </li>
                  </ul>
                </div>

                {/* Knowledge Base */}
                <div className="border-l-4 border-chart-3 pl-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload College Documents
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload important college documents so the AI chatbot can answer student questions accurately.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>What to upload:</strong> Fee structure, exam timetable, hostel rules, syllabus, holiday list, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>How to upload:</strong> Just drag PDF files into the box or click "Choose Files"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>What happens:</strong> Students can ask the chatbot questions and get answers from these documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>Example:</strong> Upload fee structure → Student asks "What is the hostel fee?" → AI gives correct answer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>Note:</strong> Documents are also shown as notices on student dashboard</span>
                    </li>
                  </ul>
                </div>

                {/* AI Assistant */}
                <div className="border-l-4 border-chart-1 pl-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Your AI Helper
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ask questions and get instant answers about your dashboard data.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>Try asking:</strong> "How many students registered?", "Show me pending documents", "Which stage has most drop-offs?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span><strong>Benefit:</strong> Get quick answers without clicking through different tabs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-4 mt-1">✓</span>
                      <span>Just type your question in plain English and press Enter!</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Tips */}
                <div className="rounded-xl bg-chart-1/10 p-6 border border-chart-1/20">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-chart-1" />
                    Quick Tips for Success
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-chart-1 mt-1">💡</span>
                      <span>Check the dashboard every morning to see pending verifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-1 mt-1">💡</span>
                      <span>Respond to sentiment alerts within 24 hours - student well-being is priority</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-1 mt-1">💡</span>
                      <span>Keep the knowledge base updated with latest circulars and notices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-chart-1 mt-1">💡</span>
                      <span>Use the AI assistant when you need quick stats for reports</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="rounded-3xl border border-border/50 bg-card overflow-hidden neu-flat">
            {/* Chat Header */}
            <div className="border-b border-border/50 bg-secondary/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
                  <Bot className="h-5 w-5 text-background" />
                </div>
                <div>
                  <h2 className="font-semibold">AI Admin Assistant</h2>
                  <p className="text-xs text-muted-foreground">
                    Ask me anything about your dashboard data
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      msg.role === "assistant" ? "bg-foreground" : "bg-chart-1/15"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="h-4.5 w-4.5 text-background" />
                    ) : (
                      <User className="h-4.5 w-4.5 text-chart-1" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                      msg.role === "assistant"
                        ? "bg-secondary"
                        : "bg-foreground text-background"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground">
                    <Bot className="h-4.5 w-4.5 text-background" />
                  </div>
                  <div className="rounded-2xl bg-secondary px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-border/50 bg-secondary/30 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Ask about students, documents, funnel..."
                  className="flex-1 rounded-full border border-border/50 bg-background px-5 py-3.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-all disabled:opacity-40"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Document Viewer Modal */}
        {showDocViewer && viewingDoc && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border/50 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold">{viewingDoc.docType}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewingDoc.studentName} ({viewingDoc.studentId})
                  </p>
                </div>
                <button
                  onClick={() => setShowDocViewer(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Document Preview */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="rounded-2xl border-2 border-dashed border-border/50 bg-secondary/30 p-12 text-center">
                  <FileCheck className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-lg font-semibold mb-2">Document Preview</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {viewingDoc.docType} - Uploaded {viewingDoc.uploadedAt}
                  </p>
                  
                  {/* Document Info */}
                  <div className="mt-6 max-w-md mx-auto text-left">
                    <div className="rounded-xl bg-card p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Confidence Score:</span>
                        <span className="text-sm font-semibold">{viewingDoc.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className={`text-sm font-semibold ${
                          viewingDoc.status === 'green' ? 'status-green' :
                          viewingDoc.status === 'yellow' ? 'status-yellow' :
                          'status-red'
                        }`}>
                          {statusStyles[viewingDoc.status].label}
                        </span>
                      </div>
                      {viewingDoc.issue && (
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-sm text-muted-foreground mb-1">Issue Detected:</p>
                          <p className="text-sm font-medium text-destructive">{viewingDoc.issue}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-6">
                    In production, the actual document image/PDF would be displayed here
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-border/50 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowDocViewer(false)}
                    className="rounded-full px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                  
                  {viewingDoc.status === "yellow" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => rejectItem(viewingDoc.id)}
                        className="flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/30 px-6 py-3 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Document
                      </button>
                      <button
                        onClick={() => approveItem(viewingDoc.id)}
                        className="flex items-center gap-2 rounded-full bg-chart-4/10 border border-chart-4/30 px-6 py-3 text-sm font-semibold text-chart-4 hover:bg-chart-4/20 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Document
                      </button>
                    </div>
                  )}
                  
                  {viewingDoc.status === "green" && (
                    <div className="rounded-full bg-chart-4/10 px-6 py-3 text-sm font-semibold text-chart-4">
                      ✓ Already Approved
                    </div>
                  )}
                  
                  {viewingDoc.status === "red" && (
                    <div className="rounded-full bg-destructive/10 px-6 py-3 text-sm font-semibold text-destructive">
                      ✗ Already Rejected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating AI Assistant Button */}
      {activeTab !== "chat" && (
        <button
          onClick={() => setActiveTab("chat")}
          className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:scale-110 hover:shadow-xl neu-convex animate-pulse-slow"
          title="AI Assistant - Click to chat"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-1 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-chart-1"></span>
          </span>
        </button>
      )}
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-6 py-4 shadow-lg neu-flat animate-in slide-in-from-bottom-5 ${
          toast.type === "success" 
            ? "border-status-green bg-status-green text-foreground" 
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}>
          <div className="flex items-center gap-3">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 status-green" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card p-6 shadow-xl neu-flat" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">Focus Search</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">Toggle Notifications</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">Open AI Chat</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">C</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">Go to Dashboard</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">D</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">Go to Queue</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">Q</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm">Go to Funnel</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">F</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Close Modals</span>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs font-mono">ESC</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Student Profile Modal */}
      {showStudentProfile && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setShowStudentProfile(false)}>
          <div className="w-full max-w-2xl rounded-3xl border border-border/50 bg-card shadow-xl neu-flat max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border/50 p-6 rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-muted-foreground">{selectedStudent.id} • {selectedStudent.branch}</p>
                </div>
                <button onClick={() => setShowStudentProfile(false)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">CONTACT INFORMATION</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedStudent.id}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedStudent.id, "Student ID")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedStudent.email}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedStudent.email, "Email")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedStudent.phone}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedStudent.phone, "Phone")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Overall Progress */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">ONBOARDING PROGRESS</h3>
                <div className="rounded-xl bg-secondary/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-2xl font-bold text-chart-1">{selectedStudent.overallProgress}%</span>
                  </div>
                  <Progress value={selectedStudent.overallProgress} className="h-2" />
                </div>
              </div>
              
              {/* Phase Progress */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">PHASE BREAKDOWN</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="h-4 w-4 text-chart-1" />
                      <span className="text-sm font-medium">Documents</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress.documents}%</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-chart-2" />
                      <span className="text-sm font-medium">Fees</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress.fees}%</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-chart-3" />
                      <span className="text-sm font-medium">Hostel</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress.hostel}%</p>
                  </div>
                  <div className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-chart-4" />
                      <span className="text-sm font-medium">Academic</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedStudent.progress.academic}%</p>
                  </div>
                </div>
              </div>
              
              {/* Documents */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">DOCUMENTS</h3>
                <div className="space-y-2">
                  {selectedStudent.documents.map((doc: any, i: number) => {
                    const docStyle = statusStyles[doc.status as keyof typeof statusStyles];
                    const DocIcon = docStyle.icon;
                    return (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${docStyle.bg}`}>
                            <DocIcon className={`h-4 w-4 ${docStyle.text}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.type}</p>
                            <p className="text-xs text-muted-foreground">{doc.uploadedAt}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${docStyle.bg} ${docStyle.text}`}>
                          {docStyle.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background hover:scale-105 transition-all">
                  <MessageCircle className="h-4 w-4" />
                  Send Message
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-semibold hover:bg-secondary/80 transition-all">
                  <FileCheck className="h-4 w-4" />
                  View All Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
