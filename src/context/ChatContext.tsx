import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ApiError } from '@/lib/api'
import {
  getConversation,
  listConversations,
  postChat,
  type ChatServerMessage,
} from '@/lib/health-api'
import { useAuth } from './AuthContext'

export interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  time: string
  /** Pesan sistem dibuat lokal (mis. "aktivitas dicatat") dan tidak ikut
   *  tersimpan di percakapan server. */
  isSystem?: boolean
}

interface ChatContextType {
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  chatMessages: ChatMessage[]
  isAiTyping: boolean
  unreadCount: number
  sendMessage: (text: string) => void
  addAiMessage: (text: string, openIfClosed?: boolean) => void
  resetChat: () => void
  conversations: Conversation[]
  newConversation: () => void
  loadConversation: (id: string) => void
}

export interface Conversation {
  id: string
  title: string
  time: string
}

const greeting: ChatMessage = {
  id: '1',
  sender: 'ai',
  text: 'Halo! 👋 Saya Sahabat Sehat AI, asisten pemantauan kebugaran dan vital sign keluarga Anda. Ada yang ingin Anda diskusikan seputar data rPPG atau gaya hidup hari ini?',
  time: '08:31 WIB',
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const timeOf = (iso?: string | null) => {
  const d = iso ? new Date(iso) : new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`
}

const toChatMessage = (msg: ChatServerMessage, index: number): ChatMessage => ({
  id: `${msg.created_at ?? index}-${index}`,
  sender: msg.role === 'assistant' ? 'ai' : 'user',
  text: msg.content,
  time: timeOf(msg.created_at),
})

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([greeting])
  const [conversations, setConversations] = useState<Conversation[]>([])
  /** null berarti pesan berikutnya memulai percakapan baru di server. */
  const [conversationId, setConversationId] = useState<string | null>(null)

  const refreshConversations = useCallback(async () => {
    try {
      const { conversations: list } = await listConversations()
      setConversations(
        list.map((c) => ({
          id: c.id,
          title: c.summary ?? `Percakapan ${timeOf(c.started_at)}`,
          time: timeOf(c.started_at),
        }))
      )
    } catch {
      /* daftar riwayat bersifat pelengkap; kegagalannya tidak memblokir chat */
    }
  }, [])

  // Riwayat hanya bisa diambil setelah token menunjuk profil.
  useEffect(() => {
    if (status !== 'ready') {
      setConversations([])
      setChatMessages([greeting])
      setConversationId(null)
      return
    }
    void refreshConversations()
  }, [status, refreshConversations])

  const startNewThread = useCallback(() => {
    setChatMessages([greeting])
    setConversationId(null)
    setIsAiTyping(false)
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    setIsAiTyping(false)
    try {
      const detail = await getConversation(id)
      setChatMessages(detail.messages.map(toChatMessage))
      setConversationId(detail.id)
    } catch {
      setChatMessages([
        greeting,
        {
          id: `load-error-${Date.now()}`,
          sender: 'ai',
          text: 'Percakapan ini tidak dapat dimuat.',
          time: timeOf(),
          isSystem: true,
        },
      ])
    }
  }, [])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
    setUnreadCount(0)
  }, [])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev
      if (next) setUnreadCount(0)
      return next
    })
  }, [])

  // Notifikasi lokal (aktivitas dicatat, pengukuran selesai). Tidak dikirim ke
  // server, jadi hanya tampil sampai percakapan dimuat ulang.
  const addAiMessage = useCallback((text: string, openIfClosed: boolean = false) => {
    const timeStr = timeOf()

    const aiMsg: ChatMessage = {
      id: `system-${Date.now()}`,
      isSystem: true,
      sender: 'ai',
      text,
      time: timeStr,
    }

    setChatMessages((prev) => [...prev, aiMsg])

    if (openIfClosed) {
      setIsChatOpen(true)
      setUnreadCount(0)
    } else {
      setIsChatOpen((isOpen) => {
        if (!isOpen) {
          setUnreadCount((count) => count + 1)
        }
        return isOpen
      })
    }
  }, [])

  const sendMessage = useCallback(
    async (textToSend: string) => {
      const text = textToSend.trim()
      if (!text) return

      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        sender: 'user',
        text,
        time: timeOf(),
      }
      setChatMessages((prev) => [...prev, userMsg])
      setIsAiTyping(true)

      try {
        const res = await postChat(text, conversationId)
        setChatMessages((prev) => [
          ...prev,
          { id: `reply-${Date.now()}`, sender: 'ai', text: res.reply, time: timeOf() },
        ])

        // Percakapan baru: simpan id-nya dan segarkan daftar riwayat.
        if (res.conversation_id !== conversationId) {
          setConversationId(res.conversation_id)
          void refreshConversations()
        }
      } catch (error) {
        // 503 berarti layanan AI sedang mati — gangguan sementara, bukan error
        // aplikasi; endpoint lain tetap berjalan normal.
        const unavailable = error instanceof ApiError && error.status === 503
        setChatMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            sender: 'ai',
            text: unavailable
              ? 'Asisten sedang tidak tersedia untuk sementara. Coba lagi beberapa saat lagi.'
              : error instanceof ApiError
              ? error.message
              : 'Pesan gagal terkirim.',
            time: timeOf(),
            isSystem: true,
          },
        ])
      } finally {
        setIsAiTyping(false)
      }
    },
    [conversationId, refreshConversations]
  )

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        setIsChatOpen,
        openChat,
        closeChat,
        toggleChat,
        chatMessages,
        isAiTyping,
        unreadCount,
        sendMessage,
        addAiMessage,
        resetChat: startNewThread,
        conversations,
        newConversation: startNewThread,
        loadConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
