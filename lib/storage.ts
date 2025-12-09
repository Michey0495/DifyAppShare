import { DifyApp, ChatSession, AppSettings } from '@/types'

const STORAGE_KEYS = {
  APPS: 'dify-app-share-apps',
  SESSIONS: 'dify-app-share-sessions',
  SETTINGS: 'dify-app-share-settings',
} as const

export class StorageService {
  static getApps(): DifyApp[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.APPS)
    return data ? JSON.parse(data) : []
  }

  static saveApps(apps: DifyApp[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps))
  }

  static getSessions(): ChatSession[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    return data ? JSON.parse(data) : []
  }

  static saveSessions(sessions: ChatSession[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  }

  static getSettings(): AppSettings {
    if (typeof window === 'undefined') {
      return {
        apiTimeout: 60000,
        retryCount: 3,
        theme: 'light',
        language: 'ja',
      }
    }
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return data
      ? JSON.parse(data)
      : {
          apiTimeout: 60000,
          retryCount: 3,
          theme: 'light',
          language: 'ja',
        }
  }

  static saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }

  static exportData(): string {
    return JSON.stringify({
      apps: this.getApps(),
      sessions: this.getSessions(),
      settings: this.getSettings(),
    })
  }

  static importData(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString)
      if (data.apps) this.saveApps(data.apps)
      if (data.sessions) this.saveSessions(data.sessions)
      if (data.settings) this.saveSettings(data.settings)
    } catch (e) {
      throw new Error('Invalid JSON format')
    }
  }
}

