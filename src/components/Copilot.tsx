import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  RotateCcw,
  MessageSquare,
  MessagesSquare,
  Plus,
  Send,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useChat } from '../context/ChatContext'
import { Markdown } from './Markdown'

const suggestions = [
  'Berapa baseline detak jantung saya?',
  'Kenapa HRV saya bisa turun?',
  'Apa efek kopi pada denyut nadi?',
  'Bagaimana cara kerja rPPG?',
]

export const Copilot: React.FC = () => {
  const {
    chatMessages,
    isAiTyping,
    sendMessage,
    resetChat,
    conversations,
    newConversation,
    loadConversation,
  } = useChat()
  const [draft, setDraft] = useState('')
  const [showHistory, setShowHistory] = useState(() => window.innerWidth >= 1024)
  const scrollRef = useRef<HTMLDivElement>(null)

  const prompts = chatMessages.filter((m) => m.sender === 'user')
  const isEmpty = prompts.length === 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatMessages, isAiTyping])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <Card className="p-0 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs overflow-hidden flex-1 flex flex-col min-h-0 h-full">
      <div className="relative flex flex-1 min-h-0 h-full">
        {/* KOLOM UTAMA */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-ink-100">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-sage-700" />
              <h1 className="text-base font-bold text-ink-900 tracking-tight">Copilot</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={resetChat}
                className="rounded-full text-xs font-semibold text-ink-500 hover:text-ink-900 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mulai ulang
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowHistory(!showHistory)}
                aria-label={showHistory ? 'Sembunyikan riwayat' : 'Tampilkan riwayat'}
                className="rounded-full text-ink-500 hover:text-ink-900 cursor-pointer"
              >
                {showHistory ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* PERCAKAPAN / EMPTY STATE */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 min-h-0">
            {isEmpty ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-sage-500/60 ring-4 ring-sage-500/10 flex items-center justify-center mb-5">
                  <Sparkles className="w-7 h-7 text-sage-700" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900 mb-6">
                  Tanya <span className="text-sage-700">Copilot</span>
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="px-4 py-2 rounded-full text-xs font-medium bg-ink-50 text-ink-700 border border-ink-200 hover:border-sage-600 hover:bg-sage-50/50 hover:text-sage-900 transition cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {chatMessages.map((msg) =>
                  msg.isSystem ? (
                    // Catatan lokal, bukan jawaban asisten — dibedakan supaya
                    // tidak terbaca sebagai bagian percakapan yang tersimpan.
                    <div key={msg.id} className="flex justify-center">
                      <span className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-ink-100 text-ink-500 border border-ink-200">
                        {msg.text}
                      </span>
                    </div>
                  ) : (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-xl bg-sage-50 border border-sage-100/80 flex items-center justify-center text-sage-700 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-ink-900 text-white rounded-br-md'
                          : 'bg-ink-50 text-ink-700 border border-ink-200/80 rounded-bl-md'
                      }`}
                    >
                      {msg.sender === 'ai' ? <Markdown>{msg.text}</Markdown> : <p>{msg.text}</p>}
                      <span
                        className={`block mt-1 text-[10px] font-mono ${
                          msg.sender === 'user' ? 'text-ink-400' : 'text-ink-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                  )
                )}

                {isAiTyping && (
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sage-50 border border-sage-100/80 flex items-center justify-center text-sage-700 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="bg-ink-50 border border-ink-200/80 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          style={{ animationDelay: `${delay}ms` }}
                          className="w-1.5 h-1.5 rounded-full bg-sage-600 animate-bounce"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="shrink-0 px-5 sm:px-8 pb-4 sm:pb-5 pt-2 space-y-2">
            <form
              onSubmit={submit}
              className="relative rounded-2xl border border-sage-600/40 bg-sage-50/30 focus-within:border-sage-700 focus-within:ring-4 focus-within:ring-sage-600/10 transition p-3 sm:p-4"
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sage-700 mt-1.5 shrink-0" />
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) submit(e)
                  }}
                  placeholder="Tanyakan detak jantung, HRV, atau aktivitas harian Anda..."
                  className="flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 resize-none outline-none"
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!draft.trim()}
                  className="rounded-full px-5 text-xs font-bold bg-sage-800 hover:bg-sage-900 text-white shadow-xs cursor-pointer"
                >
                  Kirim
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>

            <p className="text-center text-[11px] text-ink-400">
              Copilot menjawab dari data rPPG Anda. Hasilnya bersifat informasional, bukan diagnosis medis.
            </p>
          </div>
        </div>

        {/* PANEL RIWAYAT */}
        {showHistory && (
          <aside className="absolute inset-y-0 right-0 z-20 w-72 max-w-[85%] bg-white shadow-xl flex flex-col border-l border-ink-100 lg:static lg:z-auto lg:shadow-none lg:max-w-none lg:shrink-0 h-full min-h-0">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div className="flex items-center gap-2.5">
                <MessagesSquare className="w-5 h-5 text-sage-700" />
                <h2 className="text-base font-bold text-ink-900 tracking-tight">Riwayat</h2>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setShowHistory(false)}
                aria-label="Sembunyikan riwayat"
                className="rounded-full text-ink-500 hover:text-ink-900 cursor-pointer"
              >
                <PanelRightClose className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
              <Button
                size="sm"
                variant="outline"
                onClick={newConversation}
                disabled={isEmpty}
                className="w-full py-2.5 rounded-xl text-xs font-semibold border-ink-200 text-ink-700 hover:border-sage-600 hover:bg-sage-50/40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Percakapan baru
              </Button>

              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center text-ink-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-ink-400 font-medium">Belum ada percakapan</span>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => loadConversation(conv.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-ink-600 hover:bg-ink-50 hover:text-ink-900 border border-transparent hover:border-ink-200 transition cursor-pointer"
                    >
                      <span className="block truncate font-medium">{conv.title}</span>
                      <span className="text-[10px] text-ink-400 font-mono">{conv.time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </Card>
  )
}

export default Copilot
