"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import api from "@/lib/api";

type Interest = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const interestIcons: Record<string, LucideIcon> = {
  coding: Code,
  gaming: Gamepad2,
  music: Music,
  reading: BookOpen,
  photography: Camera,
  fitness: Dumbbell,
};

type Match = {
  id: string;
  name: string;
  branch: string;
  hostelBlock: string;
  sharedInterests: string[];
  matchScore: number;
  avatar: string;
};

export default function TribePage() {
  const [interests, setInterests] = useState<Interest[]>([
    { id: "coding", label: "Coding", icon: Code },
    { id: "gaming", label: "Gaming", icon: Gamepad2 },
    { id: "music", label: "Music", icon: Music },
    { id: "reading", label: "Reading", icon: BookOpen },
    { id: "photography", label: "Photography", icon: Camera },
    { id: "fitness", label: "Fitness", icon: Dumbbell },
  ]);
  const [selected, setSelected] = useState<string[]>(["coding", "gaming"]);
  const [matches, setMatches] = useState<Match[]>([
    {
      id: "1",
      name: "Rahul Sharma",
      branch: "Computer Science",
      hostelBlock: "Block A",
      sharedInterests: ["coding", "gaming"],
      matchScore: 85,
      avatar: "RS",
    },
    {
      id: "2",
      name: "Priya Patel",
      branch: "Computer Science",
      hostelBlock: "Block B",
      sharedInterests: ["coding", "music"],
      matchScore: 78,
      avatar: "PP",
    },
    {
      id: "3",
      name: "Arjun Kumar",
      branch: "Electronics",
      hostelBlock: "Block A",
      sharedInterests: ["gaming", "fitness"],
      matchScore: 72,
      avatar: "AK",
    },
    {
      id: "4",
      name: "Sneha Reddy",
      branch: "Computer Science",
      hostelBlock: "Block C",
      sharedInterests: ["reading", "photography"],
      matchScore: 68,
      avatar: "SR",
    },
    {
      id: "5",
      name: "Vikram Singh",
      branch: "Mechanical",
      hostelBlock: "Block A",
      sharedInterests: ["fitness", "music"],
      matchScore: 65,
      avatar: "VS",
    },
  ]);
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatWith, setChatWith] = useState<Match | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ from: string; message: string; time: string }[]>([]);

  useEffect(() => {
    fetchData();
    
    // Load saved interests from settings
    const savedInterests = localStorage.getItem("userInterests");
    if (savedInterests) {
      setSelected(JSON.parse(savedInterests));
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Using mock data - interests and matches are already set in state
      console.log("Tribe page loaded with mock data");
      
      /* Commented out real API calls for now
      // Fetch interest categories
      const categoriesRes = await api.social.getCategories();
      const categories = categoriesRes.data.categories;
      
      // Flatten all tags from categories
      const allInterests: Interest[] = [];
      categories.forEach((cat: any) => {
        cat.tags.forEach((tag: string) => {
          allInterests.push({
            id: tag.toLowerCase().replace(/\s+/g, "_"),
            label: tag,
            icon: interestIcons[tag.toLowerCase()] || BookOpen,
          });
        });
      });
      
      setInterests(allInterests);

      // Fetch existing matches
      const matchesRes = await api.social.getMatches();
      const formattedMatches = matchesRes.data.matches.map((match: any) => ({
        id: match.id,
        name: match.matchedUser.name,
        branch: match.matchedUser.branch,
        hostelBlock: match.matchedUser.hostelBlock || "N/A",
        sharedInterests: match.sharedInterests,
        matchScore: Math.round(match.matchScore * 100),
        avatar: match.matchedUser.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }));
      
      setMatches(formattedMatches);

      // Get user's existing interests
      // Note: This would need a separate endpoint to fetch user's interests
      // For now, we'll infer from matches
      if (formattedMatches.length > 0) {
        const userInterests = new Set<string>();
        formattedMatches.forEach((m: Match) => {
          m.sharedInterests.forEach((i) => userInterests.add(i));
        });
        setSelected(Array.from(userInterests));
      }
      */

    } catch (error) {
      console.error("Failed to fetch tribe data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = async (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((i) => i !== id)
      : [...selected, id];
    
    setSelected(newSelected);
    
    // Mock mode - just update local state
    console.log("Interest toggled:", id, "Selected:", newSelected);
    
    /* Commented out API calls for mock mode
    // Submit interests to backend
    if (newSelected.length > 0) {
      try {
        setSubmitting(true);
        await api.social.submitInterests(
          newSelected.map((interestId) => {
            const interest = interests.find((i) => i.id === interestId);
            return {
              category: "General", // You might want to track categories
              tags: [interest?.label || interestId],
            };
          })
        );
        
        // Refresh matches
        await fetchMatches();
      } catch (error) {
        console.error("Failed to submit interests:", error);
      } finally {
        setSubmitting(false);
      }
    }
    */
  };

  const fetchMatches = async () => {
    try {
      const matchesRes = await api.social.getMatches();
      const formattedMatches = matchesRes.data.matches.map((match: any) => ({
        id: match.id,
        name: match.matchedUser.name,
        branch: match.matchedUser.branch,
        hostelBlock: match.matchedUser.hostelBlock || "N/A",
        sharedInterests: match.sharedInterests,
        matchScore: Math.round(match.matchScore * 100),
        avatar: match.matchedUser.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }));
      setMatches(formattedMatches);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    }
  };

  const connectWith = async (matchId: string) => {
    // Mock mode - just update local state
    setConnected((prev) => [...prev, matchId]);
    console.log("Connected with:", matchId);
    
    /* Commented out API call for mock mode
    try {
      await api.social.respondToMatch(matchId, "accepted");
      setConnected((prev) => [...prev, matchId]);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
    */
  };

  const openChat = (match: Match) => {
    setChatWith(match);
    setShowChat(true);
    setChatMessages([
      { from: match.name, message: "Hey! Thanks for connecting!", time: "Just now" },
    ]);
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !chatWith) return;
    
    setChatMessages((prev) => [
      ...prev,
      { from: "You", message: chatMessage, time: "Just now" },
    ]);
    setChatMessage("");
    
    // Simulate response after 1 second
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { from: chatWith.name, message: "That sounds great! Let's catch up soon.", time: "Just now" },
      ]);
    }, 1000);
  };

  const filteredMatches = matches.filter((m) =>
    m.sharedInterests.some((si) => selected.includes(si))
  );

  if (loading) {
    return (
      <div className="gradient-mesh min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl flex gap-6">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
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
                          {isConnected && (
                            <button
                              onClick={() => openChat(match)}
                              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 transition-all"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Chat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        </div>

        {/* Sidebar - My Tribe */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-24">
            <div className="rounded-3xl border border-border/50 bg-card p-6 neu-flat">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-chart-1" />
                <h2 className="text-lg font-semibold">My Tribe</h2>
                <span className="ml-auto text-sm text-muted-foreground">
                  {connected.length}
                </span>
              </div>
              
              {connected.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No connections yet. Start connecting with matches!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches
                    .filter((m) => connected.includes(m.id))
                    .map((member) => (
                      <button
                        key={member.id}
                        onClick={() => openChat(member)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-1/15 text-sm font-bold text-chart-1">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.branch}
                          </p>
                        </div>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && chatWith && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/50 rounded-3xl w-full max-w-lg max-h-[600px] flex flex-col shadow-2xl">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-1/15 text-sm font-bold text-chart-1">
                {chatWith.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{chatWith.name}</h3>
                <p className="text-xs text-muted-foreground">{chatWith.branch}</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "You" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.from === "You"
                        ? "bg-foreground text-background"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-60">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-border/50 bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-all disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
