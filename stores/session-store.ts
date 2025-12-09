import { create } from 'zustand'
import { ChatSession, ChatMessage } from '@/types'
import { StorageService } from '@/lib/storage'

interface SessionStore {
  sessions: ChatSession[]
  maxSessions: number
  loadSessions: () => void
  createSession: (sessionId: string) => void
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  resetSession: (sessionId: string) => void
  getSession: (sessionId: string) => ChatSession | undefined
  assignApp: (sessionId: string, appId: string, appName: string) => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  maxSessions: 10,

  loadSessions: () => {
    const sessions = StorageService.getSessions()
    if (sessions.length === 0) {
      const initialSessions: ChatSession[] = Array.from({ length: 10 }, (_, i) => ({
        sessionId: `session-${i + 1}`,
        appId: null,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      StorageService.saveSessions(initialSessions)
      set({ sessions: initialSessions })
    } else {
      set({ sessions })
    }
  },

  createSession: (sessionId) => {
    const { sessions } = get()
    if (sessions.find((s) => s.sessionId === sessionId)) return

    const newSession: ChatSession = {
      sessionId,
      appId: null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedSessions = [...sessions, newSession]
    StorageService.saveSessions(updatedSessions)
    set({ sessions: updatedSessions })
  },

  updateSession: (sessionId, updates) => {
    const { sessions } = get()
    const updatedSessions = sessions.map((session) =>
      session.sessionId === sessionId
        ? { ...session, ...updates, updatedAt: new Date().toISOString() }
        : session
    )
    StorageService.saveSessions(updatedSessions)
    set({ sessions: updatedSessions })
  },

  addMessage: (sessionId, message) => {
    const { sessions } = get()
    const updatedSessions = sessions.map((session) =>
      session.sessionId === sessionId
        ? {
            ...session,
            messages: [...session.messages, message],
            updatedAt: new Date().toISOString(),
          }
        : session
    )
    StorageService.saveSessions(updatedSessions)
    set({ sessions: updatedSessions })
  },

  resetSession: (sessionId) => {
    const { sessions } = get()
    const updatedSessions = sessions.map((session) =>
      session.sessionId === sessionId
        ? {
            ...session,
            messages: [],
            updatedAt: new Date().toISOString(),
          }
        : session
    )
    StorageService.saveSessions(updatedSessions)
    set({ sessions: updatedSessions })
  },

  getSession: (sessionId) => {
    const { sessions } = get()
    return sessions.find((session) => session.sessionId === sessionId)
  },

  assignApp: (sessionId, appId, appName) => {
    const { sessions } = get()
    const updatedSessions = sessions.map((session) =>
      session.sessionId === sessionId
        ? {
            ...session,
            appId,
            appName,
            updatedAt: new Date().toISOString(),
          }
        : session
    )
    StorageService.saveSessions(updatedSessions)
    set({ sessions: updatedSessions })
  },
}))

