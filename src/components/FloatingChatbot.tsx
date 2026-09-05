import React, { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useChat } from '../context/ChatContext'

export const FloatingChatbot: React.FC = () => {
  const {
    isChatOpen,
    closeChat,
    toggleChat,
    chatMessages,
    isAiTyping,
    unreadCount,
    sendMessage,
  } = useChat()

  const [inputMessage, setInputMessage] = useState<string>('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isAiTyping, isChatOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    sendMessage(inputMessage)
    setInputMessage('')
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <>
      {/* Floating Action Button (FAB) when chat is closed */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={toggleChat}
          aria-label="Buka Sahabat Sehat AI Chatbot"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900/95 hover:bg-slate-900 border border-teal-500/40 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 group cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-teal-400 text-teal-950 font-extrabold text-xs shadow-xs">
            AI
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>

          <div className="text-left hidden sm:flex flex-col">
            <span className="text-xs font-bold text-stone-100 group-hover:text-teal-300 transition-colors">
              Sahabat Sehat AI
            </span>
            <span className="text-[10px] text-teal-300/80 leading-none">
              Konsultan Wellness
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px] animate-bounce">
              {unreadCount}
            </span>
          )}

          <svg
            className="w-4 h-4 text-teal-300 ml-0.5 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Floating Chat Window when chat is open */}
      {isChatOpen && (
        <div
          className="fixed bottom-6 right-4 sm:right-6 md:right-8 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[600px] max-h-[85vh] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border border-teal-700/50 bg-gradient-to-b from-teal-800 via-teal-900 to-slate-950 text-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-label="Sahabat Sehat AI Chatbot"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-white/10 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-400 text-teal-950 flex items-center justify-center font-bold text-xs shadow-xs">
                  AI
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                    Sahabat Sehat AI
                  </h2>
                  <p className="text-xs text-teal-200/90">Konsultan Wellness Anda</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-bold bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
                  Online
                </Badge>

                <button
                  type="button"
                  onClick={closeChat}
                  aria-label="Tutup Chat"
                  className="p-1.5 rounded-xl hover:bg-white/15 text-stone-300 hover:text-white transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mini Summary Capsule */}
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between text-xs">
              <span className="text-stone-300">Status Hari Ini:</span>
              <span className="font-bold text-teal-300">72 BPM (Stabil)</span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs pr-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-teal-400 text-teal-950 font-semibold rounded-br-xs shadow-xs'
                      : 'bg-white/12 text-stone-100 rounded-bl-xs border border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-stone-400 mt-1 px-1">
                  {msg.sender === 'user' ? 'Anda' : 'Sahabat AI'} &middot; {msg.time}
                </span>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white/10 text-teal-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Footer: Quick Prompts & Input */}
          <div className="p-4 sm:p-5 pt-3 border-t border-white/10 space-y-3 shrink-0 bg-slate-950/60 backdrop-blur-sm">
            {/* Quick Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => handleQuickPrompt('Berapa baseline normal saya?')}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
              >
                Berapa baseline normal?
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Tips latihan pernapasan')}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
              >
                Tips relaksasi
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Pengaruh kafein hari ini')}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
              >
                Pengaruh kopi
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Bagaimana rPPG bekerja?')}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
              >
                Cara kerja rPPG
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tanya kesehatanmu ke AI..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default FloatingChatbot
