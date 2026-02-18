"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Check } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  tourKey: string; // Unique key to track if tour was completed
}

export function OnboardingTour({ steps, tourKey }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has completed this tour
    const completed = localStorage.getItem(`tour_${tourKey}_completed`);
    if (!completed) {
      // Show tour after a short delay
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [tourKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`tour_${tourKey}_completed`, "true");
    setIsOpen(false);
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_${tourKey}_completed`, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />

      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-6">{step.description}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-foreground"
                    : index < currentStep
                    ? "bg-chart-4"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 rounded-full border border-border/50 px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:scale-[1.02]"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Got it!
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Predefined tours for different pages
export const dashboardTour: TourStep[] = [
  {
    target: "dashboard",
    title: "Welcome to Your Dashboard! 👋",
    description:
      "This is your command center. Here you can track your onboarding progress, view tasks, and stay updated with notifications.",
  },
  {
    target: "progress",
    title: "Track Your Progress",
    description:
      "See how far you've come in your onboarding journey. Complete tasks to move through different phases.",
  },
  {
    target: "phases",
    title: "Onboarding Phases",
    description:
      "Your onboarding is divided into phases: Document Verification, Fee Payment, Hostel Allotment, and Academic Setup. Complete each phase to proceed.",
  },
  {
    target: "notifications",
    title: "Stay Updated",
    description:
      "Important deadlines and updates will appear here. Don't miss any critical information!",
  },
];

export const documentsTour: TourStep[] = [
  {
    target: "documents",
    title: "Smart Document Upload 📄",
    description:
      "Upload your documents here. Our AI will automatically extract information and verify them.",
  },
  {
    target: "upload-zone",
    title: "Drag & Drop or Click",
    description:
      "Simply drag your documents here or click to browse. We support JPG, PNG, and PDF files.",
  },
  {
    target: "status",
    title: "Traffic Light System",
    description:
      "Green = Approved, Yellow = Needs Review, Red = Rejected. You'll get instant feedback on your documents.",
  },
];

export const chatTour: TourStep[] = [
  {
    target: "chat",
    title: "Meet P.A.L. - Your AI Assistant 🤖",
    description:
      "Ask me anything about campus life, deadlines, courses, or procedures. I'm here to help!",
  },
  {
    target: "quick-actions",
    title: "Quick Questions",
    description:
      "Not sure what to ask? Try these quick questions to get started.",
  },
  {
    target: "sources",
    title: "Verified Information",
    description:
      "I provide sources for my answers so you know the information is accurate and up-to-date.",
  },
];

export const tribeTour: TourStep[] = [
  {
    target: "tribe",
    title: "Find Your Tribe 👥",
    description:
      "Connect with students who share your interests. Make friends before you even step on campus!",
  },
  {
    target: "interests",
    title: "Select Your Interests",
    description:
      "Choose what you're passionate about. Our algorithm will find students with similar interests.",
  },
  {
    target: "matches",
    title: "Your Matches",
    description:
      "See your compatibility score with other students. Connect with them to start a conversation!",
  },
];

export const adminTour: TourStep[] = [
  {
    target: "admin",
    title: "Admin Control Tower 🎛️",
    description:
      "Welcome to the admin dashboard. Monitor student progress, verify documents, and track analytics.",
  },
  {
    target: "queue",
    title: "Verification Queue",
    description:
      "Review documents that need your attention. AI pre-screens them and flags issues for you.",
  },
  {
    target: "funnel",
    title: "Onboarding Funnel",
    description:
      "Track how students progress through onboarding. Identify bottlenecks and drop-off points.",
  },
  {
    target: "sentiment",
    title: "Student Well-being",
    description:
      "AI monitors student sentiment and alerts you to distress signals. Intervene early to help struggling students.",
  },
];
