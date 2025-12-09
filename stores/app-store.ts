import { create } from 'zustand'
import { DifyApp } from '@/types'
import { StorageService } from '@/lib/storage'

interface AppStore {
  apps: DifyApp[]
  maxApps: number
  isModalOpen: boolean
  setModalOpen: (isOpen: boolean) => void
  loadApps: () => void
  addApp: (app: Omit<DifyApp, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateApp: (id: string, app: Partial<DifyApp>) => void
  deleteApp: (id: string) => void
  getApp: (id: string) => DifyApp | undefined
}

export const useAppStore = create<AppStore>((set, get) => ({
  apps: [],
  maxApps: 10,
  isModalOpen: false,

  setModalOpen: (isOpen) => {
    set({ isModalOpen: isOpen })
  },

  loadApps: () => {
    const apps = StorageService.getApps()
    set({ apps })
  },

  addApp: (appData) => {
    const { apps, maxApps } = get()
    if (apps.length >= maxApps) {
      throw new Error(`最大${maxApps}個まで登録できます`)
    }

    const newApp: DifyApp = {
      ...appData,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedApps = [...apps, newApp]
    StorageService.saveApps(updatedApps)
    set({ apps: updatedApps })
  },

  updateApp: (id, appData) => {
    const { apps } = get()
    const updatedApps = apps.map((app) =>
      app.id === id
        ? { ...app, ...appData, updatedAt: new Date().toISOString() }
        : app
    )
    StorageService.saveApps(updatedApps)
    set({ apps: updatedApps })
  },

  deleteApp: (id) => {
    const { apps } = get()
    const updatedApps = apps.filter((app) => app.id !== id)
    StorageService.saveApps(updatedApps)
    set({ apps: updatedApps })
  },

  getApp: (id) => {
    const { apps } = get()
    return apps.find((app) => app.id === id)
  },
}))

