import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, User, RefreshCw, Send } from 'lucide-react';
import { ChatMessage } from '../types';

export function PatientChatbot() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Sunrise Medical Clinic AI Assistant. I can help answer questions about our clinic, our three physicians (Dr. Ann J., Dr. Rishika, and Dr. Shreyas), our hours, or how to fill out our symptom and booking form. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChatMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages.slice(-6), userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: `⚠️ Error: ${
            err.message ||
            "I'm having trouble connecting right now. Please try again in a moment."
          }`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn" id="patient-chatbot">
      {/* Chat Header */}
      <div className="p-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600 p-2 rounded-lg border border-indigo-500">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Sunrise Clinic Assistant
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-indigo-200 font-semibold">AI Assistant Online</span>
            </div>
          </div>
        </div>
        <div className="bg-indigo-900 px-2 py-0.5 rounded border border-indigo-800 text-[9px] font-black tracking-widest text-indigo-300 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          VITALIS CDS v1.8
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 bg-zinc-50/50">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {msg.role === 'assistant' ? (
                <>
                  <Bot className="h-3 w-3 text-indigo-600" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    Assistant
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    You
                  </span>
                  <User className="h-3 w-3 text-zinc-600" />
                </>
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-3xs border ${
                msg.role === 'user'
                  ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-xs'
                  : 'bg-white border-zinc-200 text-zinc-800 rounded-tl-xs whitespace-pre-line'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="flex items-center gap-1.5 mb-1">
              <Bot className="h-3 w-3 text-indigo-600" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                Assistant
              </span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-zinc-400 flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />
              Assistant is thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 border-t border-zinc-100 bg-white space-y-1">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
          Suggested Questions
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto pb-1">
          {[
            'Is chest pain always an emergency?',
            'What are Sunrise Clinic hours?',
            "Who are the clinic's doctors?",
            'Help me understand my triage category',
          ].map((q) => (
            <button
              key={q}
              disabled={isChatLoading}
              onClick={() => handleSendChatMessage(undefined, q)}
              className="text-[10px] text-zinc-600 hover:text-indigo-600 bg-zinc-100 hover:bg-indigo-50 border border-zinc-200 hover:border-indigo-200 px-2 py-1 rounded-lg font-semibold text-left transition-all duration-150 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input form */}
      <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-zinc-200 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isChatLoading}
          placeholder="Type your medical query here..."
          className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-65"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isChatLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center min-w-[36px]"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
