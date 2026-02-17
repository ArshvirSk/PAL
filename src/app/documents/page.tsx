"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileImage,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  Trash2,
  Shield,
} from "lucide-react";

type DocStatus = "idle" | "uploading" | "processing" | "approved" | "review" | "rejected";

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  status: DocStatus;
  confidence?: number;
  extractedData?: Record<string, string>;
  reason?: string;
};

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "12th_marksheet.jpg",
    type: "Marksheet",
    size: "2.4 MB",
    status: "approved",
    confidence: 0.97,
    extractedData: {
      Name: "Rahul Sharma",
      Board: "CBSE",
      "Roll No": "8234567",
      Percentage: "85.4%",
      Year: "2025",
    },
  },
  {
    id: "2",
    name: "aadhar_card.pdf",
    type: "ID_Card",
    size: "1.1 MB",
    status: "review",
    confidence: 0.72,
    extractedData: {
      Name: "Rahul Kumar Sharma",
      "ID Number": "XXXX-XXXX-4567",
    },
    reason: "Name mismatch: 'Rahul Kumar Sharma' vs admission record 'Rahul Sharma'",
  },
  {
    id: "3",
    name: "passport_photo.jpg",
    type: "Photo",
    size: "856 KB",
    status: "approved",
    confidence: 0.95,
  },
];

const statusConfig = {
  idle: { label: "Ready", color: "text-muted-foreground", bg: "bg-secondary", icon: FileImage },
  uploading: { label: "Uploading...", color: "text-chart-1", bg: "bg-chart-1/10", icon: Loader2 },
  processing: { label: "AI Scanning...", color: "text-chart-1", bg: "bg-chart-1/10", icon: Loader2 },
  approved: { label: "Approved", color: "status-green", bg: "bg-status-green", icon: CheckCircle2 },
  review: { label: "Needs Review", color: "status-yellow", bg: "bg-status-yellow", icon: AlertTriangle },
  rejected: { label: "Rejected", color: "status-red", bg: "bg-status-red", icon: XCircle },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [dragActive, setDragActive] = useState(false);

  const simulateUpload = useCallback(
    (file: File) => {
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.name.includes("mark")
          ? "Marksheet"
          : file.name.includes("id") || file.name.includes("aadhar")
          ? "ID_Card"
          : "Document",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        status: "uploading",
      };

      setDocuments((prev) => [newDoc, ...prev]);

      // Simulate upload
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === newDoc.id ? { ...d, status: "processing" as DocStatus } : d
          )
        );

        // Simulate AI processing
        setTimeout(() => {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === newDoc.id
                ? {
                    ...d,
                    status: "approved" as DocStatus,
                    confidence: 0.94,
                    extractedData: {
                      Name: "Rahul Sharma",
                      Type: "Verified Document",
                      Status: "Valid",
                    },
                  }
                : d
            )
          );
        }, 2000);
      }, 1500);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(simulateUpload);
    },
    [simulateUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(simulateUpload);
    },
    [simulateUpload]
  );

  const removeDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Smart-Scan Documents
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload your documents and let Vision AI verify them instantly.
          </p>
        </div>

        {/* PII notice */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 neu-flat">
          <Shield className="h-5 w-5 shrink-0 text-chart-1" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Privacy Protected:</span>{" "}
            Sensitive information (Aadhar/SSN numbers) is automatically masked in
            all AI responses. Your documents are stored securely.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mb-10 rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
            dragActive
              ? "border-chart-1 bg-chart-1/5"
              : "border-border/50 bg-card/50 hover:border-border neu-pressed"
          }`}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            Drop documents here or click to upload
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Supports JPG, PNG, PDF — Marksheets, ID Cards, Certificates
          </p>
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:scale-[1.02]">
            <Upload className="h-4 w-4" />
            Choose Files
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        {/* Document list */}
        <div>
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Your Documents ({documents.length})
          </h2>
          <div className="space-y-4">
            {documents.map((doc) => {
              const config = statusConfig[doc.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border/50 bg-card p-5 transition-all neu-flat"
                >
                  <div className="flex items-start gap-4">
                    {/* File icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      {doc.name.endsWith(".pdf") ? (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <FileImage className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">{doc.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}
                        >
                          <StatusIcon
                            className={`h-3.5 w-3.5 ${
                              doc.status === "uploading" || doc.status === "processing"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {doc.type} — {doc.size}
                        {doc.confidence !== undefined &&
                          ` — AI Confidence: ${Math.round(doc.confidence * 100)}%`}
                      </p>

                      {/* Mismatch reason */}
                      {doc.reason && (
                        <div className="mt-3 rounded-xl bg-status-yellow p-3">
                          <p className="text-sm status-yellow font-medium">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            {doc.reason}
                          </p>
                        </div>
                      )}

                      {/* Extracted data */}
                      {doc.extractedData && (
                        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-secondary/50 p-4 sm:grid-cols-3">
                          {Object.entries(doc.extractedData).map(([key, val]) => (
                            <div key={key}>
                              <p className="text-xs text-muted-foreground">
                                {key}
                              </p>
                              <p className="text-sm font-medium">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeDoc(doc.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
