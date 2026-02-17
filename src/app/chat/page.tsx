"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, BookOpen } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi Rahul! I'm P.A.L., your personal campus assistant. I have access to your college handbook, syllabus, and onboarding guides. Ask me anything about campus life, deadlines, or academics!",
    timestamp: new Date(),
  },
];

const sampleResponses: Record<string, { reply: string; sources: string[] }> = {
  subjects: {
    reply:
      "Based on your CS branch and 1st year curriculum, your core subjects this semester are:\n\n1. **Engineering Mathematics I**\n2. **Physics for Engineers**\n3. **Introduction to Programming (C)**\n4. **Engineering Drawing**\n5. **Communication Skills**\n\nYou also have 2 elective slots. I'd recommend checking the elective list — would you like me to pull that up?",
    sources: ["cs_syllabus_2026.pdf", "academic_calendar.pdf"],
  },
  fee: {
    reply:
      "Your CS branch fee deadline is **October 12th, 2026**. Here's the breakdown:\n\n- Tuition Fee: ₹85,000 *(Paid ✓)*\n- Hostel Fee: ₹35,000 *(Pending)*\n- Lab Fee: ₹12,000 *(Pending)*\n\n**Total Pending: ₹47,000**\n\nYou can pay via the college ERP portal or at the accounts office (Building A, Room 102).",
    sources: ["fee_structure_2026.pdf"],
  },
  hostel: {
    reply:
      "Hostel allotment for 1st year CS students typically happens after fee payment is complete. Based on the current timeline:\n\n- **Room preferences open:** Oct 15th\n- **Allotment results:** Oct 18th\n- **Move-in dates:** Oct 20-22nd\n\nYou'll be in Block C or D (first-year blocks). Would you like to know about hostel rules or the mess menu?",
    sources: ["hostel_guidelines_2026.pdf", "campus_handbook.pdf"],
  },
  default: {
    reply:
      "I do not have this specific information in my knowledge base. Please contact the admin desk at **admin@college.edu** or visit the Student Services Office (Building A, Ground Floor) for assistance.",
    sources: [],
  },
};

function getResponse(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("subject") || lower.includes("course") || lower.includes("syllabus")) {
    return sampleResponses.subjects;
  }
  if (lower.includes("fee") || lower.includes("payment") || lower.includes("deadline")) {
    return sampleResponses.fee;
  }
  if (lower.includes("hostel") || lower.includes("room") || lower.includes("accommodation")) {
    return sampleResponses.hostel;
  }
  return sampleResponses.default;
}

const quickActions = [
  "What are my core subjects?",
  "When is the fee deadline?",
  "Tell me about hostel allotment",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const response = getResponse(text);
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.reply,
      sources: response.sources,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, assistantMsg]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Chat header */}
      <div className="border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground float-animate">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="font-semibold">Chat with P.A.L.</h1>
            <p className="text-xs text-muted-foreground">
              RAG-powered campus assistant — CS Branch, 1st Year context
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-chart-4/15 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
            <span className="text-xs font-medium text-chart-4">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  msg.role === "assistant"
                    ? "bg-foreground"
                    : "bg-chart-1/15"
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
                    ? "bg-card border border-border/50 neu-flat"
                    : "bg-foreground text-background"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={i}>{part.slice(2, -2)}</strong>
                      );
                    }
                    return part;
                  })}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/30 pt-3">
                    {msg.sources.map((src) => (
                      <span
                        key={src}
                        className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        <BookOpen className="h-3 w-3" />
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground">
                <Bot className="h-4.5 w-4.5 text-background" />
              </div>
              <div className="rounded-2xl border border-border/50 bg-card px-5 py-4 neu-flat">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions + Input */}
      <div className="border-t border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          {messages.length <= 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary hover:text-foreground neu-flat"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {action}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask P.A.L. about campus, deadlines, academics..."
              className="flex-1 rounded-full border border-border/50 bg-card px-5 py-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20 neu-pressed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-105 disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
