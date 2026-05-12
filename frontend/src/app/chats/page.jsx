"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useChat } from "./hooks/useChat";
import Sidebar from "./components/Sidebar";
import { Sparkles, Globe, Mic, Send, Paperclip, PanelLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const { messages } = useSelector((state) => state.chat);
  const { handleSendMessage } = useChat();
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    handleSendMessage(input, webSearchEnabled);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="flex h-dvh text-gray-200 font-sans selection:bg-purple-500/30 overflow-hidden relative w-full ">
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area Container */}
      <div className="w-full p-3 bg-black">
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#0e0113] rounded-3xl">
          {/* Background Gradient */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-gradient-to-bl from-[#784d81] via-fuchsia-600/10 to-transparent blur-[120px] rounded-full  pointer-events-none"></div>
          {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2  w-[200px] h-[200px] -translate-y-1/2 bg-radial from-orange-500/30 blur-[60px]  to-transparent rounded-full pointer-events-none"></div> */}

          {/* Top Navigation / Header */}
          <header className="flex items-center justify-between px-6 py-4 z-10">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-all active:scale-95 duration-200 mr-1"
                  title="Open sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </header>

          {/* Main Chat Area */}
          <main className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center px-4 pb-36">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl mt-10">
                {/* Glowing Orb */}
                <div className="relative w-48 h-48 mb-6 group ">
                  <img
                    src="/Symmetry.gif"
                    alt="Symmetry AI"
                    className="w-full h-full scale-150 mix-blend-screen select-none pointer-events-none"
                  />
                </div>
                <h1 className="text-4xl mb-4 font-regular text-center text-gray-100 ">
                  Ready to Create Something New?
                </h1>
                <span className="text-md text-center mt-4 max-w-lg text-gray-500 ">
                  Experience Veronica.Experience real-time intelligence paired
                  with a beautifully rendered, highly responsive next-generation
                  AI assistant.
                </span>
              </div>
            ) : (
              <div className="w-full max-w-3xl flex flex-col gap-6 py-8 mb-10 z-8">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                        msg.role === "user"
                          ? "bg-[#2B2D31] text-gray-100 rounded-tr-sm shadow-md shadow-black/10"
                          : "bg-transparent text-gray-200"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-white p-1 rounded-md inline-block">
                            <Sparkles className="w-3 h-3 text-[#12141A] fill-[#12141A]" />
                          </div>
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Sense AI
                          </span>
                        </div>
                      )}
                      <div className="leading-relaxed text-[15px]">
                        {msg.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-white">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-300">
                                  {children}
                                </em>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold mt-4 mb-2 text-white">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-bold mt-3 mb-2 text-white">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-bold mt-2 mb-1 text-white">
                                  {children}
                                </h3>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-5 mb-2 text-gray-300 space-y-1">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-5 mb-2 text-gray-300 space-y-1">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                              ),
                              code: ({ className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(
                                  className || "",
                                );
                                const isInline = !match;
                                return isInline ? (
                                  <code
                                    className="bg-white/10 px-1.5 py-0.5 rounded-md text-sm font-mono text-[#4FC3F7]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="bg-[#1C1E26] border border-white/10 rounded-xl p-4 my-3 overflow-x-auto text-sm text-gray-300 font-mono">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                );
                              },
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline"
                                >
                                  {children}
                                </a>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2 text-gray-400 bg-white/5 p-2 rounded-r-lg">
                                  {children}
                                </blockquote>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                                  <table className="min-w-full divide-y divide-white/10 text-sm">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-white/5">{children}</thead>
                              ),
                              tbody: ({ children }) => (
                                <tbody className="divide-y divide-white/10">
                                  {children}
                                </tbody>
                              ),
                              tr: ({ children }) => (
                                <tr className="hover:bg-white/5 transition-colors">
                                  {children}
                                </tr>
                              ),
                              th: ({ children }) => (
                                <th className="px-4 py-2 text-left font-semibold text-white">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-4 py-2 text-gray-300">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.role === "assistant" && (
                            <span className="animate-pulse flex gap-1 py-1">
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 pb-6  bg-linear-to-t from-black  to-transparent z-20 flex flex-col items-center">
            <div className="w-full h-fit max-w-3xl rounded-[24px] p-[2px] bg-linear-to-b from-[#c800ff]/45 to-transparent transition-all duration-500 ease-in-out focus-within:to-[#c800ff]/70 focus-within:from-[#c800ff]/70 ">
              <form
                onSubmit={onSubmit}
                className="bg-[#130118] backdrop-blur-xl  rounded-[22px] p-2 flex flex-col shadow-2xl transition-all duration-500 ease-in-out focus-within:bg-[#100114] focus-within:border-[#c800ff]"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="bg-transparent h-[8vh] text-gray-200 placeholder-gray-500 resize-none outline-none px-4 py-3 min-h-[56px] max-h-48 overflow-y-auto w-full"
                  rows={1}
                />
                <div className="flex items-center justify-between px-2 pb-1 pt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-full transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                      className={`p-2 rounded-full transition-all duration-200 active:scale-95 ${
                        webSearchEnabled
                          ? "text-violet-400 bg-violet-500/10 border border-violet-500/20 shadow-md shadow-violet-500/5 hover:bg-violet-500/20"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                      }`}
                      title={
                        webSearchEnabled
                          ? "Disable web search"
                          : "Search the web"
                      }
                    >
                      <Globe className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-full transition-colors"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 hidden sm:inline-block">
                      Incognito
                    </span>
                    <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="bg-white text-[#12141A] p-2 rounded-full disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 hover:scale-105 transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4 translate-x-px" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="text-center mt-3">
              <span className="text-[11px] text-gray-500">
                Sense AI may contain errors. We recommend checking important
                information.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
