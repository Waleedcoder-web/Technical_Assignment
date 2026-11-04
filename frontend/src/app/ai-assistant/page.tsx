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
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello Waleed! I'm your HavenKey AI Real Estate Advisor. I can search through 9,900+ biometric verified properties, calculate tenancy escrow deposits, compare cap rates across Lahore, Islamabad, and Karachi, and review lease compliance.",
      timestamp: "11:30 AM",
    },
    {
      id: "2",
      sender: "user",
      text: "Show me top verified rental properties in Karachi Clifton and Lahore DHA with luxury amenities and direct owner lease.",
      timestamp: "11:31 AM",
    },
    {
      id: "3",
      sender: "ai",
      text: "I found 2 prime verified properties matching your criteria with direct owner leases and biometric escrow protection:",
      timestamp: "11:31 AM",
      properties: [mockProperties[0], mockProperties[1]],
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputMessage,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `Here are the matching verified insights based on your query "${userMsg.text}". All title deeds are cross-verified with biometric land registries and legal tenancy compliance.`,
        timestamp: "Just now",
        properties: [mockProperties[2]],
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  const promptSuggestions = [
    "Find 4-Bed villa in DHA Phase 6 under 400k/mo",
    "Compare rental yield: Clifton Karachi vs DHA Lahore",
    "What are the stamp duty & registry charges in Islamabad?",
    "How does the biometric tenant escrow work?",
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
                      <p>{msg.text}</p>

                      {/* Embedded Property Cards */}
                      {msg.properties && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {msg.properties.map((prop) => (
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
