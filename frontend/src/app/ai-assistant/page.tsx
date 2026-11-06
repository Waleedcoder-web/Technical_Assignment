"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PropertyCard from "@/components/ui/property-card";
import { mockProperties } from "@/lib/mock-data";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  properties?: typeof mockProperties;
  sources?: { filename: string; similarity: number }[];
  isRAG?: boolean;
}

function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[#001637]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="text-[#75777f] italic text-[11px]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-white border border-[#e7e8ea] rounded text-[11px] font-mono text-[#001637]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedMessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-line text-sm">{text}</p>;
  }

  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Section Heading
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-sm font-bold text-[#001637] font-plus-jakarta mt-2 mb-1 flex items-center gap-1.5">
              {trimmed.replace("### ", "")}
            </h4>
          );
        }

        // Horizontal Rule
        if (trimmed === "---") {
          return <hr key={idx} className="border-[#e7e8ea] my-2" />;
        }

        // Blockquote
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={idx} className="border-l-2 border-[#076a64] pl-3 py-1 my-1.5 bg-white/70 rounded-r-lg italic text-[#001637] text-xs">
              {renderFormattedInline(trimmed.replace("> ", ""))}
            </blockquote>
          );
        }

        // Bullet list item
        if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.replace(/^[•\-\*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#191c1e] my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#076a64] mt-1.5 shrink-0" />
              <span>{renderFormattedInline(bulletText)}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-xs text-[#191c1e]">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! I'm your HavenKey AI Real Estate Advisor. I can search through verified properties across Pakistan or answer your questions about HavenKey company policies, tenancy escrow, biometric deeds, and agreement rules.",
      timestamp: "11:30 AM",
    },
    {
      id: "2",
      sender: "user",
      text: "How does the biometric tenant escrow work?",
      timestamp: "11:31 AM",
    },
    {
      id: "3",
      sender: "ai",
      text: "Based on HavenKey's official company documentation:\n\nAll rental security deposits must be submitted via verified bank escrow. Deposits are held securely until lease termination inspection. If no damages are reported within 7 business days, the entire deposit is refunded to the tenant account.",
      timestamp: "11:31 AM",
      sources: [{ filename: "HavenKey_Tenancy_And_Escrow_Policy.pdf", similarity: 0.89 }],
      isRAG: true,
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputMessage.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Differentiate between Property Search (DB queries) vs Company Information (RAG)
      const isPropertyQuery = /\b(find|search|house|villa|apartment|flat|plot|room|marla|kanal|bed|bedroom|bath|rent|buy|sale|pkr|price|budget|lahore|islamabad|karachi|sialkot|rawalpindi)\b/i.test(query);

      if (isPropertyQuery) {
        // Query properties database endpoint
        let propertyList: any[] = [];
        try {
          const res = await fetch("http://localhost:5000/api/properties");
          if (res.ok) {
            const json = await res.json();
            propertyList = json.data || json || [];
          }
        } catch {
          propertyList = mockProperties;
        }

        const qLower = query.toLowerCase();
        const filtered = propertyList.filter((p: any) => {
          return (
            (p.title && p.title.toLowerCase().includes(qLower)) ||
            (p.location && p.location.toLowerCase().includes(qLower)) ||
            (p.city && p.city.toLowerCase().includes(qLower)) ||
            (p.property_type && qLower.includes(p.property_type.toLowerCase()))
          );
        });

        const matchedProps = filtered.length > 0 ? filtered.slice(0, 4) : propertyList.slice(0, 2);

        const aiReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `Here are the matching verified property listings based on your search for "${query}":`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          properties: matchedProps,
        };
        setMessages((prev) => [...prev, aiReply]);
      } else {
        // Company Information Assistant (RAG Pipeline)
        const res = await fetch("/api/ai/company-rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: query }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to retrieve company documentation.");
        }

        const aiReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: json.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: json.sources,
          isRAG: true,
        };
        setMessages((prev) => [...prev, aiReply]);
      }
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `An error occurred: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const promptSuggestions = [
    "What is the refund timeline for tenant escrow deposits?",
    "What are HavenKey's landlord dispute resolution rules?",
    "Find 4-Bed villa in DHA Phase 6 under 400k/mo",
    "Show available rental apartments in Lahore",
  ];

  return (
    <>
      <Navbar />

      <main className="w-full pt-20 pb-12 bg-[#f8f9fb] min-h-screen flex flex-col">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 w-full flex-1 flex flex-col">
          {/* Header Banner */}
          <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e8ea]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#001637] text-[#a1f1e9] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[28px]">smart_toy</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#001637] font-plus-jakarta">
                    HavenKey AI Real Estate Copilot
                  </h1>
                  <span className="px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#076a64] animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-xs text-[#44474e]">
                  Powered by Qwen 2.5 + RAG document retrieval &amp; verified real estate registries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: "init",
                      sender: "ai",
                      text: "Conversation cleared. How can I assist your property search or legal lease verification today?",
                      timestamp: "Just now",
                    },
                  ])
                }
                className="px-3 py-1.5 bg-white text-[#44474e] hover:text-[#001637] border border-[#e7e8ea] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Clear Chat
              </button>
            </div>
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="py-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#44474e] font-semibold mr-1">Suggestions:</span>
            {promptSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInputMessage(prompt)}
                className="px-3 py-1.5 bg-white hover:bg-[#edeef0] text-[#001637] border border-[#e7e8ea] text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px] text-[#076a64]">
                  auto_awesome
                </span>
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Container */}
          <div className="flex-1 bg-white rounded-2xl border border-[#e7e8ea] shadow-sm flex flex-col overflow-hidden mb-6">
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-4xl ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-[#172b4d] text-white"
                        : "bg-[#001637] text-[#a1f1e9]"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      "WH"
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className="flex flex-col gap-2">
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#172b4d] text-white rounded-tr-xs"
                          : "bg-[#f2f4f6] text-[#191c1e] rounded-tl-xs border border-[#e7e8ea]"
                      }`}
                    >
                      <FormattedMessageContent text={msg.text} isUser={msg.sender === "user"} />

                      {/* Grounded RAG Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#e7e8ea] flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-[#75777f] uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-[#076a64]">
                              verified
                            </span>
                            Verified Knowledge Sources:
                          </span>
                          {msg.sources.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#e7e8ea] rounded-lg text-[11px] font-medium text-[#001637] shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[14px] text-red-500">
                                description
                              </span>
                              <span>{s.filename}</span>
                              <span className="px-1.5 py-0.2 bg-[#a1f1e9] text-[#076a64] text-[9px] font-bold rounded-sm">
                                {(s.similarity * 100).toFixed(0)}% match
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Embedded Property Cards */}
                      {msg.properties && msg.properties.filter(Boolean).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {msg.properties.filter(Boolean).map((prop) => (
                            <div key={prop.id} className="max-w-sm">
                              <PropertyCard property={prop} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] text-[#75777f] ${
                        msg.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#44474e] p-3 bg-[#f2f4f6] rounded-xl w-fit">
                  <span className="material-symbols-outlined text-[18px] text-[#076a64] animate-spin">
                    progress_activity
                  </span>
                  HavenKey AI is analyzing real estate parameters...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-[#f8f9fb] border-t border-[#e7e8ea] flex items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask anything about properties, leases, legal deeds, or budget queries..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 bg-white text-sm text-[#191c1e] rounded-xl border border-[#e7e8ea] focus:outline-none focus:border-[#076a64] shadow-xs"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-[#75777f] hover:text-[#076a64] transition-colors"
                  title="Voice input"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
              </div>

              <button
                type="submit"
                className="h-12 px-6 bg-[#076a64] hover:bg-[#00201e] text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
