"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Shield,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Mood = "happy" | "okay" | "struggling" | null;

export default function WellnessPage() {
  const [mood, setMood] = useState<Mood>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("low");

  const handleSubmit = () => {
    if (!mood) {
      alert("Please select how you're feeling");
      return;
    }

    // Determine severity based on mood and message
    let calculatedSeverity: "low" | "medium" | "high" = "low";
    
    if (mood === "struggling") {
      calculatedSeverity = "high";
    } else if (mood === "okay") {
      calculatedSeverity = "medium";
    }

    // Check for distress keywords in message
    const distressKeywords = ["overwhelmed", "stressed", "anxious", "depressed", "struggling", "help", "difficult", "can't cope"];
    const messageText = message.toLowerCase();
    const hasDistressKeywords = distressKeywords.some(keyword => messageText.includes(keyword));
    
    if (hasDistressKeywords && calculatedSeverity !== "high") {
      calculatedSeverity = "medium";
    }

    setSeverity(calculatedSeverity);

    // Save to localStorage (in real app, would send to backend)
    const existingFeedback = JSON.parse(localStorage.getItem("wellnessFeedback") || "[]");
    const newFeedback = {
      id: Date.now().toString(),
      mood,
      message,
      severity: calculatedSeverity,
      timestamp: new Date().toISOString(),
      anonymous: true,
    };
    
    existingFeedback.push(newFeedback);
    localStorage.setItem("wellnessFeedback", JSON.stringify(existingFeedback));

    setSubmitted(true);
  };

  const resetForm = () => {
    setMood(null);
    setMessage("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="gradient-mesh min-h-screen px-6 py-10 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="rounded-3xl border border-border/50 bg-card p-8 text-center neu-flat">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-4/15 mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-chart-4" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Thank You for Sharing</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback has been received anonymously. 
              {severity === "high" && " A counselor will reach out to you soon through your registered email."}
              {severity === "medium" && " We're here to support you. Feel free to reach out anytime."}
              {severity === "low" && " We're glad you're doing well! Keep it up!"}
            </p>
            
            <div className="rounded-2xl bg-secondary/50 p-6 mb-6">
              <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Need Immediate Help?
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📞 Campus Counselor: +91 98765 43210</p>
                <p>📧 Email: counselor@college.edu</p>
                <p>🏥 Health Center: Block C, Ground Floor</p>
                <p className="text-xs mt-3">Available 24/7 for emergencies</p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:scale-[1.02] transition-all"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-1/15 mx-auto mb-4">
            <Heart className="h-8 w-8 text-chart-1" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Wellness Check-In
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your mental health matters. Share how you're feeling - completely anonymous.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mb-8 rounded-2xl border border-chart-1/30 bg-chart-1/5 p-5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-chart-1 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-chart-1 mb-1">100% Anonymous & Confidential</p>
              <p className="text-muted-foreground">
                Your identity is never shared. We only use this to understand student well-being and provide support when needed.
              </p>
            </div>
          </div>
        </div>

        {/* Mood Selection */}
        <div className="mb-8 rounded-3xl border border-border/50 bg-card p-8 neu-flat">
          <h2 className="mb-6 text-lg font-semibold">How are you feeling today?</h2>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => setMood("happy")}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                mood === "happy"
                  ? "border-chart-4 bg-chart-4/10 shadow-md"
                  : "border-border/50 hover:border-chart-4/50 hover:bg-secondary"
              }`}
            >
              <Smile className={`h-12 w-12 mx-auto mb-3 ${mood === "happy" ? "text-chart-4" : "text-muted-foreground"}`} />
              <p className="font-semibold">Doing Great!</p>
              <p className="text-xs text-muted-foreground mt-1">Feeling positive and energetic</p>
            </button>

            <button
              onClick={() => setMood("okay")}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                mood === "okay"
                  ? "border-status-yellow bg-status-yellow shadow-md"
                  : "border-border/50 hover:border-status-yellow hover:bg-secondary"
              }`}
            >
              <Meh className={`h-12 w-12 mx-auto mb-3 ${mood === "okay" ? "status-yellow" : "text-muted-foreground"}`} />
              <p className="font-semibold">It's Okay</p>
              <p className="text-xs text-muted-foreground mt-1">Managing, but could be better</p>
            </button>

            <button
              onClick={() => setMood("struggling")}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                mood === "struggling"
                  ? "border-destructive bg-destructive/10 shadow-md"
                  : "border-border/50 hover:border-destructive/50 hover:bg-secondary"
              }`}
            >
              <Frown className={`h-12 w-12 mx-auto mb-3 ${mood === "struggling" ? "text-destructive" : "text-muted-foreground"}`} />
              <p className="font-semibold">Struggling</p>
              <p className="text-xs text-muted-foreground mt-1">Need support and help</p>
            </button>
          </div>
        </div>

        {/* Message Input */}
        {mood && (
          <div className="mb-8 rounded-3xl border border-border/50 bg-card p-8 neu-flat animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Want to share more? (Optional)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tell us what's on your mind. This helps us understand and support you better.
            </p>
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I'm feeling this way because..."
              rows={6}
              className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none"
            />
            
            <p className="mt-2 text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
        )}

        {/* Submit Button */}
        {mood && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-semibold text-background hover:scale-[1.02] transition-all mx-auto"
            >
              <Send className="h-4 w-4" />
              Submit Anonymously
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Your response is completely anonymous and confidential
            </p>
          </div>
        )}

        {/* Help Resources */}
        <div className="mt-12 rounded-2xl border border-border/50 bg-card p-6 neu-flat">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-chart-1" />
            Need to Talk to Someone?
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="font-medium mb-2">Campus Counselor</p>
              <p className="text-muted-foreground text-xs">Professional mental health support</p>
              <p className="text-chart-1 mt-2">📞 +91 98765 43210</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="font-medium mb-2">Student Mentor</p>
              <p className="text-muted-foreground text-xs">Peer support and guidance</p>
              <p className="text-chart-1 mt-2">📧 mentor@college.edu</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="font-medium mb-2">Health Center</p>
              <p className="text-muted-foreground text-xs">Medical and wellness services</p>
              <p className="text-chart-1 mt-2">🏥 Block C, Ground Floor</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="font-medium mb-2">Emergency Helpline</p>
              <p className="text-muted-foreground text-xs">24/7 crisis support</p>
              <p className="text-chart-1 mt-2">📞 1800-XXX-XXXX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
