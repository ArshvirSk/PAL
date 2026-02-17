"use client";

import { useState } from "react";
import {
  Users,

  Code,
  Gamepad2,
  Music,
  BookOpen,
  Camera,
  Dumbbell,
  Check,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Interest = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const interests: Interest[] = [
  { id: "coding", label: "Coding", icon: Code },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "music", label: "Music", icon: Music },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
];

type Match = {
  id: string;
  name: string;
  branch: string;
  hostelBlock: string;
  sharedInterests: string[];
  matchScore: number;
  avatar: string;
};

const mockMatches: Match[] = [
  {
    id: "1",
    name: "Priya Patel",
    branch: "CS",
    hostelBlock: "Block C",
    sharedInterests: ["coding", "gaming", "music"],
    matchScore: 92,
    avatar: "PP",
  },
  {
    id: "2",
    name: "Arjun Singh",
    branch: "CS",
    hostelBlock: "Block C",
    sharedInterests: ["coding", "fitness"],
    matchScore: 78,
    avatar: "AS",
  },
  {
    id: "3",
    name: "Neha Gupta",
    branch: "ECE",
    hostelBlock: "Block D",
    sharedInterests: ["music", "photography"],
    matchScore: 65,
    avatar: "NG",
  },
  {
    id: "4",
    name: "Vikram Reddy",
    branch: "CS",
    hostelBlock: "Block C",
    sharedInterests: ["gaming", "coding"],
    matchScore: 85,
    avatar: "VR",
  },
  {
    id: "5",
    name: "Sneha Iyer",
    branch: "IT",
    hostelBlock: "Block D",
    sharedInterests: ["reading", "music", "photography"],
    matchScore: 70,
    avatar: "SI",
  },
];

export default function TribePage() {
  const [selected, setSelected] = useState<string[]>(["coding", "gaming", "music"]);
  const [matches] = useState<Match[]>(mockMatches);
  const [connected, setConnected] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const connectWith = (matchId: string) => {
    setConnected((prev) => [...prev, matchId]);
  };

  const filteredMatches = matches.filter((m) =>
    m.sharedInterests.some((si) => selected.includes(si))
  );

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find My Tribe
          </h1>
          <p className="mt-2 text-muted-foreground">
            Connect with classmates who share your passions. Select your
            interests and discover your campus community.
          </p>
        </div>

        {/* Interest selector */}
        <div className="mb-10 rounded-3xl border border-border/50 bg-card p-6 neu-flat">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Interests
          </h2>
          <div className="flex flex-wrap gap-3">
            {interests.map((interest) => {
              const isSelected = selected.includes(interest.id);
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

        {/* Matches */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Your Matches ({filteredMatches.length})
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Sorted by compatibility
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-3xl border border-border/50 bg-card p-12 text-center neu-flat">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                Select some interests to find your matches.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredMatches
                .sort((a, b) => b.matchScore - a.matchScore)
                .map((match) => {
                  const isConnected = connected.includes(match.id);
                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-border/50 bg-card p-6 transition-all neu-flat"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chart-1/15 text-sm font-bold text-chart-1">
                          {match.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{match.name}</h3>
                            <span className="text-sm font-bold text-chart-1">
                              {match.matchScore}%
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {match.branch} — {match.hostelBlock}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {match.sharedInterests.map((si) => {
                              const int = interests.find((i) => i.id === si);
                              if (!int) return null;
                              return (
                                <span
                                  key={si}
                                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  <int.icon className="h-3 w-3" />
                                  {int.label}
                                </span>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => connectWith(match.id)}
                            disabled={isConnected}
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                              isConnected
                                ? "bg-chart-4/10 text-chart-4"
                                : "bg-foreground text-background hover:scale-[1.02]"
                            }`}
                          >
                            {isConnected ? (
                              <>
                                <Check className="h-4 w-4" />
                                Connected
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4" />
                                Connect
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
