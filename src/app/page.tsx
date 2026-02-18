import Link from "next/link";
import {
  MessageCircle,
  FileCheck,
  Users,
  LayoutDashboard,
  ArrowRight,
  Bot,
  Sparkles,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Assistant",
    description:
      "Get instant answers about campus rules, deadlines, and academics — powered by RAG with your college knowledge base.",
    href: "/chat",
  },
  {
    icon: FileCheck,
    title: "Smart-Scan Documents",
    description:
      "Upload marksheets and IDs. Vision AI extracts data, validates against records, and flags discrepancies in seconds.",
    href: "/documents",
  },
  {
    icon: Users,
    title: "Find My Tribe",
    description:
      "Connect with classmates who share your interests — coding, gaming, music, and more. Build your campus network.",
    href: "/tribe",
  },
  {
    icon: LayoutDashboard,
    title: "Lifecycle Dashboard",
    description:
      "Track your onboarding progress from document submission to fee payment to hostel allotment and beyond.",
    href: "/dashboard",
  },
];

const stats = [
  { value: "70%", label: "Less Admin Work" },
  { value: "85%", label: "Query Deflection" },
  { value: "3 Days", label: "Onboarding Speed" },
  { value: "3s", label: "Doc Verification" },
];

export default function Home() {
  return (
    <div className="gradient-mesh">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Floating badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-medium text-muted-foreground neu-flat">
            <Sparkles className="h-4 w-4" />
            AI-Powered Campus Onboarding
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Your Digital{" "}
            <span className="relative">
              Senior
              <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full iridescent-wave opacity-60" />
            </span>
            {" "}for Campus Life
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            P.A.L. transforms chaotic college onboarding into a seamless,
            proactive journey. Smart document scanning, personalized guidance,
            and social matching — all in one intelligent assistant.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="group flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-base font-semibold text-background transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <Bot className="h-5 w-5" />
              Login to P.A.L.
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="flex h-14 items-center gap-2 rounded-full border border-border px-8 text-base font-semibold transition-all hover:bg-secondary neu-flat"
            >
              <MessageCircle className="h-5 w-5" />
              Learn More
            </Link>
          </div>
        </div>

        {/* Decorative floating orbs */}
        <div className="pointer-events-none absolute top-20 left-10 h-72 w-72 rounded-full bg-chart-1/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-10 h-56 w-56 rounded-full bg-chart-3/10 blur-3xl" />
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need, Day One
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From admission to academics, P.A.L. guides every step of your
              campus journey.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-3xl border border-border/50 bg-card p-8 transition-all hover:border-border hover:shadow-lg neu-flat"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 bg-background/60 px-6 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Your Day 1 Journey
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload Documents",
                desc: "Snap a photo of your marksheet. Vision AI verifies it in 3 seconds.",
                icon: FileCheck,
              },
              {
                step: "02",
                title: "Get Personalized Guidance",
                desc: "P.A.L. unlocks your dashboard with a customized onboarding checklist.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Connect & Thrive",
                desc: "Find your tribe, complete your setup, and start campus life stress-free.",
                icon: Users,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-border/50 bg-card p-8 neu-flat"
              >
                <span className="text-5xl font-bold text-muted-foreground/20">
                  {item.step}
                </span>
                <div className="mt-4 mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
                  <item.icon className="h-5 w-5 text-background" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-border/50 px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Built with Privacy First</h3>
          <p className="text-muted-foreground">
            PII masking on all document scans. Hallucination guardrails on every
            AI response. Your data stays secure.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Bot className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-semibold">P.A.L.</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Personal Assistant for Life on Campus
          </p>
        </div>
      </footer>
    </div>
  );
}
