import React, { createContext, useContext, useState, useCallback } from 'react'

export interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  time: string
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
  messages: ChatMessage[]
}

const greeting: ChatMessage = {
  id: '1',
  sender: 'ai',
  text: 'Halo! 👋 Saya Sahabat Sehat AI, asisten pemantauan kebugaran dan vital sign keluarga Anda. Ada yang ingin Anda diskusikan seputar data rPPG atau gaya hidup hari ini?',
  time: '08:31 WIB',
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([greeting])
  const [conversations, setConversations] = useState<Conversation[]>([])

  const resetChat = useCallback(() => {
    setChatMessages([greeting])
    setIsAiTyping(false)
  }, [])

  // Arsipkan sesi berjalan (kalau ada pertanyaan) lalu mulai sesi kosong
  const newConversation = useCallback(() => {
    setChatMessages((current) => {
      const firstPrompt = current.find((m) => m.sender === 'user')
      if (firstPrompt) {
        setConversations((prev) => [
          { id: Date.now().toString(), title: firstPrompt.text, time: firstPrompt.time, messages: current },
          ...prev,
        ])
      }
      return [greeting]
    })
    setIsAiTyping(false)
  }, [])

  const loadConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === id)
      if (target) setChatMessages(target.messages)
      return prev
    })
    setIsAiTyping(false)
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

  const addAiMessage = useCallback((text: string, openIfClosed: boolean = false) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

    const aiMsg: ChatMessage = {
      id: Date.now().toString(),
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

  const sendMessage = useCallback((textToSend: string) => {
    const text = textToSend.trim()
    if (!text) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: timeStr,
    }

    setChatMessages((prev) => [...prev, userMsg])
    setIsAiTyping(true)

    // Simulated intelligent responses
    setTimeout(() => {
      let reply =
        'Terima kasih atas pertanyaannya. Berdasarkan pantauan data rPPG harian, parameter vital Anda berada dalam batas stabil dan normal. Tetap cukupi cairan dan luangkan waktu relaksasi.'

      const lower = text.toLowerCase()
      if (lower.includes('baseline') || lower.includes('normal')) {
        reply =
          'Baseline denyut jantung istirahat Anda adalah 69 BPM dengan rentang sehat 60-80 BPM. Nilai saat ini menunjukkan kondisi kardiovaskular yang stabil dan tenang.'
      } else if (lower.includes('napas') || lower.includes('pernapasan') || lower.includes('relaksasi')) {
        reply =
          'Laju pernapasan normal rileks adalah 12-20 bpm. Jika merasa tegang, cobalah teknik pernapasan 4-7-8: tarik napas 4 detik, tahan 7 detik, lalu hembuskan perlahan 8 detik.'
      } else if (lower.includes('kopi') || lower.includes('kafein')) {
        reply =
          'Kafein menstimulasi sistem saraf simpatis selama 1-2 jam pertama. Lonjakan sesaat adalah respon alami tubuh, dan nilai HRV Anda tetap mencerminkan pemulihan otonom yang prima.'
      } else if (lower.includes('rppg') || lower.includes('kamera') || lower.includes('cara kerja')) {
        reply =
          'Teknologi rPPG (remote photoplethysmography) menangkap perubahan mikroskopis pantulan spektrum warna kulit wajah akibat pulsasi darah mikrovaskular di setiap detak jantung lewat webcam biasa.'
      } else if (lower.includes('keluarga') || lower.includes('anak') || lower.includes('orang tua')) {
        reply =
          'Anda dapat memantau kesehatan seluruh anggota keluarga dengan memilih profil di dropdown kanan atas. Setiap profil memiliki riwayat dan ambang batas baseline yang disesuaikan usia.'
      }

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`,
      }

      setChatMessages((prev) => [...prev, aiReply])
      setIsAiTyping(false)
    }, 600)
  }, [])

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
        resetChat,
        conversations,
        newConversation,
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
